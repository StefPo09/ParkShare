import os
import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, flash, jsonify, redirect, render_template, request, send_from_directory, url_for
from flask_login import current_user, login_user, login_required, logout_user
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

from . import db
from .models import Booking, Car, ParkingSpot, PersonalDetails, ProfilePicture, User

ALLOWED_EXT = {'png', 'jpg', 'jpeg'}
UPLOAD_BASE = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_BASE, exist_ok=True)

auth = Blueprint('auth', __name__)


def user_response(user):
    pd = getattr(user, 'personal_details', None)
    if pd is not None:
        personal_country = getattr(pd, 'country', None) or user.country
        personal_city = getattr(pd, 'city', None) or user.city
        first_name = getattr(pd, 'first_name', None)
        last_name = getattr(pd, 'last_name', None)
        date_of_birth = pd.date_of_birth.isoformat() if getattr(pd, 'date_of_birth', None) else None
    else:
        personal_country = user.country
        personal_city = user.city
        first_name = None
        last_name = None
        date_of_birth = None

    return {
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'phone_country_code': user.phone_country_code,
        'phone': user.phone,
        'country': personal_country,
        'city': personal_city,
        'first_name': first_name,
        'last_name': last_name,
        'date_of_birth': date_of_birth,
    }


@auth.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    first_name = (data.get('first_name') or '').strip()
    last_name = (data.get('last_name') or '').strip()
    display_name = (data.get('name') or '').strip()
    phone_country_code = (data.get('phone_country_code') or '').strip()
    phone = (data.get('phone') or '').strip()
    country = (data.get('country') or '').strip()
    city = (data.get('city') or '').strip()
    dob = (data.get('date_of_birth') or '').strip()

    if not email:
        return jsonify({'error': 'Email is required.'}), 400
    if not password:
        return jsonify({'error': 'Password is required.'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters.'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with that email already exists.'}), 409

    if display_name and not (first_name or last_name):
        name_parts = display_name.split()
        first_name = name_parts[0]
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

    user = User(
        email=email,
        password=generate_password_hash(password) if password else None,
        phone_country_code=phone_country_code or None,
        phone=phone or None,
        country=country or None,
        city=city or None,
    )
    if first_name or last_name:
        user.name = ((first_name or '') + ' ' + (last_name or '')).strip()
    elif display_name:
        user.name = display_name

    db.session.add(user)
    db.session.commit()

    pd = PersonalDetails.query.filter_by(user_id=user.id).first()
    if not pd:
        pd = PersonalDetails(user_id=user.id)
        db.session.add(pd)
    pd.first_name = first_name or None
    pd.last_name = last_name or None
    pd.country = country or None
    pd.city = city or None
    if dob:
        try:
            pd.date_of_birth = datetime.strptime(dob, '%Y-%m-%d').date()
        except ValueError:
            pass
    db.session.commit()
    return jsonify({'user': user_response(user)}), 201


@auth.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    user = User.query.filter_by(email=email).first()
    if not user or not user.password or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid email or password.'}), 401
    login_user(user, remember=bool(data.get('remember')))
    return jsonify({'user': user_response(user)}), 200


@auth.route('/api/auth/me', methods=['GET'])
def api_current_user():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Authentication required.'}), 401
    return jsonify({'user': user_response(current_user)}), 200


