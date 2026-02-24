#!/usr/bin/env bash
# =============================================================================
# deploy.sh — LiveKit Cloud deployment script (Linux / VPS)
# =============================================================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.production"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Voice Agent — LiveKit Cloud Deploy     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Check .env.production exists ─────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "❌  .env.production not found."
  echo "    Copy the example and fill in your credentials:"
  echo ""
  echo "    cp $ENV_EXAMPLE $ENV_FILE"
  echo "    nano $ENV_FILE"
  echo ""
  exit 1
fi

# ── 2. Validate required vars ────────────────────────────────────────────────
source "$ENV_FILE"

MISSING=()
[ -z "${LIVEKIT_URL:-}" ]       && MISSING+=("LIVEKIT_URL")
[ -z "${LIVEKIT_API_KEY:-}" ]   && MISSING+=("LIVEKIT_API_KEY")
[ -z "${LIVEKIT_API_SECRET:-}" ] && MISSING+=("LIVEKIT_API_SECRET")
[ -z "${GOOGLE_API_KEY:-}" ]    && MISSING+=("GOOGLE_API_KEY")

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "❌  Missing required variables in .env.production:"
  for var in "${MISSING[@]}"; do
    echo "      • $var"
  done
  echo ""
  exit 1
fi

echo "✅  Credentials validated"
echo "    LiveKit URL : $LIVEKIT_URL"
echo "    API Key     : ${LIVEKIT_API_KEY:0:8}..."
echo ""

# ── 3. Check Docker ──────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "❌  Docker not found. Install Docker: https://docs.docker.com/engine/install/"
  exit 1
fi
if ! docker compose version &>/dev/null; then
  echo "❌  Docker Compose v2 not found."
  exit 1
fi
echo "✅  Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# ── 4. Stop any existing containers ─────────────────────────────────────────
echo ""
echo "⏹   Stopping existing containers..."
cd "$SCRIPT_DIR"
docker compose down --remove-orphans 2>/dev/null || true

# ── 5. Build images ──────────────────────────────────────────────────────────
echo ""
echo "🔨  Building images..."
docker compose build --pull

# ── 6. Start services ────────────────────────────────────────────────────────
echo ""
echo "🚀  Starting services..."
docker compose --env-file "$ENV_FILE" up -d

# ── 7. Health check ──────────────────────────────────────────────────────────
echo ""
echo "⏳  Waiting for services to start..."
sleep 5

echo ""
echo "📋  Container status:"
docker compose ps

echo ""
echo "📜  Agent logs (last 20 lines):"
docker compose logs --tail=20 agent

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅  Deployment complete!                ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Frontend : http://localhost:3000"
echo "  Agent    : connected to $LIVEKIT_URL"
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f agent     # Stream agent logs"
echo "    docker compose logs -f frontend  # Stream frontend logs"
echo "    docker compose down              # Stop everything"
echo ""
