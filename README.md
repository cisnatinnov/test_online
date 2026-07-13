# BMI App

A health monitoring web application with BMI tracking, blood sugar monitoring, vital signs monitoring, patient health risk assessment, money management, and palm oil estate management. Built with Node.js, Express, Sequelize ORM, PostgreSQL, and Vue 3.

## Features

### Health Monitoring
- **BMI Calculator**: Calculate and track Body Mass Index with category classification (Sangat kurus / Kurus / Normal / Gemuk / Obesitas)
- **Blood Sugar Monitor**: Track blood sugar levels with age-based threshold evaluation
- **Vital Signs Monitor**: Blood pressure (systolic/diastolic), heart rate, body temperature, SpO2, respiratory rate with clinical evaluation
- **Health Risk Assessment**: Composite risk scoring from BMI, blood sugar, vital signs, and age factors
- **Health Trend Analysis**: Track BMI, blood sugar, and vital signs trends over time per patient
- **Health Alerts**: Flag patients with high-risk health status
- **Population Statistics**: BMI, blood sugar, vital signs, and risk distribution across all patients

### System & Auth
- **Authentication**: Register, Login with 2FA (Email / WhatsApp)
- **Email Validation**: Format validated on both backend and frontend (`user@domain.tld`), real-time on blur/input
- **Password Validation**: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 symbol -- enforced on backend (register) and frontend (register + login) with real-time strength progress bar
- **System Health Monitoring**: Server uptime, DB connectivity, memory/CPU usage, readiness/liveness probes
- **Rate Limiting**: Protection against API abuse
- **Role-based Access**: Admin and user roles with data isolation

### Patient Management
- **Patient Data List**: View all patient data with current BMI, blood sugar, and vital signs status
- **History**: View historical BMI, blood sugar, and vital signs records per patient
- **Dashboard Summary**: Aggregate statistics for patients, BMI, blood sugar, and vital signs
- **PDF Export**: Download patient examination reports as PDF

### Money Management
- **Expense/Saving Tracking**: CRUD with category and description
- **Category Breakdown**: Expense and saving totals grouped by category
- **Chart Visualization**: Weekly, monthly, yearly expense vs saving charts
- **Financial Summary**: Total expense, saving, and balance

### Palm Oil Estate Management (Sawit)
- **Estate Management**: Create and manage palm oil estates (width x length grid)
- **Tree Planting**: Plant trees at specific coordinates within estate bounds (height 1-30m)
- **Estate Statistics**: Tree count, max/min/median height per estate
- **Drone Planning**: Calculate optimal drone flyover path with Manhattan distance, forced landing calculation when battery limited
- **Canvas Visualization**: Interactive canvas showing estate grid with tree positions

### Frontend (Vue 3 SPA)
- **Health Monitor Page**: Record vitals (BP, HR, temp, SpO2, resp rate, weight, BMI), color-coded metric cards, history table
- **Money Dashboard Page**: Expense/saving CRUD, category breakdowns, trend charts, financial summary
- **Estate View Page**: Create estates, plant trees, view canvas visualization, stats, drone plans
- **Dashboard Page**: Navigation hub to Health, Money, Estate, and other features

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL (tests use SQLite in-memory)
- **Auth**: JWT with 2FA (Nodemailer / WhatsApp API)
- **Frontend**: Vue 3 SPA with Vite, Pinia store, Vue Router
- **Testing**: Jest + Supertest (backend), Vitest (frontend)

## Project Structure

