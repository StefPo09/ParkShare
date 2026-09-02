from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from . import db
from .models import Booking, Car, City, ParkingSpot, User

parking = Blueprint('parking', __name__)


@parking.route('/api/cities', methods=['GET'])
def get_cities():
    cities = City.query.order_by(City.name.asc()).all()
    return jsonify({'cities': [city.to_dict() for city in cities]}), 200


@parking.route('/api/cities/<int:city_id>', methods=['GET'])
def get_city(city_id):
    city = City.query.get(city_id)
    if not city:
        return jsonify({'error': 'City not found.'}), 404
    return jsonify({'city': city.to_dict()}), 200


@parking.route('/api/cities', methods=['POST'])
@login_required
def create_city():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    country = (data.get('country') or '').strip()

    if not name:
        return jsonify({'error': 'City name is required.'}), 400

    normalized_name = name.lower()
    if City.query.filter(db.func.lower(City.name) == normalized_name).first():
        return jsonify({'error': 'A city with this name already exists.'}), 409

    city = City(name=name, country=country or None)
    db.session.add(city)
    db.session.commit()

    return jsonify({'city': city.to_dict()}), 201


@parking.route('/api/cars', methods=['GET'])
@login_required
def get_cars():
    cars = Car.query.filter_by(user_id=current_user.id).order_by(Car.created_at.desc()).all()
    return jsonify({'cars': [car.to_dict() for car in cars]}), 200


@parking.route('/api/cars/<int:car_id>', methods=['GET'])
@login_required
def get_car(car_id):
    car = Car.query.filter_by(id=car_id, user_id=current_user.id).first()
    if not car:
        return jsonify({'error': 'Car not found.'}), 404
    return jsonify({'car': car.to_dict()}), 200


@parking.route('/api/cars', methods=['POST'])
@login_required
def create_car():
    data = request.get_json(silent=True) or {}
    brand = (data.get('brand') or '').strip()
    model = (data.get('model') or '').strip()
    license_plate = (data.get('license_plate') or '').strip()

    if not brand or not model or not license_plate:
        return jsonify({'error': 'Brand, model, and license plate are required.'}), 400

    if Car.query.filter_by(license_plate=license_plate).first():
        return jsonify({'error': 'A car with this license plate already exists.'}), 409

    car = Car(
        user_id=current_user.id,
        brand=brand,
        model=model,
        license_plate=license_plate,
        year=data.get('year'),
        color=(data.get('color') or '').strip() or None,
    )
    db.session.add(car)
    db.session.commit()

    return jsonify({'car': car.to_dict()}), 201


@parking.route('/api/spots', methods=['GET'])
def get_spots():
    city_id = request.args.get('city_id', type=int)
    city_name = (request.args.get('city') or '').strip()
    max_price = request.args.get('max_price', type=float)
    available_only = request.args.get('available_only', default='true').lower() == 'true'
    query = ParkingSpot.query

    if available_only:
        query = query.filter_by(is_available=True)

    if city_id is not None:
        query = query.filter_by(city_id=city_id)
    elif city_name:
        city = City.query.filter(db.func.lower(City.name) == city_name.lower()).first()
        if city:
            query = query.filter_by(city_id=city.id)
        else:
            return jsonify({'spots': []}), 200

    if max_price is not None:
        query = query.filter(ParkingSpot.price_per_day <= max_price)

    spots = query.order_by(ParkingSpot.created_at.desc()).all()
    return jsonify({'spots': [spot.to_dict() for spot in spots]}), 200


@parking.route('/api/cities/<int:city_id>/spots', methods=['GET'])
def get_city_spots(city_id):
    city = City.query.get(city_id)
    if not city:
        return jsonify({'error': 'City not found.'}), 404

    spots = ParkingSpot.query.filter_by(city_id=city.id).order_by(ParkingSpot.created_at.desc()).all()
    return jsonify({'city': city.to_dict(), 'spots': [spot.to_dict() for spot in spots]}), 200


@parking.route('/api/spots/<int:spot_id>', methods=['GET'])
def get_spot(spot_id):
    spot = ParkingSpot.query.get(spot_id)
    if not spot:
        return jsonify({'error': 'Spot not found.'}), 404
    return jsonify({'spot': spot.to_dict()}), 200


