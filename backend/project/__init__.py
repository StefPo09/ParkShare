
from datetime import timedelta
import os
import re

try:
    from authlib.integrations.flask_client import OAuth
except Exception:
    OAuth = None
from flask import Flask, request, Response, stream_with_context, abort, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from werkzeug.middleware.proxy_fix import ProxyFix
import requests



db = SQLAlchemy()
oauth = OAuth()


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
    app.config['GOOGLE_API_KEY'] = os.environ.get('GOOGLE_API_KEY') or os.environ.get('GEMINI_API_KEY')
    app.config['GOOGLE_CLIENT_ID'] = os.environ.get('GOOGLE_CLIENT_ID')
    app.config['GOOGLE_CLIENT_SECRET'] = os.environ.get('GOOGLE_CLIENT_SECRET')
    app.config['SQLALCHEMY_DATABASE_URI'] = (
            os.environ.get('MYSQL_DATABASE_URI') or os.environ.get('DATABASE_URL') or 'sqlite:///db.sqlite'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
    # Session / cookie defaults. In production behind HTTPS set SESSION_COOKIE_SECURE=True
    # Use FRONTEND_DOMAIN to set cookie domain (e.g., parkshare.adv.ro)
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

    frontend_domain = None
    raw_frontend_domain = os.environ.get('FRONTEND_DOMAIN') or os.environ.get('FRONTEND_ORIGINS')
    if raw_frontend_domain:
        # FRONTEND_DOMAIN may be set to 'https://parkshare.adv.ro' or 'parkshare.adv.ro' or comma separated origins
        # Normalize to bare hostname
        first = (raw_frontend_domain.split(',')[0] if ',' in raw_frontend_domain else raw_frontend_domain).strip()
        first = re.sub(r'^https?://', '', first).split('/')[0]
        if first:
            frontend_domain = first

    if frontend_domain:
        # Use a wildcard cookie domain for subdomains and ensure secure cookies
        app.config['SESSION_COOKIE_DOMAIN'] = '.' + frontend_domain
        app.config['SESSION_COOKIE_SECURE'] = True
        app.config['PREFERRED_URL_SCHEME'] = 'https'

    app.config['UPLOAD_DIR'] = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    os.makedirs(app.config['UPLOAD_DIR'], exist_ok=True)

    # Trusted proxies (allows Flask to honor X-Forwarded-* when behind a reverse proxy)
    trusted_proxies_env = os.environ.get('TRUSTED_PROXIES', '').strip()
    if trusted_proxies_env:
        trusted_proxies = {p.strip() for p in trusted_proxies_env.split(',') if p.strip()}
    else:
        # Default to the known Nginx Proxy Manager host provided by the developer
        trusted_proxies = {'192.168.111.140'}
    app.config['TRUSTED_PROXIES'] = trusted_proxies

    # Wrap the WSGI app so Flask uses X-Forwarded headers from one trusted proxy hop
    # (x_for/x_proto/x_host = 1). Adjust if you have additional proxy layers.
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    configured_origins = os.environ.get('FRONTEND_ORIGINS')
    allowed_origins = (
        [origin.strip() for origin in configured_origins.split(',') if origin.strip()]
        if configured_origins
        else [
            re.compile(
                r'^https?://(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|' 
                r'192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})'
                r'(?::\d+)?$'
            )
        ]
    )
    CORS(app, origins=allowed_origins, supports_credentials=True)
    db.init_app(app)
    oauth.init_app(app)

    if app.config.get('GOOGLE_CLIENT_ID') and app.config.get('GOOGLE_CLIENT_SECRET'):
        oauth.register(
            name='google',
            client_id=app.config['GOOGLE_CLIENT_ID'],
            client_secret=app.config['GOOGLE_CLIENT_SECRET'],
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'},
        )

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    # Sanitize X-Forwarded-* headers unless the request comes from a trusted proxy IP.
    # This prevents clients from forging forwarded headers when the app is directly reachable.
    @app.before_request
    def _sanitize_forwarded_headers():
        remote = request.remote_addr
        trusted = app.config.get('TRUSTED_PROXIES', set()) or set()
        if remote not in trusted:
            for header in ('HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED_PROTO', 'HTTP_X_FORWARDED_HOST', 'HTTP_X_FORWARDED_PORT', 'HTTP_X_FORWARDED_PREFIX'):
                request.environ.pop(header, None)

        # If request appears to be from the frontend hostname (non-localhost) and uses HTTPS
        # ensure session cookies are marked secure and, if missing, set cookie domain to the host.
        try:
            host = (request.host or '').split(':')[0]
            proto = request.headers.get('X-Forwarded-Proto') or request.scheme
            if host and host not in ('localhost', '127.0.0.1') and proto == 'https':
                app.config['SESSION_COOKIE_SECURE'] = True
                app.config['PREFERRED_URL_SCHEME'] = 'https'
                if not app.config.get('SESSION_COOKIE_DOMAIN'):
                    app.config['SESSION_COOKIE_DOMAIN'] = '.' + host
        except Exception:
            pass

    with app.app_context():
        from .models import Booking, Car, City, ParkingSpot, PersonalDetails, ProfilePicture, User
        db.create_all()
        user_columns = {column['name'] for column in inspect(db.engine).get_columns('user')}
        for col_name, ddl in {
            'reset_token': 'ALTER TABLE user ADD COLUMN reset_token VARCHAR(128)',
            'reset_token_expires': 'ALTER TABLE user ADD COLUMN reset_token_expires DATETIME',
            'role': "ALTER TABLE user ADD COLUMN role VARCHAR(20) DEFAULT 'user'",
            'phone_country_code': 'ALTER TABLE user ADD COLUMN phone_country_code VARCHAR(8)',
            'phone': 'ALTER TABLE user ADD COLUMN phone VARCHAR(30)',
        }.items():
            if col_name not in user_columns:
                db.session.execute(text(ddl))

        spot_columns = {column['name'] for column in inspect(db.engine).get_columns('parking_spot')}
        for col_name, ddl in {
            'start_hour': "ALTER TABLE parking_spot ADD COLUMN start_hour VARCHAR(10) DEFAULT '14:00'",
            'end_hour': "ALTER TABLE parking_spot ADD COLUMN end_hour VARCHAR(10) DEFAULT '18:00'",
            'price_currency': "ALTER TABLE parking_spot ADD COLUMN price_currency VARCHAR(10) DEFAULT 'RON'",
            'is_on_sale': "ALTER TABLE parking_spot ADD COLUMN is_on_sale BOOLEAN DEFAULT 0",
            'document_url': "ALTER TABLE parking_spot ADD COLUMN document_url VARCHAR(255)",
        }.items():
            if col_name not in spot_columns:
                db.session.execute(text(ddl))

        db.session.commit()

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    from .parking import parking as parking_blueprint
    app.register_blueprint(parking_blueprint)

    # Debug: print registered routes to help diagnose missing-route issues
    try:
        rules = sorted(str(rule) for rule in app.url_map.iter_rules())
        print('Registered routes:')
        for r in rules:
            print('  ', r)
    except Exception:
        pass

    # Add a machine-readable debug endpoint that lists all registered routes
    try:
        from flask import jsonify

        def _debug_routes():
            try:
                rules = sorted(str(rule) for rule in app.url_map.iter_rules())
                return jsonify({'routes': rules}), 200
            except Exception:
                return jsonify({'routes': []}), 200

        try:
            app.add_url_rule('/api/debug/routes', endpoint='debug_routes', view_func=_debug_routes, methods=['GET'])
        except Exception:
            pass
    except Exception:
        pass

    # Ensure the Google OAuth endpoints are available even if blueprint registration
    # failed in some deployment environments. This proxies to the handlers defined
    # in backend.project.auth if possible.
    try:
        from .auth import google_login as _google_login_handler, google_callback as _google_callback_handler
        try:
            app.add_url_rule('/api/auth/google/login', endpoint='google_login_proxy', view_func=_google_login_handler)
        except Exception:
            # Rule already exists or cannot be added; ignore
            pass
        try:
            app.add_url_rule('/api/auth/google/callback', endpoint='google_callback_proxy', view_func=_google_callback_handler)
        except Exception:
            pass
    except Exception:
        pass

    # Proxy /_next/* requests to the local Next.js server. This allows Nginx to route
    # _next asset requests to the Flask app (if needed) and avoids client bundles being
    # blocked when the proxy cannot directly reach the Next server. Configure the
    # NEXT_SERVER_URL env var (e.g. http://127.0.0.1:3000).
    NEXT_SERVER_URL = os.environ.get('NEXT_SERVER_URL', 'http://127.0.0.1:3000')

    def _proxy_next(subpath):
        # Only allow GET/HEAD to fetch static assets
        if request.method not in ('GET', 'HEAD'):
            abort(405)
        upstream = f"{NEXT_SERVER_URL}/_next/{subpath}"
        try:
            # Forward minimal headers; avoid sending Host to upstream
            upstream_headers = {k: v for k, v in request.headers.items() if k.lower() != 'host'}
            resp = requests.get(upstream, headers=upstream_headers, stream=True, timeout=10)
        except requests.RequestException as e:
            app.logger.warning('Failed to fetch _next asset from %s: %s', upstream, e)
            return jsonify({'error': 'Upstream asset fetch failed'}), 502

        excluded_headers = {'transfer-encoding', 'connection', 'content-encoding'}
        headers = [(name, value) for name, value in resp.headers.items() if name.lower() not in excluded_headers]
        return Response(stream_with_context(resp.iter_content(chunk_size=8192)), status=resp.status_code, headers=headers)

    # Register both general and static-specific patterns
    try:
        app.add_url_rule('/_next/<path:subpath>', endpoint='proxy_next', view_func=_proxy_next, methods=['GET', 'HEAD'])
    except Exception:
        pass

    try:
        app.add_url_rule('/_next/static/<path:subpath>', endpoint='proxy_next_static', view_func=_proxy_next, methods=['GET', 'HEAD'])
    except Exception:
        pass

    return app