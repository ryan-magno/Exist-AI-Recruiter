# ==============================================
# Exist AI Recruiter — Make targets
# ==============================================
# Quick reference for the infra team.
# Run `make help` to see all available commands.
# ==============================================

.PHONY: help build up down restart logs status health backup restore clean

# Default target
help: ## Show this help
	@echo ""
	@echo "Exist AI Recruiter — available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36mmake %-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ---------- Lifecycle ----------

build: ## Build all Docker images
	docker compose build

up: ## Start all services (detached, rebuilds if needed)
	docker compose up -d --build

down: ## Stop all services (data preserved)
	docker compose down

restart: ## Restart all services
	docker compose restart

restart-backend: ## Restart backend only (after env var changes)
	docker compose restart backend

rebuild-frontend: ## Rebuild + restart frontend (after VITE_* changes)
	docker compose up -d --build frontend

# ---------- Observability ----------

logs: ## Tail logs from all services
	docker compose logs -f

logs-backend: ## Tail backend logs only
	docker compose logs -f backend

logs-frontend: ## Tail frontend/nginx logs only
	docker compose logs -f frontend

logs-frontend: ## Tail frontend/nginx logs only
	docker compose logs -f frontend

status: ## Show container status
	docker compose ps

health: ## Check backend health endpoint
	@curl -sf http://localhost/health | python3 -m json.tool 2>/dev/null || echo "Health check failed — is the app running?"

stats: ## Show live resource usage
	docker compose stats

# ---------- Database (External) ----------

backup: ## Create a timestamped database backup (requires .env with DB credentials)
	@mkdir -p backups
	@echo "Creating backup from external database..."
	@PGPASSWORD=$${PGPASSWORD} pg_dump -h $${PGHOST} -U $${PGUSER} -d $${PGDATABASE} | gzip > backups/backup_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "Backup saved to backups/"
	@ls -lh backups/ | tail -1

restore: ## Restore from backup (usage: make restore FILE=backups/backup_xxx.sql.gz)
ifndef FILE
	@echo "Usage: make restore FILE=backups/backup_20260214_120000.sql.gz"
	@exit 1
endif
	@echo "Stopping backend..."
	docker compose stop backend
	@echo "Restoring to external database..."
	@gunzip -c $(FILE) | PGPASSWORD=$${PGPASSWORD} psql -h $${PGHOST} -U $${PGUSER} -d $${PGDATABASE}
	@echo "Restarting backend..."
	docker compose start backend
	@echo "Restore complete."

db-shell: ## Open a psql shell to the external database
	@PGPASSWORD=$${PGPASSWORD} psql -h $${PGHOST} -U $${PGUSER} -d $${PGDATABASE}

init-schema: ## Initialize database schema (run once on empty database)
	@echo "Initializing schema on external database..."
	@PGPASSWORD=$${PGPASSWORD} psql -h $${PGHOST} -U $${PGUSER} -d $${PGDATABASE} -f schema.sql
	@echo "Schema initialized. Now run: make up"

# ---------- Debugging ----------

shell-backend: ## Open a shell inside the backend container
	docker compose exec backend sh

shell-frontend: ## Open a shell inside the frontend container
	docker compose exec frontend sh

# ---------- Cleanup ----------

clean: ## Stop everything and remove images
	docker compose down --rmi all

nuke: ## ⚠️  DESTROY everything including local volumes (external DB not affected)
	@echo "⚠️  This will DELETE local volumes. External database is NOT affected."
	@echo "   Press Ctrl+C to cancel..."
	@sleep 5
	docker compose down -v --rmi all
