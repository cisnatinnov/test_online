## Tables

1. **users** (id, username, email, password, phone, role, createdAt, updatedAt)
2. **two_factor_codes** (id, user_id, code, expires_at, used, channel, createdAt, updatedAt)
3. **identity** (id, id_user, nik, name, height, birthplace, birthdate, address, createdAt, updatedAt)
4. **bmi** (id, id_identity, weight, age, result, status [current/past], createdAt, updatedAt)
5. **bloodsugar** (id, id_identity, age, result, conclusion, status [current/past], createdAt, updatedAt)
6. **vital_signs** (id, id_identity, systolic, diastolic, heart_rate, temperature, spo2, respiratory_rate, age, status [current/past], createdAt, updatedAt)
7. **expenses** (id, user_id, amount, category, description, date, createdAt, updatedAt)
8. **savings** (id, user_id, amount, category, description, date, createdAt, updatedAt)
9. **estates** (id, width, length, createdAt, updatedAt)
10. **trees** (id, estate_id, x, y, height, createdAt, updatedAt)
11. **chat_rooms** (id, name, type [direct/group], created_by, createdAt, updatedAt)
12. **chat_messages** (id, room_id, user_id, content, createdAt, updatedAt)
13. **chat_participants** (id, room_id, user_id, role [admin/member], createdAt, updatedAt)
14. **books** (id, title, author, isbn, publisher, year, category, description, quantity, available, shelf, createdAt, updatedAt)
15. **borrowings** (id, user_id, book_id, borrow_date, due_date, return_date, status [borrowed/returned/overdue], notes, fine, createdAt, updatedAt)
16. **library_settings** (id, borrow_duration_days, fine_per_day, overdue_tolerance_days, createdAt, updatedAt)
17. **health_traffic** (id, method, path, status_code, response_time_ms, user_id, ip, user_agent, createdAt, updatedAt)
18. **news** (id, title, content, category [sports/politics/criminal], source, url, image_url, published_at, createdAt, updatedAt)

### Pagination
- All list endpoints support `page` (default 1) and `limit` (default 20) query parameters
- Allowed limit values: 5, 10, 20, 50, 100 (invalid values default to 20)
- Response format: `{ total, page, limit, pages, [items] }`

### Transaction Notes
- **BMI, BloodSugar, VitalSigns**: Status updates use transactions (update past + create current in a single transaction)
- **Library borrow/return**: Operations use transactions (update borrowing + book available count in a single transaction)

## Flow

1. **Register** (username, email, password + optional identity data)
2. **Login** (username/email + password)
3. **2FA Verification** (email or WhatsApp channel)
4. **Dashboard** with user dropdown menu (profile, language, health monitoring, logout) and navigation to Health, Estate, Chat, Library features
5. **Profile** (via `/profile` ProfileView):
   - a. View identity info (name, NIK, height, birthplace, birthdate, address)
   - b. Personal health monitoring: BMI history, blood sugar history, vital signs history
   - c. Color-coded metric cards for latest health data
6. **Health Features** (via `/health` HealthMonitorView):
   - a. Record vitals (BP, heart rate, temperature, SpO2, respiratory rate) + weight for BMI
   - b. BMI calculated automatically using weight (kg) + identity height (cm)
   - c. Color-coded metric cards: green (normal), orange (low/underweight), red (high/overweight)
   - d. History table showing last 10 readings with all vitals + BMI
   - e. System health checks (DB, memory, CPU, uptime)
   - f. API traffic dashboard with request logs, hourly charts, status/method breakdowns
6. **Blood Sugar** - track with age-based thresholds (Rendah/Normal/Tinggi)
7. **Money Management** (via `/money` MoneyDashboardView):
   - a. Expense CRUD with amount, category, description, date
   - b. Saving CRUD with amount, category, description, date
   - c. Category breakdown tables (totals grouped by category)
   - d. Trend chart (weekly/monthly/yearly expense vs saving)
   - e. Financial summary (total expense, saving, balance)
