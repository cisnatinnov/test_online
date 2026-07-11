# BMI App

A health monitoring web application with BMI tracking, blood sugar monitoring, vital signs monitoring, patient health risk assessment, money management, interactive games, math tools, and text analysis. Built with Node.js, Express, Sequelize ORM, and PostgreSQL.

## Features

### Health Monitoring
- **BMI Calculator**: Calculate and track Body Mass Index with category classification
- **Blood Sugar Monitor**: Track blood sugar levels with age-based threshold evaluation
- **Vital Signs Monitor**: Blood pressure (systolic/diastolic), heart rate, body temperature, SpO2, respiratory rate with clinical evaluation
- **Health Risk Assessment**: Composite risk scoring from BMI, blood sugar, vital signs, and age factors
- **Health Trend Analysis**: Track BMI, blood sugar, and vital signs trends over time per patient
- **Health Alerts**: Flag patients with high-risk health status
- **Population Statistics**: BMI, blood sugar, vital signs, and risk distribution across all patients

### System & Auth
- **Authentication**: Register, Login with 2FA (Email / WhatsApp)
- **Email Validation**: Format validated on both backend and frontend (`user@domain.tld`)
- **Password Validation**: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 symbol — enforced on backend (register) and frontend (register + login) with strength progress bar
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
- **Chart Visualization**: Weekly, monthly, yearly expense vs saving charts
- **Financial Summary**: Total expense, saving, and balance

### Games (6 games)
- **Hangman**: Guess the word letter by letter with tech-themed vocabulary
- **Coin Catcher**: Catch falling coins, avoid bombs, 30s timer
- **Roleplay Adventure**: Text-based dungeon RPG with combat, gold, and leveling
- **Turtle Racing**: Bet coins on animated turtle races
- **Aim Trainer**: Click shrinking targets, track accuracy and score
- **Rock Paper Scissors**: Classic game vs computer with scoreboard

### Math Tools (5 tools)
- **Shapes Calculator**: 2D shapes (circle, rectangle, triangle, square, ellipse, trapezoid, parallelogram) and 3D shapes (cube, sphere, cylinder, cone, rectangular prism, pyramid, torus) with canvas visualization
- **Equation Grapher**: Plot multiple functions (sin, cos, tan, log, sqrt, x^n) with color legend
- **Scientific Calculator**: Full calculator with trigonometric, logarithmic, and power functions
- **Statistics Calculator**: Mean, median, mode, std dev, variance, quartiles, IQR, histogram
- **Quadratic Function**: Graph and solve ax^2+bx+c with vertex, roots, and step-by-step solution

### Text Analysis (NER)
- **Text Summarizer**: Extractive summarization with adjustable ratio and sentence scoring
- **Sentiment Analysis**: Lexicon-based sentiment detection with word-level coloring

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL
- **Auth**: JWT with 2FA (Nodemailer / WhatsApp API)
- **Frontend**: Vanilla HTML/CSS/JS
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
│   ├── VitalSigns.js            # BP, heart rate, temp, SpO2, respiratory rate
│   ├── Expense.js
│   └── Saving.js
├── controllers/
│   ├── authController.js        # Register, Login, 2FA
│   ├── bmiController.js         # BMI CRUD, list, summary, history
│   ├── bloodSugarController.js  # Blood sugar CRUD, history
│   ├── vitalSignsController.js  # Vital signs CRUD, history, list
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
│   ├── vitalSignsRoutes.js      # Vital signs CRUD + history
│   ├── identityRoutes.js
│   ├── moneyRoutes.js
│   ├── reportRoutes.js
│   ├── adminRoutes.js
│   ├── healthRoutes.js          # /api/health, /ready, /live, /stats
│   └── patientHealthRoutes.js   # /api/patient-health/risk, /trend, /alerts, /population
├── utils/
│   └── helpers.js               # BMI calc, blood sugar eval, vital sign eval, risk scoring, trend analysis
├── __tests__/
│   ├── helpers.test.js
│   ├── apiResponse.test.js
│   ├── authenticate.test.js
│   └── authorize.test.js
├── public/                      # Frontend static files
│   ├── index.html, login.html, register.html, verify-2fa.html
│   ├── dashboard.html, list.html, history.html, summary.html
│   ├── tools.html               # Navigation hub for games, math, NER
│   ├── style.css
│   ├── games/                   # 6 interactive browser games
│   │   ├── hangman.html
│   │   ├── coin-catcher.html
│   │   ├── roleplay-adventure.html
│   │   ├── turtle-racing.html
│   │   ├── aim-trainer.html
│   │   └── rock-paper-scissors.html
│   ├── math/                    # 5 math tools
│   │   ├── shapes.html          # 2D & 3D shape calculator
│   │   ├── equation-grapher.html
│   │   ├── scientific-calculator.html
│   │   ├── statistics.html
│   │   └── quadratic.html       # Quadratic function grapher & solver
│   └── ner/                     # 2 text analysis tools
│       ├── summary.html         # Text summarizer
│       └── sentiment.html       # Sentiment analysis
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

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@bmi-app.com
ADMIN_PASSWORD=Admin@123
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

### Vital Signs (`/api/vital-signs`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create vital signs record | Yes |
| PUT | `/:identityId` | Update vital signs record | Yes |
| GET | `/latest/:identityId` | Get latest vital signs with evaluation | Yes |
| GET | `/list` | List all patients with latest vital signs | Yes |
| GET | `/history/:identityId` | Vital signs history for an identity | Yes |

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

## Frontend Pages

| Page | Description |
|------|-------------|
| `login.html` | Login page with real-time email format validation (when input contains `@`) and password strength progress bar |
| `register.html` | Registration with patient data, real-time email validation, and password strength progress bar (5 rules) |
| `verify-2fa.html` | 2FA code verification |
| `dashboard.html` | Main hub: BMI check, blood sugar check, vital signs check |
| `list.html` | Patient data list with tabs (BMI, blood sugar) and search |
| `history.html` | Patient BMI and blood sugar history |
| `summary.html` | Dashboard statistics cards |
| `tools.html` | Navigation hub for all games, math, and NER tools |
| `games/*.html` | 6 interactive browser games |
| `math/*.html` | 5 math calculation and graphing tools |
| `ner/*.html` | 2 text analysis tools |

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