@parking.route('/api/spots', methods=['POST'])
@login_required
def create_spot():
    data = request.get_json(silent=True) or {}
    city_id = data.get('city_id')
    title = (data.get('title') or '').strip()
    address = (data.get('address') or '').strip()
    price_per_day = data.get('price_per_day', 0)

    if not city_id or not title or not address:
        return jsonify({'error': 'City, title, and address are required.'}), 400

    try:
        price_value = float(price_per_day)
    except (TypeError, ValueError):
        return jsonify({'error': 'Price per day must be a valid number.'}), 400

    if price_value < 0:
        return jsonify({'error': 'Price per day cannot be negative.'}), 400

    city = City.query.get(city_id)
    if not city:
        return jsonify({'error': 'City not found.'}), 404

    spot = ParkingSpot(
        user_id=current_user.id,
        city_id=city.id,
        title=title,
        address=address,
        description=(data.get('description') or '').strip() or None,
        price_per_day=price_value,
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        is_available=bool(data.get('is_available', True)),
    )
    db.session.add(spot)
    db.session.commit()

    return jsonify({'spot': spot.to_dict()}), 201


@parking.route('/api/spots/<int:spot_id>/availability', methods=['PATCH'])
@login_required
def update_spot_availability(spot_id):
    spot = ParkingSpot.query.filter_by(id=spot_id, user_id=current_user.id).first()
    if not spot:
        return jsonify({'error': 'Spot not found or you do not own it.'}), 404

    data = request.get_json(silent=True) or {}
    if 'is_available' not in data:
        return jsonify({'error': 'is_available is required.'}), 400

    spot.is_available = bool(data.get('is_available'))
    db.session.commit()

    return jsonify({'spot': spot.to_dict()}), 200


@parking.route('/api/bookings', methods=['GET'])
@login_required
def get_my_bookings():
    bookings = Booking.query.filter_by(user_id=current_user.id).order_by(Booking.created_at.desc()).all()
    return jsonify({'bookings': [booking.to_dict() for booking in bookings]}), 200


@parking.route('/api/owner-bookings', methods=['GET'])
@login_required
def get_owner_bookings():
    bookings = db.session.query(Booking).join(ParkingSpot).filter(ParkingSpot.user_id == current_user.id).order_by(Booking.created_at.desc()).all()
    return jsonify({'bookings': [booking.to_dict() for booking in bookings]}), 200


