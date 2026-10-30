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

The current configured engine is a **rule-based heuristic fall**
