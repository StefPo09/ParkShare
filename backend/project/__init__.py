from datetime import timedelta
import os

from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text


db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
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

    CORS(app, origins=['http://localhost:3000'], supports_credentials=True)
    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

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

    return app


