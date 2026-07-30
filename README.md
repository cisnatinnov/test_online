# VitaSuite

A health monitoring web application with BMI tracking, blood sugar monitoring, vital signs monitoring, patient health risk assessment, money management, palm oil estate management, real-time chat, and library management. Built with Node.js, Express, Sequelize ORM, PostgreSQL, and Vue 3.

## Features

### Health Monitoring
- **BMI Calculator**: Calculate and track Body Mass Index with category classification (Sangat kurus / Kurus / Normal / Gemuk / Obesitas)
- **Blood Sugar Monitor**: Track blood sugar levels with age-based threshold evaluation
- **Vital Signs Monitor**: Blood pressure (systolic/diastolic), heart rate, body temperature, SpO2, respiratory rate with clinical evaluation
- **Health Risk Assessment**: Composite risk scoring from BMI, blood sugar, vital signs, and age factors
- **Health Trend Analysis**: Track BMI, blood sugar, and vital signs trends over time per patient
- **Health Alerts**: Flag patients with high-risk health status
- **Population Statistics**: BMI, blood sugar, vital signs, and risk distribution across all patients
- **API Traffic Tracking**: Monitor API request logs with method, path, status, response time, and user info
- **Accessible to All Users**: The Health Monitor page (`/health`) is accessible to all authenticated users (non-admin sees only own patients); API traffic dashboard section remains admin-only
- **Sidebar Navigation**: All authenticated pages now use a unified sidebar navigation component (`Sidebar.vue`) with sectioned links (main menu, admin items, extra items), language switcher, and logout. Sidebar supports collapse/expand toggle (persisted in localStorage) for compact icon-only mode on desktop

### Internationalization (i18n)
- **5 Language Options**: English (UK), English (US), Bahasa Indonesia, Espanol, Portugues
- **Language Preference**: Saved in localStorage and persists across sessions
- **Language Switcher**: Dropdown select component available on login, register, and sidebar on all authenticated pages

### Progressive Web App (PWA)
- **Installable**: Can be installed on Android and iOS devices
- **Offline Support**: Service worker for offline caching of assets
- **Home Screen Installation**: Web app manifest for adding to home screen
- **Offline Mode**: Works offline for cached assets

### Security Hardening
- **HTTP Security Headers**: Helmet.js for setting secure HTTP headers
- **Body Size Limit**: JSON body size limited to 1MB
- **Startup Validation**: Required environment variables validated on startup (JWT_SECRET, JWT_TEMP_SECRET, DB credentials, admin credentials)
- **No Hardcoded Fallbacks**: No default credential fallbacks -- `JWT_SECRET` must be set; server crashes on startup if missing
- **No Query-param Tokens**: Tokens accepted only via `Authorization` header, never via URL query parameters
- **2FA Code Protection**: Verification codes are never returned in API responses or logged to console -- only sent via email/WhatsApp
- **Rate Limiting**: Rate limiting on health endpoints
- **Error Handlers**: Global unhandled rejection and exception handlers

### Transaction Safety
- **Race Condition Prevention**: Database transactions for BMI, blood sugar, and vital signs status updates
- **Library Operations**: Borrow/return operations wrapped in transactions for data integrity
- **Partial Update Safety**: Identity updates only modify fields provided in the request, preventing accidental `NaN` or `null` overwrites

### Input Validation
- **Field Length Limits**: Username (50), email (255), password (128) max length validation
- **Chat Message Cap**: Chat messages limited to 5000 characters
- **Room Membership Verification**: Verified before join/send operations

### System & Auth
- **Authentication**: Register, Login with 2FA (Email / WhatsApp)
- **JWT Token Expiry**: Access tokens expire after 24 hours; backend returns 401 (expired) vs 403 (invalid) to distinguish error types
- **Auto-Logout**: Frontend automatically logs out and redirects to login on token expiry (detected via API 401/403 response, client-side expiry check on page load, or router navigation)
- **Storage Sync**: Logout in one browser tab automatically syncs across all tabs via `storage` event listener; clearing browser history also triggers logout
- **Email Validation**: Format validated on both backend and frontend (`user@domain.tld`), real-time on blur/input
- **Password Validation**: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 symbol -- enforced on backend (register) and frontend (register + login) with real-time strength progress bar
- **System Health Monitoring**: Server uptime, DB connectivity, memory/CPU usage, readiness/liveness probes
- **Rate Limiting**: Protection against API abuse
- **Role-based Access**: Admin and user roles with data isolation

### Patient Management
- **Identity CRUD**: Identity creation requires a valid user account; admin can assign identities to any user with email notification
- **Data Isolation**: Non-admin users only see their own patients' data across all endpoints including BMI, blood sugar, vital signs, and history

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

