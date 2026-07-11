# GrowEasy — AI-Powered CSV Lead Importer

An AI-powered CSV importer that turns **any** CSV export — Facebook Lead Ads, Google Ads, real-estate CRMs, marketing-agency sheets, or a spreadsheet someone made by hand — into clean, standardized GrowEasy CRM lead records. Column mapping is done **semantically by an LLM (Gemini 2.5 Flash)**, not by matching a hardcoded list of header names.

> Built for the GrowEasy Software Developer (Intern / Full-Time) assignment.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Folder Structure](#folder-structure)
4. [Tech Stack](#tech-stack)
5. [Installation](#installation)
6. [Environment Variables](#environment-variables)
7. [Running Locally](#running-locally)
8. [Docker](#docker)
9. [API Documentation](#api-documentation)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Design Decisions & Trade-offs](#design-decisions--trade-offs)
13. [Future Improvements](#future-improvements)

---

## Architecture

```
                 ┌──────────────────────┐
                 │   Next.js Frontend   │
                 │  (Upload → Preview → │
                 │  Confirm → Progress →│
                 │      Results)        │
                 │                      │
                 │  ┌────────────────┐  │
                 │  │    Sidebar     │  │  Scanned results history
                 │  │  (How to Use,  │  │  (persisted in MongoDB)
                 │  │   Why GrowEasy)│  │
                 │  └────────────────┘  │
                 └──────────┬───────────┘
                            │ REST (JSON / multipart)
                            ▼
                 ┌──────────────────────┐
                 │   Express Backend    │
                 │  ┌────────────────┐  │
                 │  │  CSV Parser    │  │  (fast-csv, no fixed headers)
                 │  └───────┬────────┘  │
                 │          ▼           │
                 │  ┌────────────────┐  │
                 │  │  Batcher       │  │  (configurable batch size)
                 │  └───────┬────────┘  │
                 │          ▼           │
                 │  ┌────────────────┐  │
                 │  │  AI Mapper     │──┼──► Gemini 2.5 Flash
                 │  │  (retry + exp  │  │    (semantic column mapping)
                 │  │   backoff)     │  │
                 │  └───────┬────────┘  │
                 │          ▼           │
                 │  ┌────────────────┐  │
                 │  │  Zod Validator │  │  (enum + shape safety net)
                 │  └───────┬────────┘  │
                 │          ▼           │
                 │  In-memory Job Store │  (progress + results)
                 │          │           │
                 │          ▼           │
                 │  ┌────────────────┐  │
                 │  │  MongoDB       │  │  (ScanResult — durable persistence)
                 │  │  (Mongoose)    │  │  for sidebar history & downloads
                 │  └────────────────┘  │
                 └──────────────────────┘
```

**Request flow:**

1. `POST /api/upload` — user drops a CSV. The backend parses it with `fast-csv` (never assuming fixed columns), stores it against a `jobId`, and returns a preview payload.
2. Frontend renders a **local, AI-free** preview (Step 2) so users see their data instantly.
3. `POST /api/process` — kicks off the AI pipeline for that `jobId`. Returns `202 Accepted` immediately; the pipeline runs detached from the request.
4. The backend splits rows into batches (default 50), sends each batch to Gemini with a strict extraction prompt, validates/normalizes the response with Zod, and updates an in-memory progress record after every batch.
5. `GET /api/status/:jobId` — polled by the frontend every ~1.2s for progress (batch #, rows processed, ETA).
6. `GET /api/process/:jobId/result` — once `status === "completed"`, returns imported + skipped records as JSON, or as a downloadable CSV via `?format=csv`. Results are also persisted to **MongoDB** as a `ScanResult` document for durable history.
7. `GET /api/scans` — lists all previous scan results from MongoDB (newest first). Powers the sidebar history panel.
8. `GET /api/scans/:jobId/download` — streams the imported records as a CSV file directly from MongoDB.

## Features

- **Semantic AI column mapping** — no fixed header assumptions. Handles "Customer Name", "Client", "Buyer", "Prospect" all mapping to `name`; "Phone", "Cell", "Mobile Number", "Reach Number" all mapping to `mobile_without_country_code`.
- **4-step guided flow**: Upload → Preview (client-side, no AI) → Confirm → Processing (live progress) → Results.
- Drag-and-drop **and** file-picker upload, with file-type/size validation.
- Responsive table with sticky header, horizontal/vertical scroll, search, and pagination for both the CSV preview and the final results.
- Real-time **progress bar**, current batch indicator, and estimated time remaining while the AI works.
- Results view splits records into **Imported** / **Skipped** tabs, with skip reasons surfaced per row.
- **Download JSON** and **Download CSV** for the final imported records.
- **Batch processing** with configurable batch size (`AI_BATCH_SIZE`).
- **Exponential-backoff retries** per batch (`AI_MAX_RETRIES`, `AI_RETRY_BASE_DELAY_MS`) — a batch that keeps failing degrades to "skipped" rows with a clear reason instead of crashing the whole import.
- Strict business rules enforced both in the AI prompt *and* re-validated in code as a safety net: closed enums for `crm_status`/`data_source`, multi-email/phone consolidation into `crm_note`, and skip logic for rows with neither an email nor a phone number.
- **Sidebar with scanned results history** — completed imports are persisted to MongoDB and listed in the sidebar. Click any result to re-download the CSV. Delete results you no longer need.
- **"How to Use" and "Why GrowEasy"** collapsible guide sections pinned at the bottom of the sidebar for quick reference.
- Light/dark mode with no flash-of-wrong-theme on load.
- Centralized error handling, request validation, and structured JSON logging on the backend.
- Unit tests (Vitest) for CSV parsing, CSV writing, Zod validators, and prompt construction.
- Docker + docker-compose for one-command local spin-up.

## Folder Structure

```
groweasy-csv-importer/
├── backend/
│   ├── src/
│   │   ├── ai/
│   │   │   ├── prompts/crmExtractionPrompt.ts   # System + per-batch prompt
│   │   │   ├── geminiClient.ts                  # Thin Gemini SDK wrapper
│   │   │   └── aiMapper.ts                      # Batch mapping + retry/backoff
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── db.ts                            # MongoDB connection (Mongoose)
│   │   ├── controllers/
│   │   │   ├── uploadController.ts
│   │   │   ├── processController.ts
│   │   │   ├── statusController.ts
│   │   │   └── scanController.ts                # Scan CRUD + CSV download
│   │   ├── middleware/                           # upload (multer), errors, rate limit
│   │   ├── models/
│   │   │   └── scanResult.ts                    # Mongoose schema for ScanResult
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── scanRoutes.ts                    # /api/scans routes
│   │   │   └── ...
│   │   ├── services/                             # csvService, importService, statusService
│   │   ├── types/                                 # csv.ts, crm.ts
│   │   ├── utils/                                 # csvParser, csvWriter, logger, errors
│   │   ├── validators/crmValidator.ts             # Zod schemas + business rules
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/                                     # Vitest unit tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                               # Orchestrates the 4-step flow
│   │   └── globals.css                            # Design tokens (light/dark)
│   ├── components/
│   │   ├── ui/                                    # Button, Card, Badge, Progress, Stepper...
│   │   └── features/
│   │       ├── upload/Dropzone.tsx
│   │       ├── preview/PreviewTable.tsx
│   │       ├── processing/ProcessingView.tsx
│   │       ├── results/ResultsTable.tsx
│   │       └── sidebar/Sidebar.tsx                # History panel + How to Use + Why GrowEasy
│   ├── hooks/useCsvImport.ts                      # Central state machine for the flow
│   ├── services/api.ts                            # Typed fetch wrappers
│   ├── lib/                                       # utils.ts, csvClientParser.ts
│   ├── types/index.ts
│   ├── Dockerfile
│   └── package.json
├── .env                                           # Root env for docker-compose variable interpolation
├── docker-compose.yml
└── README.md
```

## Tech Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | Next.js 14 (App Router), TypeScript, TailwindCSS, TanStack Table, react-dropzone, react-hook-form + Zod, lucide-react |
| Backend   | Node.js, Express, TypeScript |
| CSV       | fast-csv (parsing), custom writer (export) |
| AI        | Google Gemini 2.5 Flash (`@google/generative-ai`) — provider is isolated in `ai/geminiClient.ts` so swapping to OpenAI/Claude only touches one file |
| Database  | MongoDB (Atlas) via Mongoose — stores completed scan results for sidebar history and re-download |
| Validation| Zod (both backend business rules and frontend forms) |
| Testing   | Vitest |
| Package manager | npm (a `pnpm-lock.yaml` will also work — Dockerfiles try pnpm first, falling back to npm) |

## Installation

Requires **Node.js 18+**.

```bash
git clone <your-repo-url> groweasy-csv-importer
cd groweasy-csv-importer

# Backend
cd backend
npm install
cp .env.example .env      # then add your GEMINI_API_KEY and MONGODB_URI

# Frontend
cd ../frontend
npm install
cp .env.local.example .env.local
```

## Environment Variables

### `backend/.env`

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend port | `4000` |
| `NODE_ENV` | `development` \| `production` | `development` |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB Atlas connection string (optional — app runs without it but scan history won't persist) | — |
| `AI_PROVIDER` | `gemini` (extensible) | `gemini` |
| `GEMINI_API_KEY` | **Required.** Get one at [aistudio.google.com](https://aistudio.google.com/apikey) | — |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `AI_BATCH_SIZE` | Rows sent to the AI per call | `50` |
| `AI_MAX_RETRIES` | Retries per batch before it's marked skipped | `3` |
| `AI_RETRY_BASE_DELAY_MS` | Base delay for exponential backoff | `1000` |
| `MAX_FILE_SIZE_MB` | Max upload size | `10` |

### `frontend/.env.local`

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API | `http://localhost:4000/api` |

## Running Locally

```bash
# Terminal 1 — backend
cd backend
npm run dev        # tsx watch, http://localhost:4000

# Terminal 2 — frontend
cd frontend
npm run dev         # http://localhost:3000
```

Open `http://localhost:3000`, drop a CSV, and walk through the flow.

## Docker

```bash
# from the project root
# Copy env vars to a root .env file (docker-compose interpolates from here)
cp backend/.env .env
docker-compose up --build
```

- Frontend → `http://localhost:3000`
- Backend → `http://localhost:4000` (health check at `/health`)

## API Documentation

Base URL: `http://localhost:4000`

### `GET /health`
Liveness check. `{ success: true, data: { status: "ok", timestamp } }`

### `POST /api/upload`
`multipart/form-data`, field name `file`. Parses the CSV (no AI) and registers a job.

```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "fileName": "leads.csv",
    "fileSizeBytes": 2048,
    "headers": ["Customer Name", "Cell", "..."],
    "rowCount": 120,
    "previewRows": [ { "Customer Name": "John Doe", "Cell": "9876543210" } ]
  }
}
```

### `POST /api/process`
Body: `{ "jobId": "uuid" }`. Starts the AI batch pipeline. Returns `202 Accepted` immediately.

### `GET /api/status/:jobId`
Poll for progress.

```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "processing",
    "totalRows": 120,
    "processedRows": 50,
    "totalBatches": 3,
    "currentBatch": 1,
    "importedCount": 47,
    "skippedCount": 3,
    "estimatedRemainingMs": 8400
  }
}
```

`status` is one of `uploaded | processing | completed | failed`.

### `GET /api/process/:jobId/result?format=json|csv`
Available once `status === "completed"`. Defaults to JSON; `?format=csv` streams a downloadable CSV.

```json
{
  "success": true,
  "data": {
    "imported": [ { "created_at": "...", "name": "...", "...": "..." } ],
    "skipped": [ { "row": { "...": "..." }, "rowIndex": 4, "reason": "No email or phone number present in row." } ],
    "stats": { "totalRows": 120, "importedCount": 117, "skippedCount": 3 }
  }
}
```

### `GET /api/scans`
Lists all previous scan results from MongoDB (newest first). Returns summary fields only (`jobId`, `fileName`, `stats`, `createdAt`).

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "jobId": "uuid",
      "fileName": "leads.csv",
      "stats": { "totalRows": 120, "importedCount": 117, "skippedCount": 3 },
      "createdAt": "2026-07-11T04:20:56.430Z"
    }
  ]
}
```

### `GET /api/scans/:jobId`
Returns the full scan document including `imported` and `skipped` arrays.

### `DELETE /api/scans/:jobId`
Deletes a scan result from MongoDB.

### `GET /api/scans/:jobId/download`
Streams the imported records as a downloadable CSV file.

All error responses share a shape:

```json
{ "success": false, "error": { "message": "...", "details": {} } }
```

## Testing

```bash
cd backend
npm test
```

28 unit tests cover:
- `csvParser` — header detection, quoted/escaped values, BOM stripping, empty-file/empty-header rejection, batching.
- `csvWriter` — quoting, comma/newline/quote escaping, single-row-per-record guarantee.
- `crmValidator` — enum fallback-to-blank behavior, contact-info business rule, AI response schema.
- `crmExtractionPrompt` — the system prompt enumerates every allowed `crm_status`/`data_source` value and the strict "never hallucinate / JSON-only" instructions actually ship in the prompt sent to the model.

## Deployment

**Frontend → Vercel**
1. Import the repo, set root directory to `frontend/`.
2. Add env var `NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api`.
3. Deploy.

**Backend → Railway / Render**
1. New service from the repo, root directory `backend/`.
2. Build command: `npm install && npm run build`. Start command: `npm start`.
3. Add env vars from the table above (`GEMINI_API_KEY` is required; set `FRONTEND_ORIGIN` to your deployed Vercel URL). Add `MONGODB_URI` for scan history persistence.

## Design Decisions & Trade-offs

- **Job state is in-memory** (a `Map`) for processing progress, while completed results are persisted to **MongoDB** via Mongoose. This gives fast, lock-free processing state with durable storage for results that the sidebar and download endpoints need to survive restarts. If `MONGODB_URI` is not set, the app still works — scans just won't persist.
- **AI failures degrade gracefully.** If a batch exhausts its retries, those rows are marked `skipped` with the underlying error as the reason rather than failing the whole job — partial success beats total failure for a bulk import tool.
- **Validation is layered.** The prompt instructs the model on the exact contract, but the response is still re-validated with Zod and re-checked against the "has email or phone" business rule in code, so a slightly-off model response can't corrupt the CRM data.
- **Provider isolation.** All Gemini-specific code lives in `ai/geminiClient.ts`; `aiMapper.ts` only knows about "send this prompt, get this text back," so swapping in OpenAI or Claude is a one-file change plus a new prompt call.

## Future Improvements

- True virtualized rendering (`@tanstack/react-virtual`) for CSV previews in the tens-of-thousands-of-rows range.
- Server-Sent Events / WebSocket progress instead of polling.
- Per-column confidence scores surfaced in the UI so low-confidence AI mappings can be reviewed before import.
- Resumable uploads for very large files.

---
