# VitaSuite - User Guide

Step-by-step guide for using the BMI health monitoring application with Vue 3 frontend.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Registration](#registration)
3. [Login & 2FA](#login--2fa)
4. [Dashboard](#dashboard)
5. [Profile](#profile)
6. [Health Monitor](#health-monitor)
   - [Recording Vitals & BMI](#recording-vitals--bmi)
   - [Viewing Health Metrics](#viewing-health-metrics)
   - [Health History](#health-history)
   - [API Traffic Dashboard](#api-traffic-dashboard)
6. [Blood Sugar Check](#blood-sugar-check)
7. [Money Management](#money-management)
   - [Expenses & Savings](#expenses--savings)
   - [Category Breakdown](#category-breakdown)
   - [Charts & Summary](#charts--summary)
8. [Category Management](#category-management)
9. [Palm Oil Estate Management](#palm-oil-estate-management)
   - [Creating Estates](#creating-estates)
   - [Planting Trees](#planting-trees)
   - [Estate Statistics](#estate-statistics)
   - [Drone Planning](#drone-planning)
9. [Real-time Chat](#real-time-chat)
   - [Chat Rooms](#chat-rooms)
   - [Messaging](#messaging)
   - [Online Users](#online-users)
10. [Library Management](#library-management)
    - [Book Catalog](#book-catalog)
    - [Adding & Editing Books](#adding--editing-books)
    - [Borrowing Books](#borrowing-books)
    - [Returning Books & Fine](#returning-books--fine)
    - [Library Statistics](#library-statistics)
    - [Fine & Duration Settings (Admin)](#fine--duration-settings-admin)
    - [Auto-refresh & Cleanup](#auto-refresh--cleanup)
12. [Health Risk Assessment](#health-risk-assessment)
12. [Health Trends](#health-trends)
13. [Health Alerts](#health-alerts)
14. [Population Statistics](#population-statistics)
15. [PDF Export](#pdf-export)
16. [History & Summary](#history--summary)
17. [Admin Features](#admin-features)
18. [System Health Monitoring](#system-health-monitoring)
19. [Pagination](#pagination)
20. [Money Management PDF Export](#money-management-pdf-export)
21. [Progressive Web App (PWA)](#progressive-web-app-pwa)
22. [Internationalization](#internationalization)
23. [Troubleshooting](#troubleshooting)

---

## Getting Started

1. Ensure Node.js v18+ and PostgreSQL are installed.
2. Install dependencies and configure `.env`:

```bash
npm install
```

3. Start the servers:

```bash
# Backend only
npm run dev      # Backend: http://localhost:3000

# Frontend only (in a separate terminal)
npm run dev:fe   # Frontend: http://localhost:5173

# Or both together
npm run dev:all
```

4. Open `http://localhost:5173` in your browser. You will be redirected to the login page.
5. **Install App** - The app can be installed on Android/iOS as a Progressive Web App (PWA). Look for the "Install App" prompt in your browser.

---

## Registration

**Page:** `/register`

1. Click **"Daftar"** on the login page.
2. **Change language** (optional) - use the language switcher above the form title to select your preferred language.
3. The **username** field is automatically focused on page load.
4. Fill in the **required fields**:
   - **Username** - your login username
   - **Email** - used for 2FA verification
   - **Password** - must meet the rules below
   - **Nama Lengkap** - patient full name
   - **Tanggal Lahir** - birthdate (auto-calculates age)
   - **Tinggi Badan (cm)** - height in centimeters
6. Fill in **optional fields** (if known):
   - **No. WhatsApp** - for WhatsApp 2FA channel (format: +628123456789)
   - **NIK** - national identity number (16 digits)
   - **Tempat Lahir** - place of birth
   - **Alamat** - address
7. Click **"Daftar"** to register. You will be logged in and redirected to the dashboard.

### Password Rules

| Rule | Example |
|------|---------|
| Minimum 8 characters | `MyP@ssw0rd` |
| At least 1 uppercase letter | `A` |
| At least 1 lowercase letter | `a` |
| At least 1 digit | `0` |
| At least 1 symbol | `@`, `#`, `$`, etc. |

The progress bar turns red (Lemah) -> orange (Sedang) -> green (Kuat) as you type.

---

## Login & 2FA

**Page:** `/login`

1. The **username** field is automatically focused on page load.
2. Enter your **username or email** and **password**.
3. If the input contains `@`, email format is validated in real-time.
4. Password must be at least 8 characters.
5. Click **"Login"**.
6. You will be redirected to the **2FA verification page**.

### 2FA Verification

**Page:** `/verify-2fa`

1. A 6-digit code is sent to your registered **email**.
2. The **code input** is automatically focused on page load.
3. If email delivery fails, an error message is displayed. Check your email configuration or contact support.
4. Enter the **6-digit code** you received.
5. Click **"Verifikasi"**.

> **Note:** The code expires after 5 minutes. If you do not receive it, click "Kirim Kode" again.

5. After successful verification, you will be redirected to the **Dashboard**.

---

## Dashboard

**Page:** `/`

The dashboard is the landing page (`/`) and the main screen after login. For **unauthenticated users**, it shows a public landing page with app description and login/register buttons.

For **authenticated users**, it shows:

- **Sidebar navigation** to all features (Home, Profile, Health, Money, Estate, Chat, Library, Categories, Tools, Language, Logout)
- **Welcome greeting** with the user's avatar/initial displayed prominently
- **Feature navigation cards** that link directly to each feature page:
  - Health Monitor, Money Management, Estate Management, Chat, Library, Tools
- **Patient Data card** (admin only) - links to the Patient Data List page (`/list`) for browsing all users and their identities
- Each card has an icon, title, and brief description; click to navigate to the corresponding page

---

## Profile

**Page:** `/profile`

View and edit your identity information and change your password.

1. **Identity Cards** — each field (name, NIK, height, birthplace, birthdate, address, gender) is shown in its own card. Click the **Edit** button on any card to open an inline form with Save/Cancel. Live validation rules:
   - **Name**: required
   - **NIK**: must be 1-20 digits only
   - **Height**: must be 1-300 cm
   - **Birthdate**: must not be in the future, must be a valid date
   - Save is blocked while any field has an error
2. **Change Password** section:
   - **Current Password** — required, must not be empty
   - **New Password** — required, must meet full password rules (min 8 chars, uppercase, lowercase, digit, symbol). A rules checklist and strength bar (red→orange→green) update as you type.
   - **Confirm New Password** — required, must match the new password; also checked against current password to prevent reuse
   - All three fields validate on input and on blur; save is blocked while any error is visible
   - After successful change, you are logged out and redirected to `/login` (all sessions invalidated)

---

## Health Monitor

**Page:** `/health`

The Health Monitor is the primary health recording interface. It combines vital signs recording with BMI tracking in a single view, plus system health checks and API traffic monitoring (admin only).

Non-admin users see only their own patients' data. Admin users can see all patients.

### Recording Vitals & BMI

**Sidebar cards** on the left side. Each input type has its own card with a submit button and shows the most recent recorded value with a color-coded label:

- **BMI Card**: Enter weight (kg) and click "Save BMI". Shows last recorded BMI value with status label.
- **Blood Sugar Card**: Enter blood sugar (mg/dL) and click "Save Blood Sugar". Shows last recorded value with status label.
- **Vital Signs Card**: Enter BP, heart rate, temperature, SpO2, and respiratory rate in a grid, then click "Save Vital Signs". Shows last recorded vitals with colored status dots.

**Patient selection**: Admin users see a patient dropdown to select which patient to record data for. Non-admin users have their patient auto-selected (no dropdown shown). Non-admin users do not need to provide `identity_id` — it is automatically resolved from their own identity record.

### Viewing Health Metrics

**Main content area** on the right:

- **Patient Chip**: Shows the selected patient's name, age, and gender above the metric cards
- **Metric Cards**: Color-coded cards for each recorded vital sign:
  - **Green** = Normal
  - **Orange** = Low / Underweight
  - **Red** = High / Overweight / Risk
- **BMI Card**: Shows calculated BMI value, unit (kg/m2), and status
  - Normal: Green
  - Underweight (Kurus / Sangat kurus): Orange
  - Overweight (Gemuk / Obesitas): Red
- **Blood Sugar Card**: Shows the latest value with colored conclusion label (Rendah/Normal/Tinggi); the conclusion is translated to the selected language
- **Overall Status Badge**: "All Normal" (green) or "Abnormal Detected" (red)

### Health History

History sections are **hidden by default**. Click on the corresponding **metric card** (BMI, Blood Sugar, or Vital Signs) to toggle its history table open/closed. A chevron icon on the card hints at the expandable behavior.

Each history table shows the last 10 readings:

**BMI History**: Shows date, weight (kg), BMI value, and category status (color-coded). The category label is translated to the selected language.

**Blood Sugar History**: Shows date, blood sugar (mg/dL), conclusion (color-coded), and description sub-line. The conclusion and description are translated to the selected language.

**Vital Signs History**: Shows date, BP with status flag, heart rate (HR), temperature (Temp), SpO2, and respiratory rate (Resp) with abbreviation labels and color-coded status badges (Low/Normal/High) on each data cell. A **Status** badge column distinguishes current (highlighted row) from past readings. Every row is evaluated server-side using the patient's age and gender, so badges reflect age/gender-appropriate thresholds (e.g., pediatric PALS for BP, wider female HR band, elderly RR band).

### API Traffic Dashboard

Admin users can view API traffic statistics for the health monitoring system:

- **Period Selector**: Filter by 1h, 24h, 7d, or 30d
- **KPI Cards**: Total requests, average response time, 200 OK count, error count
- **Method Breakdown**: Number of GET, POST, PUT, DELETE requests
- **Hourly Traffic Chart**: Bar chart showing request volume per hour
- **Recent Requests Table**: Last 50 requests with method, path, status, response time, user, and timestamp

---

## Blood Sugar Check

Blood sugar can also be recorded and tracked. The evaluation uses age-based thresholds (sex-independent; thresholds are identical for male and female patients):

| Age | Normal Range |
|-----|-------------|
| < 50 years | 70 - 100 mg/dL |
| >= 50 years | 70 - 110 mg/dL |

Results:
- **Rendah** (Low) - below 70 mg/dL
- **Normal** - within the age-appropriate range
- **Tinggi** (High) - above the threshold

The conclusion and description labels follow the selected UI language (translated client-side from canonical Indonesian strings).

---

## Money Management

**Page:** `/money`

Track your personal finances with expense and saving management.

### Expenses & Savings

**Add forms** at the top of the page:

#### Adding an Expense
1. Enter the **amount** (e.g., 50000)
2. Select a **category** from the dropdown (categories are managed in Category Management)
3. Optionally add a **description**
4. Click **"Add Expense"**

#### Adding a Saving
1. Enter the **amount**
2. Select a **category** from the dropdown (categories are managed in Category Management)
3. Optionally add a **description**
4. Click **"Add Saving"**

**Delete** any record by clicking the delete button next to it.

### Category Breakdown

Two tables below the forms show totals grouped by category:

#### Expense Breakdown

| Column | Description |
|--------|-------------|
| Category | Expense category name |
| Total | Total amount spent in that category |
| Count | Number of transactions |

#### Saving Breakdown

| Column | Description |
|--------|-------------|
| Category | Saving category name |
| Total | Total amount saved in that category |
| Count | Number of transactions |

### Charts & Summary

- **Trend Chart**: Visual chart showing expense vs saving over time (weekly/monthly/yearly)
- **Financial Summary**: Total expense, total saving, and current balance

---

## Category Management

**Page:** `/categories`

Manage spending and saving categories used in the Money Management page.

### Features

- **Two tabs**: Spending Categories and Saving Categories
- **Add Category**: Click "+ Add Category", type a name, press Enter or click Save
- **Edit Category**: Click the edit icon next to a category to rename it
- **Delete Category**: Click the delete icon and confirm to remove a category
- **Duplicate Prevention**: Creating a category with an existing name in the same type shows an error

> **Note:** Categories created here appear as dropdown options in the Money Management add forms.

---

## Palm Oil Estate Management

**Page:** `/estate`

Manage palm oil plantation estates with interactive canvas visualization. All estate operations require authentication. All estate operations require authentication.

### Creating Estates

1. Enter **width** (number of columns) - must be a positive integer
2. Enter **length** (number of rows) - must be a positive integer
3. Click **"Create Estate"**

The estate appears in the **Estate List** below. Each estate shows its dimensions and can be selected for tree planting.

### Planting Trees

1. **Select an estate** from the list
2. Enter the **X coordinate** (0 to width)
3. Enter the **Y coordinate** (0 to length)
4. Enter the **height** (1-30 meters)
5. Click **"Plant Tree"**

Trees appear on the **canvas visualization** as colored dots at their coordinates. The canvas shows:
- The estate grid with labeled axes
- Tree positions with size proportional to height
- Color coding based on tree height

### Estate Statistics

When an estate is selected, stats are shown:

| Stat | Description |
|------|-------------|
| Tree Count | Total number of trees in the estate |
| Max Height | Tallest tree (meters) |
| Min Height | Shortest tree (meters) |
| Median Height | Median tree height (meters) |

### Drone Planning

The drone plan calculates an optimal flyover path through all trees:

- **Path**: Trees sorted by Y coordinate, then X (to minimize total Manhattan distance)
- **Manhattan Distance**: |x1-x2| + |y1-y2| for each segment
- **Sum Distance**: Total distance the drone must travel

**With max_distance parameter** (`?max_distance=N`):
- If battery >= sum_distance: drone reaches the last tree
- If battery < sum_distance: drone makes a forced landing at the calculated point along the current segment

---

## Real-time Chat

**Page:** `/chat`

Communicate with other users in real-time through chat rooms.

### Chat Rooms

- **Direct Chat**: 1:1 conversation with another user
- **Group Chat**: Multi-user conversation with a custom name
- To create a new room, click the **"+ New Room"** button and select participants

### Messaging

- Messages appear instantly via Socket.IO
- **Typing indicators** show when other users are composing a message
- Messages include the sender's username and timestamp

### Online Users

- The sidebar shows a list of currently online users
- Online status updates in real-time as users connect/disconnect

---

## Library Management

**Page:** `/library`

Manage a book catalog with borrowing, returns, and overdue fine tracking. Admin can configure borrow duration, fine rate, and tolerance days.

### Book Catalog

The **Buku** tab shows all books in a card grid layout with:

- **Title** and **author** prominently displayed
- **Category** badge (e.g., Fiksi, Sains, Teknologi)
- **ISBN**, **publisher**, and **year** metadata
- **Shelf** location
- **Availability** badge: green (available) or red (all copies borrowed)
- **Action buttons**: Pinjam (Borrow), Edit, Hapus (Delete, admin only)

**Search & Filter:**
1. Type in the **search bar** to search by title, author, or ISBN
2. Select a **category** from the dropdown filter
3. Click **"Cari"** or press Enter to search
4. Results are paginated (20 per page)

### Adding & Editing Books

1. Click **"+ Tambah Buku"** to add a new book
2. Fill in the **required fields**:
   - **Judul** (Title) - book title
   - **Penulis** (Author) - author name
3. Fill in **optional fields**:
   - **ISBN** - unique identifier (e.g., 978-602-xxx-xxx)
   - **Penerbit** (Publisher) - publisher name
   - **Tahun** (Year) - publication year
   - **Kategori** (Category) - e.g., Fiksi, Sains, Teknologi
   - **Jumlah** (Quantity) - number of copies
   - **Rak** (Shelf) - shelf location (e.g., A1, B2)
   - **Deskripsi** (Description) - book description
4. Click **"Tambah"** to save

To **edit**, click the **"Edit"** button on any book card and modify the fields.

### Borrowing Books

1. Click **"Pinjam"** on a book card (only available if copies are available)
2. A modal appears showing the book title and author
3. **Set the due date** (default: borrow_duration_days from settings, typically 7 days)
4. Optionally add **notes**
5. Click **"Pinjam"** to confirm

The book's available count decreases by 1.

### Returning Books & Fine

1. Go to the **Peminjaman** (Borrowings) tab
2. Find the borrowing record and click **"Kembalikan"** (Return)
3. Confirm the return

**Overdue Fine Calculation:**
- **Borrow Duration**: configurable by admin (default: 7 days)
- **Fine Per Day**: configurable by admin (default: Rp 500/day)
- **Overdue Tolerance**: configurable by admin (default: 1 day) - first N overdue days are free
- Fine formula: `fine = max(0, overdue_days - tolerance_days) * fine_per_day`

**Fine examples** (default settings: 1 day tolerance, Rp 500/day):

| Due Date | Return Date | Overdue Days | Tolerance | Billable Days | Fine |
|----------|-------------|-------------|-----------|--------------|------|
| Jul 15 | Jul 15 | 0 | 1 | 0 | Rp 0 |
| Jul 15 | Jul 16 | 1 | 1 | 0 | Rp 0 (within tolerance) |
| Jul 15 | Jul 17 | 2 | 1 | 1 | Rp 500 |
| Jul 15 | Jul 25 | 10 | 1 | 9 | Rp 4.500 |

For borrowings that are still overdue (not yet returned), a **live fine** is calculated and displayed in real-time.

### Library Statistics

The **Statistik** tab shows:

| Stat | Description |
|------|-------------|
| Judul Buku | Total number of unique book titles |
| Total Eksemplar | Total copies across all books |
| Tersedia | Copies currently available |
| Dipinjam | Copies currently borrowed |
| Peminjaman Aktif | Active borrowing records |
| Terlambat | Overdue borrowing records |
| Total Denda | Total fines collected (Rp) |
| Denda/Hari | Fine rate per day (Rp, configurable) |
| Durasi Pinjam | Borrow duration in days (configurable) |
| Toleransi | Overdue tolerance in days (configurable) |

Below the stats, a **category breakdown** chart shows the number of books per category as horizontal bars.

### Fine & Duration Settings (Admin)

The **Pengaturan** tab (visible to admin only) allows configuring library rules:

| Setting | Description | Default |
|---------|-------------|---------|
| Durasi Peminjaman (hari) | How many days a book can be borrowed | 7 days |
| Denda Per Hari (Rp) | Fine amount per overdue day after tolerance | Rp 500 |
| Hari Toleransi | Number of overdue days with no fine | 1 day |

A **preview table** shows example fine calculations based on the current settings.

**Rules:**
- Only admin can access and modify these settings
- Changes take effect immediately for new borrowings and live fine calculations
- Settings are stored in the `library_settings` database table

---

## Health Risk Assessment

Assess a patient's combined health risk from BMI, blood sugar, vital signs, and age.

**Endpoint:** `GET /api/patient-health/risk/:identityId` (requires login)

### Risk Scoring

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

| Score | Risk Level |
|-------|------------|
| 0 - 2 | rendah (low) |
| 3 - 4 | sedang (medium) |
| 5+ | tinggi (high) |

---

## Health Trends

Track how a patient's BMI and blood sugar change over time.

**Endpoint:** `GET /api/patient-health/trend/:identityId` (requires login)

**Trend directions:**

| Metric | Directions |
|--------|-----------|
| BMI | `increasing` / `decreasing` / `stable` |
| Blood Sugar | `worsening` / `improving` / `stable` |

> A change of more than 1 BMI point or a category shift counts as a direction change.

---

## Health Alerts

Get a list of all patients flagged as high risk.

**Endpoint:** `GET /api/patient-health/alerts` (requires login)

> Only patients with risk level "tinggi" (score >= 5) appear in the alerts list.

---

## Population Statistics

View aggregate health statistics across all patients.

**Endpoint:** `GET /api/patient-health/population` (requires login)

Returns BMI distribution, blood sugar distribution, and risk distribution across all patients.

---

## PDF Export

From the patient data list page, click the **"PDF"** button next to a patient.

A PDF report will be downloaded containing:
- **Laporan Hasil Pemeriksaan** (Examination Report)
- **Data Pasien** - name, NIK, birthplace, birthdate, address, height
- **Hasil IMT** - BMI score and category
- **Hasil Gula Darah** - blood sugar criteria and description

---

## History

**Page:** `/history/:id` (requires login)

Non-admin users can only view their own patients' data. Admin can view all patients.

- View historical BMI, blood sugar, and vital signs records for a specific patient
- Age is computed from the patient's identity birthdate at query time
- **Ownership verified**: non-admin users can only access history for identities they own; admin can access all
- BMI result labels and blood sugar conclusion/description labels are translated to the selected UI language (stored as Indonesian, translated client-side)
- Blood sugar history includes a description sub-line explaining the conclusion (e.g., "Gula Darah Anda Rendah")

---

## Admin Features

Admin users can access all data regardless of ownership.

**Endpoints:**

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/users` | List all registered users |
| `GET /api/admin/all-data` | List all patient data with BMI and blood sugar |

### Admin Login

An admin account is automatically created on first run using values from `.env`:

```
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@vitasuite.com
ADMIN_PASSWORD=Admin@123
```

> Change these credentials before deploying to production.

### Admin Library Features

- Admin can **delete books** from the library
- Admin can **borrow books on behalf of other users** (specify user_id)
- Admin can **view all borrowings** across all users
- Admin can **mark overdue borrowings** and trigger fine calculation
- Admin can **configure library settings**: borrow duration, fine per day, overdue tolerance days

### Admin Health Monitor Features

- Admin can **view API traffic dashboard** with request logs, hourly charts, and status breakdowns
- Admin can **filter traffic by period** (1h, 24h, 7d, 30d)
- Admin can **create identities for any user** via `POST /api/identities` with `id_user` body param (email notification sent to the assigned user)
- Admin can **view all patients** in the Health Monitor; non-admin users see only their own patients
- Admin can **navigate directly to any patient's health data** using the `?identity=` query parameter on the Health Monitor page

### Admin Patient Data List

**Page:** `/list` (admin only)

The Patient Data List shows a searchable table of all registered users and their associated patient identities:

- **Search** by user ID or identity name to filter results
- Each row shows a user (ID, username, email) and all their identities (name, NIK, height, birthplace, birthdate, address, gender)
- Click **"Health Monitor"** button on any identity row to navigate directly to that patient's health data at `/health?identity={id}`

---

## System Health Monitoring

These endpoints are used by the Health Monitor page (admin only) and are useful for monitoring tools, load balancers, and DevOps.

### Full Health Check

**Endpoint:** `GET /api/health`

Returns:
- **status**: "healthy" or "degraded"
- **database**: connection status and latency
- **memory**: RSS, heap used, heap total, external
- **cpu**: user and system time
- **uptime**: server and process uptime in seconds

Returns HTTP **200** when healthy, **503** when degraded.

### Readiness Probe

**Endpoint:** `GET /api/health/ready`

Returns `{ status: "ready" }` if the database is reachable, or 503 on failure.

### Liveness Probe

**Endpoint:** `GET /api/health/live`

Always returns `{ status: "alive" }` with HTTP 200.

### System Statistics

**Endpoint:** `GET /api/health/stats` (requires login)

Returns aggregate counts: total users, patients, BMI records, blood sugar records, uptime, Node version, platform.

### API Traffic Stats (Admin Only)

**Endpoint:** `GET /api/health-traffic/stats?period=24h` (requires login, admin only)

Returns:
- **totalRequests**: total number of logged requests in the period
- **avgResponseTime**: average response time in milliseconds
- **statusBreakdown**: count of requests per HTTP status code
- **methodBreakdown**: count of requests per HTTP method
- **hourlyTraffic**: request count and average response time per hour
- **recentRequests**: last 50 requests with method, path, status, response time, user, IP, and timestamp

**Period options:** `1h`, `24h` (default), `7d`, `30d`

---

## Pagination

All list endpoints support pagination with consistent query parameters.

### Query Parameters

| Parameter | Default | Allowed Values | Description |
|-----------|---------|----------------|-------------|
| `page` | 1 | Any positive integer | Page number |
| `limit` | 20 | 5, 10, 20, 50, 100 | Items per page |

### Response Format

```json
{
  "success": true,
  "data": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8,
    "items": [...]
  }
}
```

### Examples

```
GET /api/money/expense?page=1&limit=50
GET /api/bmi/list?page=2&limit=10
GET /api/identities?page=1&limit=5
```

---

## Money Management PDF Export

Export money management reports as PDF files with daily, weekly, or monthly periods.

**Endpoint:** `GET /api/money/export/pdf` (requires login)

### Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `period` | monthly | `daily`, `weekly`, or `monthly` |
| `date` | today | Specific date (YYYY-MM-DD) for daily/weekly |
| `year` | current year | Year for monthly report |
| `month` | current month | Month (1-12) for monthly report |

### Examples

```
GET /api/money/export/pdf?period=daily&date=2026-07-27
GET /api/money/export/pdf?period=weekly&date=2026-07-27
GET /api/money/export/pdf?period=monthly&year=2026&month=7
```

### PDF Contents

- **Title**: "Laporan Keuangan" with period label
- **Summary**: Total expense, total saving, balance
- **Expense Table**: Date, category, description, amount for each expense
- **Saving Table**: Date, category, description, amount for each saving
- **Totals**: Subtotal for expenses and savings

---

## Progressive Web App (PWA)

The application is a Progressive Web App and can be installed on mobile and desktop devices.

### Installing on Android
1. Open the app in Chrome
2. Tap the "Add to Home Screen" banner or go to menu > "Install app"
3. The app will be installed on your device

### Installing on iOS (iPhone/iPad)
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm

### Offline Support
- The app caches static assets for offline use
- API requests require an internet connection
- The service worker runs in the background to cache resources

---

## Internationalization

The app supports 5 languages:

| Code | Language |
|------|----------|
| en-GB | English (UK) |
| en-US | English (US) |
| id | Bahasa Indonesia |
| es | Espanol |
| pt | Portugues |

### Changing Language
1. The **language switcher** is available on every page (dashboard, login, register, health monitor, etc.)
2. Click a language code button to switch languages
3. The language changes immediately
4. Your preference is saved in localStorage and persists across sessions
5. Default language is English (UK) (en-GB)

### Health Label Translation
Health evaluation labels — BMI status categories (Sangat kurus / Kurus / Normal / Gemuk / Obesitas), blood sugar conclusions (Rendah / Normal / Tinggi), and blood sugar descriptions (e.g., "Gula Darah Anda Rendah") — are stored as canonical Indonesian strings in the database and translated client-side to the selected language. Switching the UI language instantly translates all displayed health labels across the Health Monitor and History pages. If a label value is unrecognized, the raw database string is shown as a fallback.

---

## Session Management

- **Token Expiry**: Access tokens expire after **24 hours**. When expired, you will be automatically redirected to the login page
- **Cross-Tab Sync**: Logging out in one browser tab automatically logs you out in all other tabs
- **Browser History Clear**: Clearing browser history/localStorage will log you out on the next page interaction
- **Automatic Redirect**: Any API call with an expired or invalid token triggers automatic logout and redirect to `/login`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Terjadi kesalahan" on login | Check that the server is running (`npm run dev`) and database is accessible |
| 2FA code not received | Check email spam folder; ensure SMTP credentials are correct in `.env`; try WhatsApp channel if phone number is registered. If email delivery fails, an error is shown (2FA codes are never displayed in the browser) |
| "Token tidak valid" error | Your token is invalid. Log in again |
| "Token kedaluwarsa" error | Your session expired after 24 hours. You will be automatically redirected to the login page |
| "Username atau email sudah terdaftar" | Choose a different username or email |
| Password progress bar stays red | Ensure password has 8+ characters, 1 uppercase letter, and 1 symbol |
| Cannot see patient data | Ensure you are logged in; non-admin users only see their own patients' data (data isolation enforced) |
| Database connection error | Verify PostgreSQL is running and `.env` DB credentials are correct |
| Rate limit exceeded (429) | Wait 15 minutes before trying again; auth limit is 20 requests per 15 min, API limit is 100 |
| Canvas not showing trees | Ensure you've selected an estate and planted at least one tree |
| Drone plan returns sum_distance 0 | The estate has no trees planted yet |
| Chat messages not appearing | Ensure Socket.IO connection is established; check that you've joined a room |
| Library book shows 0 available | All copies are currently borrowed; wait for returns or add more copies |
| Fine seems incorrect | Check the tolerance days setting (default: 1 day); first overdue day is free; fine starts from day 2 |
| Cannot see patient in Health page | Non-admin users can only see their own patient data; admin can see all patients |
| Settings tab not visible | Only admin users see the Pengaturan tab in Library Management |
| App not installing as PWA | Ensure you're using a supported browser (Chrome/Edge on Android, Safari on iOS). The app must be served over HTTPS in production. |
| Language not changing | Clear localStorage and refresh the page. |
