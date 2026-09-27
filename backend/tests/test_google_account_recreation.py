import os
import unittest
from unittest.mock import Mock, patch

from backend.project import create_app, db
from backend.project.models import User


class GoogleAccountRecreationTests(unittest.TestCase):
    def setUp(self):
        self.database_override = patch.dict(os.environ, {
            'MYSQL_DATABASE_URI': 'sqlite://',
            'DATABASE_URL': 'sqlite://',
            'GOOGLE_CLIENT_ID': '',
            'GOOGLE_CLIENT_SECRET': '',
        })
        self.database_override.start()
        self.app = create_app()
        self.context = self.app.app_context()
        self.context.push()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()
        self.database_override.stop()

    def test_deleted_google_account_can_sign_up_again(self):
        google_user = {
            'email': 'google-user@example.test',
            'name': 'Google User',
            'given_name': 'Google',
            'family_name': 'User',
            'picture': 'https://lh3.googleusercontent.com/test-avatar',
        }
        oauth_client = Mock()
        oauth_client.authorize_access_token.return_value = {'access_token': 'test-token'}
        oauth_client.userinfo.return_value = google_user

        with patch('backend.project.auth.oauth.create_client', return_value=oauth_client):
            with self.client.session_transaction() as session:
                session['oauth_redirect_target'] = '/HomePage'

            first_login = self.client.get('/api/auth/google/callback')
            self.assertEqual(first_login.status_code, 302)
            self.assertEqual(first_login.headers['Location'], '/HomePage')
            self.assertEqual(User.query.filter_by(email=google_user['email']).count(), 1)
            first_user = User.query.filter_by(email=google_user['email']).one()
            self.assertEqual(first_user.personal_details.first_name, 'Google')
            self.assertEqual(first_user.personal_details.last_name, 'User')
            self.assertEqual(first_user.google_picture_url, google_user['picture'])
            first_user_payload = self.client.get('/api/auth/me').get_json()['user']
            self.assertEqual(first_user_payload['first_name'], 'Google')
            self.assertEqual(first_user_payload['last_name'], 'User')
            self.assertEqual(first_user_payload['profile_picture_url'], google_user['picture'])

            deleted = self.client.delete('/api/user/account')
            self.assertEqual(deleted.status_code, 200, deleted.get_json())
            self.assertIsNone(User.query.filter_by(email=google_user['email']).first())

            with self.client.session_transaction() as session:
                session['oauth_redirect_target'] = '/HomePage'

            second_login = self.client.get('/api/auth/google/callback')
            self.assertEqual(second_login.status_code, 302)
            self.assertEqual(second_login.headers['Location'], '/HomePage')
            recreated_user = User.query.filter_by(email=google_user['email']).one()
            self.assertEqual(recreated_user.name, 'Google User')
            self.assertEqual(recreated_user.personal_details.first_name, 'Google')
            self.assertEqual(recreated_user.personal_details.last_name, 'User')
            self.assertEqual(recreated_user.google_picture_url, google_user['picture'])
            current_user = self.client.get('/api/auth/me').get_json()['user']
            self.assertEqual(current_user['email'], google_user['email'])
            self.assertEqual(current_user['profile_picture_url'], google_user['picture'])


if __name__ == '__main__':
    unittest.main()