### Real-time Chat
- **Chat Rooms**: Create direct (1:1) or group chat rooms
- **Real-time Messaging**: Socket.IO-based instant message delivery
- **Online Users**: Track which users are currently online
- **Typing Indicators**: See when other users are typing
- **Participant Management**: Add/remove users from group chats

### Library Management
- **Book Management**: CRUD for books with title, author, ISBN, publisher, year, category, description, quantity, and shelf location
- **Search & Filter**: Search by title, author, ISBN; filter by category with pagination
- **Borrowing System**: Borrow and return books with due dates and notes
- **Overdue Tracking**: Automatic detection of overdue borrowings with status marking
- **Configurable Fine & Duration**: Admin can manage borrow duration (days), fine per day (Rp), and overdue tolerance days
- **Overdue Tolerance**: First N days of overdue are free (default: 1 day), fine only applies after tolerance period
- **Overdue Fine**: Configurable fine per day (default: Rp 500) for overdue borrowings beyond tolerance, calculated automatically on return
- **Fine Statistics**: Total fines collected and unpaid fines tracking
- **Library Statistics**: Total books, available, borrowed, overdue counts, category breakdown, fine/duration settings
- **Role-based Access**: Admin can manage all books, view all borrowings, and configure library settings; users manage their own borrowings


### Pagination
- All list endpoints support pagination with `page` (default 1) and `limit` (default 20) query parameters
- Allowed limit values: 5, 10, 20, 50, 100 (invalid values default to 20)
- Response includes: `total`, `page`, `limit`, `pages` (total pages), and the items array

### Money Management PDF Export
- **Daily Report**: Export expense/saving data for a specific day
- **Weekly Report**: Export expense/saving data for a specific week
- **Monthly Report**: Export expense/saving data for a specific month
- PDF includes: summary (total expense, saving, balance), itemized tables with date, category, description, and amount

### Frontend (Vue 3 SPA)
- **Health Monitor Page**: Record vitals (BP, HR, temp, SpO2, resp rate), BMI, and blood sugar via separate input cards; color-coded metric cards with previous data labels (low/yellow, normal/green, high/red); click on metric cards to toggle corresponding history sections (BMI, blood sugar, vital signs) — hidden by default, shown on click with chevron hint; BP status flags and color-coded status badges on each vital sign data cell (HR, Temp, SpO2, Resp: Low/Normal/High); API traffic dashboard with request logs, hourly charts, and status breakdowns (admin-only API traffic section). Patient auto-selected for non-admin users; `identity_id` auto-resolved from user's identity for non-admin. Accepts `?identity=` query param for admin direct navigation to a specific patient.
- **Money Dashboard Page**: Expense/saving CRUD, category dropdowns (from Category API), category breakdowns, trend charts, financial summary
- **Estate View Page**: Create estates, plant trees, view canvas visualization, stats, drone plans
- **Chat Page**: Real-time messaging with chat rooms, online users, typing indicators
- **Category Management Page**: Spending/saving category CRUD with duplicate prevention, integrated with Money Dashboard dropdowns
- **Library Page**: Book catalog with search/filter, borrowing management, fine display, library statistics with category breakdown, admin-only fine/duration settings panel
- **Dashboard Page**: Public landing page showing login/register for unauthenticated users; welcome greeting with user avatar, feature navigation cards (health, money, estate, chat, library, tools) that link to respective pages, and an admin-only "Patient Data" card when authenticated

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL (tests use SQLite in-memory)
- **Auth**: JWT with 2FA (Nodemailer / WhatsApp API), token expiry auto-logout, cross-tab storage sync
- **Real-time**: Socket.IO (chat feature)
- **PDF Generation**: PDFKit
- **Frontend**: Vue 3 SPA with Vite, Pinia store, Vue Router
- **Testing**: Jest + Supertest (backend), Vitest (frontend)
- **i18n**: vue-i18n v10 — all views (Dashboard, Health Monitor, Money, Estate, Chat, Library) fully internationalized with reactive language switching across 5 locales
- **PWA**: vite-plugin-pwa (Workbox)
- **Security**: Helmet.js

## Project Structure

