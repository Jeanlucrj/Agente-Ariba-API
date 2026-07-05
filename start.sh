#!/bin/bash
# =============================================================
# Agente Ariba Enterprise AI — Script de Inicialização Linux/Mac
# =============================================================

set -e

MODE=${1:-prod}   # prod | dev
BASE="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "=========================================="
echo "  Agente Ariba Enterprise AI"
echo "=========================================="
echo ""

# Verificar Docker
if ! docker info >/dev/null 2>&1; then
  echo "ERRO: Docker nao esta rodando."
  exit 1
fi

# Criar .env se não existir
if [ ! -f "$BASE/.env" ]; then
  echo "[SETUP] Criando .env a partir do .env.example..."
  cp "$BASE/.env.example" "$BASE/.env"
  echo "[AVISO] Edite o .env antes de usar em producao!"
fi

if [ "$MODE" = "dev" ]; then
  COMPOSE_FILE="docker-compose.dev.yml"
else
  COMPOSE_FILE="docker-compose.yml"
fi

echo "[START] Modo: $MODE"
docker-compose -f "$BASE/$COMPOSE_FILE" up -d --build

echo ""
echo "=========================================="
echo "  Servicos iniciados!"
echo "=========================================="
echo ""
echo "  Frontend:       http://localhost:3000"
echo "  Backend API:    http://localhost:3001/api/docs"
echo "  RabbitMQ Admin: http://localhost:15672"
echo ""
echo "  Login: admin@aribaenterprise.ai / Admin@123456"
echo ""