8. **Palm Oil Estate Management** (via `/estate` EstateView):
   - a. Create estates (width x length grid)
   - b. Plant trees at (x, y) coordinates with height 1-30m
   - c. Canvas visualization showing estate grid with tree positions
   - d. Estate statistics: tree count, max/min/median height
   - e. Drone planning: Manhattan distance path with forced landing on battery limit
9. **Real-time Chat** (via `/chat` ChatView):
   - a. Create direct (1:1) or group chat rooms
   - b. Real-time messaging via Socket.IO
   - c. Online user tracking and typing indicators
   - d. Participant management (add/remove from group chats)
10. **Library Management** (via `/library` LibraryView):
    - a. Book catalog with CRUD (title, author, ISBN, publisher, year, category, description, quantity, shelf)
    - b. Search by title, author, ISBN; filter by category with pagination
    - c. Borrowing system with due dates and notes (default due = borrow_duration_days)
    - d. Return books and track borrowing status (borrowed/returned/overdue)
    - e. Configurable fine & duration: admin sets borrow_duration_days, fine_per_day, overdue_tolerance_days
    - f. Overdue tolerance: first N overdue days free (default 1), fine starts after tolerance
    - g. Fine calculation: fine = max(0, overdue_days - tolerance_days) * fine_per_day
    - h. Fine tracking: total fines and unpaid fines in statistics
    - i. Library statistics: total books, available, borrowed, overdue, fines, settings, category breakdown
11. **Patient Health Analytics** (accessible by all authenticated users):
    - a. Health Risk Assessment (composite score from BMI + sugar + vitals + age)
    - b. Health Trend Analysis (BMI and blood sugar direction tracking over time)
    - c. Health Alerts (flag high-risk patients for immediate attention)
    - d. Population Statistics (BMI, sugar, vital signs, risk distribution across all patients)
