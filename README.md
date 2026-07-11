# BMI App

A health monitoring web application with BMI tracking, blood sugar monitoring, and money management features. Built with Node.js, Express, Sequelize ORM, and PostgreSQL.

## Features

- **Authentication**: Register, Login with 2FA (Email / WhatsApp)
- **BMI Calculator**: Calculate and track Body Mass Index with category classification
- **Blood Sugar Monitor**: Track blood sugar levels with age-based threshold evaluation
- **Money Management**: Track expenses and savings with chart visualization (weekly, monthly, yearly)
- **Patient Data List**: View all patient data with current BMI and blood sugar status
- **History**: View historical BMI and blood sugar records per patient
- **Dashboard Summary**: Aggregate statistics for patients, BMI, and blood sugar
- **PDF Export**: Download patient examination reports as PDF
- **Rate Limiting**: Protection against API abuse

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL
- **Auth**: JWT with 2FA (Nodemailer / WhatsApp API)
- **Testing**: Jest + Supertest

## Project Structure

```
.
├── config/
│   └── database.js              # Sequelize connection
├── models/
│   ├── index.js                 # Associations & exports
│   ├── User.js
│   ├── TwoFactorCode.js
│   ├── Identity.js
│   ├── BMI.js
│   ├── BloodSugar.js
│   ├── Expense.js
│   └── Saving.js
├── controllers/
│   ├── authController.js        # Register, Login, 2FA
│   ├── bmiController.js         # BMI CRUD, list, summary, history
│   ├── bloodSugarController.js  # Blood sugar CRUD, history
│   ├── identityController.js    # Identity CRUD
│   ├── moneyController.js       # Expense/Saving CRUD, chart, summary
│   └── reportController.js      # PDF export
├── middlewares/
│   ├── authenticate.js          # JWT authentication
│   ├── apiResponse.js           # Standardized API response + error handler
│   ├── mailTransporter.js       # Nodemailer transport
│   └── rateLimiter.js           # Rate limiting (API & Auth)
├── routes/
│   ├── authRoutes.js
│   ├── bmiRoutes.js
│   ├── bloodSugarRoutes.js
│   ├── identityRoutes.js
│   ├── moneyRoutes.js
│   └── reportRoutes.js
├── utils/
│   └── helpers.js               # BMI calc, blood sugar eval, age calc, formatters
├── __tests__/
│   ├── helpers.test.js
│   ├── apiResponse.test.js
│   └── authenticate.test.js
├── public/                      # Frontend static files
├── .env
├── server.js
└── package.json
```

## Setup

### Prerequisites

- Node.js v18+
- PostgreSQL

### Install

```bash
npm install
```

### Environment Variables (`.env`)

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=bmi
DB_PASS=your_password
DB_PORT=5432

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email

WHATSAPP_API_URL=
WHATSAPP_API_KEY=
```

### Run

```bash
npm start        # Production
npm run dev      # Development (nodemon)
npm test         # Run unit tests
```

Server runs at `http://localhost:3000`.

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login (returns temp 2FA token) | No |
| POST | `/send-2fa` | Send 2FA code | No |
| POST | `/verify-2fa` | Verify 2FA code (returns JWT) | No |

### Identity (`/api/identities`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List user identities | Yes |
| POST | `/` | Create identity | Yes |
| PUT | `/:id` | Update identity | Yes |

### BMI (`/api/bmi`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create BMI record | Yes |
| PUT | `/:identityId` | Update BMI record | Yes |
| GET | `/list` | List all patient data with current BMI & sugar | Yes |
| GET | `/summary` | Dashboard summary statistics | Yes |
| GET | `/history/:identityId` | BMI history for an identity | Yes |

### Blood Sugar (`/api/bloodsugar`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create blood sugar record | Yes |
| PUT | `/:identityId` | Update blood sugar record | Yes |
| GET | `/history/:identityId` | Blood sugar history for an identity | Yes |

### Money Management (`/api/money`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/expense` | Create expense | Yes |
| GET | `/expense` | List expenses | Yes |
| PUT | `/expense/:id` | Update expense | Yes |
| DELETE | `/expense/:id` | Delete expense | Yes |
| POST | `/saving` | Create saving | Yes |
| GET | `/saving` | List savings | Yes |
| PUT | `/saving/:id` | Update saving | Yes |
| DELETE | `/saving/:id` | Delete saving | Yes |
| GET | `/chart?period=monthly&year=2026` | Chart data (weekly/monthly/yearly) | Yes |
| GET | `/summary` | Total expense, saving, balance | Yes |

### Reports & Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/export/pdf/:identityId` | Download PDF report | Yes |
| GET | `/api/dashboard/summary` | Dashboard statistics | Yes |
| GET | `/api/history/:identityId/bmi` | BMI history | Yes |
| GET | `/api/history/:identityId/bloodsugar` | Blood sugar history | Yes |

## BMI Categories

| BMI Range | Category |
|-----------|----------|
| < 17 | Sangat kurus |
| 17 - 18.5 | Kurus |
| 18.5 - 25 | Normal |
| 25 - 27 | Gemuk |
| > 27 | Obesitas |

## Blood Sugar Thresholds

| Age | Normal Range |
|-----|-------------|
| < 50 | 70 - 100 mg/dL |
| >= 50 | 70 - 110 mg/dL |

## Testing

```bash
npm test
```

Runs 31 unit tests covering:
- Helper functions (BMI calculation, blood sugar evaluation, age calculation, formatting)
- API response middleware
- JWT authentication middleware

## License

ISC