```
.
├── config/
│   └── database.js              # Sequelize connection
├── models/
│   ├── index.js                 # Associations & exports
│   ├── User.js                  # User accounts (username, email, password, phone, role)
│   ├── TwoFactorCode.js         # 2FA codes (code, expires_at, used, channel)
│   ├── Identity.js              # Patient identity (nik, name, height, birthplace, birthdate, address)
│   ├── BMI.js                   # BMI records (weight, age, result, status current/past)
│   ├── BloodSugar.js            # Blood sugar records (age, result, conclusion, status)
│   ├── VitalSigns.js            # Vital signs (BP, HR, temp, SpO2, resp rate, status)
│   ├── Expense.js               # Expense records (amount, category, description, date)
│   ├── Saving.js                # Saving records (amount, category, description, date)
│   ├── Estate.js                # Palm oil estates (width, length)
│   └── Tree.js                  # Trees in estates (x, y, height, estate_id)
├── controllers/
│   ├── authController.js        # Register, Login, 2FA
│   ├── bmiController.js         # BMI CRUD, list, summary, history
│   ├── bloodSugarController.js  # Blood sugar CRUD, history
│   ├── vitalSignsController.js  # Vital signs CRUD, history, list
│   ├── identityController.js    # Identity CRUD
│   ├── moneyController.js       # Expense/Saving CRUD, chart, summary, category breakdown
│   ├── reportController.js      # PDF export
│   ├── healthController.js      # System health checks (DB, memory, CPU, uptime)
│   ├── patientHealthController.js # Patient risk scoring, trends, alerts, population stats
│   └── estateController.js      # Estate CRUD, tree CRUD, stats, drone plan
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
│   ├── vitalSignsRoutes.js
│   ├── identityRoutes.js
│   ├── moneyRoutes.js           # Expense, Saving, Chart, Summary, Categories
│   ├── reportRoutes.js
│   ├── adminRoutes.js
│   ├── healthRoutes.js
│   ├── patientHealthRoutes.js
│   └── estateRoutes.js          # Estate & tree management
├── utils/
│   ├── helpers.js               # BMI calc, blood sugar eval, vital sign eval, risk scoring, trend analysis
│   └── history-utils.js         # Date formatting for history records
├── __tests__/
│   ├── estate.test.js           # Estate API tests (SQLite in-memory)
│   ├── helpers.test.js
│   ├── historyUtils.test.js
│   ├── apiResponse.test.js
│   ├── authenticate.test.js
│   └── authorize.test.js
├── client/                      # Vue 3 SPA frontend (Vite)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api.js               # Axios instance with baseURL
│       ├── App.vue
│       ├── main.js
│       ├── router/index.js      # Vue Router (login, register, dashboard, health, money, estate, etc.)
│       ├── stores/auth.js       # Pinia auth store
│       ├── utils/helpers.js     # Frontend helper functions
│       └── views/
│           ├── LoginView.vue
│           ├── RegisterView.vue
│           ├── Verify2FAView.vue
│           ├── DashboardView.vue
│           ├── HealthMonitorView.vue  # Health dashboard with BMI, vitals, history
│           ├── MoneyDashboardView.vue # Money management with charts
│           ├── EstateView.vue         # Estate management with canvas
│           ├── ListView.vue
│           ├── HistoryView.vue
│           ├── SummaryView.vue
│           └── ToolsView.vue
├── .env
├── server.js
├── README.md
├── BLUEPRINT.md
├── USAGE.md
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

**Backend:**

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=bmi_app
DB_PASS=your_password
DB_PORT=5432

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email

WHATSAPP_API_URL=
WHATSAPP_API_KEY=

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@bmi-app.com
ADMIN_PASSWORD=Admin@123

CORS_ORIGIN=http://localhost:5173
```

**Frontend (`client/.env`):**

```env
VITE_API_URL=http://localhost:3000
VITE_API_BASE=/api
```

### Run

```bash
# Backend only (API server on :3000)
npm run dev

# Frontend only (Vite dev server on :5173)
npm run dev:fe

# Both together
npm run dev:all

# Build frontend SPA
npm run build:fe

# Run tests
npm test
```

| Command | Description |
|---------|-------------|
| `npm run dev` | Backend only (`:3000`) |
| `npm run dev:fe` | Frontend only (`:5173`) |
| `npm run dev:all` | Both concurrently |
| `npm run build:fe` | Build SPA to `client/dist/` |
| `npm test` | Run backend unit tests |

