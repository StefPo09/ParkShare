from datetime import timedelta

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from sqlalchemy import inspect, text

# Initialize SQLAlchemy instance (outside create_app for import access)
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
    app.config['SESSION_COOKIE_SECURE'] = False  # Enable in production with HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent XSS
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # CSRF protection

    CORS(app, origins=['http://localhost:3000'], supports_credentials=True)
    
    # Initialize extensions with app
    db.init_app(app)
    
    # Configure Flask-Login
    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)
    
    # User loader function for Flask-Login
    from .models import User
    with app.app_context():
        db.create_all()
        user_columns = {column['name'] for column in inspect(db.engine).get_columns('user')}
        if 'reset_token' not in user_columns:
            db.session.execute(text('ALTER TABLE user ADD COLUMN reset_token VARCHAR(128)'))
        if 'reset_token_expires' not in user_columns:
            db.session.execute(text('ALTER TABLE user ADD COLUMN reset_token_expires DATETIME'))
        if 'role' not in user_columns:
            db.session.execute(text("ALTER TABLE user ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
        if 'phone_country_code' not in user_columns:
            db.session.execute(text('ALTER TABLE user ADD COLUMN phone_country_code VARCHAR(8)'))
        if 'phone' not in user_columns:
            db.session.execute(text('ALTER TABLE user ADD COLUMN phone VARCHAR(30)'))
        if 'country' not in user_columns:
            db.session.execute(text('ALTER TABLE user ADD COLUMN country VARCHAR(100)'))
        if 'city' not in user_columns:
            db.session.execute(text('ALTER TABLE user ADD COLUMN city VARCHAR(100)'))
        db.session.commit()

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Register blueprints
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)
    
    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    return app