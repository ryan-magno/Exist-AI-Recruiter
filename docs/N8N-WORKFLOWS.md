# Exist AI Recruiter — n8n Workflow Documentation

> **Audience**: Developers, n8n administrators, AI/ML engineers
> **Last updated**: February 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Workflow 1: Resource Requirements Embeddings](#2-workflow-1-resource-requirements-embeddings)
3. [Workflow 3: CV Upload to Vector DB](#3-workflow-3-cv-upload-to-vector-db)
4. [Workflow 4: Chatbot](#4-workflow-4-chatbot)
5. [External Services & Credentials](#5-external-services--credentials)
6. [Maintenance & Troubleshooting](#6-maintenance--troubleshooting)

---

## 1. Overview

The Exist AI Recruiter app offloads all AI/ML processing to **n8n**, a self-hosted workflow automation platform running at `workflow.exist.com.ph`. The app's Express API calls n8n webhooks; n8n orchestrates AI services and returns results.

### Workflow Map

```
                          ┌──────────────────────────────────────────────────────┐
                          │                    n8n Server                         │
                          │              workflow.exist.com.ph                    │
                          │                                                      │
┌─────────────┐           │  ┌───────────────────────────────────────────────┐   │
│  Express    │  POST     │  │  Workflow 1: Resource Requirements Embeddings │   │
│  API        │──────────▶│  │  /webhook/job-order-webhook-path              │   │
│  (Backend)  │           │  │  Embeds job orders → Azure AI Search          │   │
│             │           │  └───────────────────────────────────────────────┘   │
│             │           │                                                      │
│             │  POST     │  ┌───────────────────────────────────────────────┐   │
│             │──────────▶│  │  Workflow 3: CV Upload to Vector DB           │   │
│             │ multipart │  │  /webhook/vector-db-loader                    │   │
│             │           │  │  Parses CVs → embeds → stores → callbacks     │   │
│             │◀──────────│  │                                               │   │
│             │ callback  │  └───────────────────────────────────────────────┘   │
└─────────────┘           │                                                      │
                          │  ┌───────────────────────────────────────────────┐   │
┌─────────────┐  POST     │  │  Workflow 4: Chatbot                          │   │
│  Browser    │──────────▶│  │  /webhook/51c69627-...                        │   │
│  (Direct)   │  streaming│  │  AI assistant → streaming NDJSON response     │   │
│             │◀──────────│  │                                               │   │
└─────────────┘           │  └───────────────────────────────────────────────┘   │
                          │                                                      │
                          │              External Services Used:                  │
                          │              • Azure OpenAI (GPT-4.1)                │
                          │              • Google Gemini (embeddings)             │
                          │              • Azure AI Search (vector store)         │
                          │              • Google Drive (file storage)            │
                          │              • PostgreSQL (data persistence)          │
                          │              • Gmail (email notifications)            │
                          └──────────────────────────────────────────────────────┘
```

### Webhook Endpoints

| Workflow | Webhook Path | Method | Response Mode | Caller |
|----------|-------------|--------|---------------|--------|
| **1** — JO Embeddings | `/webhook/job-order-webhook-path` | POST | Response Node | Express API |
| **3** — CV Upload | `/webhook/vector-db-loader` | POST | Response Node | Express API (multipart proxy) |
| **4** — Chatbot | `/webhook/51c69627-4831-44a4-8d91-1824a7d38ebf` | POST | Streaming | Browser (direct) |

---

## 2. Workflow 1: Resource Requirements Embeddings

**Purpose**: When a job order is created or updated, this workflow generates a vector embedding of the JO description and upserts it into Azure AI Search so the chatbot can search job requirements.

### Trigger

```
POST https://workflow.exist.com.ph/webhook/job-order-webhook-path
Content-Type: application/json

{
  "id": "uuid",
  "title": "Data Engineer",
  "description": "<p>HTML job description...</p>",
  "action": "create" | "update" | "delete"
}
```

### Flow Diagram

```
Webhook
  │
  ▼
Main Set ─────────────────────────────────────────────────────────────────────
  │  Sets: searchServiceUrl = https://n8nfoundry.search.windows.net
  │        indexName = resource-requirements
  ▼
AI: Generate Embeddings ──────────────────────────────────────────────────────
  │  POST https://generativelanguage.googleapis.com/v1beta/
  │       models/gemini-embedding-001:embedContent
  │  Body: { content: { parts: [{ text: cleanedDescription }] } }
  │  Strips HTML tags, decodes entities, trims whitespace
  ▼
Upsert the vector (If node) ─────────────────────────────────────────────────
  │                                │
  │  action == "create"/"update"   │  action == "delete"
  ▼                                ▼
VecDB: Upsert Job Order       VecDB: Delete Job Order
  │  POST {searchUrl}/indexes/     │  POST {searchUrl}/indexes/
  │  resource-requirements/        │  resource-requirements/
  │  docs/index?api-version=       │  docs/index?api-version=
  │  2024-07-01                    │  2024-07-01
  │  Action: mergeOrUpload         │  Action: delete
  │  Fields: id, title,            │
  │  description, embedding,       │
  │  metadata (JSON string)        │
  ▼                                ▼
Respond to Webhook             Respond to Webhook1
  │  { "status": "Done" }         │  { "status": "Deleted" }
```

### Nodes Detail

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | Webhook | `n8n-nodes-base.webhook` | Receives JO data from Express API |
| 2 | Main Set | `n8n-nodes-base.set` | Stores Azure AI Search URL and index name as variables |
| 3 | AI: Generate Embeddings | `n8n-nodes-base.httpRequest` | Calls Google Gemini to generate embedding vector |
| 4 | Upsert the vector | `n8n-nodes-base.if` | Routes to upsert or delete based on `action` field |
| 5 | VecDB: Upsert Job Order | `n8n-nodes-base.httpRequest` | Upserts document + embedding into Azure AI Search |
| 6 | VecDB: Delete Job Order | `n8n-nodes-base.httpRequest` | Deletes document from Azure AI Search |
| 7 | Respond to Webhook | `n8n-nodes-base.respondToWebhook` | Returns success response |

### Configuration

| Parameter | Value |
|-----------|-------|
| Azure AI Search endpoint | `https://n8nfoundry.search.windows.net` |
| Index name | `resource-requirements` |
| Embedding model | `gemini-embedding-001` |
| Azure Search API version | `2024-07-01` |
| Retry on fail | Yes (max 2 tries, 1s wait) |

### Data Transformation

The JO description is cleaned before embedding:
```javascript
// Strip HTML tags
description.replace(/<[^>]+>/g, ' ')
// Decode HTML entities
  .replace(/&amp;/g, '&')
// Normalize whitespace
  .replace(/\s+/g, ' ').trim()
```

Metadata stored alongside the embedding:
```json
{
  "id": "jo-uuid",
  "title": "Data Engineer",
  "description": "cleaned plain text...",
  "embedding": [0.123, -0.456, ...],
  "metadata": "{\"jo_number\":\"JO-2026-001\",\"department\":\"Engineering\",...}"
}
```

---

## 3. Workflow 3: CV Upload to Vector DB

**Purpose**: The most complex workflow. Receives uploaded CV files, extracts text, uses AI to analyze the resume, generates embeddings, stores everything in the vector DB and PostgreSQL, and sends an email confirmation.

### Trigger

```
POST https://workflow.exist.com.ph/webhook/vector-db-loader
Content-Type: multipart/form-data

Fields:
  - files[]: Binary CV files (PDF/DOCX, max 10MB each)
  - metadata: JSON string with candidate details
  - callbackUrl: URL for n8n to POST results back to
```

### Flow Diagram (High Level)

```
                                    Webhook (multipart)
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ Create GDrive │
                                  │ staging folder│
                                  └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ Split binary  │
                                  │ files + match │
                                  │ metadata      │
                                  └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ Upload files  │
                                  │ to GDrive     │
                                  └──────┬───────┘
                                         │
                                         ▼
                               ┌─────────────────────┐
                               │  Loop: Process Files │◀──────────────────┐
                               └─────────┬───────────┘                    │
                                         │                                │
                                         ▼                                │
                                  ┌──────────────┐                        │
                                  │ Check file   │                        │
                                  │ type (MIME)  │                        │
                                  └──────┬───────┘                        │
                            ┌────────────┴────────────┐                   │
                            ▼                         ▼                   │
                     ┌──────────────┐          ┌──────────────┐           │
                     │ Word: Convert│          │ PDF: Download │           │
                     │ to GDoc then │          │ from GDrive   │           │
                     │ download PDF │          └──────┬───────┘           │
                     └──────┬───────┘                 │                   │
                            │                         │                   │
                            ▼                         ▼                   │
                     ┌──────────────┐          ┌──────────────┐           │
                     │ Extract text │          │ Extract text │           │
                     │ from PDF     │          │ from PDF     │           │
                     └──────┬───────┘          └──────┬───────┘           │
                            └────────────┬────────────┘                   │
                                         ▼                                │
                                  ┌──────────────┐                        │
                                  │ AI: Recruiter│                        │
                                  │ Agent        │ ◀─── retry on error    │
                                  │ (GPT-4.1)   │                        │
                                  └──────┬───────┘                        │
                                         │                                │
                                         ▼                                │
                                  ┌──────────────┐                        │
                                  │ Clean JSON   │                        │
                                  │ output       │                        │
                                  └──────┬───────┘                        │
                                         │                                │
                                         ▼                                │
                              ┌──────────────────────┐                    │
                              │ Archive CV to GDrive  │                   │
                              │ "Applicant CVs" folder│                   │
                              └──────────┬───────────┘                    │
                                         │                                │
                                         ▼                                │
                              ┌──────────────────────┐                    │
                              │ Generate embedding   │                    │
                              │ (Google Gemini)      │                    │
                              └──────────┬───────────┘                    │
                                         │                                │
                                         ▼                                │
                              ┌──────────────────────┐                    │
                              │ Upsert to Azure AI   │                    │
                              │ Search (applicants-  │                    │
                              │ index)               │                    │
                              └──────────┬───────────┘                    │
                                         │                                │
                                         ▼                                │
                              ┌──────────────────────┐                    │
                              │ Upsert to PostgreSQL │                    │
                              │ (candidates + related│                    │
                              │  tables)             │                    │
                              └──────────┬───────────┘                    │
                                         │                                │
                                         ▼                                │
                              ┌──────────────────────┐                    │
                              │ Send email (Gmail)   │                    │
                              └──────────┬───────────┘                    │
                                         │                                │
                                         └────────────────────────────────┘
                                                (next file in batch)

                              After all files processed:
                              ┌──────────────────────┐
                              │ Delete staging folder │
                              └──────────┬───────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │ Respond to Webhook   │
                              │ { status: completed }│
                              └──────────────────────┘
```

### Nodes Detail

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | Webhook | webhook | Receives multipart CV upload + metadata |
| 2 | Create folder | googleDrive | Creates staging folder in GDrive |
| 3 | Code in JavaScript | code | Copies binary data from webhook payload |
| 4 | Helper: Split Binaries | code | Matches files to metadata entries by index |
| 5 | Drive: Upload File | googleDrive | Uploads each file to GDrive staging folder |
| 6 | Loop: Process Files | splitInBatches | Iterates over uploaded files |
| 7 | Logic: Check File Type | switch | Routes by MIME type (Word vs PDF) |
| 8 | Drive: Convert to GDOC | googleDrive | Converts DOCX → Google Doc (for text extraction) |
| 9 | Drive: Download PDF | googleDrive | Downloads PDF from GDrive |
| 10 | Helper: Extract Text | code | Extracts text content from PDF binary |
| 11 | Drive: Delete Temp Doc | googleDrive | Cleans up temporary Google Doc conversion |
| 12 | Data: Set Resume Text | set | Stores extracted plain text for next steps |
| 13 | Recruiter Agent1 | agent | AI agent that analyzes resume (see below) |
| 14 | Clean JSON Output | code | Parses/validates AI agent's JSON response |
| 15 | If error exists | if | Error check — retries agent on failure |
| 16 | Rename CV3 | code | Renames file for archival |
| 17 | Drive: Archive File | googleDrive | Moves to "Applicant CVs" folder |
| 18 | Change Status | googleDrive | Makes archived file accessible |
| 19 | Data: Generate ID | code | Generates deterministic UUID from candidate name |
| 20 | AI: Generate Embeddings | httpRequest | Calls Gemini API for resume embedding |
| 21 | Main Set | set | Sets Azure AI Search URL + index name |
| 22 | VecDB: Upsert Applicant | httpRequest | Upserts candidate embedding to vector DB |
| 23 | Accumulate Results | code | Aggregates all candidate data |
| 24 | Execute SQL query | postgres | Upserts into candidates + related tables |
| 25 | Send a message | gmail | Sends confirmation email to candidate |
| 26 | Delete folder | googleDrive | Cleans up staging folder |
| 27 | Final Webhook Response | respondToWebhook | Returns `{ status: "completed" }` |

### AI Recruiter Agent

The Recruiter Agent is the core intelligence of CV processing. It uses **Azure OpenAI GPT-4.1** with a detailed system prompt.

**Model Configuration:**
| Parameter | Value |
|-----------|-------|
| Model | `gpt-4.1` (Azure OpenAI) |
| Temperature | `0.3` (low — deterministic) |
| Max Tokens | `4000` |
| Tools | Resource Requirements Vector DB (Azure AI Search) |

**System Prompt Summary:**

The agent is instructed to act as a "senior technical recruiter with 15+ years of experience." It:

1. **Calls the vector store first** — searches `resource-requirements` index to find matching job orders
2. **Extracts structured data** from the resume text:
   - Name, email, phone, location
   - Current position, years of experience
   - Education history (degree, school, year)
   - Certifications
   - Work experience (company, title, duration, description)
   - Skills (technical + soft)
3. **Matches against job orders** — produces a match score (0–100) with rationale
4. **Outputs strict JSON** with defined schema including:
   - Candidate profile fields
   - `education[]`, `certifications[]`, `work_experience[]`
   - `matched_job_orders[]` with score, strengths, weaknesses, summary
   - `overall_summary` with recommendation

**Vector Store Tool:**
- Index: `resource-requirements`
- Top-K: `10`
- Used to retrieve job orders for matching

### Data Persistence

After AI analysis, the workflow writes to multiple targets:

1. **Azure AI Search** (`applicants-index`): candidate embedding + metadata
2. **PostgreSQL** (via SQL upsert):
   - `candidates` table
   - `candidate_education` table
   - `candidate_certifications` table
   - `candidate_work_experience` table
   - `candidate_job_applications` table (links to matched JOs)
3. **Google Drive** (`Applicant CVs` folder): archived CV file with public link
4. **Gmail**: confirmation email to the candidate

### File Processing Logic

```
File MIME Type
  │
  ├─ application/pdf
  │    → Download from GDrive → Extract text directly
  │
  └─ application/vnd.openxmlformats (DOCX)
       → Convert to Google Doc → Export as PDF → Extract text → Delete temp doc
```

### Configuration

| Parameter | Value |
|-----------|-------|
| Azure AI Search endpoint | `https://n8nfoundry.search.windows.net` |
| Index name | `applicants-index` |
| Embedding model | `gemini-embedding-001` |
| AI model | `gpt-4.1` (Azure OpenAI) |
| AI temperature | `0.3` |
| AI max tokens | `4000` |
| Vector search top-K (agent) | `10` |
| GDrive staging | `WEB-STAGING [DO NOT DELETE]` |
| GDrive archive | `Applicant CVs` |
| Retry on fail | Yes (max 2–3 tries, 1–2s wait) |

---

## 4. Workflow 4: Chatbot

**Purpose**: Powers the AI assistant chat interface in the app. Receives user messages, searches both the candidate and job order vector stores, and streams back an AI-generated response.

### Trigger

```
POST https://workflow.exist.com.ph/webhook/51c69627-4831-44a4-8d91-1824a7d38ebf
Content-Type: application/json

{
  "chatInput": "Who are the best candidates for the Data Engineer role?",
  "sessionId": "session-uuid"
}

Response: NDJSON streaming (line-delimited JSON chunks)
```

### Flow Diagram

```
                     Browser
                       │
                       │ POST (chatInput + sessionId)
                       ▼
                    Webhook
                    (streaming mode)
                       │
                       ▼
               ┌───────────────┐
               │   AI Agent    │
               │   (GPT-4.1)  │
               │               │
               │ ┌───────────┐ │     ┌─────────────────────────┐
               │ │  Language  │ │     │  Azure OpenAI           │
               │ │  Model     │─┼────▶│  Model: gpt-4.1         │
               │ └───────────┘ │     │  Temp: 0.7, Max: 5000   │
               │               │     └─────────────────────────┘
               │ ┌───────────┐ │     ┌─────────────────────────┐
               │ │ Tool 1:   │ │     │  Azure AI Search         │
               │ │ Applicants│─┼────▶│  Index: applicants-index │
               │ │ Database  │ │     │  Top-K: 10, Hybrid query │
               │ └───────────┘ │     │  Embeddings: Gemini      │
               │               │     └─────────────────────────┘
               │ ┌───────────┐ │     ┌─────────────────────────┐
               │ │ Tool 2:   │ │     │  Azure AI Search         │
               │ │ Job Reqs  │─┼────▶│  Index: resource-        │
               │ │ Database  │ │     │  requirements            │
               │ └───────────┘ │     │  Top-K: 3                │
               │               │     │  Embeddings: Gemini      │
               │ ┌───────────┐ │     └─────────────────────────┘
               │ │  Session  │ │
               │ │  Memory   │ │  (maintains context per sessionId)
               │ └───────────┘ │
               └───────┬───────┘
                       │
                       ▼
               Respond to Webhook
               (streaming NDJSON)
                       │
                       ▼
                    Browser
              (renders Markdown)
```

### Nodes Detail

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | Webhook | webhook | Receives chat input (streaming mode) |
| 2 | AI Agent | agent | Orchestrates LLM + tools + memory |
| 3 | Azure OpenAI Chat Model | lmChatOpenAi | GPT-4.1 language model |
| 4 | Azure AI Search Vector Store1 | vectorStoreAzureAiSearch | Applicant candidate database |
| 5 | Azure AI Search Vector Store | vectorStoreAzureAiSearch | Job requirements database |
| 6 | Embeddings Google Gemini1 | embeddingsGoogleGemini | Embeddings for applicants search |
| 7 | Embeddings Google Gemini | embeddingsGoogleGemini | Embeddings for JO search |
| 8 | Simple Memory | memoryBufferWindow | Session-based conversation memory |
| 9 | Respond to Webhook | respondToWebhook | Streams response back to browser |

### AI Agent Configuration

**Model:**
| Parameter | Value |
|-----------|-------|
| Model | `gpt-4.1` (Azure OpenAI) |
| Temperature | `0.7` (moderate — conversational balance) |
| Max Tokens | `5000` |

**System Prompt:**

The agent is instructed to act as an "intelligent HR assistant embedded in an Applicant Tracking System (ATS)." Key responsibilities:

- **Candidate matching**: Search and rank candidates against job requirements
- **Data-driven recommendations**: Provide confidence scores and qualification summaries
- **Comparative analysis**: Compare candidates side-by-side
- **Query handling**: Answer questions about candidates, JOs, pipeline status

**Response protocol:**
- Always include confidence scores when matching
- List key qualifications and skill gaps
- Provide concise summaries alongside details
- Use Markdown formatting (headers, tables, bullet lists)

**Constraints:**
- Never fabricate candidate data
- State clearly when data is insufficient
- Maintain confidentiality
- Use both tools (applicants DB + job requirements DB) for matching queries

### Vector Store Tools

| Tool | Index | Top-K | Query Type | Embedding Model |
|------|-------|-------|------------|-----------------|
| Applicants Database | `applicants-index` | 10 | Hybrid (vector + keyword) | `gemini-embedding-001` |
| Job Requirements Database | `resource-requirements` | 3 | Vector | `gemini-embedding-001` |

### Session Memory

- **Type**: Buffer Window Memory
- **Key**: `sessionId` from request body
- **Scope**: Per-session (each browser tab/conversation gets isolated context)
- **Storage**: In-memory on n8n server (resets on n8n restart)

### Streaming Response

The response is delivered as **NDJSON** (newline-delimited JSON). The frontend (`useStreamingChat.ts`) reads this as a `ReadableStream`:

```
{"chunk": "Based on the "}
{"chunk": "applicant database, "}
{"chunk": "here are the top "}
{"chunk": "candidates for...\n\n"}
{"chunk": "| Name | Score | ..."}
```

---

## 5. External Services & Credentials

### Required Credentials in n8n

| Credential Name | Type | Service | Used By |
|----------------|------|---------|---------|
| **AISearchCredentials** | HTTP Header Auth | Azure AI Search | Workflows 1, 3 |
| **Azure Open AI account** | Azure OpenAI API | Azure OpenAI | Workflows 3, 4 |
| **Google Gemini (PaLM) Api account 2** | Google PaLM API | Google Gemini | Workflows 1, 3, 4 |
| **Azure AI Search account** | Azure AI Search API | Azure AI Search | Workflow 4 |
| **Google Drive account 2** | Google Drive OAuth2 | Google Drive | Workflow 3 |
| **Gmail account** | Gmail OAuth2 | Gmail | Workflow 3 |
| **Postgres account** | PostgreSQL | PostgreSQL DB | Workflow 3 |

### Azure AI Search Indexes

| Index Name | Contents | Used By | Embedding Dimensions |
|-----------|----------|---------|---------------------|
| `applicants-index` | Candidate profiles + resume embeddings | Workflows 3, 4 | Gemini embedding size |
| `resource-requirements` | Job order descriptions + embeddings | Workflows 1, 4 | Gemini embedding size |

### API Endpoints

| Service | Endpoint |
|---------|----------|
| Google Gemini Embedding | `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent` |
| Azure AI Search | `https://n8nfoundry.search.windows.net` |
| Azure OpenAI | Via n8n built-in Azure OpenAI node (configured in credentials) |
| Google Drive | Via n8n built-in Google Drive node (OAuth2) |
| Gmail | Via n8n built-in Gmail node (OAuth2) |
| PostgreSQL | Via n8n built-in Postgres node (connection string in credential) |

---

## 6. Maintenance & Troubleshooting

### Importing Workflows

The workflow JSON files are stored in `n8n-workflows/`:

```
n8n-workflows/
├── Workflow 1: Resource Requirements Embeddings.n8n
├── Workflow 3: CV Upload to Vector DB.n8n
└── Workflow 4: Chatbot.n8n
```

To import into a new n8n instance:

1. Open n8n UI → **Workflows** → **Import from File**
2. Upload each `.n8n` file
3. Configure all credentials (see table above)
4. Activate each workflow
5. Test with a sample request

### Common Issues

| Issue | Symptom | Resolution |
|-------|---------|------------|
| **CV upload hangs** | Processing status never completes | Check Workflow 3 execution logs in n8n. Common: GDrive quota exceeded, Gemini API rate limit |
| **Chatbot returns empty** | No streaming response | Verify Workflow 4 is active. Check Azure OpenAI quota and key validity |
| **JO not appearing in chat** | Chatbot can't find recently created JO | Workflow 1 may have failed. Check n8n execution history for the job-order-webhook-path |
| **Embedding failures** | HTTP 429 from Gemini API | Rate limit hit. Workflows have retry logic (2–3 attempts). If persistent, add delays between batch items |
| **SQL errors in Workflow 3** | Postgres upsert fails | Check if schema is up to date. Run `/migrate` endpoint on the Express API |
| **Email not sent** | Gmail node fails | OAuth2 token may have expired. Re-authorize Gmail credential in n8n |
| **Memory issues** | Chatbot forgets context | n8n was restarted (in-memory buffer cleared). This is expected — sessions reset on restart |

### Monitoring

- **n8n Execution History**: Each workflow execution is logged in n8n's UI under **Executions**. Failed executions show the error node and message.
- **Express API logs**: The backend logs webhook proxy calls and callback receipts.
- **Health check**: `GET /health` on the Express API verifies DB connectivity.

### Scaling Notes

- **Workflow 3 (CV)**: Processes files sequentially within a batch. For large batches (20+ CVs), processing can take several minutes due to AI analysis per file.
- **Workflow 4 (Chatbot)**: Each chat message is a stateless webhook call. Multiple concurrent users are supported by n8n's built-in concurrency.
- **Workflow 1 (JO Embeddings)**: Lightweight — typically completes in 2–3 seconds per JO.
- **Azure AI Search**: Shared across all workflows. Monitor index size and query volume via Azure portal.
