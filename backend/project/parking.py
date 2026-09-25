import os
import uuid
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from flask_login import current_user, login_required
from sqlalchemy.exc import IntegrityError

from werkzeug.utils import secure_filename
import os

from . import db
from .models import Booking, Car, City, ParkingSpot, User

parking = Blueprint('parking', __name__)

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}


def _allowed_image(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


def _save_uploaded_image(file_storage, prefix: str) -> str:
    """Salvează fișierul primit in app.config['UPLOAD_DIR'] și returnează numele generat."""
    ext = file_storage.filename.rsplit('.', 1)[1].lower() if '.' in file_storage.filename else 'bin'
    filename = f"{prefix}_{uuid.uuid4().hex}.{ext}"
    upload_dir = current_app.config['UPLOAD_DIR']
    os.makedirs(upload_dir, exist_ok=True)
    file_storage.save(os.path.join(upload_dir, filename))
    return filename

def _delete_image_file(filename):
    """Șterge fișierul de pe disc dacă există."""
    if not filename:
        return
    filepath = os.path.join(current_app.config['UPLOAD_DIR'], filename)
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
        except OSError:
            pass  # nu blocăm request-ul dacă ștergerea fizică eșuează


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
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'A city with this name already exists.'}), 409

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
    brand = (request.form.get('brand') or '').strip()
    model = (request.form.get('model') or '').strip()
    license_plate = (request.form.get('license_plate') or '').strip()
    color = (request.form.get('color') or '').strip()
    year = request.form.get('year')

    if not brand or not model or not license_plate:
        return jsonify({'error': 'Brand, model, and license plate are required.'}), 400
    if Car.query.filter_by(user_id=current_user.id).count() >= 5:
        return jsonify({'error': 'Maximum 5 cars per user.'}), 400
    if Car.query.filter_by(license_plate=license_plate).first():
        return jsonify({'error': 'A car with this license plate already exists.'}), 409

    image_filename = None
    image_file = request.files.get('image')
    if image_file and image_file.filename:
        if not _allowed_image(image_file.filename):
            return jsonify({'error': 'Invalid image type. Use png, jpg, jpeg or webp.'}), 400
        image_filename = _save_uploaded_image(image_file, 'car')

    car = Car(
        user_id=current_user.id,
        brand=brand,
        model=model,
        license_plate=license_plate,
        year=int(year) if year else None,
        color=color or None,
        image_url=image_filename,
    )
    db.session.add(car)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'A car with this license plate already exists.'}), 409

    return jsonify({'car': car.to_dict()}), 201

@parking.route('/api/cars/<int:car_id>', methods=['PATCH'])
@login_required
def update_car(car_id):
    car = Car.query.filter_by(id=car_id, user_id=current_user.id).first()
    if not car:
        return jsonify({'error': 'Car not found or you do not own it.'}), 404

    if 'brand' in request.form:
        brand = request.form.get('brand', '').strip()
        if not brand:
            return jsonify({'error': 'Brand cannot be empty.'}), 400
        car.brand = brand

    if 'model' in request.form:
        model = request.form.get('model', '').strip()
        if not model:
            return jsonify({'error': 'Model cannot be empty.'}), 400
        car.model = model

    if 'license_plate' in request.form:
        license_plate = request.form.get('license_plate', '').strip()
        if not license_plate:
            return jsonify({'error': 'License plate cannot be empty.'}), 400
        existing = Car.query.filter(
            Car.license_plate == license_plate, Car.id != car.id
        ).first()
        if existing:
            return jsonify({'error': 'A car with this license plate already exists.'}), 409
        car.license_plate = license_plate

    if 'color' in request.form:
        car.color = request.form.get('color', '').strip() or None

    if 'year' in request.form:
        year_raw = request.form.get('year')
        car.year = int(year_raw) if year_raw else None

    image_file = request.files.get('image')
    if image_file and image_file.filename:
        if not _allowed_image(image_file.filename):
            return jsonify({'error': 'Invalid image type. Use png, jpg, jpeg or webp.'}), 400
        old_image = car.image_url
        car.image_url = _save_uploaded_image(image_file, 'car')
        _delete_image_file(old_image)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'A car with this license plate already exists.'}), 409

    return jsonify({'car': car.to_dict()}), 200