@auth.route('/api/user/personal-details', methods=['PATCH'])
@login_required
def update_personal_details():
    data = request.get_json(silent=True) or {}

    first_name = (data.get('first_name') or '').strip()
    last_name = (data.get('last_name') or '').strip()
    dob = (data.get('date_of_birth') or '').strip()

    pd = PersonalDetails.query.filter_by(user_id=current_user.id).first()
    if not pd:
        pd = PersonalDetails(user_id=current_user.id)
        db.session.add(pd)

    if 'first_name' in data:
        pd.first_name = first_name or None
    if 'last_name' in data:
        pd.last_name = last_name or None
    if 'date_of_birth' in data:
        if dob:
            try:
                pd.date_of_birth = datetime.strptime(dob, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400
        else:
            pd.date_of_birth = None

    name_parts = [pd.first_name or '', pd.last_name or '']
    current_user.name = ' '.join(part for part in name_parts if part).strip() or None

    db.session.commit()
    return jsonify({'user': user_response(current_user)}), 200


@auth.route('/api/auth/logout', methods=['POST'])
def api_logout():
    logout_user()
    return jsonify({'success': True}), 200


@auth.route('/api/user/profile-picture', methods=['GET', 'POST', 'DELETE'])
@login_required
def profile_picture():
    if request.method == 'GET':
        pic = ProfilePicture.query.filter_by(user_id=current_user.id).first()
        if not pic:
            return jsonify({'picture': None}), 200
        return jsonify({'picture': {'id': pic.id, 'filename': pic.filename, 'content_type': pic.content_type, 'uploaded_at': pic.uploaded_at.isoformat() if pic.uploaded_at else None}})

    if request.method == 'DELETE':
        pic = ProfilePicture.query.filter_by(user_id=current_user.id).first()
        if not pic or not pic.filename:
            return jsonify({'error': 'Not found'}), 404
        file_path = os.path.join(UPLOAD_BASE, 'profile_pictures', pic.filename)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except OSError:
            pass
        db.session.delete(pic)
        db.session.commit()
        return jsonify({'success': True}), 200

    if 'picture' not in request.files:
        return jsonify({'error': 'Missing file field `picture`'}), 400
    uploaded = request.files['picture']
    if uploaded.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(uploaded.filename)
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in ALLOWED_EXT:
        return jsonify({'error': 'Invalid file type. Use JPG/JPEG/PNG.'}), 400

    user_dir = os.path.join(UPLOAD_BASE, 'profile_pictures')
    os.makedirs(user_dir, exist_ok=True)
    final_name = f"u{current_user.id}_{int(datetime.utcnow().timestamp())}_{filename}"
    final_path = os.path.join(user_dir, final_name)

    pic = ProfilePicture.query.filter_by(user_id=current_user.id).first()
    if pic and pic.filename:
        old_path = os.path.join(user_dir, pic.filename)
        try:
            if os.path.exists(old_path):
                os.remove(old_path)
        except OSError:
            pass

    uploaded.save(final_path)

    if not pic:
        pic = ProfilePicture(user_id=current_user.id)
        db.session.add(pic)
    pic.filename = final_name
    pic.content_type = uploaded.mimetype or 'image/' + ext
    pic.uploaded_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'picture': {'id': pic.id, 'filename': pic.filename}}), 201


@auth.route('/api/user/profile-picture/download')
@login_required
def download_profile_picture():
    pic = ProfilePicture.query.filter_by(user_id=current_user.id).first()
    if not pic or not pic.filename:
        return jsonify({'error': 'Not found'}), 404
    user_dir = os.path.join(UPLOAD_BASE, 'profile_pictures')
    return send_from_directory(user_dir, pic.filename, as_attachment=True)


@auth.route('/api/user/account', methods=['DELETE'])
@login_required
def delete_account():
    user = current_user
    user_id = user.id

    pic = ProfilePicture.query.filter_by(user_id=user_id).first()
    if pic and pic.filename:
        file_path = os.path.join(UPLOAD_BASE, 'profile_pictures', pic.filename)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except OSError:
            pass

    cars = Car.query.filter_by(user_id=user_id).all()
    for car in cars:
        for filename in [car.image_url, car.document_url]:
            if not filename:
                continue
            file_path = os.path.join(os.path.dirname(__file__), '..', 'uploads', filename)
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except OSError:
                pass

    spots = ParkingSpot.query.filter_by(user_id=user_id).all()
    for spot in spots:
        for filename in [spot.image_url, spot.document_url]:
            if not filename:
                continue
            file_path = os.path.join(os.path.dirname(__file__), '..', 'uploads', filename)
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except OSError:
                pass

    Booking.query.filter_by(user_id=user_id).delete(synchronize_session=False)
    db.session.delete(user)
    db.session.commit()
    logout_user()
    return jsonify({'success': True}), 200