12. **Patient Data List** (admin-only, all identities with current BMI, blood sugar, and vital signs status, PDF export)
13. **History** (auth required; non-admin users see only their own patients' BMI, blood sugar, and vital signs records; admin sees all)
14. **Summary** (auth required; non-admin users see aggregate stats for their own patients only; admin sees all)
15. **News** (Indonesian news about sports, politics, and criminals; updated daily; keeps past 1-3 days of news; older articles are auto-deleted)
16. **Tools & Games** (accessible from dashboard navigation):
    - a. Games: Hangman, Coin Catcher, Roleplay Adventure, Turtle Racing, Aim Trainer, Rock Paper Scissors
    - b. Math: Shapes Calculator (2D/3D), Equation Grapher, Scientific Calculator, Statistics, Quadratic Function
    - c. NER: Text Summarizer, Sentiment Analysis
16. **System Health Monitoring** (admin-only via FE, DB connectivity, memory usage, CPU usage, uptime, readiness/liveness probes)
17. **API Traffic Tracking** (admin-only, logs all API requests with method, path, status, response time, user)
18. **Indonesian News** (auth required; fetches news from RSS feeds daily; categories: sports, politics, criminal; keeps last 3 days of news; auto-cleanup of old articles; admin can trigger manual refresh)

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
- **Controllers**: Separate controller per feature (auth, bmi, bloodSugar, vitalSigns, identity, money, category, report, health, healthTraffic, patientHealth, estate, chat, library, admin, news)
- **Middlewares**: authenticate (JWT, returns 401 for expired tokens, 403 for invalid), authorize (role-based), apiResponse (standardized response), mailTransporter (nodemailer), rateLimiter (express-rate-limit), healthTraffic (request logging)
- **Models**: User, TwoFactorCode, Identity, BMI, BloodSugar, VitalSigns, Expense, Saving, Category, Estate, Tree, ChatRoom, ChatMessage, ChatParticipant, Book, Borrowing, LibrarySetting, HealthTraffic, News
- **Routes**: Separate route file per feature (auth, bmi, bloodSugar, vitalSigns, identity, money, category, report, admin, health, healthTraffic, patientHealth, estate, chat, library, news)
- **Frontend**: Vue 3 SPA with Vite, Pinia store (auth with JWT expiry check and storage sync), Vue Router (route guard validates token expiry), Axios API client (auto-logout on 401/403)
  - Runs on `:5173` during development (Vite dev server)
  - Vite proxies `/api` requests to `:3000` backend
  - Built output at `client/dist/` served by Express in production
  - Unified sidebar navigation (`Sidebar.vue`) with collapse/expand toggle (persisted in localStorage), icon-only compact mode on desktop
  - Health Monitor page (`/health`) accessible to all authenticated users; API traffic dashboard section remains admin-only
- **Backend**: Express API server on `:3000`, serves built SPA from `client/dist` when available
- **Real-time**: Socket.IO server for chat feature (path: `/socket.io`)
- **Traffic Logging**: All API requests (`/api/*`) are logged to `health_traffic` table via global middleware
- **Database Sync**: Sequelize syncs with `force: false` (safe for production)
- **Security**: Helmet.js for HTTP headers, rate limiting, no hardcoded credential fallbacks, startup env validation
- **i18n**: vue-i18n with 5 locales (en-GB, en-US, id, es, pt), language persisted in localStorage. All views fully internationalized with reactive language switching
- **Category Management**: Spending/saving categories with CRUD operations, duplicate name prevention (unique constraint on name+type)
- **PWA**: vite-plugin-pwa with Workbox, auto-update service worker, offline caching for static assets
- **Separation**: FE and BE can run independently via `npm run dev` (BE) and `npm run dev:fe` (FE), or together via `npm run dev:all`
- **Tests**: Jest + Supertest (62 backend tests), Vitest (6 frontend tests)
  - Estate tests use SQLite in-memory (no PostgreSQL dependency)
  - Other backend tests use mocked/unit-tested functions

## Frontend Vue Pages

### Vue Router Pages (SPA - `client/src/views/`)

| Route | Access | View | Description |
|-------|--------|------|-------------|
| `/login` | Public | LoginView | Login with username/email + password, real-time email format validation |
| `/register` | Public | RegisterView | Registration with patient identity, real-time email & password validation with strength progress bar |
| `/verify-2fa` | Public | Verify2FAView | 2FA verification (email or WhatsApp) |
| `/` | Auth | DashboardView | Main hub with user dropdown menu (profile, language, health, logout) and navigation to Health, Estate, Chat, Library |
| `/profile` | Auth | ProfileView | User profile with identity info and personal health monitoring (BMI, blood sugar, vital signs history) |
| `/health` | Auth | HealthMonitorView | Health monitoring: record vitals + weight, BMI display, color-coded metrics, history table, API traffic dashboard (admin-only traffic section) |
| `/money` | Auth | MoneyDashboardView | Money management: expense/saving CRUD, category breakdowns, trend charts |
| `/estate` | Auth | EstateView | Estate management: create estates, plant trees, canvas visualization, stats, drone plans |
| `/chat` | Auth | ChatView | Real-time chat: rooms, messaging, online users, typing indicators |
| `/library` | Auth | LibraryView | Library management: book catalog, search/filter, borrowing, return, fine display, statistics, admin settings panel |
| `/categories` | Auth | CategoriesView | Category management: spending/saving category CRUD with duplicate prevention |
| `/list` | Admin Only | ListView | Patient data list with tabbed BMI/blood sugar view and search |
| `/history/:id` | Auth | HistoryView | Patient BMI, blood sugar, and vital signs history (non-admin sees own patients only; admin sees all) |
| `/summary` | Auth | SummaryView | Dashboard statistics cards (non-admin sees own patients only; admin sees all) |
| `/tools` | Auth | ToolsView | Navigation hub for games, math tools, and NER tools |

### Static Pages (`client/public/` or `client/dist/`)

#### Games (`games/`)
- `hangman.html` - Word guessing game with 20 tech-themed words and canvas hangman drawing
- `coin-catcher.html` - Catch falling coins, avoid bombs, 30s timer, mouse/keyboard controls
- `roleplay-adventure.html` - Text-based dungeon RPG with combat, gold, weapons, armor, branching story, boss fight
- `turtle-racing.html` - Bet on 6 colored turtles with animated race track
- `aim-trainer.html` - Click shrinking targets, 30s timer, tracks score/hits/misses/accuracy
- `rock-paper-scissors.html` - Classic RPS vs computer with emoji display and scoreboard

#### Math Tools (`math/`)
- `shapes.html` - 2D shapes (circle, rectangle, triangle, square, ellipse, trapezoid, parallelogram) and 3D shapes (cube, sphere, cylinder, cone, rectangular prism, pyramid, torus) with canvas visualization
- `equation-grapher.html` - Plot multiple functions (sin, cos, tan, asin, acos, atan, log, sqrt, x^n) on adjustable coordinate system
- `scientific-calculator.html` - Full calculator with sin/cos/tan/asin/acos/atan/log/ln/sqrt/cbrt/powers
- `statistics.html` - Mean, median, mode, std dev, variance, range, quartiles, IQR, histogram chart
- `quadratic.html` - Graph and solve ax^2+bx+c with vertex, roots, discriminant, step-by-step solution

#### NER Tools (`ner/`)
- `summary.html` - Extractive text summarizer with adjustable ratio (10%/20%/30%), sentence scoring, visual highlighting
- `sentiment.html` - Lexicon-based sentiment analysis with positive/negative/neutral scoring, visual meter, word-level coloring

## Health Monitoring Endpoints

### System Health (`/api/health` - traffic logged)
- `GET /` - Full health check: DB connectivity + latency, memory (RSS, heap), CPU usage, server/process uptime (no auth required)
- `GET /ready` - Readiness probe: verifies database is reachable (no auth required)
- `GET /live` - Liveness probe: confirms process is alive (no auth required)
- `GET /stats` - Aggregate stats: total users, patients, BMI records, blood sugar records, uptime, Node version, platform (auth required)

### Health Traffic (`/api/health-traffic` - admin only)
- `GET /stats?period=24h` - API traffic stats with period filtering (1h, 24h, 7d, 30d): total requests, avg response time, status breakdown, method breakdown, hourly traffic, 50 most recent requests with user info

### News (`/api/news` - auth required)
- `GET /` - List news with pagination and optional category filter (sports, politics, criminal)
- `GET /latest` - Get latest news from the past 3 days
- `GET /stats` - News statistics: total, per category, recent count, retention days
- `GET /:id` - Get single news article by ID
- `POST /refresh` - Manually refresh news from RSS feeds (admin only)

### Vital Signs (`/api/vital-signs` - auth required, data isolation)
- `POST /` - Create vital signs record (BP, heart rate, temp, SpO2, respiratory rate), marks previous as past
- `PUT /:identityId` - Update vital signs record
- `GET /latest/:identityId` - Get latest vital signs with clinical evaluation
- `GET /list` - List all patients with latest vital signs and evaluation
- `GET /history/:identityId` - Vital signs history (ownership verified; admin sees all)

### Patient Health (`/api/patient-health` - auth required)
- `GET /risk/:identityId` - Composite health risk score (0-10) from BMI, blood sugar, vital signs, and age. Levels: rendah (0-2), sedang (3-4), tinggi (5+)
- `GET /trend/:identityId` - BMI, blood sugar, and vital signs trend analysis with direction tracking
- `GET /alerts` - Lists all patients with tinggi (high) risk level
- `GET /population` - Population-wide BMI, blood sugar, vital signs, and risk distribution

## Estate Management Endpoints

### Estate (`/api/estate` - auth required)
- `GET /` - List all estates
- `POST /` - Create estate (width, length must be positive integers)
- `GET /:id/trees` - List all trees in an estate
- `POST /:id/tree` - Plant tree (x, y must be within estate bounds; height 1-30m)
- `GET /:id/stats` - Estate statistics: tree count, max/min/median height
- `GET /:id/drone-plan` - Drone path with Manhattan distance sum
- `GET /:id/drone-plan?max_distance=N` - Drone path with forced landing when battery runs out

### Estate Validation Rules
- `width` and `length`: positive integers (min 1)
- `x`: non-negative integer, must be <= estate width
- `y`: non-negative integer, must be <= estate length
- `height`: integer between 1 and 30
- `max_distance`: positive integer (validated before tree count check)

## Chat Endpoints

### Chat (`/api/chat` - auth required)
- `GET /rooms` - List chat rooms for current user
- `POST /rooms` - Create chat room (name, type: direct/group, participants array)
- `POST /rooms/:id/participants` - Add participant to room
- `DELETE /rooms/:id/participants/:userId` - Remove participant from room
- `GET /rooms/:id/messages` - List messages in a room (paginated: page, limit)
- `GET /online` - List currently online users

### Socket.IO Events (path: `/socket.io`)
- `chat:join` (client -> server) - Join a chat room
- `chat:leave` (client -> server) - Leave a chat room
- `chat:send` (client -> server) - Send message to room (content)
- `chat:typing` (client -> server) - User is typing
- `chat:message` (server -> client) - Receive new message
- `chat:users` (server -> client) - Broadcast typing status
- `user:online` (server -> client) - User came online
- `user:offline` (server -> client) - User went offline

## Library Endpoints

### Library (`/api/library` - auth required)
- `GET /settings` - Get library settings (borrow_duration_days, fine_per_day, overdue_tolerance_days)
- `PUT /settings` - Update library settings (admin only)
- `GET /` - List books (query: search, category, page, limit)
- `POST /` - Create book (title, author required; isbn, publisher, year, category, description, quantity, shelf optional)
- `GET /:id` - Get book detail
- `PUT /:id` - Update book fields
- `DELETE /:id` - Delete book (admin only; fails if book has active borrowings)
- `POST /:id/borrow` - Borrow book (due_date required; user_id for admin; auto-decrements available count)
- `POST /:id/return/:borrowId` - Return borrowed book (auto-increments available count; calculates overdue fine with tolerance)
- `GET /borrowings` - List borrowings (query: status, user_id for admin, page, limit); includes live fine for active overdue
- `GET /categories` - List all distinct book categories
- `GET /stats` - Library statistics (totalBooks, totalAvailable, totalBorrowed, totalTitles, activeBorrowings, overdueBorrowings, totalFines, unpaidFines, finePerDay, borrowDurationDays, overdueToleranceDays, categoryStats)
- `POST /overdue/update` - Mark overdue borrowings and calculate fines

### Library Settings (single-row config table)
- `borrow_duration_days`: INTEGER (default 7) - days a book can be borrowed
- `fine_per_day`: INTEGER (default 500) - fine per overdue day in Rupiah
- `overdue_tolerance_days`: INTEGER (default 1) - days tolerated before fine applies

### Library Validation Rules
- `title` and `author`: required, non-empty strings
- `quantity`: non-negative integer
- `isbn`: unique if provided
- `due_date`: required, must be after today
- `status`: one of borrowed, returned, overdue

### Library Fine Rules
- **Borrow Duration**: configurable (default: 7 days)
- **Fine Per Day**: configurable (default: Rp 500/day)
- **Overdue Tolerance**: configurable (default: 1 day) - first N overdue days are free
- Fine = `max(0, overdue_days - tolerance_days) * fine_per_day`
- Fine is calculated when a book is returned
- Overdue days = `ceil((return_date - due_date) / 86400000)` in milliseconds
- Live fine is calculated for borrowings still overdue (not yet returned)
- Fines are included in borrowing list response and library statistics

### Drone Path Algorithm
1. Sort trees by Y coordinate, then X coordinate
2. Start at origin (0, 0)
3. Visit each tree in sorted order
4. Calculate Manhattan distance for each segment: |x1-x2| + |y1-y2|
5. Sum all segment distances
6. If `max_distance` provided:
   - If >= sum_distance: report last tree as landing point
   - If < sum_distance: calculate exact forced landing point along the current segment

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

### BMI Categories
- Sangat kurus: < 17
- Kurus: 17 - 18.5
- Normal: 18.5 - 25
- Gemuk: 25 - 27
- Obesitas: > 27

### Blood Sugar Thresholds
- Age < 50: Normal is 70-100 mg/dL
- Age >= 50: Normal is 70-110 mg/dL
