# CivicLens Backend & Supabase Database Integration

FastAPI backend with Supabase PostgreSQL integration for the CivicLens platform.

---

## 1. Prerequisites
* Python 3.10+ (Python 3.12 recommended)
* A Supabase project (from [supabase.com](https://supabase.com))

---

## 2. Setup Instructions

### Step 1: Create and Activate Virtual Environment
```powershell
cd backend
& "C:\Users\Karthik\AppData\Local\Programs\Python\Python312\python.exe" -m venv .venv
.venv\Scripts\Activate.ps1
```

*(On macOS/Linux: `python3 -m venv .venv && source .venv/bin/activate`)*

### Step 2: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
copy .env.example .env
```
Open `backend/.env` and supply your actual Supabase credentials:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-role-key
```
> **Security Notice**: Never commit `backend/.env` to Git. It is excluded in `.gitignore`. Do not expose service role keys in client-side code.

### Step 4: Apply Database Schema in Supabase
1. Open your Supabase Project Dashboard at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab on the left menu.
3. Paste and run the complete contents of [`backend/schema.sql`](./schema.sql).
4. This creates:
   - `incidents` table (clustered operational issues)
   - `reports` table (individual citizen submissions)
   - Proper foreign keys, indexes, and Row-Level Security (RLS) policies
   - Baseline seed data (6 incidents & 10 linked reports)

### Step 5: Start the API Server
```powershell
uvicorn app.main:app --reload --port 8000
```

---

## 3. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and database connection probe |
| `POST` | `/api/reports` | Submit a citizen report (runs intelligence analysis, generates `SUB-XXXXXX`, saves to DB) |
| `POST` | `/api/reports/analyze-draft` | Pre-screen draft complaint (returns category, summary, priority, duplicates) |
| `POST` | `/api/reports/{ref_id}/analyze` | Trigger or refresh intelligence analysis on an existing report |
| `GET` | `/api/reports` | List reports from database (supports `status` and `incident_id` filters) |
| `GET` | `/api/reports/{ref_id}` | Retrieve single report by reference ID (returns 404 if not found) |
| `GET` | `/api/incidents` | List incident clusters |
| `GET` | `/api/incidents/{id}` | Retrieve incident cluster details |
| `GET` | `/api/incidents/{id}/reports` | List individual citizen reports linked to an incident |
| `GET` | `/docs` | Interactive Swagger OpenAPI documentation |

---

## 4. Distinction Between Incidents and Reports

* **Incidents** (`incidents` table): Clustered operational civic issues triaged by municipal teams (e.g. `CIV-8402` Dangerous pothole near school crossing). Holds priority, assignment, and status.
* **Reports** (`reports` table): Individual citizen submissions (e.g. `SUB-D82A4F`, `REP-101`). When a citizen submits a report through `/report`, it starts with `incident_id = NULL` (unlinked intake queue) until municipal officer review.
