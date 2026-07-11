# BMI App

A health monitoring web application with BMI tracking, blood sugar monitoring, patient health risk assessment, and money management features. Built with Node.js, Express, Sequelize ORM, and PostgreSQL.

## Features

- **Authentication**: Register, Login with 2FA (Email / WhatsApp)
- **BMI Calculator**: Calculate and track Body Mass Index with category classification
- **Blood Sugar Monitor**: Track blood sugar levels with age-based threshold evaluation
- **Health Risk Assessment**: Composite risk scoring from BMI, blood sugar, and age factors
- **Health Trend Analysis**: Track BMI and blood sugar trends over time per patient
- **Health Alerts**: Flag patients with high-risk health status
- **Population Statistics**: BMI, blood sugar, and risk distribution across all patients
- **System Health Monitoring**: Server uptime, DB connectivity, memory/CPU usage, readiness/liveness probes
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
│   ├── reportController.js      # PDF export
│   ├── healthController.js      # System health checks (DB, memory, CPU, uptime)
│   └── patientHealthController.js # Patient risk scoring, trends, alerts, population stats
├── middlewares/
│   ├── authenticate.js          # JWT authentication
│   ├── apiResponse.js           # Standardized API response + error handler
│   ├── mailTransporter.js       # Nodemailer transport
│   ├── rateLimiter.js           # Rate limiting (API & Auth)
│   └── authorize.js             # Role-based access control
├── routes/
│   ├── authRoutes.js
│   ├── bmiRoutes.js
│   ├── bloodSugarRoutes.js
│   ├── identityRoutes.js
│   ├── moneyRoutes.js
│   ├── reportRoutes.js
│   ├── adminRoutes.js
│   ├── healthRoutes.js          # /api/health, /ready, /live, /stats
│   └── patientHealthRoutes.js   # /api/patient-health/risk, /trend, /alerts, /population
├── utils/
│   └── helpers.js               # BMI calc, blood sugar eval, risk scoring, trend analysis
├── __tests__/
│   ├── helpers.test.js
│   ├── apiResponse.test.js
│   ├── authenticate.test.js
│   └── authorize.test.js
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

### System Health (`/api/health`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Full health check (DB, memory, CPU, uptime) | No |
| GET | `/ready` | Readiness probe (DB connectivity) | No |
| GET | `/live` | Liveness probe | No |
| GET | `/stats` | Aggregate system and data statistics | No |

### Patient Health (`/api/patient-health`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/risk/:identityId` | Health risk score for a patient | Yes |
| GET | `/trend/:identityId` | BMI and blood sugar trend analysis | Yes |
| GET | `/alerts` | List all high-risk patients | Yes |
| GET | `/population` | BMI, sugar, and risk distribution stats | Yes |

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

## Health Risk Scoring

Risk score is calculated from combined BMI, blood sugar, and age factors:

| Factor | Points |
|--------|--------|
| BMI: Sangat kurus | +3 |
| BMI: Kurus | +1 |
| BMI: Gemuk | +2 |
| BMI: Obesitas | +4 |
| Blood sugar: Rendah | +2 |
| Blood sugar: Tinggi | +3 |
| Age >= 50 | +1 |
| Age >= 65 | +1 |

| Total Score | Risk Level |
|-------------|------------|
| 0 - 2 | rendah |
| 3 - 4 | sedang |
| 5+ | tinggi |

## System Health Check

`GET /api/health` returns:

```json
{
  "status": "healthy|degraded",
  "timestamp": "2026-07-11T...",
  "checks": {
    "database": { "status": "up", "latencyMs": 5 },
    "memory": { "rss": "45.20 MB", "heapUsed": "20.10 MB", "heapTotal": "35.00 MB", "external": "1.50 MB" },
    "cpu": { "user": "120.50 ms", "system": "30.20 ms" },
    "uptime": { "serverSeconds": 3600, "processSeconds": 3600 }
  }
}
```

Returns HTTP 200 when healthy, 503 when database is unreachable (degraded).

## Testing

```bash
npm test
```

Runs 35 unit tests covering:
- Helper functions (BMI calculation, blood sugar evaluation, age calculation, formatting)
- API response middleware
- JWT authentication middleware
- Role-based authorization middleware

## License

ISC
