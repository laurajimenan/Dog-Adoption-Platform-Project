# Dog Adoption Platform API

This project is a backend API for a dog adoption platform built with Node.js, Express, and MongoDB.

## Features

- User registration and login with JWT authentication
- Dog registration, adoption, removal
- List registered and adopted dogs with pagination and filtering
- Error handling and input validation
- CORS enabled
- Environment variables for configuration
- Automated tests with Mocha and Chai

## Folder Structure

- `controllers` — Request handling logic  
- `models` — Database schemas and models  
- `routes` — API route definitions  
- `middlewares` — Custom middleware (auth, error handling, etc.)  
- `app.js` — Main app setup  
- `db.js` — MongoDB connection  
- `.env` — Environment variables  
- `package.json` — Project dependencies and scripts  

## Setup

1. Install dependencies:

   npm install

2. Create a .env file with your configuration (MongoDB URI, JWT secret, etc.)

3. Run the app:

npm run dev

4. Run tests:

npm test


**API Endpoints**

POST /api/auth/register — Register user

POST /api/auth/login — Login user

GET /api/auth/profile — Get logged-in user profile

POST /api/dogs — Register a new dog

PUT /api/dogs/:id/adopt — Adopt a dog

DELETE /api/dogs/:id — Remove a dog

GET /api/dogs/registered — List registered dogs

GET /api/dogs/adopted — List adopted dogs

GET /api/dogs — List available dogs

GET /api/health — API health check

**Author**

Laura Nino
