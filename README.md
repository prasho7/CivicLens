# 🏙️ CivicLens

### From Citizen Reports to Actionable Civic Intelligence

**CivicLens is a civic issue reporting and management platform that connects citizen submissions with municipal incident management.** It helps transform individual reports into structured information that can be prioritized, investigated, assigned, and tracked through resolution.

Instead of treating complaints as isolated messages, CivicLens brings reporting, analysis, geographic insights, and municipal workflows into one system.

**Capture → Understand → Reveal → Act**

---

## 🎯 The Problem

Citizens report potholes, waterlogging, overflowing waste, damaged roads, and other civic issues. However, collecting complaints is only one part of the problem.

* Similar complaints can remain scattered across multiple submissions.
* Urgent issues need to be distinguished from routine maintenance.
* Recurring problems can be difficult to identify geographically.
* Citizens need visibility into what happens after submitting a report.
* Municipal teams need a structured workflow for managing incidents.

## 💡 The Solution

CivicLens provides a connected workflow for citizens and municipal teams.

### 1. 📥 Capture | Citizen Reporting

* Submit a civic issue with a description, category, and location.
* Support image-based evidence where available.
* Generate a reference ID for tracking.
* Store submissions in a persistent database.
* Keep newly submitted reports separate from municipal incidents until explicitly linked.

### 2. 🧠 Understand | Intelligent Intake

* Suggest an appropriate civic issue category.
* Generate concise report summaries.
* Assess priority using urgency and impact indicators.
* Extract relevant evidence from the submitted description.
* Identify potential duplicate incidents for human review.

### 3. 🗺️ Reveal | Geographic Intelligence

* Visualize incidents using an interactive map.
* Display issue locations and priority indicators.
* Summarize recurring categories and geographic concentrations.
* Highlight areas that may require greater attention.

### 4. 🛠️ Act | Incident Management

* Assign incidents to responsible departments or teams.
* Update incident status as work progresses.
* Maintain an audit history of officer updates.
* Link citizen reports to relevant municipal incidents.
* Allow citizens to track their report and view linked incident progress.

---

## ✨ What Makes CivicLens Different?

### 🔗 1. Reports Are Not Incidents

A citizen submission is an individual report. An incident represents an underlying civic problem that may have multiple supporting reports.

CivicLens preserves this distinction instead of treating every complaint as a separate municipal incident.

### 🧩 2. Human-Reviewed Duplicate Detection

The system suggests potentially matching incidents using available information, such as descriptions, categories, and location.

Potential matches are suggestions, not automatic merges. Municipal teams retain control over incident linkage.

### 🚦 3. Explainable Priority Assessment

Priority assessments include a reason rather than presenting a label without context.

The goal is to help users understand why an issue may require attention, while distinguishing reported claims from independently verified facts.

### 🌍 4. Geographic Patterns, Not Just Pins

The map is paired with civic intelligence summaries to help reveal recurring categories and geographic concentrations.

This moves the experience beyond a simple complaint map toward a more useful operational overview.

### 🔄 5. Citizen-to-Officer Traceability

A report can move from submission to analysis, review, incident linkage, and status tracking.

Officers can assign incidents and record updates, while citizens can follow their report using its reference ID.

### 🗄️ 6. Persistent, Structured Data

Supabase PostgreSQL stores report records and analysis information. Incident updates and report linkage can be persisted through the backend.

The system is designed around structured records rather than relying entirely on temporary frontend state.

---

## 🧠 AI and Intelligence Approach

CivicLens separates the intelligence layer from the application workflow.

### Current Engine: Rule-Based Intake

The current configured engine is a **rule-based heuristic fallback**, not a live generative AI model.

It evaluates available report information to support:

* Category suggestions.
* Priority assessment.
* Evidence extraction.
* Report summaries.
* Potential duplicate screening.

This approach provides a predictable baseline and allows the application to operate without requiring an external AI API key.

### Optional LLM Integration

The backend includes an optional Gemini integration path controlled by environment configuration.

When correctly configured and tested, an LLM can provide more flexible interpretation of natural-language reports.

**Important:** Real Gemini inference is not the active engine unless a valid API key is configured and the integration is successfully exercised.

### Why This Approach?