@parking.route('/api/cars/<int:car_id>', methods=['DELETE'])
@login_required
def delete_car(car_id):
    car = Car.query.filter_by(id=car_id, user_id=current_user.id).first()
    if not car:
        return jsonify({'error': 'Car not found or you do not own it.'}), 404

    # Remove any related data if present in future (none currently), then files
    _delete_image_file(car.image_url)
    _delete_image_file(car.document_url)

    db.session.delete(car)
    db.session.commit()
    return jsonify({'message': 'Car deleted successfully.'}), 200


@parking.route('/api/cars/<int:car_id>/image', methods=['GET'])
def get_car_image(car_id):
    car = Car.query.get(car_id)
    if not car or not car.image_url:
        return jsonify({'error': 'Image not found.'}), 404
    return send_from_directory(current_app.config['UPLOAD_DIR'], car.image_url)


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
    city_id = request.form.get('city_id')
    title = (request.form.get('title') or '').strip()
    address = (request.form.get('address') or '').strip()
    description = (request.form.get('description') or '').strip()
    price_per_day = request.form.get('price_per_day', 0)

    if not city_id or not title or not address:
        return jsonify({'error': 'City, title, and address are required.'}), 400
    if ParkingSpot.query.filter_by(user_id=current_user.id).count() >= 5:
        return jsonify({'error': 'Maximum 5 rented spots per user.'}), 400

    try:
        price_value = float(price_per_day)
    except (TypeError, ValueError):
        return jsonify({'error': 'Price per day must be a valid number.'}), 400
    if price_value < 0:
        return jsonify({'error': 'Price per day cannot be negative.'}), 400

    city = City.query.get(city_id)
    if not city:
        return jsonify({'error': 'City not found.'}), 404

    image_filename = None
    image_file = request.files.get('image')
    if image_file and image_file.filename:
        if not _allowed_image(image_file.filename):
            return jsonify({'error': 'Invalid image type. Use png, jpg, jpeg or webp.'}), 400
        image_filename = _save_uploaded_image(image_file, 'spot')

    document_filename = None
    doc_file = request.files.get('document')
    if doc_file and doc_file.filename:
        document_filename = _save_uploaded_image(doc_file, 'doc')

    start_hour = request.form.get('start_hour') or request.form.get('start_time') or '08:00'
    end_hour = request.form.get('end_hour') or request.form.get('end_time') or '17:00'
    price_currency = request.form.get('price_currency') or 'RON'
    is_on_sale_raw = request.form.get('is_on_sale')
    is_on_sale = str(is_on_sale_raw).lower() in ['true', '1', 'on sale']

    lat_raw = request.form.get('latitude')
    lng_raw = request.form.get('longitude')
    try:
        lat_val = float(lat_raw) if lat_raw is not None and lat_raw != '' else None
    except (ValueError, TypeError):
        lat_val = None
    try:
        lng_val = float(lng_raw) if lng_raw is not None and lng_raw != '' else None
    except (ValueError, TypeError):
        lng_val = None

    spot = ParkingSpot(
        user_id=current_user.id,
        city_id=city.id,
        title=title,
        address=address,
        description=description or None,
        price_per_day=price_value,
        latitude=lat_val,
        longitude=lng_val,
        is_available=True,
        image_url=image_filename,
        document_url=document_filename,
        start_hour=start_hour,
        end_hour=end_hour,
        price_currency=price_currency,
        is_on_sale=is_on_sale,
    )
    db.session.add(spot)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Failed to create parking spot due to data integrity issue.'}), 409

    return jsonify({'spot': spot.to_dict()}), 201