```
.
├── config/
│   └── database.js              # Sequelize connection
├── models/
│   ├── index.js                 # Associations & exports
│   ├── User.js                  # User accounts (username, email, password, phone, role)
│   ├── TwoFactorCode.js         # 2FA codes (code, expires_at, used, channel)
│   ├── Identity.js              # Patient identity (nik, name, height, birthplace, birthdate, address, gender)
│   ├── BMI.js                   # BMI records (weight, age, result, status current/past)
│   ├── BloodSugar.js            # Blood sugar records (age, result, conclusion, status)
│   ├── VitalSigns.js            # Vital signs (BP, HR, temp, SpO2, resp rate, status)
│   ├── Expense.js               # Expense records (amount, category, description, date)
│   ├── Saving.js                # Saving records (amount, category, description, date)
│   ├── Estate.js                # Palm oil estates (width, length)
│   ├── Tree.js                  # Trees in estates (x, y, height, estate_id)
│   ├── ChatRoom.js              # Chat rooms (name, type direct/group)
│   ├── ChatMessage.js           # Chat messages (room_id, user_id, content)
│   ├── ChatParticipant.js       # Room participants (room_id, user_id, role)
│   ├── Book.js                  # Library books (title, author, isbn, publisher, year, category, quantity, available, shelf)
│   ├── Borrowing.js             # Book borrowings (user_id, book_id, borrow_date, due_date, return_date, status, fine, notes)
│   ├── LibrarySetting.js        # Library config (borrow_duration_days, fine_per_day, overdue_tolerance_days)
│   ├── HealthTraffic.js         # API traffic logs (method, path, status_code, response_time_ms, user_id, ip, user_agent)
│   └── Category.js              # Spending/saving categories (name, type [spending/saving], unique name+type)
├── controllers/
│   ├── authController.js        # Register, Login, 2FA
│   ├── bmiController.js         # BMI CRUD, list, history
│   ├── bloodSugarController.js  # Blood sugar CRUD, history
│   ├── vitalSignsController.js  # Vital signs CRUD, history, list
│   ├── identityController.js    # Identity CRUD with user validation and email notification
│   ├── moneyController.js       # Expense/Saving CRUD, chart, summary, category breakdown
│   ├── categoryController.js    # Category CRUD (spending/saving, duplicate name prevention)
│   ├── reportController.js      # PDF export
│   ├── healthController.js      # System health checks (DB, memory, CPU, uptime)
│   ├── healthTrafficController.js # API traffic stats (total requests, avg response, status/method breakdown, hourly, recent)
│   ├── patientHealthController.js # Patient risk scoring, trends, alerts, population stats
│   ├── estateController.js      # Estate CRUD, tree CRUD, stats, drone plan
│   ├── chatController.js        # Real-time chat (Socket.IO + REST)
│   ├── libraryController.js     # Book CRUD, borrow/return, overdue fine, stats, library settings
│   └── adminController.js       # Admin user/data listing
├── middlewares/
│   ├── authenticate.js          # JWT authentication (401 for expired, 403 for invalid)
│   ├── apiResponse.js           # Standardized API response + error handler
│   ├── mailTransporter.js       # Nodemailer transport
│   ├── rateLimiter.js           # Rate limiting (API & Auth)
│   ├── authorize.js             # Role-based access control
│   └── healthTraffic.js         # Logs all API requests to health_traffic table
├── routes/
│   ├── authRoutes.js
│   ├── bmiRoutes.js
│   ├── bloodSugarRoutes.js
│   ├── vitalSignsRoutes.js
│   ├── identityRoutes.js
│   ├── moneyRoutes.js
│   ├── categoryRoutes.js
│   ├── reportRoutes.js
│   ├── adminRoutes.js
│   ├── healthRoutes.js
│   ├── healthTrafficRoutes.js
│   ├── patientHealthRoutes.js
│   ├── estateRoutes.js
│   ├── chatRoutes.js
│   └── libraryRoutes.js
├── utils/
│   ├── helpers.js               # BMI calc, blood sugar eval, vital sign eval, risk scoring, trend analysis
│   ├── history-utils.js         # Date formatting for history records
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
│   ├── public/
│   │   └── icons/               # PWA icons
│   └── src/
│       ├── api.js               # Axios instance with auth interceptors (auto-logout on 401/403)
│       ├── App.vue
│       ├── main.js
│       ├── router/index.js      # Vue Router (all routes, token expiry guard)
│       ├── stores/auth.js       # Pinia auth store (JWT expiry check, storage sync)
│       ├── utils/helpers.js     # Frontend helper functions
│       ├── locales/              # i18n translation files
│       │   ├── en-GB.json       # English (UK) translations
│       │   ├── en-US.json       # English (US) translations
│       │   ├── id.json          # Bahasa Indonesia translations
│       │   ├── es.json          # Espanol translations
│       │   ├── pt.json          # Portugues translations
│       │   └── index.js         # i18n configuration and locale loading
│       ├── components/
│       │   ├── LanguageSwitcher.vue  # Language selection dropdown component
│       │   └── Sidebar.vue          # Sidebar navigation component (menu, admin, extra, language, logout)
│       └── views/
│           ├── LoginView.vue
│           ├── RegisterView.vue
│           ├── Verify2FAView.vue
│           ├── DashboardView.vue
│           ├── HealthMonitorView.vue
│           ├── MoneyDashboardView.vue
│           ├── EstateView.vue
│           ├── ChatView.vue
│           ├── LibraryView.vue
│   ├── ListView.vue             # Admin user/identity list with health detail navigation
│           ├── HistoryView.vue
│           ├── ToolsView.vue
│           └── tools/           # 13 tool Vue components
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

**Backend:** (all variables are required at startup)

```env
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASS=your_db_password
DB_PORT=5432

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email

