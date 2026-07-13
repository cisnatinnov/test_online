# BMI App - User Guide

Step-by-step guide for using the BMI health monitoring application with Vue 3 frontend.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Registration](#registration)
3. [Login & 2FA](#login--2fa)
4. [Dashboard](#dashboard)
5. [Health Monitor](#health-monitor)
   - [Recording Vitals & BMI](#recording-vitals--bmi)
   - [Viewing Health Metrics](#viewing-health-metrics)
   - [Health History](#health-history)
6. [Blood Sugar Check](#blood-sugar-check)
7. [Money Management](#money-management)
   - [Expenses & Savings](#expenses--savings)
   - [Category Breakdown](#category-breakdown)
   - [Charts & Summary](#charts--summary)
8. [Palm Oil Estate Management](#palm-oil-estate-management)
   - [Creating Estates](#creating-estates)
   - [Planting Trees](#planting-trees)
   - [Estate Statistics](#estate-statistics)
   - [Drone Planning](#drone-planning)
9. [Health Risk Assessment](#health-risk-assessment)
10. [Health Trends](#health-trends)
11. [Health Alerts](#health-alerts)
12. [Population Statistics](#population-statistics)
13. [PDF Export](#pdf-export)
14. [Admin Features](#admin-features)
15. [System Health Monitoring](#system-health-monitoring)
16. [Troubleshooting](#troubleshooting)

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

---

## Registration

**Page:** `/register`

1. Click **"Daftar"** on the login page.
2. Fill in the **required fields**:
   - **Username** - your login username
   - **Email** - used for 2FA verification
   - **Password** - must meet the rules below
   - **Nama Lengkap** - patient full name
   - **Tanggal Lahir** - birthdate (auto-calculates age)
   - **Tinggi Badan (cm)** - height in centimeters
3. Fill in **optional fields** (if known):
   - **No. WhatsApp** - for WhatsApp 2FA channel (format: +628123456789)
   - **NIK** - national identity number (16 digits)
   - **Tempat Lahir** - place of birth
   - **Alamat** - address
4. Click **"Daftar"** to register. You will be logged in and redirected to the dashboard.

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

1. Enter your **username or email** and **password**.
2. If the input contains `@`, email format is validated in real-time.
3. Password must be at least 8 characters.
4. Click **"Login"**.
5. You will be redirected to the **2FA verification page**.

### 2FA Verification

**Page:** `/verify-2fa`

1. **Choose a channel** to receive your verification code:
   - **Email** - a 6-digit code sent to your registered email
   - **WhatsApp** - sent to your registered phone number (only available if you provided a phone number during registration)
2. Click **"Kirim Kode"** to send the code.
3. Enter the **6-digit code** you received.
4. Click **"Verifikasi"**.

> **Note:** The code expires after 5 minutes. If you do not receive it, click "Kirim Kode" again.

5. After successful verification, you will be redirected to the **Dashboard**.

---

## Dashboard

**Page:** `/`

The dashboard is the main screen after login. It shows:

- **Navigation buttons** for quick access:
  - **Health** - go to the Health Monitor page
  - **Money** - go to the Money Management page
  - **Estate** - go to the Estate Management page
- **Welcome message** with your username
- Links to other features (Patient List, Summary, Tools, etc.)

---

## Health Monitor

**Page:** `/health`

The Health Monitor is the primary health recording interface. It combines vital signs recording with BMI tracking in a single view.

### Recording Vitals & BMI

**Sidebar form** on the left side:

1. **Select a Patient** from the dropdown.
2. Enter vital signs:
   - **Systolic (mmHg)** - e.g., 120
   - **Diastolic (mmHg)** - e.g., 80
   - **Heart Rate (bpm)** - e.g., 72
   - **Temperature (C)** - e.g., 36.5
   - **SpO2 (%)** - e.g., 98
   - **Respiratory Rate (/min)** - e.g., 16
3. Enter **Weight (kg)** for BMI calculation - e.g., 65
4. **Height (cm)** is displayed read-only from the patient's identity record
5. Click **"Save Vitals"** to submit

When you save:
- Vital signs are saved via `POST /api/vital-signs`
- If weight is provided, BMI is calculated and saved via `POST /api/bmi`
- Previous readings are marked as "past", new ones as "current"

### Viewing Health Metrics

**Main content area** on the right:

- **Metric Cards**: Color-coded cards for each recorded vital sign:
  - **Green** = Normal
  - **Orange** = Low / Underweight
  - **Red** = High / Overweight / Risk
- **BMI Card**: Shows calculated BMI value, unit (kg/m2), and status
  - Normal: Green
  - Underweight (Kurus / Sangat kurus): Orange
  - Overweight (Gemuk / Obesitas): Red
- **Overall Status Badge**: "All Normal" (green) or "Abnormal Detected" (red)

### Health History

Below the metric cards, a **history table** shows the last 10 vital sign readings with columns:

| Column | Description |
|--------|-------------|
| Date | When the reading was taken |
| BP | Blood pressure (systolic/diastolic) |
| HR | Heart rate |
| Temp | Body temperature |
| SpO2 | Oxygen saturation |
| Resp | Respiratory rate |
| BMI | BMI category result |
| Status | Green dot (all normal) or Red dot (abnormal) |

---

## Blood Sugar Check

Blood sugar can also be recorded and tracked. The evaluation uses age-based thresholds:

| Age | Normal Range |
|-----|-------------|
| < 50 years | 70 - 100 mg/dL |
| >= 50 years | 70 - 110 mg/dL |

Results:
- **Rendah** (Low) - below 70 mg/dL
- **Normal** - within the age-appropriate range
- **Tinggi** (High) - above the threshold

---

## Money Management

**Page:** `/money`

Track your personal finances with expense and saving management.

### Expenses & Savings

**Add forms** at the top of the page:

#### Adding an Expense
1. Enter the **amount** (e.g., 50000)
2. Select a **category** (e.g., Makanan, Transport, Kesehatan, etc.)
3. Optionally add a **description**
4. Click **"Add Expense"**

#### Adding a Saving
1. Enter the **amount**
2. Select a **category** (e.g., Gaji, Bonus, Investasi, etc.)
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

## Palm Oil Estate Management

**Page:** `/estate`

Manage palm oil plantation estates with interactive canvas visualization.

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
ADMIN_EMAIL=admin@bmi-app.com
ADMIN_PASSWORD=Admin@123
```

> Change these credentials before deploying to production.

---

## System Health Monitoring

These endpoints require no authentication and are useful for monitoring tools, load balancers, and DevOps.

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

**Endpoint:** `GET /api/health/stats`

Returns aggregate counts: total users, patients, BMI records, blood sugar records, uptime, Node version, platform.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Terjadi kesalahan" on login | Check that the server is running (`npm run dev`) and database is accessible |
| 2FA code not received | Check email spam folder; ensure SMTP credentials are correct in `.env`; try WhatsApp channel if phone number is registered |
| "Token tidak valid" error | Your session expired. Log in again |
| "Username atau email sudah terdaftar" | Choose a different username or email |
| Password progress bar stays red | Ensure password has 8+ characters, 1 uppercase letter, and 1 symbol |
| Cannot see patient data | Ensure you are logged in; non-admin users only see their own patients |
| Database connection error | Verify PostgreSQL is running and `.env` DB credentials are correct |
| Rate limit exceeded (429) | Wait 15 minutes before trying again; auth limit is 20 requests per 15 min, API limit is 100 |
| Canvas not showing trees | Ensure you've selected an estate and planted at least one tree |
| Drone plan returns sum_distance 0 | The estate has no trees planted yet |
