from datetime import date

from flask import Blueprint, flash, jsonify, redirect, render_template, request, url_for
from flask_login import current_user, login_user, logout_user
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from . import db
from .models import PersonalDetails, User


auth = Blueprint('auth', __name__)


def _user_payload(user):
    personal_details = user.personal_details
    first_name = personal_details.first_name if personal_details and personal_details.first_name else None
    last_name = personal_details.last_name if personal_details and personal_details.last_name else None

    if not first_name and not last_name and user.name:
        parts = user.name.split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else None

    return {
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'phone_country_code': user.phone_country_code,
        'phone': user.phone,
        'country': user.country,
        'city': user.city,
        'first_name': first_name,
        'last_name': last_name,
        'date_of_birth': (
            personal_details.date_of_birth.isoformat()
            if personal_details and personal_details.date_of_birth
            else None
        ),
    }


def _create_user(data):
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))
    first_name = str(data.get('first_name', '')).strip()
    last_name = str(data.get('last_name', '')).strip()
    name = str(data.get('name', '')).strip()

    if not name and (first_name or last_name):
        name = f"{first_name} {last_name}".strip()
    elif name and not first_name and not last_name:
        parts = name.split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ''

    phone_country_code = str(data.get('phone_country_code', '')).strip()
    phone = str(data.get('phone', '')).strip()
    country = str(data.get('country', '')).strip()
    city = str(data.get('city', '')).strip()

    if not all((email, name, password, phone_country_code, phone, country, city)):
        return None, 'All profile fields are required.', 400
    if len(password) < 8:
        return None, 'Password must be at least 8 characters long.', 400
    if User.query.filter_by(email=email).first():
        return None, 'An account with this email already exists.', 409

    user = User(
        email=email,
        name=name,
        password=generate_password_hash(password),
        phone_country_code=phone_country_code,
        phone=phone,
        country=country,
        city=city,
    )
    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return None, 'An account with this email already exists.', 409

    personal_details = PersonalDetails(
        user_id=user.id,
        first_name=first_name or None,
        last_name=last_name or None,
        country=country or None,
        city=city or None,
    )
    db.session.add(personal_details)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()

    return user, None, 201


@auth.route('/login')
def login():
    return render_template('login.html')


@auth.route('/login', methods=['POST'])
def login_post():
    email = request.form.get('email', '').strip().lower()
    password = request.form.get('password', '')
    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        flash('Please check your login details and try again.')
        return redirect(url_for('auth.login'))

    login_user(user, remember=bool(request.form.get('remember')))
    return redirect(url_for('main.profile'))


@auth.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        if User.query.filter_by(email=email).first():
            flash('An account with this email already exists')
            return redirect(url_for('auth.signup'))
        return redirect(url_for('auth.register', email=email))

    return render_template('signup.html')


@auth.route('/register', methods=['GET', 'POST'])
def register():
    email = request.values.get('email', '').strip().lower()
    if request.method == 'GET':
        return render_template('register.html', email=email)

    first_name = request.form.get('first_name', '').strip()
    last_name = request.form.get('last_name', '').strip()
    date_of_birth_value = request.form.get('date_of_birth', '').strip()
    try:
        date_of_birth = date.fromisoformat(date_of_birth_value) if date_of_birth_value else None
    except ValueError:
        flash('Please provide a valid date of birth.')
        return render_template('register.html', email=email)

    data = {
        'email': email,
        'password': request.form.get('password', ''),
        'first_name': first_name,
        'last_name': last_name,
        'name': ' '.join(part for part in (first_name, last_name) if part),
        'phone_country_code': request.form.get('phone_country_code', ''),
        'phone': request.form.get('phone', ''),
        'country': request.form.get('country', ''),
        'city': request.form.get('city', ''),
    }
    user, error, _ = _create_user(data)
    if error:
        flash(error)
        return render_template('register.html', email=email)

    if date_of_birth and user.personal_details:
        user.personal_details.date_of_birth = date_of_birth
        db.session.commit()

    return redirect(url_for('auth.login'))


@auth.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('main.index'))


@auth.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json(silent=True) or {}
    user, error, status = _create_user(data)
    if error:
        return jsonify({'error': error}), status
    login_user(user)
    return jsonify({'user': _user_payload(user)}), status


@auth.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json(silent=True) or {}
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))
    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid email or password.'}), 401

    login_user(user, remember=bool(data.get('remember')))
    return jsonify({'user': _user_payload(user)}), 200


@auth.route('/api/auth/me')
def api_me():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Authentication required.'}), 401
    return jsonify({'user': _user_payload(current_user)}), 200


@auth.route('/api/auth/logout', methods=['POST'])
def api_logout():
    logout_user()
    response = jsonify({'success': True})
    response.delete_cookie('session')
    return response, 200


@auth.route('/api/user/personal-details', methods=['PATCH'])
def api_update_personal_details():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Authentication required.'}), 401

    data = request.get_json(silent=True) or {}
    user = current_user

    if 'email' in data:
        email = str(data['email']).strip().lower()
        if email and email != user.email:
            existing = User.query.filter(User.email == email, User.id != user.id).first()
            if existing:
                return jsonify({'error': 'An account with this email already exists.'}), 409
            user.email = email

    if 'phone_country_code' in data:
        user.phone_country_code = str(data['phone_country_code']).strip()
    if 'phone' in data:
        user.phone = str(data['phone']).strip()
    if 'country' in data:
        user.country = str(data['country']).strip()
    if 'city' in data:
        user.city = str(data['city']).strip()

    personal_details = user.personal_details
    if not personal_details:
        personal_details = PersonalDetails(user_id=user.id)
        db.session.add(personal_details)

    if 'first_name' in data:
        personal_details.first_name = str(data['first_name']).strip()
    if 'last_name' in data:
        personal_details.last_name = str(data['last_name']).strip()
    if 'date_of_birth' in data:
        dob_raw = str(data['date_of_birth']).strip()
        try:
            personal_details.date_of_birth = date.fromisoformat(dob_raw) if dob_raw else None
        except ValueError:
            pass

    full_name = f"{personal_details.first_name or ''} {personal_details.last_name or ''}".strip()
    if full_name:
        user.name = full_name

    db.session.commit()
    return jsonify({'user': _user_payload(user)}), 200
