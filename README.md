# ParkShare

ParkShare is currently organized as two applications:

- **Next.js frontend**: the ParkShare user interface, page navigation, forms, menus, themes, translations, mock parking listings, and Google Maps rental view.
- **Flask backend**: the initial Python authentication application using Flask-Login, SQLAlchemy, and SQLite.

The intended architecture is:

```text
Next.js frontend -> Flask API/backend -> database
```

The applications are partially connected. The frontend login now calls the Flask authentication API, while most other frontend features still use local state and mock data. The Flask backend currently handles authentication; cars, parking spots, rentals, and payments still need real models and API endpoints.

## What We Did, Step by Step

### Step 1: Make Flask Start

The Flask application factory used `timedelta` without importing it, which prevented the application from being created. We added the missing import.

We also updated the User model to match the authentication code by adding password-reset fields and the missing imports used by `role_required`. Passwords are stored as secure hashes, not plain text.

The new `backend/run.py` file is the direct Flask entry point. It creates the app and initializes database tables when the server starts.

### Step 2: Add a Real Authentication API

The original Flask routes rendered HTML templates. We kept those routes and added JSON endpoints for the Next.js frontend:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

These endpoints validate input, hash passwords, reject duplicate email addresses, create Flask-Login sessions, and return JSON responses. Local-development CORS support allows requests from Next.js on port `3000` to Flask on port `5000`.

Older local SQLite databases did not contain the newer `role` and password-reset columns. Startup now upgrades those tables without deleting existing data.

### Step 3: Connect the Next.js Login

The login page originally treated any non-empty form as successful and created a fake browser cookie called `session=authenticated`.

That behavior was removed. The page now sends the email, password, and remember-me value to Flask using `fetch` with credentials enabled. Flask verifies the credentials and creates the real session cookie. The frontend then redirects to the home page and displays backend errors when login fails.

The signup flow is also connected. The email entered on the first signup screen is carried to the registration screen, which sends the completed name, email, and password form to Flask. Successful registration returns the user to login; duplicate emails, short passwords, and connection errors are shown in the form.

### Step 4: Save Registration Profile Data

The registration form now sends the phone country code, phone number, country, and city along with the name, email, and password. Flask validates these fields and saves them in the `User` table. The API also returns them in its user response.

The existing SQLite database is upgraded automatically with the new columns, so existing local users are preserved.

### Step 5: Add Git Ignore Rules

The root `.gitignore` excludes generated and local-only files such as `node_modules`, Next.js build output, Python virtual environments, Python caches, SQLite databases, `.env` secrets, logs, and machine-specific editor files. Dependency lockfiles such as `frontend/package-lock.json` remain tracked.

## Database

The local SQLite database is stored at:

```text
backend/instance/db.sqlite
```

It currently contains the `User` table with email, password hash, name, phone, country, city, role, and password-reset fields. It does not yet contain cars, parking spots, rentals, or payments.

## What Each Application Does

- **Next.js** renders the user interface, handles page navigation and interaction, and calls Flask with `fetch`.
- **Flask** validates requests, authenticates users, manages sessions, and reads or writes database records.
- **SQLite** stores local development data.

The intended relationship is:

```text
Next.js login form -> Flask API -> SQLite User table
```

## Quick Start

Start the backend and frontend in two separate terminals. Start Flask first because the frontend login and registration forms send requests to it.

### Terminal 1: Flask Backend

From Git Bash:

```bash
cd /c/Users/denni/ParkShare-main/backend
source .venv/Scripts/activate
pip install -r requirements.txt
python run.py
```

The backend will be available at `http://127.0.0.1:5000`.

### Terminal 2: Next.js Frontend

From Git Bash:

```bash
cd /c/Users/denni/ParkShare-main/frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

Open `http://localhost:3000/SignUpPage` to create an account, or open `http://localhost:3000/LoginPage` to log in.

## Authentication API

The Flask backend now exposes these JSON endpoints:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

Authentication uses the Flask-Login session cookie. Requests from the local Next.js server at `http://localhost:3000` are allowed during development.

## Running the Backend

Python must be installed first. From PowerShell:

```powershell
cd C:\Users\cezara.dumitrescu\Documents\ParkShare\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

The Flask server runs at `http://127.0.0.1:5000`.

Test the home route from another PowerShell window:

```powershell
Invoke-WebRequest http://127.0.0.1:5000
```

If PowerShell blocks `Activate.ps1`, use Git Bash or call the virtual-environment Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe run.py
```

## Running the Frontend

Node.js must be installed first. From a second PowerShell window:

```powershell
cd C:\Users\cezara.dumitrescu\Documents\ParkShare\frontend
npm install
npm run dev
```

The Next.js app runs at `http://localhost:3000`.

From Git Bash:

```bash
cd /c/Users/cezara.dumitrescu/Documents/ParkShare/frontend
npm install
npm run dev
```

If Git Bash reports exit code `127` or says `npm: command not found`, restart Git Bash after installing Node.js. If needed, temporarily add the standard Node.js directory:

```bash
export PATH="$PATH:/c/Program Files/nodejs"
npm --version
```

The rental page can use Google Maps when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is configured in the frontend environment.

Run Flask and Next.js in separate terminals. Flask must be running before testing the frontend login.

## Validation Completed

The backend authentication flow was tested with Flask's test client:

```text
Invalid registration: 400
Successful registration: 201
Duplicate registration: 409
Login: 200
Authenticated /me: 200
Logout: 200
Anonymous /me: 401
```

The Next.js production build also completed successfully, including its TypeScript check.

## Next Development Step

Authentication and registration profile data are now connected. The next step is to add persistent models and API endpoints for cars and parking spots, then connect the corresponding frontend management pages.
