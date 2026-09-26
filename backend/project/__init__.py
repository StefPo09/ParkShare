
from datetime import timedelta
import os
import re

try:
    from authlib.integrations.flask_client import OAuth
except Exception:
    OAuth = None
from flask import Flask, jsonify, redirect, request, url_for
from flask_cors import CORS
from flask_login import LoginManager, current_user, logout_user
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from werkzeug.middleware.proxy_fix import ProxyFix


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
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
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

    with app.app_context():
        from .models import Booking, Car, City, ParkingSpot, PersonalDetails, ProfilePicture, User, UserReport
        db.create_all()
        user_columns = {column['name'] for column in inspect(db.engine).get_columns('user')}
        for col_name, ddl in {
            'reset_token': 'ALTER TABLE user ADD COLUMN reset_token VARCHAR(128)',
            'reset_token_expires': 'ALTER TABLE user ADD COLUMN reset_token_expires DATETIME',
            'role': "ALTER TABLE user ADD COLUMN role VARCHAR(20) DEFAULT 'user'",
            'phone_country_code': 'ALTER TABLE user ADD COLUMN phone_country_code VARCHAR(8)',
            'phone': 'ALTER TABLE user ADD COLUMN phone VARCHAR(30)',
            'is_banned': 'ALTER TABLE user ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT 0',
            'banned_at': 'ALTER TABLE user ADD COLUMN banned_at DATETIME',
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

    @app.before_request
    def _reject_banned_users():
        if not current_user.is_authenticated or not current_user.is_banned:
            return None
        if request.endpoint in {'auth.api_login', 'auth.api_logout', 'auth.login', 'auth.login_post', 'auth.logout'}:
            return None
        logout_user()
        if request.path.startswith('/api/'):
            return jsonify({'error': 'account_banned'}), 403
        return redirect(url_for('auth.login'))

    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    from .parking import parking as parking_blueprint
    app.register_blueprint(parking_blueprint)

    from .reports import reports as reports_blueprint
    app.register_blueprint(reports_blueprint)

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

    return app