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

### Step 5: Add the City, Car, and ParkingSpot Data Model

We added the first backend domain models beyond authentication so the project can now represent real parking data:

- `City` with a unique name and optional country/description
- `Car` linked to a user, with brand, model, license plate, year, and color
- `ParkingSpot` linked to both a user and a city, with title, address, price, coordinates, and availability

These models are defined in `backend/project/models.py` and support relationships between users, cities, and parking listings.

### Step 6: Add Parking API Routes

We created a new parking blueprint in `backend/project/parking.py` and registered it in the app factory. The backend now includes endpoints for:

```text
GET  /api/cities
POST /api/cities
GET  /api/cars
POST /api/cars
GET  /api/spots
POST /api/spots
```

These routes let the app create and fetch city, car, and parking-spot records in a simple, city-based structure.

### Step 7: Add Git Ignore Rules

The root `.gitignore` excludes generated and local-only files such as `node_modules`, Next.js build output, Python virtual environments, Python caches, SQLite databases, `.env` secrets, logs, and machine-specific editor files. Dependency lockfiles such as `frontend/package-lock.json` remain tracked.

### Step 8: Connect Frontend Pages to Parking APIs

We connected the frontend parking management and rental pages to the backend APIs to enable real data flow:

- **AddSpotPage**: Now fetches cities from `GET /api/cities` and creates spots via `POST /api/spots`
- **ManageSpotsPage**: Displays user's spots from `GET /api/my-spots` with loading/empty states
- **RentPage**: Shows available spots from `GET /api/spots?available_only=true` and enables booking via `POST /api/bookings`

These pages now use:
- `useEffect` hooks to fetch data on mount
- Proper error handling and loading states
- City selection dropdowns populated from backend
- Date range pickers for booking duration
- Ownership validation through Flask-Login sessions

### Step 9: Complete Parking Marketplace Flow

The core parking marketplace flow is now fully functional:

1. **User Authentication** → Login/register via `/api/auth/*` endpoints
2. **Manage Cars** → Add/view cars via `/api/cars` endpoints  
3. **Manage Parking Spots** → Add/view spots via `/api/spots` endpoints
4. **Browse & Book** → Find available spots and create bookings via `/api/bookings`

All endpoints include proper ownership validation:
- Users can only modify/delete their own cars/spots
- Users cannot book their own spots
- Booking price is automatically calculated: `price_per_day × duration_days`

### Step 10: Add Countdown Timers for Reservation and Rental Status

The home page now includes a reusable countdown component that visualizes the user’s real booking timeline. The timer is not a static demo widget; it is connected to app data and changes meaning based on the booking context.

The component supports two visual variants:

- **Reservation timer** → blue/teal theme for the time until a booking starts
- **Rental timer** → amber/orange theme for time remaining in an active rental session

The timer logic was built as a reusable React component that tracks:
- current time remaining in `MM:SS`
- whether the timer is running or paused
- whether the countdown is complete
- the progress bar percentage for the active session

The home page now renders two countdown cards:

- `Reservation starts in`
- `Rental session ends in`

These cards are placed directly on the home screen so users can immediately see upcoming bookings and active rentals.

On the backend, a new protected dashboard endpoint was added to expose the current user’s timeline state:

```text
GET /api/dashboard/timers
```

This endpoint returns the next upcoming reservation and the currently active rental session, based on the user’s real `Booking` records. It resolves the nearest future `start_date` and the active `end_date` that is still in progress.

The frontend fetches this data on the home page and renders the corresponding countdowns using real booking timestamps. The fetch includes `credentials: 'include'` so the session cookie is sent with the request.

The booking flow was also connected into this timeline. After a successful reservation is created on the rent page, the user is redirected back to the home page so the booking countdown appears immediately as part of the dashboard state.

The timer design is intentionally semantic: users can distinguish reservation countdowns from rental countdowns by color and label without needing to read extra text. This makes the home page feel more like an active booking dashboard rather than a generic marketing screen.

## Database

The local SQLite database is stored at:

```text
backend/instance/db.sqlite
```

It now contains tables for:
- `User` (email, password hash, profile data, role)
- `City` (name, country) 
- `Car` (brand, model, license plate, user_id)
- `ParkingSpot` (title, address, price, coordinates, user_id, city_id)
- `Booking` (spot_id, user_id, dates, total_price, status)

## What Each Application Does

- **Next.js** renders the user interface, handles page navigation and interaction, and calls Flask with `fetch` (including credentials for authentication).
- **Flask** validates requests, authenticates users via Flask-Login, manages sessions, and reads/writes database records.
- **SQLite** stores local development data for all parking domain entities.

The complete data flow is now:

```text
Next.js frontend (forms/maps) -> Flask API endpoints -> SQLite tables (User, City, Car, ParkingSpot, Booking)
```

## Validation

All updated files were validated:
- Backend Python files checked with `python -m compileall project` 
- Frontend TypeScript files validated through Next.js build process
- API endpoints tested with curl and browser network inspection

## Current Focus

The parking marketplace core functionality is complete. Users can now:
1. Register and log in
2. Add their cars to the system
3. Add parking spots in cities they own
4. Browse available spots on a map
5. Book spots for date ranges
6. View their bookings and manage their listings

## Next Development Step

Future enhancements could include:
- Booking management pages (view upcoming/past bookings)
- Edit/delete functionality for cars and spots
- Payment integration for completed bookings
- Enhanced search/filtering (by date, amenities, etc.)
- User ratings and reviews for spots
