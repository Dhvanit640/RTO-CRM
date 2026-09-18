# Insurance Policy Web Application

A full-stack insurance policy web app built with Node.js, Express, vanilla HTML/CSS/JavaScript, MySQL, and a hardcoded OTP flow for testing.

## Features
- Login and registration flow
- OTP verification using the master test code 9999
- JWT-based authentication stored in localStorage
- Responsive dashboard with insurance policy cards
- Form validation and loading states

## XAMPP + MySQL Setup
1. Install XAMPP and start Apache and MySQL.
2. Open phpMyAdmin at http://localhost/phpmyadmin.
3. Import the SQL file from [database/insurance.sql](database/insurance.sql).
4. Create a .env file in the project root with the following values:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=insurance_db
   JWT_SECRET=your_secret_key_here
   ```
5. Go to the backend folder and install dependencies:
   ```bash
   cd backend
   npm install
   ```
6. Start the Node backend:
   ```bash
   node server.js
   ```
7. Open the frontend in your browser at http://localhost/insurance-app/frontend/index.html.

## Files
- [backend/server.js](backend/server.js)
- [backend/routes/auth.js](backend/routes/auth.js)
- [backend/config/db.js](backend/config/db.js)
- [frontend/index.html](frontend/index.html)
- [frontend/register.html](frontend/register.html)
- [frontend/otp.html](frontend/otp.html)
- [frontend/dashboard.html](frontend/dashboard.html)
- [frontend/css/style.css](frontend/css/style.css)
- [frontend/js/main.js](frontend/js/main.js)
- [database/insurance.sql](database/insurance.sql)

## Notes
- The OTP flow currently uses the hardcoded test code 9999 for local testing.
- The frontend is designed to be served from Apache under the XAMPP htdocs path.