Backend runs at `http://localhost:3000`. Frontend dev server runs at `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:3000`.

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user (with optional patient identity) | No |
| POST | `/login` | Login (returns temp 2FA token) | No |
| POST | `/send-2fa` | Send 2FA code (email or WhatsApp) | No |
| POST | `/verify-2fa` | Verify 2FA code (returns JWT) | No |

### Identity (`/api/identities`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List user identities | Yes |
| POST | `/` | Create identity (admin only) | Yes (admin) |
| PUT | `/:id` | Update identity | Yes |

### BMI (`/api/bmi`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create BMI record (identity_id + weight) | Yes |
| PUT | `/:identityId` | Update BMI record | Yes |
| GET | `/list` | List all patient data with current BMI & sugar | Yes |
| GET | `/summary` | Dashboard summary statistics | Yes |
| GET | `/history/:identityId` | BMI history for an identity | Yes |

### Blood Sugar (`/api/bloodsugar`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create blood sugar record (identity_id + sugar) | Yes |
| PUT | `/:identityId` | Update blood sugar record | Yes |
| GET | `/history/:identityId` | Blood sugar history for an identity | Yes |

### Vital Signs (`/api/vital-signs`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create vital signs record (BP, HR, temp, SpO2, resp rate) | Yes |
| PUT | `/:identityId` | Update vital signs record | Yes |
| GET | `/latest/:identityId` | Get latest vital signs with clinical evaluation | Yes |
| GET | `/list` | List all patients with latest vital signs | Yes |
| GET | `/history/:identityId` | Vital signs history for an identity | Yes |

### Money Management (`/api/money`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/expense` | Create expense (amount, category, description, date) | Yes |
| GET | `/expense` | List expenses | Yes |
| PUT | `/expense/:id` | Update expense | Yes |
| DELETE | `/expense/:id` | Delete expense | Yes |
| POST | `/saving` | Create saving (amount, category, description, date) | Yes |
| GET | `/saving` | List savings | Yes |
| PUT | `/saving/:id` | Update saving | Yes |
| DELETE | `/saving/:id` | Delete saving | Yes |
| GET | `/chart?period=monthly&year=2026` | Chart data (weekly/monthly/yearly) | Yes |
| GET | `/summary` | Total expense, saving, balance | Yes |
| GET | `/expense/categories` | Expense totals grouped by category | Yes |
| GET | `/saving/categories` | Saving totals grouped by category | Yes |

### Estate Management (`/api/estate`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all estates | No |
| POST | `/` | Create estate (width, length) | No |
| GET | `/:id/trees` | List trees in an estate | No |
| POST | `/:id/tree` | Plant tree (x, y, height) | No |
| GET | `/:id/stats` | Estate stats (count, max, min, median height) | No |
| GET | `/:id/drone-plan` | Drone path with Manhattan distance | No |
| GET | `/:id/drone-plan?max_distance=N` | Drone path with forced landing point | No |

