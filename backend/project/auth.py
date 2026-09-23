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
    return {
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'phone_country_code': user.phone_country_code,
        'phone': user.phone,
        'country': user.country,
        'city': user.city,
        'first_name': personal_details.first_name if personal_details else None,
        'last_name': personal_details.last_name if personal_details else None,
        'date_of_birth': (
            personal_details.date_of_birth.isoformat()
            if personal_details and personal_details.date_of_birth
            else None
        ),
    }


def _create_user(data):
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))
    name = str(data.get('name', '')).strip()
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

    user.personal_details = PersonalDetails(
        first_name=first_name or None,
        last_name=last_name or None,
        date_of_birth=date_of_birth,
    )
    db.session.commit()
    return redirect(url_for('auth.login'))


@auth.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('main.index'))


@auth.route('/api/auth/register', methods=['POST'])
def api_register():
    user, error, status = _create_user(request.get_json(silent=True) or {})
    if error:
        return jsonify({'error': error}), status
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