@parking.route('/api/spots/<int:spot_id>', methods=['PATCH'])
@login_required
def update_spot(spot_id):
    spot = ParkingSpot.query.filter_by(id=spot_id, user_id=current_user.id).first()
    if not spot:
        return jsonify({'error': 'Spot not found or you do not own it.'}), 404

    if 'city_id' in request.form:
        city = City.query.get(request.form.get('city_id'))
        if not city:
            return jsonify({'error': 'City not found.'}), 404
        spot.city_id = city.id

    if 'title' in request.form:
        title = request.form.get('title', '').strip()
        if not title:
            return jsonify({'error': 'Title cannot be empty.'}), 400
        spot.title = title

    if 'address' in request.form:
        address = request.form.get('address', '').strip()
        if not address:
            return jsonify({'error': 'Address cannot be empty.'}), 400
        spot.address = address

    if 'description' in request.form:
        spot.description = request.form.get('description', '').strip() or None

    if 'price_per_day' in request.form:
        try:
            price_value = float(request.form.get('price_per_day'))
        except (TypeError, ValueError):
            return jsonify({'error': 'Price per day must be a valid number.'}), 400
        if price_value < 0:
            return jsonify({'error': 'Price per day cannot be negative.'}), 400
        spot.price_per_day = price_value

    if 'latitude' in request.form:
        lat_raw = request.form.get('latitude')
        try:
            spot.latitude = float(lat_raw) if lat_raw is not None and lat_raw != '' else None
        except (ValueError, TypeError):
            spot.latitude = None

    if 'longitude' in request.form:
        lng_raw = request.form.get('longitude')
        try:
            spot.longitude = float(lng_raw) if lng_raw is not None and lng_raw != '' else None
        except (ValueError, TypeError):
            spot.longitude = None

    if 'start_hour' in request.form or 'start_time' in request.form:
        val = request.form.get('start_hour') or request.form.get('start_time')
        if val:
            spot.start_hour = val

    if 'end_hour' in request.form or 'end_time' in request.form:
        val = request.form.get('end_hour') or request.form.get('end_time')
        if val:
            spot.end_hour = val

    if 'price_currency' in request.form:
        val = request.form.get('price_currency')
        if val:
            spot.price_currency = val

    if 'is_on_sale' in request.form:
        val = request.form.get('is_on_sale')
        spot.is_on_sale = str(val).lower() in ['true', '1', 'on sale']

    image_file = request.files.get('image')
    if image_file and image_file.filename:
        if not _allowed_image(image_file.filename):
            return jsonify({'error': 'Invalid image type. Use png, jpg, jpeg or webp.'}), 400
        old_image = spot.image_url
        spot.image_url = _save_uploaded_image(image_file, 'spot')
        _delete_image_file(old_image)
    elif request.form.get('remove_image') == 'true':
        old_image = spot.image_url
        spot.image_url = None
        _delete_image_file(old_image)

    doc_file = request.files.get('document')
    if doc_file and doc_file.filename:
        old_doc = spot.document_url
        spot.document_url = _save_uploaded_image(doc_file, 'doc')
        _delete_image_file(old_doc)
    elif request.form.get('remove_document') == 'true':
        old_doc = spot.document_url
        spot.document_url = None
        _delete_image_file(old_doc)

    db.session.commit()
    return jsonify({'spot': spot.to_dict()}), 200


@parking.route('/api/spots/<int:spot_id>', methods=['DELETE'])
@login_required
def delete_spot(spot_id):
    spot = ParkingSpot.query.filter_by(id=spot_id, user_id=current_user.id).first()
    if not spot:
        return jsonify({'error': 'Spot not found or you do not own it.'}), 404

    Booking.query.filter_by(spot_id=spot.id).delete(synchronize_session=False)
    _delete_image_file(spot.image_url)
    _delete_image_file(spot.document_url)
    db.session.delete(spot)
    db.session.commit()
    return jsonify({'message': 'Spot deleted successfully.'}), 200