### Reports & Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/export/pdf/:identityId` | Download PDF report | Yes |
| GET | `/api/dashboard/summary` | Dashboard statistics | Yes |
| GET | `/api/history/:identityId/bmi` | BMI history | Yes |
| GET | `/api/history/:identityId/bloodsugar` | Blood sugar history | Yes |
| GET | `/api/history/:identityId/vitalsigns` | Vital signs history | Yes |

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
| GET | `/trend/:identityId` | BMI, blood sugar, and vital signs trend analysis | Yes |
| GET | `/alerts` | List all high-risk patients | Yes |
| GET | `/population` | BMI, sugar, vital signs, and risk distribution stats | Yes |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users` | List all registered users | Yes (admin) |
| GET | `/all-data` | List all patient data with BMI and blood sugar | Yes (admin) |

## BMI Categories

| BMI Range | Category |
|-----------|----------|
| < 17 | Sangat kurus (Severely underweight) |
| 17 - 18.5 | Kurus (Underweight) |
| 18.5 - 25 | Normal |
| 25 - 27 | Gemuk (Overweight) |
| > 27 | Obesitas (Obese) |

## Blood Sugar Thresholds

| Age | Normal Range |
|-----|-------------|
| < 50 | 70 - 100 mg/dL |
| >= 50 | 70 - 110 mg/dL |

## Vital Signs Reference

### Blood Pressure (AHA Classification)

| Category | Systolic (mmHg) | Diastolic (mmHg) |
|----------|-----------------|-------------------|
| Low (Hypotension) | < 90 | < 60 |
| Normal | 90-120 | 60-80 |
| Elevated | 121-129 | < 80 |
| High Stage 1 | 130-139 | 80-89 |
| High Stage 2 | 140-180 | 90-120 |
| Crisis | > 180 | > 120 |

### Heart Rate (bpm)

| Age | Normal Range |
|-----|-------------|
| Infant (< 1 yr) | 100 - 160 |
| Child (< 12 yrs) | 70 - 120 |
| Adult | 60 - 100 |

### Body Temperature

| Range | Status |
|-------|--------|
| < 35.0C | Hypothermia |
| 36.1 - 37.2C | Normal |
| 37.3 - 38.0C | Mild fever |
| 38.1 - 39.0C | Fever |
| > 39.0C | High fever |

### SpO2 (Oxygen Saturation)

| Range | Status |
|-------|--------|
| < 90% | Critical |
| 90-94% | Low |
| 95-100% | Normal |

### Respiratory Rate (breaths/min)

| Age | Normal Range |
|-----|-------------|
| Infant (< 1 yr) | 30 - 60 |
| Child (< 12 yrs) | 18 - 30 |
| Adult | 12 - 20 |

## Health Risk Scoring

Risk score is calculated from combined BMI, blood sugar, vital signs, and age factors:

| Factor | Points |
|--------|--------|
| BMI: Sangat kurus | +3 |
| BMI: Kurus | +1 |
| BMI: Gemuk | +2 |
| BMI: Obesitas | +4 |
| Blood sugar: Rendah | +2 |
| Blood sugar: Tinggi | +3 |
| Vital signs: abnormal reading | +2 |
| Age >= 50 | +1 |
| Age >= 65 | +1 |

| Total Score | Risk Level |
|-------------|------------|
| 0 - 2 | rendah (low) |
| 3 - 4 | sedang (medium) |
| 5+ | tinggi (high) |

## Estate Management Rules

- Estate width and length must be positive integers (minimum 1)
- Tree coordinates must be within estate bounds (0 <= x <= width, 0 <= y <= length)
- Tree height must be between 1 and 30 meters
- Drone path follows sorted tree order (by y then x), starting from (0,0)
- Manhattan distance: |x1-x2| + |y1-y2|
- When `max_distance` is provided, a forced landing point is calculated if battery runs out mid-segment

## Frontend Pages (Vue SPA)

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginView | Login with username/email + password |
| `/register` | RegisterView | Registration with patient identity |
| `/verify-2fa` | Verify2FAView | 2FA verification (email or WhatsApp) |
| `/` | DashboardView | Main hub: navigation to Health, Money, Estate |
| `/health` | HealthMonitorView | Record vitals + weight, view BMI/metrics, history table |
| `/money` | MoneyDashboardView | Expense/saving CRUD, category breakdowns, trend charts |
| `/estate` | EstateView | Estate CRUD, tree planting, canvas visualization, drone plans |
| `/list` | ListView | Patient data list with tabs |
| `/history` | HistoryView | Patient BMI and blood sugar history |
| `/summary` | SummaryView | Dashboard statistics cards |
| `/tools` | ToolsView | Navigation hub for games, math, and NER tools |

## Testing

```bash
npm test
```

Runs 62 unit tests covering:
- Estate API (24 tests) - estate CRUD, tree CRUD, stats, drone plan, max_distance (SQLite in-memory)
- Helper functions (BMI calculation, blood sugar evaluation, age calculation, formatting)
- History date formatting
- API response middleware
- JWT authentication middleware
- Role-based authorization middleware

```bash
cd client && npx vitest run
```

Runs 6 frontend tests covering frontend helper functions.

## License

ISC
