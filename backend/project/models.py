from datetime import datetime, timedelta
from functools import wraps

from flask import flash, redirect, url_for
from flask_login import UserMixin, current_user

from . import db


class User(UserMixin, db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)  # primary keys are required by SQLAlchemy
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    name = db.Column(db.String(1000))
    phone_country_code = db.Column(db.String(8), nullable=True)
    phone = db.Column(db.String(30), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    reset_token = db.Column(db.String(128), unique=True, nullable=True)
    reset_token_expires = db.Column(db.DateTime(timezone=True), nullable=True)
    role = db.Column(db.String(20), default='user')

    cars = db.relationship('Car', back_populates='owner', cascade='all, delete-orphan')
    parking_spots = db.relationship('ParkingSpot', back_populates='owner', cascade='all, delete-orphan')
    bookings = db.relationship('Booking', back_populates='user', cascade='all, delete-orphan')

    def has_role(self, role):
        return self.role == role

    def is_admin(self):
        return self.role == 'admin'


class City(db.Model):
    __tablename__ = 'city'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    country = db.Column(db.String(120), nullable=True)
    description = db.Column(db.Text, nullable=True)

    spots = db.relationship('ParkingSpot', back_populates='city', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'country': self.country,
            'description': self.description,
        }


class Car(db.Model):
    __tablename__ = 'car'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    brand = db.Column(db.String(80), nullable=False)
    model = db.Column(db.String(80), nullable=False)
    license_plate = db.Column(db.String(30), nullable=False, unique=True)
    year = db.Column(db.Integer, nullable=True)
    color = db.Column(db.String(40), nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    document_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    owner = db.relationship('User', back_populates='cars')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'brand': self.brand,
            'model': self.model,
            'license_plate': self.license_plate,
            'year': self.year,
            'color': self.color,
            'image_url': self.image_url,
            'document_url': self.document_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ParkingSpot(db.Model):
    __tablename__ = 'parking_spot'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    city_id = db.Column(db.Integer, db.ForeignKey('city.id'), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price_per_day = db.Column(db.Float, nullable=False, default=0.0)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    document_url = db.Column(db.String(255), nullable=True)
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    owner = db.relationship('User', back_populates='parking_spots')
    city = db.relationship('City', back_populates='spots')
    bookings = db.relationship('Booking', back_populates='spot', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'city_id': self.city_id,
            'title': self.title,
            'address': self.address,
            'description': self.description,
            'price_per_day': self.price_per_day,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'image_url': self.image_url,
            'document_url': self.document_url,
            'is_available': self.is_available,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Booking(db.Model):
    __tablename__ = 'booking'

    id = db.Column(db.Integer, primary_key=True)
    spot_id = db.Column(db.Integer, db.ForeignKey('parking_spot.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    total_price = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(30), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', back_populates='bookings')
    spot = db.relationship('ParkingSpot', back_populates='bookings')

    def to_dict(self):
        return {
            'id': self.id,
            'spot_id': self.spot_id,
            'user_id': self.user_id,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'total_price': self.total_price,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# Custom decorator for role-based access
def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated or not current_user.has_role(role):
                flash('Access denied. Insufficient permissions.')
                return redirect(url_for('main.index'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator
