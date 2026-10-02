from datetime import datetime, timezone
from urllib.parse import urlsplit, urlunsplit

import stripe
from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_required
from stripe import StripeError

from . import db
from .models import PremiumSubscription, User


premium = Blueprint('premium', __name__)
PREMIUM_PRICE_CENTS = 500
PREMIUM_CURRENCY = 'eur'
ACTIVE_PREMIUM_STATUSES = {'active', 'trialing'}
ONGOING_SUBSCRIPTION_STATUSES = {'active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'paused'}


def _frontend_url():
    configured = current_app.config.get('FRONTEND_URL')
    if configured:
        return configured.rstrip('/')

    parsed = urlsplit(request.host_url)
    port = parsed.port
    if port == 5000:
        authority = f'{parsed.hostname}:3000'
    elif port:
        authority = f'{parsed.hostname}:{port}'
    else:
        authority = f'{parsed.hostname}:3000'
    return urlunsplit((parsed.scheme, authority, '', '', '')).rstrip('/')


def _field(value, name, default=None):
    if isinstance(value, dict):
        return value.get(name, default)
    return getattr(value, name, default)


def _stripe_id(value):
    return value if isinstance(value, str) else _field(value, 'id')


def _timestamp_datetime(timestamp):
    if not timestamp:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)


def _subscription_user(subscription, fallback_user_id=None, fallback_customer_id=None):
    user_id = fallback_user_id or _field(_field(subscription, 'metadata', {}), 'user_id')
    customer_id = _stripe_id(_field(subscription, 'customer')) or fallback_customer_id
    user = db.session.get(User, int(user_id)) if user_id else None
    if user is None and customer_id:
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
    return user, customer_id


def _sync_subscription(subscription, fallback_user_id=None, fallback_customer_id=None):
    subscription_id = _stripe_id(subscription)
    if not subscription_id:
        raise ValueError('Stripe subscription event is missing its ID.')

    user, customer_id = _subscription_user(
        subscription,
        fallback_user_id=fallback_user_id,
        fallback_customer_id=fallback_customer_id,
    )
    if user is None:
        current_app.logger.warning('Ignoring Stripe subscription %s without a matching user.', subscription_id)
        return False

    if customer_id:
        user.stripe_customer_id = customer_id

    record = PremiumSubscription.query.filter_by(stripe_subscription_id=subscription_id).first()
    if record is None:
        record = PremiumSubscription(
            user_id=user.id,
            stripe_subscription_id=subscription_id,
            stripe_customer_id=customer_id,
            status='incomplete',
        )
        db.session.add(record)

    record.user_id = user.id
    record.stripe_customer_id = customer_id
    record.status = _field(subscription, 'status', 'incomplete')
    record.current_period_end = _timestamp_datetime(_field(subscription, 'current_period_end'))
    record.cancel_at_period_end = bool(_field(subscription, 'cancel_at_period_end', False))
    db.session.commit()
    return True


def cancel_user_subscriptions(user):
    subscriptions = [
        item for item in user.premium_subscriptions
        if item.status in ONGOING_SUBSCRIPTION_STATUSES
    ]
    if not subscriptions:
        return None

    api_key = current_app.config.get('STRIPE_SECRET_KEY')
    if not api_key:
        return 'Premium billing is unavailable; your account was not deleted.'

    try:
        for subscription in subscriptions:
            stripe.Subscription.cancel(subscription.stripe_subscription_id, api_key=api_key)
    except StripeError as error:
        current_app.logger.warning(
            'Stripe subscription cancellation failed during account deletion (%s).',
            type(error).__name__,
        )
        return 'Unable to cancel your Premium subscription. Your account was not deleted.'
    return None


@premium.route('/api/premium/status', methods=['GET'])
@login_required
def premium_status():
    active_subscription = next(
        (
            item for item in sorted(
                current_user.premium_subscriptions,
                key=lambda subscription: subscription.created_at,
                reverse=True,
            )
            if item.status in ACTIVE_PREMIUM_STATUSES
        ),
        None,
    )
    return jsonify({
        'is_premium': current_user.is_premium,
        'status': active_subscription.status if active_subscription else None,
        'current_period_end': (
            active_subscription.current_period_end.isoformat()
            if active_subscription and active_subscription.current_period_end
            else None
        ),
        'cancel_at_period_end': (
            active_subscription.cancel_at_period_end if active_subscription else False
        ),
    }), 200


