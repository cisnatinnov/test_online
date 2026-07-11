## Tables

1. **users** (id, username, email, password, phone, role, createdAt, updatedAt)
2. **two_factor_codes** (id, user_id, code, expires_at, used, channel, createdAt, updatedAt)
3. **identity** (id, id_user, nik, name, height, birthplace, birthdate, address, createdAt, updatedAt)
4. **bmi** (id, id_identity, weight, age, result, status [current/past], createdAt, updatedAt)
5. **bloodsugar** (id, id_identity, age, result, conclusion, status [current/past], createdAt, updatedAt)
6. **vital_signs** (id, id_identity, systolic, diastolic, heart_rate, temperature, spo2, respiratory_rate, age, status [current/past], createdAt, updatedAt)
7. **expenses** (id, user_id, amount, category, description, date, createdAt, updatedAt)
8. **savings** (id, user_id, amount, category, description, date, createdAt, updatedAt)

## Flow

1. **Register** (username, email, password + optional identity data)
2. **Login** (username/email + password)
3. **2FA Verification** (email or WhatsApp channel)
4. **Dashboard** with summary statistics and health check buttons
5. **Health Features**:
   - a. Check BMI (weight + auto age from birthdate, result saved with current/past status)
   - b. Check Blood Sugar (sugar value + auto age, evaluated against age-based thresholds)
   - c. Check Vital Signs (blood pressure, heart rate, temperature, SpO2, respiratory rate with clinical evaluation)
   - d. Patient Health Risk Assessment (composite risk score from BMI + blood sugar + vital signs + age)
   - e. Health Trend Analysis (BMI, blood sugar, and vital signs direction tracking over time)
   - f. Health Alerts (flag high-risk patients for immediate attention)
   - g. Population Statistics (BMI, blood sugar, vital signs, and risk distribution across all patients)
6. **Money Management** (expense tracking, saving tracking, chart visualization weekly/monthly/yearly)
7. **Patient Data List** (all identities with current BMI, blood sugar, and vital signs status, PDF export)
8. **History** (full BMI, blood sugar, and vital signs records per identity)
9. **Tools & Games** (accessible from dashboard navigation):
   - a. Games: Hangman, Coin Catcher, Roleplay Adventure, Turtle Racing, Aim Trainer, Rock Paper Scissors
   - b. Math: Shapes Calculator (2D/3D), Equation Grapher, Scientific Calculator, Statistics, Quadratic Function
   - c. NER: Text Summarizer, Sentiment Analysis
10. **System Health Monitoring** (DB connectivity, memory usage, CPU usage, uptime, readiness/liveness probes)

## Password Rules

- Minimum 8 characters
- Minimum 1 uppercase letter
- Minimum 1 lowercase letter
- Minimum 1 digit
- Minimum 1 symbol
- Visual progress bar with color coding (red/orange/green)
- Real-time validation on register page with strength label (Lemah/Sedang/Kuat)
- Login page validates minimum 8 characters

## Email Validation

