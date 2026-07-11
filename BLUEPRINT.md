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
6. **Patient Data List** (all identities with current BMI and blood sugar status, PDF export)
7. **History** (full BMI and blood sugar records per identity)

## Password Rules

- Minimum 8 characters
- Minimum 1 uppercase letter
- Minimum 1 symbol
- Visual progress bar with color coding (red/yellow/green)

## Architecture

- **ORM**: Sequelize (no raw queries)
- **Controllers**: Separate controller per feature (auth, bmi, bloodSugar, identity, money, report)
- **Middlewares**: authenticate (JWT), apiResponse (standardized response), mailTransporter (nodemailer), rateLimiter (express-rate-limit)
- **Models**: User, TwoFactorCode, Identity, BMI, BloodSugar, Expense, Saving
- **Routes**: Separate route file per feature
- **Tests**: Jest + Supertest unit tests (helpers, apiResponse, authenticate)
