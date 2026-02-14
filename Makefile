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

logs-db: ## Tail database logs only
	docker compose logs -f db

status: ## Show container status
	docker compose ps

health: ## Check backend health endpoint
	@curl -sf http://localhost/health | python3 -m json.tool 2>/dev/null || echo "Health check failed — is the app running?"

stats: ## Show live resource usage
	docker compose stats

# ---------- Database ----------

backup: ## Create a timestamped database backup
	@mkdir -p backups
	docker compose exec db pg_dump -U $${PGUSER:-recruiter} $${PGDATABASE:-recruiter_db} | gzip > backups/backup_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "Backup saved to backups/"
	@ls -lh backups/ | tail -1

restore: ## Restore from latest backup (usage: make restore FILE=backups/backup_xxx.sql.gz)
ifndef FILE
	@echo "Usage: make restore FILE=backups/backup_20260214_120000.sql.gz"
	@exit 1
endif
	docker compose stop backend
	gunzip -c $(FILE) | docker compose exec -T db psql -U $${PGUSER:-recruiter} $${PGDATABASE:-recruiter_db}
	docker compose start backend
	@echo "Restore complete."

db-shell: ## Open a psql shell to the database
	docker compose exec db psql -U $${PGUSER:-recruiter} $${PGDATABASE:-recruiter_db}

# ---------- Debugging ----------

shell-backend: ## Open a shell inside the backend container
	docker compose exec backend sh

shell-frontend: ## Open a shell inside the frontend container
	docker compose exec frontend sh

# ---------- Cleanup ----------

clean: ## Stop everything and remove images (DATA PRESERVED)
	docker compose down --rmi all

nuke: ## ⚠️  DESTROY everything including database data
	@echo "⚠️  This will DELETE ALL DATA. Press Ctrl+C to cancel."
	@sleep 5
	docker compose down -v --rmi all