* **Graceful degradation:** Core intake can remain available when external AI services are unavailable.
* **Separation of concerns:** Intelligence processing runs through the backend rather than exposing credentials in the browser.
* **Human oversight:** Duplicate suggestions do not automatically merge records.
* **Evidence awareness:** Analysis should remain grounded in submitted information.
* **Incremental extensibility:** Additional models can be integrated without redesigning the entire application.

CivicLens treats automated analysis as decision support, not as a substitute for municipal verification or judgment.

---

## 🏗️ System Architecture

```text
                 CITIZEN / MUNICIPAL OFFICER
                            |
                            v
                 REACT + VITE FRONTEND
                  /         |          \
                 /          |           \
          Report Form    Dashboard    Track Report
                              |
                    Incident Map & Insights
                              |
                              v
                     FASTAPI BACKEND
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
        Report API      Incident API    Analysis Engine
              |               |          /          \
              |               |      Rules       Optional
              |               |      Engine      Gemini
              |               |                   (if
              |               |               configured)
              +---------------+---------------+
                              |
                              v
                     SUPABASE POSTGRESQL
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
         Citizen Reports   Incidents     Analysis Data
                              |
                              v
                    Assignment & Audit
                         Information
```

### Technology Stack

| Layer           | Technology                         | Purpose                                             |
| --------------- | ---------------------------------- | --------------------------------------------------- |
| Frontend        | React, Vite, JavaScript            | User interface and application workflows            |
| Backend         | Python, FastAPI                    | APIs, validation, analysis, and incident operations |
| Database        | Supabase PostgreSQL                | Persistent reports, incidents, and related data     |
| Mapping         | React Leaflet                      | Interactive map components                          |
| Map Data        | OpenStreetMap                      | Geographic map tiles                                |
| Intelligence    | Rule-based engine; optional Gemini | Report analysis and prioritization                  |
| Version Control | Git, GitHub                        | Source code and project collaboration               |

---

## 🔄 Example End-to-End Workflow

Imagine a citizen reports waterlogging near a busy road.

**Step 1: Submit**

The citizen describes the issue and provides available location details. CivicLens creates a report with a reference ID.

**Step 2: Analyze**

The intake engine suggests a category, produces a summary, assesses priority, and checks for potential matching incidents.

**Step 3: Review**

The report appears in the intake workflow. A municipal officer reviews its details and any suggested matches.

**Step 4: Link and Assign**

If an existing incident is appropriate, the officer links the report to it. Otherwise, the report can remain in the intake queue until the appropriate action is taken. The incident can be assigned to a responsible team.

**Step 5: Track**

The officer updates the incident as work progresses. The citizen can use the report reference ID to view the report's current state and linked incident status, when applicable.

**Result:** A structured, traceable workflow connecting citizen input to municipal action.

---

## 🚀 Getting Started

### Prerequisites

Install the following:

* Node.js and npm
* Python 3.12 or a compatible Python version
* A Supabase project
* Git

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd civiclens
```

Replace the repository placeholder with your actual GitHub repository URL.

### 2. Set Up the Frontend

From the project root:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, commonly `http://localhost:5173`.

### 3. Set Up the Backend

Open a separate terminal from the project root.

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows:**

```powershell
.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use the equivalent activation command for your terminal.

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload --port 8000
```

This command assumes the application entry point is `backend/app/main.py`. If your actual entry point differs, use the corresponding module path.

Open `http://127.0.0.1:8000/docs` to inspect the API when the backend is running.

### 4. Configure Supabase

1. Create a Supabase project.
2. Open the project's SQL Editor.
3. Inspect and apply the SQL setup in `backend/schema.sql`, following the project's existing migration requirements.
4. Configure the database connection settings expected by the backend.
5. Start the backend and verify database connectivity.

Use the environment variable names expected by the actual backend implementation. Do not commit credentials to GitHub.

### 5. Optional Gemini Configuration

To enable the optional Gemini integration, obtain an API key and configure it in the backend environment if supported by the current implementation.

For example, if the backend expects this variable:

```env
GEMINI_API_KEY=your_api_key_here
```

Keep the key in the backend environment, never in frontend source code. Restart the backend after changing environment variables and verify that requests actually use Gemini.

### 6. Run the Application

Run the frontend and backend in separate terminals.

Verify that:

* The frontend can reach the backend.
* The backend can reach Supabase.
* Citizen reports can be submitted and retrieved.
* Officer changes persist after refreshing.
* Report tracking displays the correct linkage and status.
* The map and intelligence summaries use the available data.