@parking.route('/api/bookings', methods=['POST'])
@login_required
def create_booking():
    data = request.get_json(silent=True) or {}
    spot_id = data.get('spot_id')
    start_date_raw = data.get('start_date')
    end_date_raw = data.get('end_date')

    if not spot_id or not start_date_raw or not end_date_raw:
        return jsonify({'error': 'spot_id, start_date, and end_date are required.'}), 400

    spot = ParkingSpot.query.get(spot_id)
    if not spot:
        return jsonify({'error': 'Parking spot not found.'}), 404

    if spot.user_id == current_user.id:
        return jsonify({'error': 'You cannot book your own parking spot.'}), 400

    if not spot.is_available:
        return jsonify({'error': 'This parking spot is currently unavailable.'}), 400

    try:
        start_date = datetime.fromisoformat(start_date_raw.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end_date_raw.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Dates must be valid ISO timestamps.'}), 400

    if end_date <= start_date:
        return jsonify({'error': 'End date must be after the start date.'}), 400

    duration_days = (end_date - start_date).total_seconds() / 86400
    if duration_days <= 0:
        return jsonify({'error': 'Booking duration must be greater than zero.'}), 400

    total_price = round(float(spot.price_per_day) * duration_days, 2)

    booking = Booking(
        spot_id=spot.id,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        total_price=total_price,
        status='pending',
    )
    db.session.add(booking)
    db.session.commit()

    return jsonify({'booking': booking.to_dict()}), 201


@parking.route('/api/bookings/<int:booking_id>/status', methods=['PATCH'])
@login_required
def update_booking_status(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found.'}), 404

    spot = ParkingSpot.query.get(booking.spot_id)
    if not spot or spot.user_id != current_user.id:
        return jsonify({'error': 'You do not have permission to update this booking.'}), 403

    data = request.get_json(silent=True) or {}
    new_status = (data.get('status') or '').strip().lower()
    valid_statuses = {'pending', 'accepted', 'rejected', 'cancelled'}

    if new_status not in valid_statuses:
        return jsonify({'error': 'Status must be one of: pending, accepted, rejected, cancelled.'}), 400

    booking.status = new_status
    db.session.commit()

    return jsonify({'booking': booking.to_dict()}), 200


@parking.route('/api/my-spots', methods=['GET'])
@login_required
def get_my_spots():
    spots = ParkingSpot.query.filter_by(user_id=current_user.id).order_by(ParkingSpot.created_at.desc()).all()
    return jsonify({'spots': [spot.to_dict() for spot in spots]}), 200


@parking.route('/api/spots/<int:spot_id>', methods=['PUT', 'PATCH'])
@login_required
def update_spot(spot_id):
    spot = ParkingSpot.query.filter_by(id=spot_id, user_id=current_user.id).first()
    if not spot:
        return jsonify({'error': 'Spot not found or you do not own it.'}), 404

    data = request.get_json(silent=True) or {}

    if 'title' in data:
        title = (data.get('title') or '').strip()
        if not title:
            return jsonify({'error': 'Title cannot be empty.'}), 400
        spot.title = title

    if 'address' in data:
        address = (data.get('address') or '').strip()
        if not address:
            return jsonify({'error': 'Address cannot be empty.'}), 400
        spot.address = address

    if 'description' in data:
        spot.description = (data.get('description') or '').strip() or None

    if 'price_per_day' in data:
        try:
            price_value = float(data.get('price_per_day'))
        except (TypeError, ValueError):
            return jsonify({'error': 'Price per day must be a valid number.'}), 400
        if price_value < 0:
            return jsonify({'error': 'Price per day cannot be negative.'}), 400
        spot.price_per_day = price_value

    if 'city_id' in data:
        city = City.query.get(data.get('city_id'))
        if not city:
            return jsonify({'error': 'City not found.'}), 404
        spot.city_id = city.id

    if 'latitude' in data:
        spot.latitude = data.get('latitude')

    if 'longitude' in data:
        spot.longitude = data.get('longitude')

    if 'is_available' in data:
        spot.is_available = bool(data.get('is_available'))

    db.session.commit()
    return jsonify({'spot': spot.to_dict()}), 200


@parking.route('/api/spots/<int:spot_id>', methods=['DELETE'])
@login_required
def delete_spot(spot_id):
    spot = ParkingSpot.query.filter_by(id=spot_id, user_id=current_user.id).first()
    if not spot:
        return jsonify({'error': 'Spot not found or you do not own it.'}), 404

    db.session.delete(spot)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Parking spot deleted.'}), 200


@parking.route('/api/cars/<int:car_id>', methods=['PUT', 'PATCH'])
@login_required
def update_car(car_id):
    car = Car.query.filter_by(id=car_id, user_id=current_user.id).first()
    if not car:
        return jsonify({'error': 'Car not found or you do not own it.'}), 404

    data = request.get_json(silent=True) or {}

    if 'brand' in data:
        brand = (data.get('brand') or '').strip()
        if not brand:
            return jsonify({'error': 'Brand cannot be empty.'}), 400
        car.brand = brand

    if 'model' in data:
        model = (data.get('model') or '').strip()
        if not model:
            return jsonify({'error': 'Model cannot be empty.'}), 400
        car.model = model

    if 'license_plate' in data:
        license_plate = (data.get('license_plate') or '').strip()
        if not license_plate:
            return jsonify({'error': 'License plate cannot be empty.'}), 400
        car.license_plate = license_plate

    if 'year' in data:
        car.year = data.get('year')

    if 'color' in data:
        color = (data.get('color') or '').strip()
        car.color = color or None

    db.session.commit()
    return jsonify({'car': car.to_dict()}), 200


@parking.route('/api/cars/<int:car_id>', methods=['DELETE'])
@login_required
def delete_car(car_id):
    car = Car.query.filter_by(id=car_id, user_id=current_user.id).first()
    if not car:
        return jsonify({'error': 'Car not found or you do not own it.'}), 404

    db.session.delete(car)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Car deleted.'}), 200