WHATSAPP_API_URL=
WHATSAPP_API_KEY=

ADMIN_USERNAME=your_admin_username
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password

JWT_SECRET=your_jwt_secret

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
| POST | `/change-password` | Change password (currentPassword, newPassword); logs out all sessions | Yes |

### Identity (`/api/identities`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List user identities (own patients only, admin sees all) | Yes |
| POST | `/` | Create identity (admin only, requires valid user account, email notification sent to assigned user) | Yes (admin) |
| PUT | `/:id` | Update identity | Yes |

### BMI (`/api/bmi`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create BMI record (identity_id optional for non-admin, auto-resolved; weight required) | Yes |
| PUT | `/:identityId` | Update BMI record | Yes |
| GET | `/list` | List all patient data with current BMI & sugar | Yes |
| GET | `/history/:identityId` | BMI history for an identity | Yes |

### Blood Sugar (`/api/bloodsugar`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create blood sugar record (identity_id optional for non-admin, auto-resolved; sugar required) | Yes |
| PUT | `/:identityId` | Update blood sugar record | Yes |
| GET | `/history/:identityId` | Blood sugar history for an identity | Yes |

### Vital Signs (`/api/vital-signs`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create vital signs record (identity_id optional for non-admin, auto-resolved) | Yes |
| PUT | `/:identityId` | Update vital signs record | Yes |
| GET | `/latest/:identityId` | Get latest vital signs with clinical evaluation | Yes |
| GET | `/list` | List all patients with latest vital signs | Yes |
| GET | `/history/:identityId` | Vital signs history for an identity | Yes |

### Money Management (`/api/money`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/expense` | Create expense (amount, category, description, date) | Yes |
| GET | `/expense` | List expenses (paginated) | Yes |
| PUT | `/expense/:id` | Update expense | Yes |
| DELETE | `/expense/:id` | Delete expense | Yes |
| POST | `/saving` | Create saving (amount, category, description, date) | Yes |
| GET | `/saving` | List savings (paginated) | Yes |
| PUT | `/saving/:id` | Update saving | Yes |
| DELETE | `/saving/:id` | Delete saving | Yes |
| GET | `/chart?period=monthly&year=2026` | Chart data (weekly/monthly/yearly) | Yes |
| GET | `/summary` | Total expense, saving, balance | Yes |
| GET | `/export/pdf?period=monthly&year=2026&month=7` | Export PDF report (daily/weekly/monthly) | Yes |
| GET | `/expense/categories` | Expense totals grouped by category | Yes |
| GET | `/saving/categories` | Saving totals grouped by category | Yes |

### Estate Management (`/api/estate`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all estates | Yes |
| POST | `/` | Create estate (width, length) | Yes |
| GET | `/:id/trees` | List trees in an estate | Yes |
| POST | `/:id/tree` | Plant tree (x, y, height) | Yes |
| GET | `/:id/stats` | Estate stats (count, max, min, median height) | Yes |
| GET | `/:id/drone-plan` | Drone path with Manhattan distance | Yes |
| GET | `/:id/drone-plan?max_distance=N` | Drone path with forced landing point | Yes |

### Chat (`/api/chat`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/rooms` | List chat rooms for current user | Yes |
| POST | `/rooms` | Create chat room (name, type, participants) — direct rooms verified by both participants | Yes |
| POST | `/rooms/:id/participants` | Add participant to room | Yes |
| DELETE | `/rooms/:id/participants/:userId` | Remove participant from room (admin only) | Yes |
| GET | `/rooms/:id/messages` | List messages in a room (paginated) | Yes |
| GET | `/online` | List currently online users | Yes |