@premium.route('/api/premium/checkout', methods=['POST'])
@login_required
def create_premium_checkout():
    api_key = current_app.config.get('STRIPE_SECRET_KEY')
    if not api_key:
        return jsonify({'error': 'Premium billing is not configured.'}), 503
    if current_user.is_premium:
        return jsonify({'error': 'Your account already has Premium.'}), 409

    metadata = {'user_id': str(current_user.id)}
    frontend_url = _frontend_url()
    try:
        session = stripe.checkout.Session.create(
            mode='subscription',
            line_items=[{
                'price_data': {
                    'currency': PREMIUM_CURRENCY,
                    'unit_amount': PREMIUM_PRICE_CENTS,
                    'recurring': {'interval': 'month'},
                    'product_data': {'name': 'ParkShare Premium'},
                },
                'quantity': 1,
            }],
            success_url=f'{frontend_url}/PremiumPage?checkout=success',
            cancel_url=f'{frontend_url}/PremiumPage?checkout=cancelled',
            customer=current_user.stripe_customer_id if current_user.stripe_customer_id else None,
            customer_email=None if current_user.stripe_customer_id else current_user.email,
            client_reference_id=str(current_user.id),
            metadata=metadata,
            subscription_data={'metadata': metadata},
            api_key=api_key,
        )
    except StripeError as error:
        current_app.logger.warning('Stripe Premium Checkout creation failed (%s).', type(error).__name__)
        return jsonify({'error': 'Unable to start Premium checkout. Please try again.'}), 502

    return jsonify({'url': session.url}), 200


@premium.route('/api/premium/portal', methods=['POST'])
@login_required
def create_premium_portal():
    api_key = current_app.config.get('STRIPE_SECRET_KEY')
    if not api_key:
        return jsonify({'error': 'Premium billing is not configured.'}), 503
    customer_id = current_user.stripe_customer_id
    if not customer_id:
        subscription = (
            PremiumSubscription.query
            .filter_by(user_id=current_user.id)
            .order_by(PremiumSubscription.created_at.desc())
            .first()
        )
        customer_id = subscription.stripe_customer_id if subscription else None
    if not customer_id:
        return jsonify({'error': 'No Stripe billing account is linked to this user.'}), 404

    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f'{_frontend_url()}/PremiumPage',
            api_key=api_key,
        )
    except StripeError as error:
        current_app.logger.warning('Stripe customer portal creation failed (%s).', type(error).__name__)
        return jsonify({'error': 'Unable to open subscription management. Please try again.'}), 502
    return jsonify({'url': session.url}), 200


@premium.route('/api/premium/webhook', methods=['POST'])
def premium_webhook():
    webhook_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
    if not webhook_secret:
        return jsonify({'error': 'Stripe webhook is not configured.'}), 503

    signature = request.headers.get('Stripe-Signature', '')
    try:
        event = stripe.Webhook.construct_event(
            request.get_data(),
            signature,
            webhook_secret,
        )
    except (ValueError, stripe.SignatureVerificationError):
        return jsonify({'error': 'Invalid Stripe webhook signature.'}), 400

    event_type = _field(event, 'type', '')
    event_object = _field(_field(event, 'data', {}), 'object', {})
    if event_type == 'checkout.session.completed':
        if _field(event_object, 'mode') == 'subscription':
            user_id = _field(event_object, 'client_reference_id')
            metadata_user_id = _field(_field(event_object, 'metadata', {}), 'user_id')
            user_id = user_id or metadata_user_id
            customer_id = _stripe_id(_field(event_object, 'customer'))
            subscription_id = _stripe_id(_field(event_object, 'subscription'))
            if subscription_id and user_id:
                user = db.session.get(User, int(user_id))
                if user and customer_id:
                    user.stripe_customer_id = customer_id
                    db.session.commit()
                try:
                    subscription = stripe.Subscription.retrieve(
                        subscription_id,
                        api_key=current_app.config.get('STRIPE_SECRET_KEY'),
                    )
                    _sync_subscription(subscription, user_id, customer_id)
                except (StripeError, ValueError):
                    current_app.logger.warning('Could not sync completed Premium Checkout subscription.')
                    return jsonify({'error': 'Could not sync subscription.'}), 500
    elif event_type in {
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
    }:
        try:
            _sync_subscription(event_object)
        except ValueError as error:
            current_app.logger.warning('Invalid Stripe subscription webhook: %s', error)
            return jsonify({'error': 'Invalid subscription event.'}), 400

    return jsonify({'received': True}), 200
