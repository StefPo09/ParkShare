import os
import unittest
from unittest.mock import patch

from backend.project import create_app, db
from backend.project.models import City, FavoriteSpot, ParkingSpot, User
from werkzeug.security import generate_password_hash


class FavoriteSpotTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {
            'MYSQL_DATABASE_URI': 'sqlite://',
            'DATABASE_URL': 'sqlite://',
        })
        self.environment.start()
        self.app = create_app()
        self.context = self.app.app_context()
        self.context.push()

        user = User(
            email='favorites-user@example.test',
            name='Favorites User',
            password=generate_password_hash('password123'),
        )
        city = City(name='Favorites Test City')
        db.session.add_all([user, city])
        db.session.flush()
        spot = ParkingSpot(
            user_id=user.id,
            city_id=city.id,
            title='Test parking spot',
            address='1 Test Street',
            price_per_day=10,
        )
        db.session.add(spot)
        db.session.commit()
        self.user_id = user.id
        self.spot_id = spot.id

        self.client = self.app.test_client()
        response = self.client.post('/api/auth/login', json={
            'email': user.email,
            'password': 'password123',
        })
        self.assertEqual(response.status_code, 200)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()
        self.environment.stop()

    def test_add_list_and_remove_favorite_spot(self):
        added = self.client.post(f'/api/favorites/{self.spot_id}')
        self.assertEqual(added.status_code, 200)
        self.assertEqual(added.get_json()['spot_id'], self.spot_id)

        listed = self.client.get('/api/favorites')
        self.assertEqual(listed.status_code, 200)
        data = listed.get_json()
        self.assertEqual(data['spot_ids'], [self.spot_id])
        self.assertEqual(data['spots'][0]['title'], 'Test parking spot')

        self.client.post(f'/api/favorites/{self.spot_id}')
        self.assertEqual(
            FavoriteSpot.query.filter_by(user_id=self.user_id, spot_id=self.spot_id).count(),
            1,
        )

        removed = self.client.delete(f'/api/favorites/{self.spot_id}')
        self.assertEqual(removed.status_code, 200)
        self.assertEqual(self.client.get('/api/favorites').get_json()['spot_ids'], [])

    def test_favorites_are_private_to_each_user(self):
        self.client.post(f'/api/favorites/{self.spot_id}')
        other_user = User(
            email='other-favorites-user@example.test',
            name='Other User',
            password=generate_password_hash('password123'),
        )
        db.session.add(other_user)
        db.session.commit()

        other_client = self.app.test_client()
        login = other_client.post('/api/auth/login', json={
            'email': other_user.email,
            'password': 'password123',
        })
        self.assertEqual(login.status_code, 200)
        self.assertEqual(other_client.get('/api/favorites').get_json()['spot_ids'], [])

    def test_cannot_favorite_missing_spot(self):
        response = self.client.post('/api/favorites/99999')
        self.assertEqual(response.status_code, 404)


if __name__ == '__main__':
    unittest.main()