@parking.route('/api/spots/<int:spot_id>/image', methods=['GET'])
def get_spot_image(spot_id):
    spot = ParkingSpot.query.get(spot_id)
    if not spot or not spot.image_url:
        return jsonify({'error': 'Image not found.'}), 404
    return send_from_directory(current_app.config['UPLOAD_DIR'], spot.image_url)


@parking.route('/api/spots/<int:spot_id>/document', methods=['GET'])
def get_spot_document(spot_id):
    spot = ParkingSpot.query.get(spot_id)
    if not spot or not spot.document_url:
        return jsonify({'error': 'Document not found.'}), 404
    return send_from_directory(current_app.config['UPLOAD_DIR'], spot.document_url)


@parking.route('/api/my-spots', methods=['GET'])
@login_required
def get_my_spots():
    spots = ParkingSpot.query.filter_by(user_id=current_user.id).order_by(ParkingSpot.created_at.desc()).all()
    return jsonify({'spots': [spot.to_dict() for spot in spots]}), 200


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
    data = request.get_json(silent=True)
    if data is None:
        data = request.form.to_dict() or request.args.to_dict() or {}

    if not data and request.data:
        try:
            data = request.get_json(force=True, silent=True) or {}
        except Exception:
            data = {}

    spot_id = data.get('spot_id') or data.get('spotId')
    start_date_raw = data.get('start_date') or data.get('startDate')
    end_date_raw = data.get('end_date') or data.get('endDate')

    if not spot_id or not start_date_raw or not end_date_raw:
        return jsonify({'error': 'spot_id, start_date, and end_date are required.'}), 400

    spot = ParkingSpot.query.get(spot_id)
    if not spot:
        return jsonify({'error': 'Spot not found.'}), 404

    def parse_booking_datetime(value):
        if value is None:
            raise ValueError('Missing datetime value')
        if isinstance(value, str):
            candidate = value.strip()
            if not candidate:
                raise ValueError('Empty datetime value')
            if candidate.endswith('Z'):
                candidate = candidate[:-1] + '+00:00'
            try:
                parsed = datetime.fromisoformat(candidate)
            except ValueError:
                try:
                    parsed = datetime.fromisoformat(candidate.replace(' ', 'T'))
                except ValueError:
                    raise
            return parsed
        try:
            return datetime.fromisoformat(str(value))
        except ValueError:
            raise

    try:
        start_date = parse_booking_datetime(start_date_raw)
        end_date = parse_booking_datetime(end_date_raw)
        if start_date.tzinfo is not None:
            start_date = start_date.astimezone(timezone.utc).replace(tzinfo=None)
        if end_date.tzinfo is not None:
            end_date = end_date.astimezone(timezone.utc).replace(tzinfo=None)
    except ValueError:
        return jsonify({'error': 'start_date and end_date must be valid ISO datetime strings.'}), 400

    if end_date <= start_date:
        return jsonify({'error': 'end_date must be after start_date.'}), 400

    overlapping = Booking.query.filter(
        Booking.spot_id == spot.id,
        Booking.status != 'cancelled',
        Booking.start_date < end_date,
        Booking.end_date > start_date
    ).first()
    if overlapping:
        return jsonify({'error': 'The selected time slot is already booked.'}), 409

    operating_hours = 24.0
    if spot.start_hour and spot.end_hour:
        try:
            sh_parts = [int(p) for p in spot.start_hour.split(':')]
            eh_parts = [int(p) for p in spot.end_hour.split(':')]
            sh_val = sh_parts[0] + (sh_parts[1] / 60.0 if len(sh_parts) > 1 else 0)
            eh_val = eh_parts[0] + (eh_parts[1] / 60.0 if len(eh_parts) > 1 else 0)
            if eh_val > sh_val:
                operating_hours = eh_val - sh_val
        except Exception:
            operating_hours = 24.0
    hourly_rate = float(spot.price_per_day) / operating_hours
    duration_hours = (end_date - start_date).total_seconds() / 3600.0
    total_price = round(duration_hours * hourly_rate, 2)
    booking = Booking(
        spot_id=spot.id,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        total_price=total_price,
        status='confirmed',
    )
    db.session.add(booking)
    db.session.commit()
    return jsonify({'booking': booking.to_dict()}), 201