---

## 🔐 Security and Data Integrity

* Keep database credentials and API keys out of frontend code.
* Configure CORS for the intended frontend origin.
* Apply appropriate database access policies and least-privilege permissions.
* Validate incoming API requests.
* Do not expose privileged database credentials to the browser.
* Preserve the distinction between citizen reports and municipal incidents.
* Do not represent automated priority assessments as official verification.
* Do not automatically merge potential duplicate reports.

Deployment requires reviewing Supabase Row Level Security policies, backend authorization, and production environment configuration. A working local demo does not by itself establish production readiness.

---

## 🧪 Testing and Automated Verification

CivicLens includes a complete automated test suite spanning the FastAPI backend and React frontend. External database operations and network AI calls are cleanly mocked during test runs so automated evaluations execute rapidly, deterministically, and without modifying live Supabase data.

### 1. Frontend Test Suite (Vitest + React Testing Library)

Covers citizen report form validation, submission success/error states, and tracking views:

```bash
# Run all frontend tests
npm test

# Run frontend tests in interactive watch mode
npm run test:watch
```

**Key Frontend Scenarios Tested:**
* Form input validation (required category, description, and location).
* Enforced minimum 10-character description constraints.
* Submission success handling and Reference ID (`SUB-XXXXXX`) presentation.
* API error banner and graceful error recovery.
* Citizen tracking page state rendering:
  - Not found screen for non-existent reference IDs.
  - Pending incident linkage badge for intake queue submissions.
  - Linked operational incident details, assigned response department, and latest field updates.
  - Enforced legal disclaimer: *"Citizen-reported; not independently verified."*

### 2. Backend Test Suite (Pytest + FastAPI TestClient)

Located in `backend/tests/` and structured for standard automated evaluator discovery:

```powershell
# From project root:
npm run test:backend

# Or directly in the backend directory:
cd backend
.\.venv\Scripts\Activate.ps1
pytest -v
```

**Key Backend Scenarios Tested:**
* `test_health.py`: Health endpoint (`/api/health`) probe under connected and unconfigured database states.
* `test_reports.py`:
  - Citizen report intake (`POST /api/reports`) with schema validation (category enum, min-length, whitespace guards).
  - Report listing (`GET /api/reports`) with status and incident filters.
  - Single report retrieval (`GET /api/reports/{ref_id}`) with 404 handling.
  - Explicit officer report-to-incident linkage (`PATCH /api/reports/{ref_id}/link`) and 404 validation.
* `test_analysis.py`:
  - Priority triage: `Critical` (safety hazards near schools/hospitals/collapses), `High` (transit/vehicle hazards), `Low` (cosmetic/faded paint).
  - Issue category suggestion heuristics based on keyword vocabulary.
  - Evidence phrase extraction from complaints.
  - Duplicate candidate detection against existing incidents without auto-merging.
  - Draft analysis endpoint (`POST /api/reports/analyze-draft`).
* `test_incidents.py`:
  - Incident retrieval (`GET /api/incidents`, `GET /api/incidents/{incident_id}`) and 404 handling.
  - Officer operational updates (`PATCH /api/incidents/{incident_id}`) with status progression, department assignment, and audit log history appending.

### 3. Run All Test Suites

```bash
npm run test:all
```

### 4. Code Quality & Build Checks

```bash
# Static analysis and linting (0 errors, 0 warnings)
npm run lint

# Production bundle check
npm run build
```

---

## 🔮 Future Scope

* Configurable real-time AI analysis and model evaluation.
* More robust duplicate detection across descriptions, locations, and time.
* Role-based authentication for citizens and municipal officers.
* Image analysis for relevant civic evidence.
* Notifications when incident statuses change.
* Response-time and resolution analytics.
* Department-level performance insights.
* Multilingual reporting for broader accessibility.
* Production deployment, monitoring, and security hardening.

---

## 🌟 Vision

CivicLens aims to make civic issue management more transparent, structured, and actionable.

The long-term vision is not simply to collect more complaints. It is to help communities and municipal teams understand recurring problems, prioritize attention, coordinate responses, and make progress visible.

**Better reporting. Clearer priorities. More accountable action.**

---

### Built for CivicTech | AI-Assisted Decision Support | Full-Stack Development
