#!/bin/bash
# ============================================
# Start LiteLLM Proxy
# ============================================
# Requires: pip install litellm[proxy]
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
    echo "[OK] Loaded .env"
else
    echo "[ERROR] No .env file found. Copy .env.example to .env and add your keys."
    exit 1
fi

# Check if litellm is installed
if ! command -v litellm &> /dev/null; then
    echo "[INFO] Installing LiteLLM proxy..."
    pip install "litellm[proxy]"
fi

PORT="${LITELLM_PORT:-4000}"

echo ""
echo "=========================================="
echo "  Starting LiteLLM Proxy on port $PORT"
echo "=========================================="
echo ""
echo "  Endpoint:  http://localhost:$PORT"
echo "  Config:    $SCRIPT_DIR/litellm_config.yaml"
echo ""
echo "  Usage:     Point any OpenAI-compatible client to:"
echo "             OPENAI_API_BASE=http://localhost:$PORT"
echo "             OPENAI_API_KEY=$LITELLM_MASTER_KEY"
echo ""
echo "  Models:    'auto' (routed), 'fast', 'gemini', 'local', etc."
echo ""

litellm --config "$SCRIPT_DIR/litellm_config.yaml" --port "$PORT"
