# BMI App - User Guide

Step-by-step guide for using the BMI health monitoring application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Registration](#registration)
3. [Login & 2FA](#login--2fa)
4. [Dashboard](#dashboard)
5. [BMI Check](#bmi-check)
6. [Blood Sugar Check](#blood-sugar-check)
7. [Viewing Patient Data](#viewing-patient-data)
8. [Patient History](#patient-history)
9. [Dashboard Summary](#dashboard-summary)
10. [PDF Export](#pdf-export)
11. [Money Management](#money-management)
12. [Health Risk Assessment](#health-risk-assessment)
13. [Health Trends](#health-trends)
14. [Health Alerts](#health-alerts)
15. [Population Statistics](#population-statistics)
16. [Admin Features](#admin-features)
17. [System Health Monitoring](#system-health-monitoring)
18. [Troubleshooting](#troubleshooting)

---

## Getting Started

1. Ensure Node.js v18+ and PostgreSQL are installed.
2. Install dependencies and configure `.env`:

```bash
npm install
```

3. Start the server:

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

**Page:** `register.html` (Daftar Akun Baru)

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

The progress bar turns red (Lemah) -> orange (Sedang) -> green (Kuat) as you type. Real-time validation shows errors below the field on blur.

---

## Login & 2FA

**Page:** `login.html`

1. Enter your **username or email** and **password**.
2. If the input contains `@`, email format is validated in real-time.
3. Password must be at least 8 characters.
4. Click **"Login"**.
5. You will be redirected to the **2FA verification page**.

### 2FA Verification

**Page:** `verify-2fa.html` (Verifikasi Dua Faktor)

1. **Choose a channel** to receive your verification code:
   - **Email** - a 6-digit code sent to your registered email
   - **WhatsApp** - sent to your registered phone number (only available if you provided a phone number during registration)
2. Click **"Kirim Kode"** to send the code.
3. Enter the **6-digit code** you received.
4. Click **"Verifikasi"**.

> **Note:** The code expires after 5 minutes. If you do not receive it, click "Kirim Kode" again to get a new one.

5. After successful verification, you will be redirected to the **Dashboard**.

---

## Dashboard

**Page:** `` (Cek IMT & Gula Darah)

The dashboard is the main screen after login. It shows:

- **Welcome message** with your name
- **Navigation buttons** at the top:
  - **"Lihat data lain"** - go to the patient data list
  - **"Ringkasan"** - go to the summary page
  - **"Logout"** - sign out
- **Two main actions:**
  - **"Cek IMT (Berat Badan)"** - check BMI
  - **"Cek Gula Darah"** - check blood sugar

---

## BMI Check

**From Dashboard:** Click **"Cek IMT (Berat Badan)"**

1. **Select a patient** from the dropdown ("Pilih Identitas").
   - The patient's info (name, NIK, height) will appear below.
2. Enter the **weight in kg** ("Berat Badan").
3. Click **"HITUNG"** to calculate.
4. The **result screen** shows:
   - Patient name, age, address, height, weight
   - **BMI score** (numeric value)
   - **BMI category** (one of: Sangat kurus / Kurus / Normal / Gemuk / Obesitas)
   - **Blood sugar status** (if available)

### BMI Categories

| BMI Range | Category |
|-----------|----------|
| < 17 | Sangat kurus (Severely underweight) |
| 17 - 18.5 | Kurus (Underweight) |
| 18.5 - 25 | Normal |
| 25 - 27 | Gemuk (Overweight) |
| > 27 | Obesitas (Obese) |

> Each new BMI reading automatically marks previous readings as "past" and saves the new one as "current".

---

## Blood Sugar Check

**From Dashboard:** Click **"Cek Gula Darah"**

1. **Select a patient** from the dropdown.
   - The patient's info (name, age) will appear below.
2. Enter the **blood sugar level in mg/dL** ("Kadar Gula").
3. Click **"HITUNG"** to evaluate.
4. The **result screen** shows:
   - Patient name, age, height
   - **Blood sugar criteria** with a colored badge:
     - **Rendah** (Low) - below 70 mg/dL
     - **Normal** - within the age-appropriate range
     - **Tinggi** (High) - above the threshold
   - **Description** of the result

### Blood Sugar Thresholds

| Age | Normal Range |
|-----|-------------|
| < 50 years | 70 - 100 mg/dL |
| >= 50 years | 70 - 110 mg/dL |

> Each new blood sugar reading automatically marks previous readings as "past".

---

## Viewing Patient Data

**Page:** `list.html` (Data IMT & Gula Darah)

**From Dashboard:** Click **"Lihat data lain"**

This page shows all patients in a table with two tabs:

### BMI Tab (Data IMT)

| Column | Description |
|--------|-------------|
| NIK | National identity number |
| Nama | Patient name |
| Usia | Age |
| Tinggi | Height in cm |
| Berat | Weight in kg |
| Skor IMT | BMI score |
| Status | BMI category |
| Aksi | Actions: "Riwayat" (history) or "PDF" (export) |

### Blood Sugar Tab (Data Gula Darah)

| Column | Description |
|--------|-------------|
| NIK | National identity number |
| Nama | Patient name |
| Usia | Age |
| Kriteria | Blood sugar level (colored badge) |
| Status | current/past |
| Aksi | "Riwayat" button |

**Features:**
- **Search** - type in the search box to filter by name or NIK
- **Tab switching** - click "Data IMT" or "Data Gula Darah" to switch views
- **PDF download** - click the "PDF" button next to a patient to download their report

---

## Patient History

**Page:** `history.html` (Riwayat Pasien)

**From the data list:** Click **"Riwayat"** next to a patient

Shows two history tables for the selected patient:

### BMI History

| Column | Description |
|--------|-------------|
| Tanggal | Date of the record |
| Berat | Weight in kg |
| Usia | Age at time of measurement |
| Hasil | BMI category |
| Status | current or past |

### Blood Sugar History

| Column | Description |
|--------|-------------|
| Tanggal | Date of the record |
| Usia | Age at time of measurement |
| Hasil | Blood sugar category (Rendah/Normal/Tinggi) |
| Kesimpulan | Description |
| Status | current or past |

> Records marked "current" are the latest readings. Older readings are marked "past".

---

## Dashboard Summary

**Page:** `summary.html` (Ringkasan Data)

**From Dashboard:** Click **"Ringkasan"**

Displays four stat cards:

| Card | Description |
|------|-------------|
| Total Pasien | Number of registered patients |
| Total IMT | Number of BMI records |
| IMT Normal | Number of patients with normal BMI |
| Gula Tinggi | Number of patients with high blood sugar |

---

## PDF Export

**From the data list page:** Click the **"PDF"** button next to a patient.

A PDF report will be downloaded containing:
- **Laporan Hasil Pemeriksaan** (Examination Report)
- **Data Pasien** - name, NIK, birthplace, birthdate, address, height
- **Hasil IMT** - BMI score and category
- **Hasil Gula Darah** - blood sugar criteria and description

The file is saved as `pasien-{id}.pdf`.

---

## Money Management

Access money management via the API (`/api/money`).

### Expenses

| Action | How |
|--------|-----|
| Create expense | `POST /api/money/expense` with `{ amount, category, description?, date? }` |
| List expenses | `GET /api/money/expense` |
| Update expense | `PUT /api/money/expense/:id` |
| Delete expense | `DELETE /api/money/expense/:id` |

### Savings

| Action | How |
|--------|-----|
| Create saving | `POST /api/money/saving` with `{ amount, category, description?, date? }` |
| List savings | `GET /api/money/saving` |
| Update saving | `PUT /api/money/saving/:id` |
| Delete saving | `DELETE /api/money/saving/:id` |

### Chart & Summary

| Action | How |
|--------|-----|
| View chart data | `GET /api/money/chart?period=monthly&year=2026` |
| View summary | `GET /api/money/summary` |

**Chart periods:**
- `weekly` - data grouped by week
- `monthly` - data grouped by month (default)
- `yearly` - single row with year totals

**Summary returns:** totalExpense, totalSaving, balance, expenseCount, savingCount.

---

## Health Risk Assessment

Assess a patient's combined health risk from BMI, blood sugar, and age.

**Endpoint:** `GET /api/patient-health/risk/:identityId` (requires login)

**Response:**

```json
{
  "patientId": 1,
  "name": "Budi",
  "age": 55,
  "bmi": { "bmi": "28.50", "status": "Obesitas" },
  "bloodSugar": { "label": "Tinggi", "colorClass": "sugar-high" },
  "risk": {
    "score": 7,
    "level": "tinggi",
    "reasons": ["BMI obesitas", "Gula darah tinggi", "Usia >= 50 tahun"]
  }
}
```

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

**Response:**

```json
{
  "patientId": 1,
  "name": "Budi",
  "trend": {
    "bmi": {
      "direction": "increasing",
      "dataPoints": 5,
      "data": [
        { "date": "2026-01-15", "weight": 70, "bmi": 25.50, "status": "Gemuk" }
      ]
    },
    "bloodSugar": {
      "direction": "worsening",
      "dataPoints": 3,
      "data": [
        { "date": "2026-01-15", "result": "Normal", "age": 55 }
      ]
    }
  }
}
```

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

**Response:**

```json
{
  "count": 2,
  "alerts": [
    {
      "patientId": 3,
      "name": "Siti",
      "level": "tinggi",
      "reasons": ["BMI obesitas", "Gula darah tinggi"]
    }
  ]
}
```

> Only patients with risk level "tinggi" (score >= 5) appear in the alerts list.

---

## Population Statistics

View aggregate health statistics across all patients.

**Endpoint:** `GET /api/patient-health/population` (requires login)

**Response:**

```json
{
  "totalPatients": 50,
  "bmiDistribution": {
    "Sangat kurus": 2,
    "Kurus": 5,
    "Normal": 30,
    "Gemuk": 8,
    "Obesitas": 5
  },
  "sugarDistribution": {
    "Rendah": 3,
    "Normal": 35,
    "Tinggi": 12
  },
  "riskDistribution": {
    "rendah": 25,
    "sedang": 15,
    "tinggi": 10
  }
}
```

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

Returns `{ status: "ready" }` if the database is reachable, or 503 with `{ status: "not ready" }` on failure.

### Liveness Probe

**Endpoint:** `GET /api/health/live`

Always returns `{ status: "alive" }` with HTTP 200.

### System Statistics

**Endpoint:** `GET /api/health/stats`

Returns aggregate counts and system info:

```json
{
  "users": 10,
  "patients": 25,
  "bmiRecords": 80,
  "bloodSugarRecords": 60,
  "uptime": 3600,
  "nodeVersion": "v18.17.0",
  "platform": "win32"
}
```

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
