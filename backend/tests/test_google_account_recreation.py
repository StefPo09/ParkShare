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
            current_user = self.client.get('/api/auth/me').get_json()['user']
            self.assertEqual(current_user['email'], google_user['email'])


if __name__ == '__main__':
    unittest.main()
