.PHONY: help \
        up down logs build restart \
        dev dev-api dev-mcp \
        redis-up redis-down redis-cli redis-keys redis-flush \
        install

# ── Config ─────────────────────────────────────────────────────────────────────

API_DIR    := project
MCP_DIR    := project/server
REDIS_PORT := 6379

# ── Help ───────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  DOCKER"
	@echo "  make up          Levanta todo el stack (redis + mcp + api)"
	@echo "  make down        Para y elimina los contenedores"
	@echo "  make build       Rebuild de las imágenes"
	@echo "  make logs        Logs de todos los servicios"
	@echo "  make logs s=api  Logs de un servicio concreto"
	@echo "  make restart     Rebuild y up"
	@echo ""
	@echo "  LOCAL"
	@echo "  make install     Instala dependencias en el virtualenv"
	@echo "  make dev         Levanta redis + api + mcp en local"
	@echo "  make dev-api     Solo uvicorn (asume redis ya corriendo)"
	@echo "  make dev-mcp     Solo mcp server (asume redis ya corriendo)"
	@echo "  make redis-up    Levanta Redis en Docker para desarrollo local"
	@echo "  make redis-down  Para Redis de desarrollo"
	@echo ""
	@echo "  REDIS INSPECT"
	@echo "  make redis-cli   Abre redis-cli interactivo"
	@echo "  make redis-keys  Lista todas las keys"
	@echo "  make redis-flush Borra TODAS las keys (¡cuidado!)"
	@echo ""

# ── Docker ─────────────────────────────────────────────────────────────────────

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

restart: build up

logs:
ifdef s
	docker compose logs -f $(s)
else
	docker compose logs -f
endif

# ── Local ──────────────────────────────────────────────────────────────────────

install:
	pip install -r requirements.txt

# Levanta redis en docker, luego mcp y api en paralelo en local
dev: redis-up
	@echo "Esperando a Redis..."
	@sleep 2
	@trap 'kill 0' SIGINT; \
	  MCP_SERVER_URL=http://localhost:8001/sse REDIS_URL=redis://localhost:6379 \
	  python $(MCP_DIR)/main.py & \
	  sleep 1 && \
	  cd $(API_DIR) && \
	  REDIS_URL=redis://localhost:6379 MCP_SERVER_URL=http://localhost:8001/sse \
	  uvicorn main:app --reload --port 8000 & \
	  wait

dev-api:
	cd $(API_DIR) && \
	REDIS_URL=redis://localhost:6379 MCP_SERVER_URL=http://localhost:8001/sse \
	uvicorn main:app --reload --port 8000

dev-mcp:
	MCP_SERVER_URL=http://localhost:8001/sse REDIS_URL=redis://localhost:6379 \
	python $(MCP_DIR)/main.py

# ── Redis local ────────────────────────────────────────────────────────────────

redis-up:
	@if [ -z "$$(docker ps -q -f name=english_redis)" ]; then \
	  echo "Levantando Redis..."; \
	  docker run -d --name english_redis -p $(REDIS_PORT):6379 redis:7-alpine; \
	else \
	  echo "Redis ya está corriendo."; \
	fi

redis-down:
	docker stop english_redis && docker rm english_redis

# ── Redis inspect ──────────────────────────────────────────────────────────────

redis-cli:
	docker exec -it english_redis redis-cli

redis-keys:
	docker exec english_redis redis-cli KEYS "*"

redis-flush:
	@read -p "¿Borrar TODAS las keys de Redis? [s/N] " confirm; \
	  [ "$$confirm" = "s" ] && docker exec english_redis redis-cli FLUSHALL || echo "Cancelado."