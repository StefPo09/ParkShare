import os
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

from backend.project import create_app, db
from backend.project.models import Booking, City, ParkingSpot, User, UserReport
from werkzeug.security import generate_password_hash


class UserReportTests(unittest.TestCase):
    def setUp(self):
        self.database_override = patch.dict(os.environ, {
            'MYSQL_DATABASE_URI': 'sqlite://',
            'DATABASE_URL': 'sqlite://',
        })
        self.database_override.start()
        self.app = create_app()
        self.context = self.app.app_context()
        self.context.push()

        password_hash = generate_password_hash('password123')
        self.target = User(email='target@example.test', name='Target User', password=password_hash)
        self.admin = User(email='admin@example.test', name='Admin User', role='admin', password=password_hash)
        self.reporters = [
            User(email=f'reporter{index}@example.test', name=f'Reporter {index}', password=password_hash)
            for index in range(3)
        ]
        db.session.add_all([self.target, self.admin, *self.reporters])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()
        self.database_override.stop()

    def _client_for(self, user):
        client = self.app.test_client()
        response = client.post(
            '/api/auth/login',
            json={'email': user.email, 'password': 'password123'},
        )
        self.assertEqual(response.status_code, 200, response.get_json())
        return client

    def test_third_valid_report_bans_account(self):
        self.assertFalse(self.target.is_banned)

        for index, reporter in enumerate(self.reporters):
            reporter_client = self._client_for(reporter)
            self.assertEqual(reporter_client.get('/api/auth/me').get_json()['user']['id'], reporter.id)
            response = reporter_client.post(
                f'/api/users/{self.target.id}/reports',
                json={'reason': 'fraud', 'details': 'Please review this report.'},
            )
            self.assertEqual(response.status_code, 201, f'reporter {index}: {response.get_json()}')
            report_id = response.get_json()['report']['id']

            if index == 0:
                duplicate = reporter_client.post(
                    f'/api/users/{self.target.id}/reports',
                    json={'reason': 'fraud'},
                )
                self.assertEqual(duplicate.status_code, 409)
                self.assertEqual(duplicate.get_json()['error'], 'already_reported')

            if index < 2:
                self.assertFalse(self.target.is_banned)
            admin_client = self._client_for(self.admin)
            review = admin_client.patch(
                f'/api/admin/reports/{report_id}',
                json={'status': 'valid'},
            )
            self.assertEqual(review.status_code, 200, f'index {index}: {review.get_json()}')
            repeated_review = admin_client.patch(
                f'/api/admin/reports/{report_id}',
                json={'status': 'valid'},
            )
            self.assertEqual(repeated_review.status_code, 409)

        self.assertTrue(self.target.is_banned)
        self.assertEqual(
            UserReport.query.filter_by(target_id=self.target.id, status='valid').count(),
            3,
        )
        blocked_login = self.app.test_client().post(
            '/api/auth/login',
            json={'email': self.target.email, 'password': 'password123'},
        )
        self.assertEqual(blocked_login.status_code, 403)

    def test_only_admin_can_review_and_account_delete_cleans_reports(self):
        reporter_client = self._client_for(self.reporters[0])
        created = reporter_client.post(
            f'/api/users/{self.target.id}/reports',
            json={'reason': 'other'},
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(reporter_client.get('/api/admin/reports').status_code, 403)

        deleted = reporter_client.delete('/api/user/account')
        self.assertEqual(deleted.status_code, 200)
        self.assertEqual(UserReport.query.filter_by(reporter_id=self.reporters[0].id).count(), 0)

    def test_booking_price_overlap_and_spot_serialization(self):
        city = City(name='Test City')
        db.session.add(city)
        db.session.flush()
        spot = ParkingSpot(
            user_id=self.target.id,
            city_id=city.id,
            title='Test parking spot',
            address='10 Test Street',
            price_per_day=120,
            price_currency='RON',
            start_hour='08:00',
            end_hour='18:00',
            is_on_sale=True,
        )
        db.session.add(spot)
        db.session.commit()

        renter_client = self._client_for(self.reporters[0])
        first_booking = renter_client.post('/api/bookings', json={
            'spot_id': spot.id,
            'start_date': '2026-10-01T09:00:00+02:00',
            'end_date': '2026-10-01T11:30:00+02:00',
        })
        self.assertEqual(first_booking.status_code, 201, first_booking.get_json())
        booking_data = first_booking.get_json()['booking']
        self.assertEqual(booking_data['status'], 'confirmed')
        self.assertEqual(booking_data['total_price'], 30)
        self.assertEqual(booking_data['spot']['id'], spot.id)
        self.assertEqual(booking_data['start_date'], '2026-10-01T07:00:00+00:00')

        overlapping_booking = renter_client.post('/api/bookings', json={
            'spot_id': spot.id,
            'start_date': '2026-10-01T08:00:00',
            'end_date': '2026-10-01T10:00:00',
        })
        self.assertEqual(overlapping_booking.status_code, 409)

        spot_response = renter_client.get('/api/spots?available_only=true')
        serialized_spot = spot_response.get_json()['spots'][0]
        self.assertEqual(serialized_spot['owner']['id'], self.target.id)
        self.assertEqual(len(serialized_spot['bookings']), 1)
        self.assertEqual(serialized_spot['bookings'][0]['status'], 'confirmed')

    def test_dashboard_returns_overtime_and_upcoming_booking_details(self):
        city = City(name='Timer City')
        db.session.add(city)
        db.session.flush()
        spot = ParkingSpot(
            user_id=self.target.id,
            city_id=city.id,
            title='Timer parking spot',
            address='20 Timer Street',
            price_per_day=120,
            price_currency='RON',
            start_hour='08:00',
            end_hour='18:00',
        )
        db.session.add(spot)
        db.session.flush()
        now = datetime.utcnow()
        db.session.add_all([
            Booking(
                spot_id=spot.id,
                user_id=self.reporters[0].id,
                start_date=now - timedelta(hours=2),
                end_date=now - timedelta(hours=1),
                total_price=12,
                status='confirmed',
            ),
            Booking(
                spot_id=spot.id,
                user_id=self.reporters[0].id,
                start_date=now + timedelta(hours=1),
                end_date=now + timedelta(hours=2),
                total_price=12,
                status='confirmed',
            ),
        ])
        db.session.commit()

        response = self._client_for(self.reporters[0]).get('/api/dashboard/timers')
        self.assertEqual(response.status_code, 200, response.get_json())
        data = response.get_json()
        self.assertEqual(data['rental']['status'], 'overtime')
        self.assertGreater(data['rental']['extra_cost'], 0)
        self.assertEqual(data['rental']['spot']['id'], spot.id)
        self.assertEqual(data['reservation']['status'], 'upcoming')
        self.assertEqual(len(data['bookings']), 2)


if __name__ == '__main__':
    unittest.main()