## Tables

1. **users** (id, username, email, password, phone, createdAt, updatedAt)
2. **two_factor_codes** (id, user_id, code, expires_at, used, channel, createdAt, updatedAt)
3. **identity** (id, id_user, nik, name, height, birthplace, birthdate, address, createdAt, updatedAt)
4. **bmi** (id, id_identity, weight, age, result, status [current/past], createdAt, updatedAt)
5. **bloodsugar** (id, id_identity, age, result, conclusion, status [current/past], createdAt, updatedAt)
6. **expenses** (id, user_id, amount, category, description, date, createdAt, updatedAt)
7. **savings** (id, user_id, amount, category, description, date, createdAt, updatedAt)

## Flow

1. **Register** (username, email, password + optional identity data)
2. **Login** (username/email + password)
3. **2FA Verification** (email or WhatsApp channel)
4. **Dashboard** with summary statistics
5. **Features**:
   - a. Check BMI (weight + auto age from birthdate, result saved with current/past status)
   - b. Check Blood Sugar (sugar value + auto age, evaluated against age-based thresholds)
   - c. Money Management (expense tracking, saving tracking, chart visualization weekly/monthly/yearly)
   - d. Patient Health Risk Assessment (composite risk score from BMI + blood sugar + age)
   - e. Health Trend Analysis (BMI and blood sugar direction tracking over time)
   - f. Health Alerts (flag high-risk patients for immediate attention)
   - g. Population Statistics (BMI, blood sugar, and risk distribution across all patients)
6. **Patient Data List** (all identities with current BMI and blood sugar status, PDF export)
7. **History** (full BMI and blood sugar records per identity)
8. **System Health Monitoring** (DB connectivity, memory usage, CPU usage, uptime, readiness/liveness probes)

## Password Rules

- Minimum 8 characters
- Minimum 1 uppercase letter
- Minimum 1 symbol
- Visual progress bar with color coding (red/yellow/green)

## Architecture

- **ORM**: Sequelize (no raw queries)
- **Controllers**: Separate controller per feature (auth, bmi, bloodSugar, identity, money, report, health, patientHealth)
- **Middlewares**: authenticate (JWT), authorize (role-based), apiResponse (standardized response), mailTransporter (nodemailer), rateLimiter (express-rate-limit)
- **Models**: User, TwoFactorCode, Identity, BMI, BloodSugar, Expense, Saving
- **Routes**: Separate route file per feature (auth, bmi, bloodSugar, identity, money, report, admin, health, patientHealth)
- **Tests**: Jest + Supertest unit tests (helpers, apiResponse, authenticate, authorize)

## Health Monitoring Endpoints

### System Health (`/api/health` - no auth required)
- `GET /` - Full health check: DB connectivity + latency, memory (RSS, heap), CPU usage, server/process uptime
- `GET /ready` - Readiness probe: verifies database is reachable
- `GET /live` - Liveness probe: confirms process is alive
- `GET /stats` - Aggregate stats: total users, patients, BMI records, blood sugar records, uptime, Node version, platform

### Patient Health (`/api/patient-health` - auth required)
- `GET /risk/:identityId` - Composite health risk score (0-10) from BMI status, blood sugar level, and age factors. Levels: rendah (0-2), sedang (3-4), tinggi (5+)
- `GET /trend/:identityId` - BMI and blood sugar trend analysis with direction tracking (increasing/decreasing/stable for BMI, worsening/improving/stable for blood sugar)
- `GET /alerts` - Lists all patients with tinggi (high) risk level
- `GET /population` - Population-wide BMI category distribution, blood sugar distribution, and risk level distribution