@auth.route('/login')
def login():
    return render_template('login.html')


@auth.route('/login', methods=['POST'])
def login_post():
    email = request.form.get('email')
    password = request.form.get('password')
    remember = True if request.form.get('remember') else False

    user = User.query.filter_by(email=email).first()
    if not user or not user.password or not check_password_hash(user.password, password):
        flash('Please check your login details and try again.')
        return redirect(url_for('auth.login'))

    login_user(user, remember=remember)
    return redirect(url_for('main.profile'))


@auth.route('/signup')
def signup():
    return render_template('signup.html')


@auth.route('/signup', methods=['POST'])
def signup_post():
    email = (request.form.get('email') or '').strip().lower()
    if not email:
        flash('Email is required.')
        return redirect(url_for('auth.signup'))

    user = User.query.filter_by(email=email).first()
    if user:
        return redirect(url_for('auth.register', email=email))

    new_user = User(email=email)
    db.session.add(new_user)
    db.session.commit()
    return redirect(url_for('auth.register', email=email))


@auth.route('/register')
def register():
    email = request.args.get('email', '')
    return render_template('register.html', email=email)


@auth.route('/register', methods=['POST'])
def register_post():
    email = (request.form.get('email') or '').strip().lower()
    password = request.form.get('password') or ''
    first_name = (request.form.get('first_name') or '').strip()
    last_name = (request.form.get('last_name') or '').strip()
    phone_country_code = (request.form.get('phone_country_code') or '').strip()
    phone = (request.form.get('phone') or '').strip()
    country = (request.form.get('country') or '').strip()
    city = (request.form.get('city') or '').strip()
    dob = (request.form.get('date_of_birth') or '').strip()

    if not email:
        flash('Email is required')
        return redirect(url_for('auth.register'))

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email)
        db.session.add(user)
        db.session.flush()

    if password:
        if len(password) < 8:
            flash('Password must be at least 8 characters.')
            return redirect(url_for('auth.register', email=email))
        user.password = generate_password_hash(password)
    user.phone_country_code = phone_country_code or None
    user.phone = phone or None
    user.country = country or user.country
    user.city = city or user.city
    if first_name or last_name:
        user.name = ((first_name or '') + ' ' + (last_name or '')).strip()

    pd = PersonalDetails.query.filter_by(user_id=user.id).first()
    if not pd:
        pd = PersonalDetails(user_id=user.id)
        db.session.add(pd)
    pd.first_name = first_name or None
    pd.last_name = last_name or None
    pd.country = country or None
    pd.city = city or None
    if dob:
        try:
            pd.date_of_birth = datetime.strptime(dob, '%Y-%m-%d').date()
        except ValueError:
            pass

    db.session.commit()
    return redirect(url_for('auth.login'))


@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))


@auth.route('/forgot-password')
def forgot_password():
    return render_template('forgot_password.html')


@auth.route('/forgot-password', methods=['POST'])
def forgot_password_post():
    email = request.form.get('email')
    user = User.query.filter_by(email=email).first()

    if user:
        user.reset_token = secrets.token_urlsafe(32)
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.session.commit()
        flash('If an account with that email exists, a password reset link has been sent.')
    else:
        flash('If an account with that email exists, a password reset link has been sent.')
    return redirect(url_for('auth.login'))


@auth.route('/reset-password/<token>')
def reset_password(token):
    user = User.query.filter_by(reset_token=token).first()
    if not user or user.reset_token_expires is None or (user.reset_token_expires.tzinfo is None and user.reset_token_expires < datetime.utcnow()):
        flash('Invalid or expired reset token')
        return redirect(url_for('auth.login'))
    return render_template('reset_password.html', token=token)


@auth.route('/reset-password/<token>', methods=['POST'])
def reset_password_post(token):
    user = User.query.filter_by(reset_token=token).first()
    if not user:
        flash('Invalid or expired reset token')
        return redirect(url_for('auth.login'))

    new_password = request.form.get('password')
    user.password = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()
    flash('Your password has been reset successfully! Please log in.')
    return redirect(url_for('auth.login'))
