import secrets
from datetime import datetime, timedelta, timezone
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from .models import User
from . import db

auth = Blueprint('auth', __name__)

@auth.route('/login')
def login():
    return render_template('login.html')

@auth.route('/login', methods=['POST'])
def login_post():
    email = request.form.get('email')
    password = request.form.get('password')
    remember = True if request.form.get('remember') else False

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        flash('Please check your login details and try again.')
        return redirect(url_for('auth.login'))

    login_user(user, remember=remember)
    return redirect(url_for('main.profile'))

@auth.route('/signup')
def signup():
    return render_template('signup.html')

@auth.route('/signup', methods=['POST'])
def signup_post():
    email = request.form.get('email')
    name = request.form.get('name')
    password = request.form.get('password')

    user = User.query.filter_by(email=email).first()

    if user:
        flash('Email address already exists')
        return redirect(url_for('auth.signup'))

    # generate_password_hash defaults to scrypt/pbkdf2:sha256 in modern Werkzeug
    new_user = User(email=email, name=name, password=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()

    return redirect(url_for('auth.login'))

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))


# --- FORGOT & RESET PASSWORD ROUTES ---

@auth.route('/forgot-password')
def forgot_password():
    return render_template('forgot_password.html')

@auth.route('/forgot-password', methods=['POST'])
def forgot_password_post():
    email = request.form.get('email')
    user = User.query.filter_by(email=email).first()

    if user:
        # Generate token and expiration time (1 hour from now)
        user.reset_token = secrets.token_urlsafe(32)
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.session.commit()

        # TODO: Send email containing the link: url_for('auth.reset_password', token=user.reset_token, _external=True)
        flash('If an account with that email exists, a password reset link has been sent.')
    else:
        # Avoid user enumeration by showing the same flash message
        flash('If an account with that email exists, a password reset link has been sent.')

    return redirect(url_for('auth.login'))

@auth.route('/reset-password/<token>')
def reset_password(token):
    user = User.query.filter_by(reset_token=token).first()

    # Check if token exists and hasn't expired
    if not user or user.reset_token_expires is None or user.reset_token_expires.tzinfo is None and user.reset_token_expires < datetime.utcnow():
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
    
    # Update password and clear the reset token
    user.password = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()

    flash('Your password has been reset successfully! Please log in.')
    return redirect(url_for('auth.login'))