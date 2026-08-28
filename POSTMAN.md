# ParkShare API Testing with Postman

This guide explains how to test the Flask authentication API with Postman.

## Before Testing

Start the Flask backend first. From Git Bash:

```bash
cd /c/Users/cezara.dumitrescu/Documents/ParkShare/backend
source .venv/Scripts/activate
pip install -r requirements.txt
python run.py
```

The API base URL is:

```text
http://127.0.0.1:5000
```

Keep the Flask terminal running while sending Postman requests.

## Request Order

Use the requests in this order:

1. Register a user.
2. Log in with that user.
3. Check the current user.
4. Log out.
5. Check the current user again to confirm the session ended.

Postman should automatically store the Flask session cookie after login. If needed, open **Cookies** near the request URL and check the cookies for `127.0.0.1`.

## 1. Register

- Method: `POST`
- URL: `http://127.0.0.1:5000/api/auth/register`
- Headers: `Content-Type: application/json`
- Body: **raw** -> **JSON**

```json
{
  "email": "postman@example.com",
  "name": "Postman User",
  "password": "password123",
  "phone_country_code": "+40",
  "phone": "774123567",
  "country": "Romania",
  "city": "Bucharest"
}
```

Expected result: `201 Created`.

The response contains the new user's profile. The password is not returned.

## 2. Login

- Method: `POST`
- URL: `http://127.0.0.1:5000/api/auth/login`
- Headers: `Content-Type: application/json`
- Body: **raw** -> **JSON**

```json
{
  "email": "postman@example.com",
  "password": "password123",
  "remember": true
}
```

Expected result: `200 OK`.

The response sets the Flask-Login session cookie. Postman uses this cookie for later requests to the same host.

## 3. Check the Current User

- Method: `GET`
- URL: `http://127.0.0.1:5000/api/auth/me`

Send this request after login. Expected result: `200 OK` with the authenticated user's profile.

Example response:

```json
{
  "user": {
    "id": 1,
    "email": "postman@example.com",
    "name": "Postman User",
    "role": "user",
    "phone_country_code": "+40",
    "phone": "774123567",
    "country": "Romania",
    "city": "Bucharest"
  }
}
```

## 4. Logout

- Method: `POST`
- URL: `http://127.0.0.1:5000/api/auth/logout`

Expected response:

```json
{
  "success": true
}
```

Expected status: `200 OK`.

## 5. Confirm Logout

Send the current-user request again:

- Method: `GET`
- URL: `http://127.0.0.1:5000/api/auth/me`

Expected response:

```json
{
  "error": "Authentication required."
}
```

Expected status: `401 Unauthorized`.

## Useful Validation Tests

### Short Password

Register with a password shorter than 8 characters. Expected status: `400 Bad Request`.

### Duplicate Email

Register with an email that already exists. Expected status: `409 Conflict`.

### Incorrect Login

Use the wrong password. Expected status: `401 Unauthorized`.

### Missing Profile Field

Leave out the phone, country, or city field. Expected status: `400 Bad Request`.

## Where the Data Is Saved

Successful registration saves the user in the local SQLite database:

```text
backend/instance/db.sqlite
```

The password is stored as a secure hash. The original password cannot be read from the database.

## Troubleshooting

- If Postman cannot connect, confirm that `python run.py` is still running.
- Use `127.0.0.1` consistently in all requests so Postman uses the same cookie host.
- If the session is not recognized, open Postman's cookie manager and remove stale cookies for `127.0.0.1`, then log in again.
- If a duplicate-email response appears, use a different email address or remove the test user from the local database.
