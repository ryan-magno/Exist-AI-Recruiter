# Exist AI Recruiter — Deployment Guide

> **Audience**: Infrastructure / DevOps team
> **Last updated**: February 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Security Warning](#security-warning)
4. [Quick Start](#quick-start)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Using an External Database](#using-an-external-database)
7. [Multi-User & Concurrency](#multi-user--concurrency)
8. [Files Included in Docker Images](#files-included-in-docker-images)
9. [Updating the Application](#updating-the-application)
10. [Data Persistence & Backups](#data-persistence--backups)
11. [Logs & Troubleshooting](#logs--troubleshooting)
12. [Scaling Considerations](#scaling-considerations)
13. [SSL / TLS Termination](#ssl--tls-termination)
14. [Production Hardening (built-in)](#production-hardening-built-in)
15. [Go-Live Checklist](#go-live-checklist)

---

## Architecture Overview

```
                                ┌──────────────────────┐
                                │   n8n Workflows      │
                                │  workflow.exist.com.ph│
                                │  - CV processing     │
                                │  - Chatbot RAG       │
                                │  - Email sending     │
                                └──────────┬───────────┘
                                           │ HTTPS webhooks
                                           │
┌─────────┐       :80       ┌──────────────┴───────────┐       :5432       ┌─────────────┐
│ Browser  │ ───────────▶   │        frontend          │                   │     db       │
│ (Users)  │                │     (nginx:alpine)       │                   │ (postgres:16)│
└─────────┘                 │                          │                   │              │
                            │  Static SPA  ──▶  /      │                   │  pgdata vol  │
                            │  API proxy   ──▶  /api/* │                   └──────▲───────┘
                            └──────────┬───────────────┘                          │
                                       │ proxy_pass :3001                         │
                                       ▼                                          │
                            ┌──────────────────────────┐                          │
                            │        backend           │──────────────────────────┘
                            │   (node:20-alpine)       │     PG connection pool
                            │   Express API :3001      │     (max 10 connections)
                            └──────────────────────────┘
```

**Three containers:**

| Container  | Image                | Purpose                                         | Exposed Port        |
|------------|----------------------|--------------------------------------------------|---------------------|
| `frontend` | Custom (nginx)       | Serves React SPA + reverse-proxies API requests  | `80` (host, configurable via `FRONTEND_PORT`) |
| `backend`  | Custom (node:20)     | Express REST API, DB access, webhook proxy       | `3001` (internal only) |
| `db`       | `postgres:16-alpine` | PostgreSQL database                              | `5432` (internal only) |

---

## Prerequisites

| Requirement        | Minimum Version | Check Command              |
|--------------------|-----------------|----------------------------|
| Docker Engine      | 24.0+           | `docker --version`         |
| Docker Compose     | v2.20+          | `docker compose version`   |
| GNU Make           | 3.81+           | `make --version`           |
| Disk space         | ~2 GB           | For images + DB data       |
| RAM                | ~2 GB           | Minimum for all 3 services |
| Network access     | —               | Outbound HTTPS to `workflow.exist.com.ph` |

**Before you begin, you need:**

1. A strong database password to replace the default in `.env`
2. If using CV upload features: a **publicly reachable URL** for `WEBHOOK_CALLBACK_URL` so n8n can POST processed results back to the backend (e.g., `https://recruiter.yourcompany.com/webhook-callback`)
3. The n8n webhook URLs are **already pre-configured** pointing to `workflow.exist.com.ph` — no action needed unless your n8n instance is hosted elsewhere

---

## Security Warning

> **The application has NO built-in authentication or authorization.** There is no login screen, no JWT, no session management. Any user who can reach port 80 has full read/write access to all data.

**Required before production deployment:**

- Place the application behind a **VPN**, **OAuth2 proxy** (e.g., oauth2-proxy), or **network-level access control**
- Alternatively, use **Azure App Service Authentication**, **Cloudflare Access**, or a similar identity-aware proxy
- At minimum, restrict access via firewall rules to trusted IP ranges
- Change the default database password in `.env`

---

## Quick Start

```bash
# 1. Clone the repository (if not already done)
git clone <repository-url>
cd Exist-AI-Recruiter

# 2. Create your environment file from the template
cp .env.example .env

# 3. Edit .env — most values are already pre-configured
#    You only MUST change:
#    - PGPASSWORD          → use a strong password
#    - WEBHOOK_CALLBACK_URL → your server's public URL + /webhook-callback
nano .env

# 4. Build and start all containers
make up          # or: docker compose up -d --build

# 5. Verify everything is running
make status      # or: docker compose ps

# 6. Check backend health
make health      # or: curl http://localhost/health

# 7. Open in browser
open http://localhost
```

> **Tip:** Run `make help` to see all available Make targets for lifecycle, logs, backups, and debugging.

**Expected output of `docker compose ps`:**

```
NAME                              STATUS              PORTS
exist-ai-recruiter-db-1           Up (healthy)        0.0.0.0:5432->5432/tcp
exist-ai-recruiter-backend-1      Up (healthy)        3001/tcp
exist-ai-recruiter-frontend-1     Up                  0.0.0.0:80->80/tcp
```

**Expected output of `curl http://localhost/health`:**

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-13T..."
}
```

---

## Environment Variables Reference

### Database

| Variable     | Required | Default        | Description                                                                                  |
|--------------|----------|----------------|----------------------------------------------------------------------------------------------|
| `PGHOST`     | Yes      | `db`           | PostgreSQL hostname. Use `db` for the bundled container, or a real hostname for external DB   |
| `PGUSER`     | Yes      | `recruiter`    | PostgreSQL username                                                                          |
| `PGPASSWORD` | Yes      | —              | PostgreSQL password. **Change the default!**                                                 |
| `PGDATABASE` | Yes      | `recruiter_db` | PostgreSQL database name                                                                     |
| `PGPORT`     | No       | `5432`         | PostgreSQL port                                                                              |

### API Server

| Variable   | Required | Default | Description                                                |
|------------|----------|---------|------------------------------------------------------------|
| `API_PORT` | No       | `3001`  | Internal Express server port (no need to change usually)   |

### n8n Webhooks (pre-configured)

All n8n webhook URLs come **pre-configured** pointing to `workflow.exist.com.ph`. You only need to change these if your n8n instance is hosted on a different server.

| Variable                     | Pre-configured Value                                                               | Purpose                              |
|------------------------------|------------------------------------------------------------------------------------|--------------------------------------|
| `N8N_CV_WEBHOOK_URL`         | `https://workflow.exist.com.ph/webhook/vector-db-loader`                           | CV upload processing pipeline        |
| `N8N_JO_WEBHOOK_URL`        | `https://workflow.exist.com.ph/webhook/job-order-webhook-path`                     | Job order sync (embeddings)          |
| `N8N_EMAIL_WEBHOOK_URL`     | `https://workflow.exist.com.ph/webhook/81f944ac-1805-4de0-aec6-248bc04c535d`       | Email sending                        |
| `VITE_N8N_CHAT_WEBHOOK_URL` | `https://workflow.exist.com.ph/webhook/51c69627-4831-44a4-8d91-1824a7d38ebf`       | AI chatbot (called from browser)     |
| `WEBHOOK_CALLBACK_URL`       | **Must be set** — your server's public URL + `/webhook-callback`                   | n8n sends processed CV results here  |

> **Changing n8n webhook URLs later:** Simply update the values in `.env`. For `N8N_*` and `WEBHOOK_CALLBACK_URL`, restart the backend only: `docker compose restart backend`. For `VITE_N8N_CHAT_WEBHOOK_URL` (a build-time variable), you must rebuild the frontend: `docker compose up -d --build frontend`.

### Frontend (build-time)

| Variable                     | Default  | Description                                                                        |
|------------------------------|----------|------------------------------------------------------------------------------------|
| `VITE_API_URL`               | *(empty)* | API base URL. Leave empty when using nginx reverse proxy (recommended).            |
| `VITE_N8N_CHAT_WEBHOOK_URL` | *(pre-configured)* | n8n chatbot webhook URL. Called directly from the browser.               |

> **Important:** `VITE_*` variables are **build-time only** — they are baked into the JavaScript bundle during `docker compose build`. If you change them, you must rebuild the frontend: `docker compose up -d --build frontend`

---

## Using an External Database

To connect to an existing PostgreSQL server (e.g., Azure Database for PostgreSQL) instead of the bundled container:

### 1. Update `.env`

```env
PGHOST=your-server.postgres.database.azure.com
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=your_database
PGPORT=5432
```

### 2. Modify `docker-compose.yml`

Comment out or remove the `db` service and update `backend.depends_on`:

```yaml
services:
  # db:             # ← comment out or remove the entire db service
  #   image: ...

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    restart: unless-stopped
    # depends_on:   # ← remove or comment out depends_on
    #   db:
    #     condition: service_healthy
    environment:
      # ... same as before, PGHOST now points to external server
```

### 3. Initialize the schema

If the external database is empty, run the schema manually:

```bash
psql -h your-server.postgres.database.azure.com -U your_username -d your_database -f schema.sql
```

### 4. Start without the db container

```bash
docker compose up -d --build backend frontend
```

---

## Multi-User & Concurrency

**Yes, multiple users can use the application simultaneously with a single database.**

### How it works

- **PostgreSQL** natively handles concurrent reads and writes with MVCC (Multi-Version Concurrency Control). Multiple users inserting, updating, and reading data simultaneously is fully supported.
- **Express backend** uses a connection pool (max 10 connections) to the database. Each API request gets a connection from the pool and releases it when done.
- **nginx** handles many concurrent HTTP connections efficiently and proxies requests to the backend.
- **Chat sessions** are stored in each user's browser `localStorage` — they are independent per browser and do not conflict.
- **File uploads** are processed in-memory and forwarded to n8n — no shared disk storage to contend over.

### Limits & tuning

| Resource              | Default    | How to increase                                     |
|-----------------------|------------|-----------------------------------------------------|
| DB connection pool    | 10 conns   | Edit `max` in `server/index.js` (~line 52)          |
| File upload size      | 10 MB      | Edit `multer` config in `server/index.js` + `nginx.conf` `client_max_body_size` |
| nginx worker conns    | 1024       | Edit `worker_connections` in `nginx.conf`           |
| PostgreSQL max conns  | 100        | Edit `max_connections` in PostgreSQL config          |

For typical use (up to ~50 concurrent users), the defaults are sufficient with no changes needed.

---

## Files Included in Docker Images

### Frontend image (nginx) — final layer

- `dist/` — compiled HTML, JS, CSS bundles only
- `nginx.conf` — reverse proxy configuration

Source code, `node_modules`, dev tools, TypeScript configs — all discarded after the build stage.

### Backend image (node)

- `server/index.js` — Express API server
- `server/node_modules/` — production dependencies only (~6 packages)
- `schema.sql` — database schema (used by auto-migration on startup)
- `migrations/` — SQL migration files

### NOT included in any image

| Excluded                   | Reason                                 |
|----------------------------|----------------------------------------|
| `node_modules/` (root)     | Only needed at frontend build time     |
| `src/`                     | Compiled into `dist/` at build time    |
| `mockData/`                | Development only                       |
| `n8n-workflows/`           | External service config                |
| `scripts/`                 | Development utilities                  |
| `seed.sql`                 | Optional test data                     |
| `.env`                     | Secrets — injected via docker-compose  |
| `*.test.*`                 | Test files                             |
| `bun.lockb`                | Unused (npm is used)                   |
| `tsconfig*.json`, etc.     | Build configs — used only in Stage 1   |

---

## Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Check status
docker compose ps
docker compose logs -f backend --tail=50
```

To rebuild only a specific service:

```bash
docker compose up -d --build frontend   # frontend only
docker compose up -d --build backend    # backend only
```

---

## Data Persistence & Backups

### Docker volume

Database data is stored in a named Docker volume `pgdata`. This persists across:

- Container restarts (`docker compose restart`)
- Rebuilds (`docker compose up -d --build`)
- Stop/start cycles (`docker compose down` then `docker compose up -d`)

**Data is ONLY destroyed if you explicitly remove the volume:**

```bash
# ⚠️ THIS DELETES ALL DATA
docker compose down -v
```

### Backup

```bash
# Full database dump
docker compose exec db pg_dump -U recruiter recruiter_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed
docker compose exec db pg_dump -U recruiter recruiter_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore

```bash
# Stop backend to avoid conflicts
docker compose stop backend

# Restore from backup
cat backup_20260213_120000.sql | docker compose exec -T db psql -U recruiter recruiter_db

# Restart backend
docker compose start backend
```

---

## Logs & Troubleshooting

### Viewing logs

```bash
docker compose logs -f              # all containers
docker compose logs -f backend      # backend only
docker compose logs -f frontend     # nginx only
docker compose logs -f db           # database only
docker compose logs --tail=100 backend  # last 100 lines
```

### Common issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Backend exits: "Missing required environment variable" | `.env` missing or incomplete | `cp .env.example .env` and fill in `PGPASSWORD` + `WEBHOOK_CALLBACK_URL` |
| Backend: "DB connection failed" | Database not ready or wrong credentials | Check `PGHOST`, `PGUSER`, `PGPASSWORD`; ensure `db` container is healthy |
| Blank page in browser | Build-time env vars not set at build time | Check `VITE_API_URL`; rebuild: `docker compose up -d --build frontend` |
| CV upload works but candidates never appear | `WEBHOOK_CALLBACK_URL` not reachable by n8n | Set to a publicly accessible URL; check firewall rules |
| Chat not responding | `VITE_N8N_CHAT_WEBHOOK_URL` wrong or n8n down | Verify webhook URL; check n8n service status |
| Port 80 connection refused | Frontend container not running | `docker compose up -d frontend`; check `docker compose logs frontend` |
| Database data lost after restart | Used `docker compose down -v` | Never use `-v` unless you intend to delete data |

### Entering containers for debugging

```bash
docker compose exec backend sh           # backend shell
docker compose exec db psql -U recruiter recruiter_db   # database shell
docker compose exec frontend sh          # nginx shell
```

---

## Scaling Considerations

### Horizontal scaling

The backend is stateless — it can be replicated behind a load balancer. For production:

- Use **Docker Swarm** or **Kubernetes** for multi-replica orchestration
- Or run multiple backend containers behind a separate nginx/HAProxy

### Vertical scaling

```yaml
# Add to docker-compose.yml under a service:
backend:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 1G
```

### Database connection pool

If you see "connection pool exhausted" errors, increase the pool size in `server/index.js` (~line 52):

```javascript
const pool = new pg.Pool({
  // ...
  max: 20,  // increase from default 10
});
```

---

## SSL / TLS Termination

The containers serve HTTP only on port 80. For HTTPS in production:

### Option A: External reverse proxy (recommended)

Place a reverse proxy in front of the `frontend` container:

- **Azure Application Gateway** or **Azure Front Door**
- **Cloudflare** (proxy mode)
- **Traefik** or **Caddy** as a sidecar container
- **AWS ALB** / **GCP Cloud Load Balancer**

### Option B: Add TLS directly to nginx

Mount certificates into the frontend container:

```yaml
# docker-compose.yml
frontend:
  volumes:
    - ./certs/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro
    - ./certs/privkey.pem:/etc/nginx/ssl/privkey.pem:ro
  ports:
    - "443:443"
    - "80:80"
```

Then update `nginx.conf` to listen on 443 with the SSL certs and redirect 80 → 443.

---

## Quick Reference (Makefile)

A `Makefile` is included for common operations. Run `make help` for a full list.

```bash
make up                 # Build + start all services
make down               # Stop all services (data preserved)
make restart-backend    # Restart backend only (env var changes)
make rebuild-frontend   # Rebuild frontend (VITE_* changes)
make logs               # Tail all logs
make logs-backend       # Tail backend logs only
make health             # Check /health endpoint
make status             # Show container status
make stats              # Live resource usage
make backup             # Timestamped DB backup → backups/
make restore FILE=...   # Restore from backup
make db-shell           # psql shell into database
make shell-backend      # sh into backend container
make clean              # Stop + remove images (data kept)
make nuke               # ⚠️ DESTROY everything incl. data
```

Or use `docker compose` directly:

```bash
docker compose up -d --build          # Start everything (build fresh)
docker compose down                   # Stop everything (data preserved)
docker compose restart backend        # Restart a single service
docker compose stats                  # View resource usage
docker compose up -d --build frontend # Rebuild after VITE_* change
docker compose down -v                # ⚠️ RESET — deletes ALL data
```

---

## Production Hardening (built-in)

The following security and reliability measures are already configured out of the box:

| Feature | Where |
|---------|-------|
| **Non-root containers** | Backend runs as `appuser:1001`, frontend as `nginx` user |
| **PID 1 signal handling** | Backend uses `tini` init for proper SIGTERM forwarding |
| **Graceful shutdown** | Backend drains in-flight requests + closes DB pool before exit |
| **Health checks** | All 3 services have Docker health checks |
| **Network isolation** | DB is only reachable from backend (separate Docker networks) |
| **Resource limits** | CPU + memory caps on all services prevent runaway resource usage |
| **Log rotation** | JSON file logging with max-size (10MB) and max-file (3-5) |
| **Security headers** | nginx adds X-Frame-Options, X-Content-Type-Options, CSP, etc. |
| **Server tokens hidden** | nginx `server_tokens off` hides version info |
| **DB port not exposed** | PostgreSQL port 5432 is internal-only by default |
| **Gzip compression** | Enabled for text/JS/CSS/JSON/SVG |
| **Static asset caching** | 1-year cache with immutable headers |

---

## Go-Live Checklist

- [ ] Changed default `PGPASSWORD` to a strong password
- [ ] Set `WEBHOOK_CALLBACK_URL` to the server's public URL + `/webhook-callback`
- [ ] Verified n8n webhook URLs are correct (pre-configured to `workflow.exist.com.ph`)
- [ ] Placed the application behind VPN / auth proxy / firewall
- [ ] Set up SSL/TLS termination (see section above)
- [ ] Tested CV upload → processing → candidate appearing end-to-end
- [ ] Set up a database backup schedule (`make backup` or cron)
- [ ] Verified the server has outbound HTTPS access to `workflow.exist.com.ph`
- [ ] Confirmed `make health` returns `{"status": "ok"}`
- [ ] Verified `make status` shows all containers as `Up (healthy)`