- Format: `user@domain.tld` (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Validated on both backend (authController.register) and frontend (LoginView, RegisterView)
- Login page only validates when input contains `@` (allows plain username login)
- Real-time validation on blur and input with red border and error message

## Architecture

- **ORM**: Sequelize (no raw queries)
- **Controllers**: Separate controller per feature (auth, bmi, bloodSugar, vitalSigns, identity, money, report, health, patientHealth)
- **Middlewares**: authenticate (JWT), authorize (role-based), apiResponse (standardized response), mailTransporter (nodemailer), rateLimiter (express-rate-limit)
- **Models**: User, TwoFactorCode, Identity, BMI, BloodSugar, VitalSigns, Expense, Saving
- **Routes**: Separate route file per feature (auth, bmi, bloodSugar, vitalSigns, identity, money, report, admin, health, patientHealth)
- **Frontend**: Vue 3 SPA with Vite, runs independently on `:5173` (proxies `/api` to `:3000`)
- **Backend**: Express API server on `:3000`, serves built SPA from `client/dist` when available
- **Separation**: FE and BE can run independently via `npm run dev` (BE) and `npm run dev:fe` (FE), or together via `npm run dev:all`
- **Tests**: Jest + Supertest unit tests (helpers, apiResponse, authenticate, authorize, historyUtils)

## Health Monitoring Endpoints

### System Health (`/api/health` - no auth required)
- `GET /` - Full health check: DB connectivity + latency, memory (RSS, heap), CPU usage, server/process uptime
- `GET /ready` - Readiness probe: verifies database is reachable
- `GET /live` - Liveness probe: confirms process is alive
- `GET /stats` - Aggregate stats: total users, patients, BMI records, blood sugar records, uptime, Node version, platform

### Vital Signs (`/api/vital-signs` - auth required)
- `POST /` - Create vital signs record (BP, heart rate, temp, SpO2, respiratory rate), marks previous as past
- `PUT /:identityId` - Update vital signs record
- `GET /latest/:identityId` - Get latest vital signs with clinical evaluation
- `GET /list` - List all patients with latest vital signs and evaluation
- `GET /history/:identityId` - Full vital signs history

### Patient Health (`/api/patient-health` - auth required)
- `GET /risk/:identityId` - Composite health risk score (0-10) from BMI, blood sugar, vital signs, and age. Levels: rendah (0-2), sedang (3-4), tinggi (5+)
- `GET /trend/:identityId` - BMI, blood sugar, and vital signs trend analysis with direction tracking
- `GET /alerts` - Lists all patients with tinggi (high) risk level
- `GET /population` - Population-wide BMI, blood sugar, vital signs, and risk distribution

## Vital Signs Evaluation

### Blood Pressure (AHA)
- Low: systolic < 90 or diastolic < 60
- Normal: systolic 90-120 and diastolic 60-80
- Elevated: systolic 121-129 and diastolic < 80
- High Stage 1: systolic 130-139 or diastolic 80-89
- High Stage 2: systolic 140-180 or diastolic 90-120
- Crisis: systolic > 180 or diastolic > 120

### Heart Rate
- Infant (<1yr): 100-160 bpm
- Child (<12yrs): 70-120 bpm
- Adult: 60-100 bpm

### Body Temperature
- Hypothermia: < 35.0C
- Normal: 36.1-37.2C
- Mild fever: 37.3-38.0C
- Fever: 38.1-39.0C
- High fever: > 39.0C

### SpO2
- Critical: < 90%
- Low: 90-94%
- Normal: 95-100%

### Respiratory Rate
- Infant (<1yr): 30-60 /min
- Child (<12yrs): 18-30 /min
- Adult: 12-20 /min

## Frontend Pages

### Core Pages (Vue SPA - `client/dist/`)
- `login.html` - Login with username/email + password, real-time email format validation, password strength progress bar
- `register.html` - Registration with account data + optional patient identity, real-time email & password validation with strength progress bar
- `verify-2fa.html` - 2FA verification (email or WhatsApp)
- `dashboard.html` - Main hub with BMI, blood sugar, and vital signs check forms
- `list.html` - Patient data list with tabbed BMI/blood sugar view and search
- `history.html` - Patient BMI and blood sugar history tables
- `summary.html` - Dashboard statistics cards (total patients, BMI, sugar)
- `tools.html` - Navigation hub for games, math tools, and NER tools

### Games (`client/dist/games/`)
- `hangman.html` - Word guessing game with 20 tech-themed words and canvas hangman drawing
- `coin-catcher.html` - Catch falling coins, avoid bombs, 30s timer, mouse/keyboard controls
- `roleplay-adventure.html` - Text-based dungeon RPG with combat, gold, weapons, armor, branching story, boss fight
- `turtle-racing.html` - Bet on 6 colored turtles with animated race track
- `aim-trainer.html` - Click shrinking targets, 30s timer, tracks score/hits/misses/accuracy
- `rock-paper-scissors.html` - Classic RPS vs computer with emoji display and scoreboard

### Math Tools (`client/dist/math/`)
- `shapes.html` - 2D shapes (circle, rectangle, triangle, square, ellipse, trapezoid, parallelogram) and 3D shapes (cube, sphere, cylinder, cone, rectangular prism, pyramid, torus) with canvas visualization
- `equation-grapher.html` - Plot multiple functions (sin, cos, tan, asin, acos, atan, log, sqrt, x^n) on adjustable coordinate system
- `scientific-calculator.html` - Full calculator with sin/cos/tan/asin/acos/atan/log/ln/sqrt/cbrt/powers
- `statistics.html` - Mean, median, mode, std dev, variance, range, quartiles, IQR, histogram chart
- `quadratic.html` - Graph and solve ax^2+bx+c with vertex, roots, discriminant, step-by-step solution

### NER Tools (`client/dist/ner/`)
- `summary.html` - Extractive text summarizer with adjustable ratio (10%/20%/30%), sentence scoring, visual highlighting
- `sentiment.html` - Lexicon-based sentiment analysis with positive/negative/neutral scoring, visual meter, word-level coloring