**Socket.IO Events** (path: `/socket.io`):

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:join` | Client -> Server | Join a chat room |
| `chat:leave` | Client -> Server | Leave a chat room |
| `chat:send` | Client -> Server | Send a message to a room |
| `chat:message` | Server -> Client | Receive a new message |
| `chat:typing` | Client -> Server | User is typing indicator |
| `chat:users` | Server -> Client | Broadcast typing status |
| `user:online` | Server -> Client | User came online |
| `user:offline` | Server -> Client | User went offline |

### Library Management (`/api/library`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/settings` | Get library settings (borrow duration, fine, tolerance) | Yes |
| PUT | `/settings` | Update library settings | Yes (admin) |
| GET | `/` | List books (search, category, page, limit) | Yes |
| POST | `/` | Create book (title, author, isbn, publisher, year, category, description, quantity, shelf) | Yes |
| GET | `/:id` | Get book detail | Yes |
| PUT | `/:id` | Update book | Yes |
| DELETE | `/:id` | Delete book (admin only) | Yes |
| POST | `/:id/borrow` | Borrow book (due_date, notes, user_id for admin) | Yes |
| POST | `/:id/return/:borrowId` | Return borrowed book (calculates overdue fine) | Yes |
| GET | `/borrowings` | List borrowings (status, user_id, page, limit) with fine info | Yes |
| GET | `/categories` | List all book categories | Yes |
| GET | `/stats` | Library statistics (totals, overdue, fines, settings, category breakdown) | Yes |
| POST | `/overdue/update` | Mark overdue borrowings and calculate fines | Yes |

### Reports & Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/export/pdf/:identityId` | Download PDF report | Yes |
| GET | `/api/history/:identityId/bmi` | BMI history | Yes |
| GET | `/api/history/:identityId/bloodsugar` | Blood sugar history | Yes |
| GET | `/api/history/:identityId/vitalsigns` | Vital signs history | Yes |

### System Health (`/api/health`) - Traffic logged

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Full health check (DB, memory, CPU, uptime) | No |
| GET | `/ready` | Readiness probe (DB connectivity) | No |
| GET | `/live` | Liveness probe | No |
| GET | `/stats` | Aggregate system and data statistics | Yes |

### Health Traffic (`/api/health-traffic`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/stats?period=24h` | API traffic stats (1h, 24h, 7d, 30d) | Yes (admin) |



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
| 18.5 - < 25 | Normal |
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

## Library Fine & Duration Rules

- **Borrow Duration**: Configurable (default: 7 days) -- how long a book can be borrowed
- **Fine Per Day**: Configurable (default: Rp 500/day) -- fine amount per day of overdue
- **Overdue Tolerance**: Configurable (default: 1 day) -- the first N overdue days are free
- Fine calculation: `fine = max(0, overdue_days - tolerance_days) * fine_per_day`
- Fine is calculated automatically when a book is returned late
- Fine is also calculated for books still overdue (live fine) in the borrowing list
- Fines are tracked in the library statistics (total fines, unpaid fines)
- Only admin can update library settings via `PUT /api/library/settings`

## Frontend Pages (Vue SPA)

| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/login` | LoginView | Public | Login with username/email + password |
| `/register` | RegisterView | Public | Registration with patient identity |
| `/verify-2fa` | Verify2FAView | Public | 2FA verification (email or WhatsApp) |
| `/` | DashboardView | Public | Landing page / main hub. Welcome greeting with avatar, feature navigation cards (health, money, estate, chat, library, tools); admin-only "Patient Data" card when authenticated |
| `/profile` | ProfileView | Auth | User profile: view and edit identity info (name, NIK, height, birthplace, birthdate, address, gender), change password with logout redirect |
| `/health` | HealthMonitorView | Auth | Record vitals, BMI, and blood sugar via separate input cards with previous data labels; click metric cards to toggle history sections; admin API traffic dashboard; accepts `?identity=` query param |
| `/money` | MoneyDashboardView | Auth | Expense/saving CRUD, category breakdowns, trend charts |
| `/estate` | EstateView | Auth | Estate CRUD, tree planting, canvas visualization, drone plans |
| `/chat` | ChatView | Auth | Real-time chat rooms, messaging, online users |
| `/library` | LibraryView | Auth | Book catalog, search/filter, borrowing, return, fine, statistics, admin settings |
| `/list` | ListView | Admin Only | Searchable list of all users and their identities with "Health Monitor" navigation link to `/health?identity={id}` |
| `/history/:id` | HistoryView | Auth | Patient BMI, blood sugar, and vital signs history (non-admin sees own patients only; admin sees all) |
| `/tools` | ToolsView | Auth | Navigation hub for games, math, and NER tools with translated category titles |

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

Runs 8 frontend tests covering frontend helper functions.

## License

ISC