@parking.route('/api/dashboard/timers', methods=['GET'])
@login_required
def get_dashboard_timers():
    now = datetime.utcnow()
    bookings = Booking.query.filter(
        Booking.user_id == current_user.id,
        Booking.status != 'cancelled'
    ).order_by(Booking.start_date.asc()).all()

    active_booking = None
    upcoming_booking = None

    for b in bookings:
        if b.start_date <= now:
            # Active or overtime
            if not active_booking or b.start_date > active_booking.start_date:
                active_booking = b
        elif b.start_date > now:
            if not upcoming_booking or b.start_date < upcoming_booking.start_date:
                upcoming_booking = b

    rental_data = None
    if active_booking:
        spot = active_booking.spot
        target_time_ms = int(active_booking.end_date.replace(tzinfo=timezone.utc).timestamp() * 1000)
        start_time_ms = int(active_booking.start_date.replace(tzinfo=timezone.utc).timestamp() * 1000)
        is_overtime = now > active_booking.end_date
        overtime_seconds = max(0, int((now - active_booking.end_date).total_seconds()))

        hourly_rate = float(spot.price_per_day) if spot else 4.0
        if spot and spot.start_hour and spot.end_hour:
            try:
                sh_parts = [int(p) for p in spot.start_hour.split(':')]
                eh_parts = [int(p) for p in spot.end_hour.split(':')]
                sh_val = sh_parts[0] + (sh_parts[1] / 60.0 if len(sh_parts) > 1 else 0)
                eh_val = eh_parts[0] + (eh_parts[1] / 60.0 if len(eh_parts) > 1 else 0)
                operating_hours = (eh_val - sh_val) if eh_val > sh_val else 24.0
                hourly_rate = round(float(spot.price_per_day) / operating_hours, 2)
            except Exception:
                hourly_rate = round(float(spot.price_per_day) / 24.0, 2)

        extra_cost = round((overtime_seconds / 3600.0) * hourly_rate, 2)

        rental_data = {
            'id': active_booking.id,
            'title': spot.title if spot else 'Active Parking Spot',
            'address': spot.address if spot else '',
            'targetTime': target_time_ms,
            'startTime': start_time_ms,
            'status': 'overtime' if is_overtime else 'active',
            'is_overtime': is_overtime,
            'overtime_seconds': overtime_seconds,
            'hourly_rate': hourly_rate,
            'extra_cost': extra_cost,
            'currency': spot.price_currency if spot else 'RON',
            'start_date': active_booking.start_date.replace(tzinfo=timezone.utc).isoformat(),
            'end_date': active_booking.end_date.replace(tzinfo=timezone.utc).isoformat(),
            'spot': spot.to_dict() if spot else None,
        }

    reservation_data = None
    if upcoming_booking:
        spot = upcoming_booking.spot
        target_time_ms = int(upcoming_booking.start_date.replace(tzinfo=timezone.utc).timestamp() * 1000)
        end_time_ms = int(upcoming_booking.end_date.replace(tzinfo=timezone.utc).timestamp() * 1000)

        reservation_data = {
            'id': upcoming_booking.id,
            'title': spot.title if spot else 'Upcoming Reservation',
            'address': spot.address if spot else '',
            'targetTime': target_time_ms,
            'startTime': target_time_ms,
            'endTime': end_time_ms,
            'status': 'upcoming',
            'currency': spot.price_currency if spot else 'RON',
            'start_date': upcoming_booking.start_date.replace(tzinfo=timezone.utc).isoformat(),
            'end_date': upcoming_booking.end_date.replace(tzinfo=timezone.utc).isoformat(),
            'spot': spot.to_dict() if spot else None,
        }

    return jsonify({
        'rental': rental_data,
        'reservation': reservation_data,
        'bookings': [b.to_dict() for b in bookings],
    }), 200
