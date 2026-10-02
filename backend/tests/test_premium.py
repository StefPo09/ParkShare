import os
import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

from backend.project import create_app, db
from backend.project.models import City, ParkingSpot, PremiumSubscription, User
from werkzeug.security import generate_password_hash


class PremiumTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {
            'MYSQL_DATABASE_URI': 'sqlite://',
            'DATABASE_URL': 'sqlite://',
        })
        self.environment.start()
        self.app = create_app()
        self.app.config.update(
            STRIPE_SECRET_KEY='sk_test_parkshare',
            STRIPE_WEBHOOK_SECRET='whsec_test_parkshare',
            FRONTEND_URL='http://localhost:3000',
        )
        self.context = self.app.app_context()
        self.context.push()

        self.user = User(
            email='premium-user@example.test',
            name='Premium User',
            password=generate_password_hash('password123'),
        )
        self.city = City(name='Premium Test City')
        db.session.add_all([self.user, self.city])
        db.session.flush()
        self.spot = ParkingSpot(
            user_id=self.user.id,
            city_id=self.city.id,
            title='Premium test spot',
            address='1 Test Street',
            price_per_day=100,
            price_currency='RON',
            start_hour='08:00',
            end_hour='18:00',
        )
        db.session.add(self.spot)
        db.session.commit()
        self.client = self.app.test_client()
        login = self.client.post('/api/auth/login', json={
            'email': self.user.email,
            'password': 'password123',
        })
        self.assertEqual(login.status_code, 200)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()
        self.environment.stop()

    def test_checkout_creates_five_euro_monthly_subscription(self):
        with patch(
            'backend.project.premium.stripe.checkout.Session.create',
            return_value=SimpleNamespace(url='https://checkout.stripe.test/session'),
        ) as create_session:
            response = self.client.post('/api/premium/checkout')

        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(response.get_json()['url'], 'https://checkout.stripe.test/session')
        line_item = create_session.call_args.kwargs['line_items'][0]['price_data']
        self.assertEqual(line_item['currency'], 'eur')
        self.assertEqual(line_item['unit_amount'], 500)
        self.assertEqual(line_item['recurring']['interval'], 'month')
        self.assertEqual(create_session.call_args.kwargs['mode'], 'subscription')
        self.assertIn(
            '&session_id={CHECKOUT_SESSION_ID}',
            create_session.call_args.kwargs['success_url'],
        )

    def test_subscription_webhook_updates_entitlement(self):
        event = {
            'type': 'customer.subscription.updated',
            'data': {'object': {
                'id': 'sub_parkshare_test',
                'customer': 'cus_parkshare_test',
                'metadata': {'user_id': str(self.user.id)},
                'status': 'active',
                'current_period_end': int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp()),
                'cancel_at_period_end': False,
            }},
        }
        with patch(
            'backend.project.premium.stripe.Webhook.construct_event',
            return_value=event,
        ):
            response = self.client.post(
                '/api/premium/webhook',
                data=b'{}',
                headers={'Stripe-Signature': 'test-signature'},
            )

        self.assertEqual(response.status_code, 200, response.get_json())
        subscription = PremiumSubscription.query.one()
        self.assertEqual(subscription.stripe_subscription_id, 'sub_parkshare_test')
        self.assertEqual(subscription.status, 'active')
        self.assertTrue(self.user.is_premium)
        self.assertTrue(self.client.get('/api/auth/me').get_json()['user']['is_premium'])
        self.assertTrue(self.client.get('/api/spots?available_only=false').get_json()['spots'][0]['is_promoted'])

        event['data']['object']['status'] = 'canceled'
        with patch(
            'backend.project.premium.stripe.Webhook.construct_event',
            return_value=event,
        ):
            cancelled = self.client.post(
                '/api/premium/webhook',
                data=b'{}',
                headers={'Stripe-Signature': 'test-signature'},
            )
        self.assertEqual(cancelled.status_code, 200)
        self.assertFalse(self.user.is_premium)
        self.assertFalse(self.client.get('/api/spots?available_only=false').get_json()['spots'][0]['is_promoted'])

    def test_cancel_at_period_end_immediately_removes_premium_access(self):
        self.user.premium_subscriptions.append(PremiumSubscription(
            stripe_subscription_id='sub_cancel_test',
            stripe_customer_id='cus_cancel_test',
            status='active',
            current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
            cancel_at_period_end=False,
        ))
        db.session.commit()
        self.assertTrue(self.user.is_premium)

        subscription = SimpleNamespace(
            id='sub_cancel_test',
            customer='cus_cancel_test',
            status='active',
            current_period_end=int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp()),
            cancel_at_period_end=True,
            metadata={'user_id': str(self.user.id)},
        )
        with patch(
            'backend.project.premium.stripe.Subscription.retrieve',
            return_value=subscription,
        ):
            response = self.client.get('/api/premium/status')

        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertFalse(response.get_json()['is_premium'])
        self.assertTrue(response.get_json()['cancel_at_period_end'])
        self.assertFalse(self.user.is_premium)
        self.assertFalse(self.client.get('/api/auth/me').get_json()['user']['is_premium'])
        self.assertFalse(self.client.get('/api/spots?available_only=false').get_json()['spots'][0]['is_promoted'])

    def test_checkout_return_verifies_stripe_session_and_activates_premium(self):
        checkout_session = SimpleNamespace(
            mode='subscription',
            status='complete',
            payment_status='paid',
            client_reference_id=str(self.user.id),
            metadata={'user_id': str(self.user.id)},
            subscription='sub_return_test',
            customer='cus_return_test',
        )
        subscription = SimpleNamespace(
            id='sub_return_test',
            customer='cus_return_test',
            status='active',
            current_period_end=int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp()),
            cancel_at_period_end=False,
            metadata={'user_id': str(self.user.id)},
        )
        with (
            patch(
                'backend.project.premium.stripe.checkout.Session.retrieve',
                return_value=checkout_session,
            ),
            patch(
                'backend.project.premium.stripe.Subscription.retrieve',
                return_value=subscription,
            ),
        ):
            response = self.client.post(
                '/api/premium/confirm',
                json={'session_id': 'cs_test_paid_session'},
            )

        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertTrue(response.get_json()['is_premium'])
        self.assertEqual(response.get_json()['status'], 'active')
        self.assertTrue(self.user.is_premium)
        self.assertEqual(self.user.stripe_customer_id, 'cus_return_test')

    def test_checkout_return_rejects_another_users_session(self):
        checkout_session = SimpleNamespace(
            mode='subscription',
            status='complete',
            payment_status='paid',
            client_reference_id='99999',
            metadata={'user_id': '99999'},
            subscription='sub_other_user',
            customer='cus_other_user',
        )
        with (
            patch(
                'backend.project.premium.stripe.checkout.Session.retrieve',
                return_value=checkout_session,
            ),
            patch('backend.project.premium.stripe.Subscription.retrieve') as retrieve_subscription,
        ):
            response = self.client.post(
                '/api/premium/confirm',
                json={'session_id': 'cs_test_other_users_session'},
            )

        self.assertEqual(response.status_code, 404)
        retrieve_subscription.assert_not_called()
        self.assertFalse(self.user.is_premium)

    def test_premium_discount_is_charged_and_verified_before_booking(self):
        self.user.premium_subscriptions.append(PremiumSubscription(
            stripe_subscription_id='sub_active_test',
            stripe_customer_id='cus_active_test',
            status='active',
            current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
        ))
        db.session.commit()
        start_date = '2026-10-01T09:00:00Z'
        end_date = '2026-10-01T11:00:00Z'
        with patch(
            'backend.project.parking.stripe.PaymentIntent.create',
            return_value=SimpleNamespace(id='pi_premium_test', client_secret='pi_secret'),
        ) as create_intent:
            response = self.client.post('/api/bookings/payment-intent', json={
                'spot_id': self.spot.id,
                'start_date': start_date,
                'end_date': end_date,
            })

        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(response.get_json()['subtotal'], 20)
        self.assertEqual(response.get_json()['discount'], 2)
        self.assertEqual(response.get_json()['total'], 18)
        self.assertEqual(create_intent.call_args.kwargs['amount'], 1800)
        self.assertEqual(create_intent.call_args.kwargs['metadata']['discount_percent'], '10')

        args = create_intent.call_args.kwargs
        payment_intent = SimpleNamespace(
            status='succeeded',
            metadata=args['metadata'],
            amount=args['amount'],
            amount_received=args['amount'],
            currency=args['currency'],
        )
        with patch(
            'backend.project.parking.stripe.PaymentIntent.retrieve',
            return_value=payment_intent,
        ):
            booking_response = self.client.post('/api/bookings', json={
                'spot_id': self.spot.id,
                'start_date': start_date,
                'end_date': end_date,
                'payment_intent_id': 'pi_premium_test',
            })

        self.assertEqual(booking_response.status_code, 201, booking_response.get_json())
        self.assertEqual(booking_response.get_json()['booking']['total_price'], 18)

    def test_customer_portal_uses_linked_stripe_customer(self):
        self.user.stripe_customer_id = 'cus_portal_test'
        db.session.commit()
        with patch(
            'backend.project.premium.stripe.billing_portal.Session.create',
            return_value=SimpleNamespace(url='https://billing.stripe.test/portal'),
        ) as create_session:
            response = self.client.post('/api/premium/portal')

        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(create_session.call_args.kwargs['customer'], 'cus_portal_test')

    def test_account_deletion_cancels_active_stripe_subscription(self):
        self.user.premium_subscriptions.append(PremiumSubscription(
            stripe_subscription_id='sub_to_cancel',
            stripe_customer_id='cus_to_cancel',
            status='active',
        ))
        db.session.commit()

        with patch('backend.project.premium.stripe.Subscription.cancel') as cancel_subscription:
            response = self.client.delete('/api/user/account')

        self.assertEqual(response.status_code, 200, response.get_json())
        cancel_subscription.assert_called_once_with('sub_to_cancel', api_key='sk_test_parkshare')
        self.assertIsNone(db.session.get(User, self.user.id))


if __name__ == '__main__':
    unittest.main()
