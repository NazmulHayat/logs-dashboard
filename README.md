# Logs Dashboard

## Screenshots

<details>
  <summary>Click to view screenshots of the website</summary>
  <br>
  <img width="1630" alt="Logs page" src="https://github.com/user-attachments/assets/e83b6257-0665-4d2e-88f8-963858a53f9e" />
  <br>
  <img width="1630" alt="Dashboard overview" src="https://github.com/user-attachments/assets/429edd1d-f1a7-4200-8ee0-f5e1cc0c58b8" />
  <br>
  <img width="1611" alt="Severity distribution and trend chart" src="https://github.com/user-attachments/assets/3a78f4cc-51b4-41ec-8ba7-4f2191d93f8a" />
</details>

## Project Overview

Logs Dashboard is a full-stack log dashboard system to ingest, filter, and visualize logs.

It is built for local development and testing, with a simple architecture:
- capture/store structured log records (`timestamp`, `severity`, `source`, `message`)
- query logs with practical filters
- visualize trends and severity distribution for fast operational insight

Key features:
- Adding single logs or importing CSV files
- filtering and searching by date range, severity, and source
- trend chart for log count over time 
- severity distribution chart (histogram-style)
- Export filtered log data as a CSV file

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic, SQLAlchemy
- Database: PostgreSQL
- Tooling: Docker, Docker Compose, Uvicorn, Pytest, HTTPX

## Project structure

- **`frontend/`** — Next.js app (pages, React components, client-side filters, charts, CSV import UI, etc). 
- **`backend/`** — FastAPI application: routers, Pydantic schemas, SQLAlchemy models, `app/service/` (log and analytics logic), pytest suite.
- **`docker-compose.yml`** — Runs the frontend, API, and PostgreSQL together for local development.

## Run Locally

No deployment is required. The project is designed to run locally via Docker Compose.

Prerequisites:
- Docker
- Docker Compose

Steps:
1. From project root:
   ```bash
   docker compose up --build
   ```
2. Access services:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)
   - Interactive API docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
   - Alternative docs (ReDoc): [http://localhost:8000/redoc](http://localhost:8000/redoc)
   - Health check: [http://localhost:8000/health](http://localhost:8000/health) (`GET /health`)

## Run Tests

Tests are intentionally focused on backend validation and edge cases.

From `backend/`:
```bash
pip install -r requirements.txt
pytest
```

Run only validation tests:
```bash
pytest tests/test_validation.py -vv
```

**NOTE: Dummy data for testing:** The repo includes [`/data/logs_dummy_1000.csv`](/data/logs_dummy_1000.csv) at the project root (~1000 sample rows in the correct CSV shape). With the app running, open **Logs → Import from CSV**, select that file, review the validation summary, and confirm import to fill the dashboard and filters for exploration.

## API Overview

- `GET /api/logs` — list and filter logs (date range, severity, source, sort, pagination)
- `POST /api/logs` — create and store a new log entry
- `POST /api/logs/bulk` — create multiple log entries in one request (used by CSV import)
- `GET /api/logs/{log_id}` — fetch a specific log by its ID
- `PUT /api/logs/{log_id}` — update an existing log entry by ID
- `DELETE /api/logs/{log_id}` — delete a log entry by ID
- `GET /api/logs/analytics/trend` — daily trend points for the selected filters
- `GET /api/logs/analytics/severity-distribution` — severity histogram data for the selected date range and source
- `GET /api/logs/analytics/summary` — summary counters (total logs, error logs, unique sources)

##   Decisions & Implementation Notes

- **Severity is a small, fixed set**: severity is an enum (`DEBUG`, `INFO`, `WARNING`, `ERROR`). Keeping it fixed makes filtering and analytics predictable and avoids messy, free‑text values.
- **Sources stay flexible**: `source` is validated (trimmed, non‑blank) but not an enum. New apps or services can start sending logs without any backend change.
- **How filters work together for dashboard analytics**:
  - **Global filters** (date range and source) apply to everything: the table, trend chart, and severity histogram all respect these.
  - The **trend chart** has an extra “severity” filter that only affects the trend line, so you can zoom in on errors, for example, without changing the rest of the dashboard.
- **Histogram is always “full picture”**: the severity distribution chart intentionally ignores the trend chart’s local severity filter so it always shows the true mix of severities in the selected date/source window.
- **Table is built for scale**: the logs table uses server‑side filtering, sorting, and pagination so performance holds up even when there are many log records.
- **Charts stay readable on small screens**: all time buckets are still rendered, but the x‑axis only shows a subset of labels so dates don’t overlap or become unreadable.

### Logs list: search vs source (and severity)

On the **Logs** page, filters map to `GET /api/logs` query parameters. Behavior on the backend:

- **`search` (message)** — Case-insensitive **substring** search: if your text appears **anywhere** in the log’s `message` (as a contiguous fragment), the row can match. It is not “keyword” or ranked full‑text search; it behaves like SQL `ILIKE '%your text%'`.
- **`source`** — **Exact** match on the stored `source` value (same characters as in the database; casing matters in PostgreSQL).
- **`severity`** — Exact match on one of `DEBUG`, `INFO`, `WARNING`, `ERROR`.

## Validation Approach

Validation is layered to keep both UX and correctness strong:
- Frontend: lightweight UX validation for immediate feedback
- Backend: strict request/query schema validation 
- Database: uses constraints to keep stored data accurate and consistent

Backend validation tests were added for key scenarios.

## Backend Validation Testing Approach

- Focused and minimal by design (no heavy test infrastructure)
- Covers key edge cases:
  - invalid severity
  - invalid date format/range
  - invalid page/page size
  - missing required fields for create
  - invalid body values (bad severity/timestamp/blank strings)

## CSV import

On the **Logs** page, entries can be ingested via **CSV upload** (Import from CSV).

- **Required columns:** `timestamp`, `severity`, `source`, `message` (header row; column names are matched case-insensitively).
- **Invalid rows** are skipped. The UI lists each problem row and reason **before** you confirm.
- **Valid rows** are sent to the API and inserted **after** you confirm.

This gives a straightforward way to load structured log data in bulk.

## Data flow (Dashboard)

- The frontend sends **filter parameters** (date range, source, and—on the trend chart—optional severity) to the backend **analytics** endpoints.
- The backend applies those filters and returns **aggregated data**: summary counts, **daily** trend points, and severity distribution for the histogram—not the full raw log list.
- The frontend turns the daily trend series into **time buckets** (by **day** or **month**, depending on the selected range) for the line chart.
- The chart keeps **every bucket** in the series (line, area, hover), but **thins x-axis labels** so the axis stays readable.

