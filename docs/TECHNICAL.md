# Exist AI Recruiter — Technical Documentation

> **Audience**: Developers, DevOps, technical leads
> **Last updated**: February 2026

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Setup Guide](#2-setup-guide)
3. [API Documentation](#3-api-documentation)
4. [Codebase Structure](#4-codebase-structure)
5. [Development Standards](#5-development-standards)
6. [Deployment](#6-deployment)
7. [Dependencies & External Services](#7-dependencies--external-services)

---

## 1. System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT SIDE                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  React SPA (Vite + TypeScript)                                     │    │
│  │                                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │  Pages   │  │Components│  │  Hooks   │  │ React Query Cache │   │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │    │
│  │       │              │             │                  │             │    │
│  │       └──────────────┴─────────────┴──────────────────┘             │    │
│  │                            │                                        │    │
│  │                    AppContext (shared state)                         │    │
│  └─────────────────────────────┬───────────────────────────────────────┘    │
│                                │                                            │
│            ┌───────────────────┼───────────────────────┐                    │
│            │ REST API calls    │ Direct HTTPS           │ localStorage      │
│            │ (via VITE_API_URL)│ (VITE_N8N_CHAT_        │ (chat sessions)   │
│            │                   │  WEBHOOK_URL)          │                    │
└────────────┼───────────────────┼───────────────────────┼────────────────────┘
             │                   │                       │
             ▼                   ▼                       │
┌────────────────────┐  ┌──────────────────┐             │
│  Express API       │  │  n8n Workflows   │             │
│  (Node.js :3001)   │  │  (External)      │             │
│                     │  │                  │             │
│  ├─ CRUD endpoints  │  │  ├─ Chatbot (4)  │◀────────────┘
│  ├─ Webhook proxy   │──│  ├─ CV Parse (3) │
│  ├─ File upload     │  │  ├─ JO Embed (1) │
│  ├─ Email proxy     │  │  └─ Email        │
│  └─ Analytics       │  │                  │
│         │           │  │  Uses:           │
│         │           │  │  - Azure OpenAI  │
│         │           │  │  - Google Gemini │
│         │           │  │  - Azure Search  │
│         │           │  │  - Google Drive  │
└─────────┼───────────┘  └──────────────────┘
          │
          ▼
┌────────────────────┐
│  PostgreSQL 16     │
│  (Azure / Docker)  │
│                    │
│  14 tables         │
│  7 enums           │
│  26 indexes        │
│  7 triggers        │
└────────────────────┘
```

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | React | 18.3 |
| **Language** | TypeScript | 5.6 |
| **Build Tool** | Vite (with SWC) | 5.4 |
| **CSS** | Tailwind CSS | 3.4 |
| **UI Components** | Radix UI + shadcn/ui | Latest |
| **State Management** | TanStack React Query | 5.83 |
| **Routing** | React Router DOM | 6.30 |
| **Charts** | Recharts | 2.15 |
| **Drag & Drop** | @dnd-kit | 6.3 |
| **Animations** | Framer Motion | 12.6 |
| **Backend Runtime** | Node.js | 20+ LTS |
| **Backend Framework** | Express | 5.1 |
| **Database Driver** | node-postgres (pg) | 8.16 |
| **Database** | PostgreSQL | 16 |
| **AI/ML Orchestration** | n8n | Self-hosted |
| **AI Models** | Azure OpenAI (GPT-4.1), Google Gemini Embeddings | — |
| **Vector Store** | Azure AI Search | — |
| **File Storage** | Google Drive | — |
| **Testing** | Vitest + jsdom + Testing Library | 2.1 |

### Data Flow

#### CV Upload → Candidate Creation

```
Browser                    Express API                 n8n Workflow 3              AI Services
  │                           │                            │                          │
  │  POST /webhook-proxy      │                            │                          │
  │  (multipart: files +      │                            │                          │
  │   metadata JSON)          │                            │                          │
  │──────────────────────────▶│                            │                          │
  │                           │  Forward multipart to      │                          │
  │                           │  N8N_CV_WEBHOOK_URL        │                          │
  │                           │───────────────────────────▶│                          │
  │                           │                            │                          │
  │  200 OK {batchId,         │                            │  1. Upload to GDrive     │
  │   processingCount}        │                            │  2. Extract text (PDF)   │
  │◀──────────────────────────│                            │  3. AI parse resume ────▶│
  │                           │                            │     (Azure OpenAI)       │
  │                           │                            │  4. Generate embeddings ─▶│
  │                           │                            │     (Google Gemini)      │
  │                           │                            │  5. Upsert to Azure AI   │
  │                           │                            │     Search               │
  │                           │  POST /webhook-callback    │                          │
  │                           │  {candidate data}          │                          │
  │                           │◀───────────────────────────│                          │
  │                           │                            │                          │
  │                           │  Insert into PostgreSQL:   │                          │
  │                           │  - candidates              │                          │
  │                           │  - candidate_education     │                          │
  │                           │  - candidate_certifications│                          │
  │                           │  - candidate_work_experience│                         │
  │                           │  - candidate_job_applications│                        │
  │                           │  - candidate_timeline      │                          │
  │                           │  - activity_log            │                          │
  │                           │                            │                          │
  │  Polling:                 │                            │                          │
  │  GET /candidates/         │                            │                          │
  │  processing-status        │                            │                          │
  │──────────────────────────▶│                            │                          │
  │  {allDone: true}          │                            │                          │
  │◀──────────────────────────│                            │                          │
  │                           │                            │                          │
  │  Show refresh notification│                            │                          │
```

#### Job Order → Embedding Sync

```
Browser                    Express API              n8n Workflow 1
  │                           │                         │
  │  POST /job-orders         │                         │
  │  {title, description,...} │                         │
  │──────────────────────────▶│                         │
  │                           │  INSERT into job_orders │
  │                           │                         │
  │                           │  POST N8N_JO_WEBHOOK   │
  │                           │  {id, title, desc,      │
  │                           │   action: "create"}     │
  │                           │────────────────────────▶│
  │                           │                         │ Generate embeddings
  │                           │                         │ Upsert to Azure AI Search
  │ 200 OK                    │                         │
  │◀──────────────────────────│                         │
```

#### AI Chatbot (streaming)

```
Browser                                   n8n Workflow 4
  │                                            │
  │  POST VITE_N8N_CHAT_WEBHOOK_URL            │
  │  {chatInput, sessionId}                    │
  │  (direct HTTPS — no Express proxy)         │
  │───────────────────────────────────────────▶│
  │                                            │ AI Agent:
  │                                            │ 1. Check Azure AI Search
  │                                            │    (applicants + JOs)
  │                                            │ 2. Generate response
  │                                            │    (Azure OpenAI GPT-4.1)
  │  NDJSON streaming response                 │
  │  (line-by-line chunks)                     │
  │◀───────────────────────────────────────────│
  │                                            │
  │  Render markdown in UI                     │
```

### Database Schema

#### Entity Relationship Diagram

```
departments ─────────────┐
                         │ 1:N
                         ▼
cv_uploaders        job_orders ◀────────────────────────────────┐
                    │    │                                       │
                    │    │ 1:N                                   │
                    │    ▼                                       │
                    │  candidate_job_applications ───────┐       │
                    │    │   │   │   │                   │       │
                    │    │   │   │   │ 1:1 each          │       │
                    │    │   │   │   ▼                   │       │
                    │    │   │   │ hr_interviews         │       │
candidates ─────────┘    │   │   │                       │       │
  │ 1:N                  │   │   ▼                       │       │
  ├─ candidate_education │   │ tech_interviews           │       │
  ├─ candidate_certifications│                           │       │
  ├─ candidate_work_experience                           │       │
  ├─ application_history │   ▼                           │       │
  │                      │ offers                        │       │
  │                      │                               │       │
  │                      ▼                               │       │
  │                    candidate_timeline                 │       │
  │                                                      │       │
  └────────────────────▶ pooled_candidates ──────────────┘───────┘
                                                     (original + new JO refs)

activity_log (standalone — references entity_type + entity_id)
```

#### Tables

| Table | Records | Purpose |
|-------|---------|---------|
| `departments` | Lookup | Department master list |
| `cv_uploaders` | Lookup | Track who uploaded CVs |
| `candidates` | Core | Candidate profiles with AI-extracted data |
| `job_orders` | Core | Job requisitions / open positions |
| `candidate_job_applications` | Junction | Links candidates to JOs with pipeline status |
| `candidate_timeline` | Audit | Pipeline stage change history |
| `candidate_education` | Detail | Education records per candidate |
| `candidate_certifications` | Detail | Certifications per candidate |
| `candidate_work_experience` | Detail | Work history per candidate |
| `hr_interviews` | Detail | HR interview data (1:1 with application) |
| `tech_interviews` | Detail | Tech interview data (1:1 with application) |
| `offers` | Detail | Offer data (1:1 with application) |
| `pooled_candidates` | Feature | Talent pool tracking |
| `application_history` | Audit | Cross-JO application history |
| `activity_log` | Audit | Full audit trail of all actions |

#### Enums

```sql
applicant_type_enum:    'internal', 'external'
employment_type_enum:   'full_time', 'part_time', 'contract'
interview_verdict_enum: 'pass', 'fail', 'conditional', 'pending'
job_level_enum:         'L1', 'L2', 'L3', 'L4', 'L5'
job_status_enum:        'open', 'closed', 'on_hold', 'pooling', 'archived'
offer_status_enum:      'pending', 'accepted', 'rejected', 'withdrawn', 'expired'
pipeline_status_enum:   'hr_interview', 'tech_interview', 'offer', 'hired', 'rejected', 'pooled'
```

---

## 2. Setup Guide

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ LTS | Backend runtime + frontend build |
| npm | 10+ | Package management |
| PostgreSQL | 16+ | Database (or use Docker) |
| Git | 2.x | Version control |

### Local Development Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd Exist-AI-Recruiter

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd server && npm install && cd ..

# 4. Create environment file
cp .env.example .env
# Edit .env with your database credentials and webhook URLs

# 5. Initialize the database (if using a fresh PostgreSQL instance)
psql -h localhost -U your_user -d your_db -f schema.sql

# 6. Start both frontend and backend
npm run dev:all
# Or separately:
# Terminal 1: npm run dev          (Vite frontend on :8080)
# Terminal 2: npm run dev:server   (Express API on :3001)

# 7. For webhook callback testing (optional — needed for CV processing)
npm run dev:tunnel
# This creates a Cloudflare tunnel. Copy the URL and set WEBHOOK_CALLBACK_URL in .env
```

### Environment Variables

See `.env.example` for the full list. Critical variables:

```env
# Database
PGHOST=localhost                    # or db (Docker) / your-server.postgres.database.azure.com
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=your_database
PGPORT=5432

# API
API_PORT=3001

# n8n Webhooks (pre-configured)
N8N_CV_WEBHOOK_URL=https://workflow.exist.com.ph/webhook/vector-db-loader
N8N_JO_WEBHOOK_URL=https://workflow.exist.com.ph/webhook/job-order-webhook-path
N8N_EMAIL_WEBHOOK_URL=https://workflow.exist.com.ph/webhook/81f944ac-1805-4de0-aec6-248bc04c535d
WEBHOOK_CALLBACK_URL=http://localhost:3001/webhook-callback  # must be public for n8n

# Frontend (build-time — baked into JS bundle)
VITE_API_URL=http://localhost:3001
VITE_N8N_CHAT_WEBHOOK_URL=https://workflow.exist.com.ph/webhook/51c69627-4831-44a4-8d91-1824a7d38ebf
```

### Docker Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete Docker instructions.

```bash
cp .env.example .env
# Edit .env
docker compose up -d --build
# App available at http://localhost
```

---

## 3. API Documentation

The Express API server runs on port `3001` (configurable via `API_PORT`).

### Base URL

```
Development: http://localhost:3001
Production:  Proxied through nginx at the same domain (e.g., https://recruiter.yourcompany.com)
```

### Authentication

**None.** The API is completely open — no auth middleware. Access control must be handled at the network/proxy level.

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "database": "connected",
  "server": "exist-ai-recruiter-api",
  "uptime": 3600,
  "timestamp": "2026-02-13T10:00:00.000Z"
}
```

### Job Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/job-orders` | List all job orders (supports `?status=open&department=Engineering`) |
| `GET` | `/job-orders/count` | Get count of job orders by status |
| `GET` | `/job-orders/pooled` | List JOs in pooling status with pooled candidate counts |
| `POST` | `/job-orders` | Create a job order |
| `PUT` | `/job-orders/:id` | Update a job order |
| `PATCH` | `/job-orders/:id/status` | Update JO status (open/closed/on_hold/pooling/archived) |
| `DELETE` | `/job-orders/:id` | Delete a job order and cascade delete related records |

**Create Job Order — Request Body:**
```json
{
  "jo_number": "JO-2026-001",
  "title": "Data Engineer",
  "description": "<p>We're looking for...</p>",
  "department_name": "Engineering",
  "department_id": "uuid",
  "level": "L3",
  "quantity": 2,
  "employment_type": "full_time",
  "requestor_name": "John Doe",
  "required_date": "2026-03-15"
}
```

### Job Titles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/job-titles` | List distinct job titles from existing JOs |

### Candidates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/candidates` | List all candidates (supports `?applicant_type=internal`) |
| `GET` | `/candidates/:id` | Get candidate by ID |
| `GET` | `/candidates/:id/full` | Get candidate with all related data (education, certs, work, applications) |
| `GET` | `/candidates/processing-status` | Get batch processing status (for polling after CV upload) |
| `POST` | `/candidates` | Create a candidate manually |
| `POST` | `/candidates/from-webhook` | Create candidate from n8n webhook callback data |
| `POST` | `/candidates/cleanup` | Clean up incomplete/failed candidate records |
| `PUT` | `/candidates/:id` | Update candidate fields |
| `DELETE` | `/candidates/:id` | Delete candidate and all related records |

### Applications (Candidate-JO Links)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/applications` | List applications (supports `?job_order_id=uuid&candidate_id=uuid`) |
| `POST` | `/applications` | Create a new application (link candidate to JO) |
| `PUT` | `/applications/:id` | Update application (pipeline status, match score, etc.) |
| `POST` | `/applications/:id/pool` | Move application to talent pool |

**Update Application — Key Fields:**
```json
{
  "pipeline_status": "tech_interview",
  "match_score": 85,
  "remarks": "Strong candidate, moving forward"
}
```

### Pooled Candidates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/pooled-candidates` | List pooled candidates (supports `?disposition=available`) |
| `PATCH` | `/pooled-candidates/:id` | Update disposition (available/not_suitable/on_hold/archived) |
| `POST` | `/pooled-candidates/:id/activate` | Re-activate into an active JO |
| `POST` | `/pooled-candidates/bulk-action` | Bulk update disposition for multiple candidates |

**Activate — Request Body:**
```json
{
  "job_order_id": "uuid",
  "pipeline_status": "hr_interview",
  "activated_by": "Jane Smith"
}
```

### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/departments` | List all departments |
| `POST` | `/departments` | Create a department |
| `PUT` | `/departments/:id` | Rename a department |
| `DELETE` | `/departments/:id` | Delete a department |

### CV Uploaders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cv-uploaders` | List all uploaders (for autocomplete) |
| `POST` | `/cv-uploaders` | Register a new uploader name |
| `DELETE` | `/cv-uploaders` | Delete an uploader |

### Interviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/hr-interviews` | List HR interviews (`?application_id=uuid`) |
| `POST` | `/hr-interviews` | Create/update HR interview |
| `GET` | `/tech-interviews` | List tech interviews (`?application_id=uuid`) |
| `POST` | `/tech-interviews` | Create/update tech interview |

### Offers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/offers` | List offers (`?application_id=uuid`) |
| `POST` | `/offers` | Create/update an offer |

### Timeline & Activity

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/timeline` | Get candidate timeline (`?application_id=uuid&candidate_id=uuid`) |
| `GET` | `/activity-log` | Get activity log (supports `?entity_type=job_order&limit=50&offset=0`) |
| `POST` | `/activity-log` | Create an activity log entry |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics` | Get all analytics data (aggregated queries across all tables) |

Returns: KPI counts, funnel data, pipeline distribution, time metrics, department breakdowns, interview stats, offer stats, monthly trends, JO fill rates.

### Webhooks & Proxies

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhook-proxy` | Proxy CV uploads to n8n (multipart, max 10MB per file) |
| `POST` | `/webhook-callback` | Receive processed candidate data from n8n |
| `POST` | `/email-webhook` | Proxy email sends to n8n email webhook |

### Database Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/init` | Initialize database schema (runs schema.sql) |
| `POST` | `/migrate` | Run pending migrations |
| `POST` | `/recreate-db` | Drop and recreate all tables (⚠️ destructive) |

---

## 4. Codebase Structure

```
Exist-AI-Recruiter/
├── docs/                          # Documentation (you are here)
│   ├── README.md
│   ├── NON-TECHNICAL.md
│   ├── TECHNICAL.md
│   └── N8N-WORKFLOWS.md
│
├── server/                        # Backend (Express API)
│   ├── package.json               # Backend dependencies (6 packages)
│   ├── package-lock.json
│   └── index.js                   # Single-file API server (~2056 lines)
│                                  # Contains: routes, DB pool, migrations,
│                                  # webhook proxy, analytics queries
│
├── src/                           # Frontend (React + TypeScript)
│   ├── main.tsx                   # App entry point
│   ├── App.tsx                    # Router + route definitions
│   ├── index.css                  # Global styles + Tailwind imports
│   │
│   ├── pages/                     # Top-level page components
│   │   ├── DashboardPage.tsx      # Main hub: JO list + Kanban/Table views
│   │   ├── CandidatesPage.tsx     # Cross-JO candidate table
│   │   ├── UploadPage.tsx         # CV upload with drag-and-drop
│   │   ├── CreateJOPage.tsx       # Job order creation form
│   │   ├── ChatbotPage.tsx        # AI assistant chat interface
│   │   ├── AnalyticsPage.tsx      # Analytics dashboard (20+ charts)
│   │   ├── ArchivePage.tsx        # Archived job orders
│   │   ├── HistoryPage.tsx        # Activity audit trail
│   │   ├── TalentPoolPage.tsx     # Pooled candidates management
│   │   └── PooledJobOrdersPage.tsx # JOs in pooling status
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Sidebar + main area wrapper
│   │   │   └── Sidebar.tsx        # Icon-only navigation rail
│   │   │
│   │   ├── dashboard/
│   │   │   ├── JobOrderList.tsx    # Left panel JO list (grouped by status)
│   │   │   ├── JobOrderDetail.tsx  # JO detail header
│   │   │   ├── KanbanBoard.tsx     # Kanban pipeline view
│   │   │   ├── KanbanColumn.tsx    # Single Kanban column
│   │   │   ├── KanbanCard.tsx      # Candidate card in Kanban
│   │   │   ├── DashboardTableView.tsx # Table pipeline view
│   │   │   ├── CandidateTimeline.tsx  # Stage transition timeline
│   │   │   ├── CandidateListView.tsx  # Candidate list sub-component
│   │   │   └── DepartmentManager.tsx  # Department CRUD dialog
│   │   │
│   │   ├── candidate/
│   │   │   ├── CandidateProfileView.tsx  # Full candidate profile (6 tabs)
│   │   │   ├── HRInterviewFormTab.tsx    # HR interview form
│   │   │   ├── TechInterviewFormTab.tsx  # Tech interview form
│   │   │   ├── OfferFormTab.tsx          # Offer management form
│   │   │   ├── MatchScoreRing.tsx        # SVG score indicator
│   │   │   └── ApplicationHistoryTab.tsx # Cross-JO application history
│   │   │
│   │   ├── chat/
│   │   │   ├── MessageBubble.tsx   # Chat message with Markdown rendering
│   │   │   └── ChatInput.tsx       # Auto-resize chat input
│   │   │
│   │   ├── modals/
│   │   │   ├── CandidateModal.tsx       # Full-screen candidate overlay
│   │   │   ├── EditJobOrderModal.tsx    # Edit JO dialog
│   │   │   ├── EmailModal.tsx           # Email composer
│   │   │   ├── PoolCandidateModal.tsx   # Pool reason dialog
│   │   │   └── MoveToActiveJOModal.tsx  # Re-activate from pool dialog
│   │   │
│   │   └── ui/                    # shadcn/ui primitives (~40 components)
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── select.tsx
│   │       └── ... (accordion, badge, card, chart, etc.)
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useJobOrders.ts        # JO CRUD + React Query
│   │   ├── useCandidates.ts       # Candidate CRUD + React Query
│   │   ├── useApplications.ts     # Application management
│   │   ├── useInterviews.ts       # HR + Tech interview hooks
│   │   ├── useOffers.ts           # Offer management
│   │   ├── usePooledCandidates.ts # Talent pool operations
│   │   ├── usePooledJobOrders.ts  # Pooled JO queries
│   │   ├── useDepartments.ts      # Department CRUD
│   │   ├── useCVUploaders.ts      # Uploader name autocomplete
│   │   ├── useAnalytics.ts        # Analytics data fetching
│   │   ├── useActivityLog.ts      # Activity log queries
│   │   ├── useTimeline.ts         # Candidate timeline
│   │   ├── useStreamingChat.ts    # AI chatbot with NDJSON streaming
│   │   ├── useRealtimeCandidates.ts # Polling for CV processing status
│   │   ├── useProcessingStatus.ts # Upload batch status tracking
│   │   ├── use-toast.ts           # Toast notifications
│   │   ├── use-mobile.tsx         # Responsive breakpoint detection
│   │   └── use-debounce.ts        # Input debouncing
│   │
│   ├── context/
│   │   └── AppContext.tsx          # React Context (shared state, data mapping)
│   │
│   ├── lib/
│   │   ├── azureDb.ts             # API client (fetch wrapper with base URL)
│   │   ├── chatApi.ts             # Chat API (NDJSON streaming fetch)
│   │   ├── chatStorage.ts         # localStorage session management
│   │   ├── activityLogger.ts      # Activity log helper
│   │   └── utils.ts               # Tailwind cn() utility
│   │
│   ├── types/
│   │   └── chat.types.ts          # TypeScript interfaces for chat
│   │
│   └── test/
│       ├── setup.ts               # Vitest setup
│       └── example.test.ts        # Example test
│
├── migrations/                    # SQL migration files
│   └── add-position-applied.sql
│
├── n8n-workflows/                 # n8n workflow export files
│   ├── Workflow 1: Resource Requirements Embeddings.n8n
│   ├── Workflow 3: CV Upload to Vector DB.n8n
│   └── Workflow 4: Chatbot.n8n
│
├── schema.sql                     # Full database schema
├── seed.sql                       # Sample data for development
│
├── .env.example                   # Environment variable template
├── .dockerignore                  # Docker build exclusions
├── Dockerfile.frontend            # Multi-stage: Vite build → nginx
├── Dockerfile.backend             # Node.js backend image
├── docker-compose.yml             # 3-service orchestration
├── nginx.conf                     # Reverse proxy + SPA config
├── DEPLOYMENT.md                  # Infra team deployment guide
│
├── package.json                   # Frontend dependencies + scripts
├── package-lock.json
├── vite.config.ts                 # Vite configuration (port 8080, path alias)
├── vitest.config.ts               # Test configuration
├── tsconfig.json                  # TypeScript base config
├── tsconfig.app.json              # App-specific TS config
├── tsconfig.node.json             # Node/Vite TS config
├── tailwind.config.ts             # Tailwind configuration
├── postcss.config.js              # PostCSS (Tailwind + autoprefixer)
├── eslint.config.js               # ESLint configuration
├── components.json                # shadcn/ui configuration
└── index.html                     # HTML entry point
```

### Key Modules Explained

#### `server/index.js` — The API Server

A single-file Express 5 server (~2056 lines) structured as:

1. **Lines 1–50**: Imports, env validation, multer config
2. **Lines 50–90**: PostgreSQL connection pool (max 10, SSL enabled)
3. **Lines 90–270**: Health check, DB verify, auto-migration system
4. **Lines 270–560**: Job Orders + Candidates CRUD
5. **Lines 560–960**: Applications, Pooled Candidates, Pipeline operations
6. **Lines 960–1230**: Departments, CV Uploaders, Interviews, Offers, Timeline, Activity Log
7. **Lines 1230–1600**: Webhook proxy (CV upload → n8n), Webhook callback (n8n → DB), Email proxy
8. **Lines 1600–1700**: Database recreation endpoint, Analytics (complex aggregation queries)
9. **Lines 1700–2056**: Server startup, graceful shutdown (SIGTERM/SIGINT)

#### `src/context/AppContext.tsx` — Shared State

Central React Context that:
- Exposes `useAppContext()` hook
- Manages selected JO, candidate, and view state
- Maps database records to legacy display format
- Provides pipeline operations (move candidate, update status)
- Manages department and CV uploader CRUD
- Coordinates with React Query cache invalidation

#### `src/lib/azureDb.ts` — API Client

Simple fetch wrapper that prepends `VITE_API_URL` (or defaults to `http://localhost:3001`). Used by all hooks for API calls.

#### `src/hooks/useStreamingChat.ts` — AI Chat

Implements NDJSON streaming:
1. Sends POST to `VITE_N8N_CHAT_WEBHOOK_URL` with `chatInput` + `sessionId`
2. Reads response as `ReadableStream`
3. Parses line-delimited JSON chunks
4. Accumulates text incrementally for streaming display
5. Includes retry logic, rate limiting, and error handling
6. Persists sessions to `localStorage` via `chatStorage.ts`

---

## 5. Development Standards

### Code Conventions

- **Language**: TypeScript for all frontend code, JavaScript (ES modules) for the backend
- **Formatting**: Standard Prettier defaults (2-space indent, single quotes in TS, double in JSX attributes)
- **Components**: Functional components with hooks only — no class components
- **Naming**: PascalCase for components/types, camelCase for functions/variables, UPPER_SNAKE for constants
- **File naming**: PascalCase for components (`CandidateProfileView.tsx`), camelCase for hooks (`useCandidates.ts`), camelCase for libs (`azureDb.ts`)
- **Imports**: Absolute imports via `@/` path alias (maps to `src/`)

### State Management Pattern

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  React Query │────▶│  AppContext   │────▶│  Components  │
│  (server     │     │  (shared UI  │     │  (local UI   │
│   cache)     │◀────│   state)     │     │   state)     │
└──────────────┘     └──────────────┘     └──────────────┘
     │                                           │
     └──────── API calls via hooks ◀─────────────┘
```

- **Server state**: React Query (`useQuery`, `useMutation`) for all API data
- **Shared UI state**: React Context for selected JO, candidate, view mode
- **Local UI state**: `useState` for form fields, modals, toggles

### Testing

```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode
```

- Framework: **Vitest** with jsdom environment
- Assertions: Vitest built-in + Testing Library
- Config: `vitest.config.ts`
- Setup: `src/test/setup.ts`

### Git Workflow

- **Main branch**: `main` — always deployable
- **Feature branches**: `feature/your-feature-name`
- **Commit messages**: Descriptive, present tense (e.g., "Add talent pool bulk actions")
- **PR process**: Create PR → review → merge to main

---

## 6. Deployment

### Architecture

```
                     ┌──── docker-compose.yml ────┐
                     │                             │
  :80/:443 ────▶  frontend (nginx:alpine)         │
                     │  ├─ Serves static SPA       │
                     │  └─ Proxies API requests    │
                     │          │                   │
                     │          ▼                   │
                     │  backend (node:20-alpine)    │
                     │  ├─ Express API :3001        │
                     │  └─ DB connection pool       │
                     │          │                   │
                     │          ▼                   │
                     │  db (postgres:16-alpine)     │
                     │  └─ pgdata volume            │
                     └─────────────────────────────┘
```

### Quick Deploy

```bash
cp .env.example .env   # Edit with production values
docker compose up -d --build
```

### Environment Differences

| Aspect | Development | Production |
|--------|------------|------------|
| Frontend server | Vite dev server (:8080) | nginx (:80) |
| `VITE_API_URL` | `http://localhost:3001` | Empty (nginx proxies) |
| DB host | `localhost` / Azure | `db` (Docker) / Azure |
| DB port exposed | Yes | **No** |
| SSL | No | Required |
| Auth | None needed | **Required** (VPN/OAuth2) |
| `WEBHOOK_CALLBACK_URL` | localhost + tunnel | Public URL |
| Hot reload | Yes (Vite + node --watch) | No (rebuild required) |

### Complete deployment guide: See [DEPLOYMENT.md](../DEPLOYMENT.md)

### Monitoring

- **Health check**: `GET /health` — returns DB connection status
- **Backend logs**: `docker compose logs -f backend`
- **Request logging**: Every request (except `/health`) is logged with method, path, status code, and duration
- **DB pool errors**: Logged to stderr on idle client disconnect

---

## 7. Dependencies & External Services

### External Services

| Service | Provider | Purpose | Required? |
|---------|----------|---------|-----------|
| **PostgreSQL** | Azure / Docker | Primary database | Yes |
| **n8n** | Self-hosted (`workflow.exist.com.ph`) | AI workflow orchestration | Yes (for CV processing + chatbot) |
| **Azure OpenAI** | Azure | GPT-4.1 for CV analysis + chatbot | Yes (via n8n) |
| **Google Gemini** | Google Cloud | Embedding generation (embed-001) | Yes (via n8n) |
| **Azure AI Search** | Azure | Vector store for candidate + JO embeddings | Yes (via n8n) |
| **Google Drive** | Google Workspace | CV file storage | Yes (via n8n) |
| **Cloudflare Tunnel** | Cloudflare | Dev tunneling for webhook callbacks | Dev only |

### Frontend Dependencies (key packages)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI framework |
| `react-router-dom` | ^6.30.0 | Client-side routing |
| `@tanstack/react-query` | ^5.83.1 | Server state management |
| `tailwindcss` | ^3.4.17 | Utility-first CSS |
| `@radix-ui/*` | Various | Accessible UI primitives |
| `recharts` | ^2.15.2 | Chart library |
| `@dnd-kit/*` | Various | Drag-and-drop (Kanban) |
| `framer-motion` | ^12.6.5 | Animations |
| `lucide-react` | ^0.474.0 | Icons |
| `react-markdown` | ^10.1.0 | Markdown rendering (chat) |
| `date-fns` | ^4.1.0 | Date formatting |
| `zod` | ^3.24.2 | Schema validation |
| `react-hook-form` | ^7.55.0 | Form management |

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.1.0 | HTTP framework |
| `pg` | ^8.16.0 | PostgreSQL driver |
| `cors` | ^2.8.5 | Cross-origin support |
| `dotenv` | ^16.4.7 | Environment variable loading |
| `multer` | ^2.0.2 | File upload handling |
| `form-data` | ^4.0.5 | Multipart form construction |

### Known Limitations

| Limitation | Description | Mitigation |
|-----------|-------------|------------|
| No authentication | App is completely open | Place behind VPN/auth proxy |
| No WebSocket | Real-time uses polling (10s interval) | Acceptable for current scale |
| Single backend file | `server/index.js` is 2056 lines | Could split into route modules |
| No rate limiting | API has no request throttling | Add at nginx or Express level |
| `VITE_*` is build-time | Frontend env vars can't change at runtime | Must rebuild frontend image |
| No file persistence | CV uploads are memory-only, forwarded to n8n | Google Drive is the persistent store |
| No pagination | Some list endpoints return all records | Add `LIMIT/OFFSET` for scale |
| No soft delete | Most deletes are hard deletes with CASCADE | Consider adding `deleted_at` columns |
| Chat is browser-local | Chat sessions are in localStorage | Consider server-side session store for persistence |
