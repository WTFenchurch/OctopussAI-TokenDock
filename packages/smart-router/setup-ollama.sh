#!/bin/bash
# ============================================
# Ollama Local Setup — Unlimited Free Backstop
# ============================================
# Run this after installing Ollama from https://ollama.ai/download
# ============================================

set -e

echo "=========================================="
echo "  Ollama Local Model Setup"
echo "=========================================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "[ERROR] Ollama is not installed."
    echo "  Download from: https://ollama.ai/download"
    echo "  After installing, re-run this script."
    exit 1
fi

echo "[OK] Ollama is installed: $(ollama --version 2>/dev/null || echo 'version unknown')"
echo ""

# Pull recommended models
echo "Pulling recommended models..."
echo "(This will download a few GB — one-time cost)"
echo ""

echo "[1/3] Pulling llama3.1:8b (4.7GB) — general purpose..."
ollama pull llama3.1:8b

echo ""
echo "[2/3] Pulling mistral:7b (4.1GB) — balanced general purpose..."
ollama pull mistral:7b

echo ""
echo "[3/3] Pulling phi3:mini (2.3GB) — lightweight, fast..."
ollama pull phi3:mini

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Models installed:"
ollama list
echo ""
echo "To start the server:  ollama serve"
echo "Endpoint:             http://localhost:11434"
echo ""
echo "Optional extras:"
echo "  ollama pull codellama:13b    # Code tasks (7.4GB)"
echo "  ollama pull llama3.1:70b     # Large model — needs 48GB+ RAM"
echo ""
echo "Test it:  curl http://localhost:11434/api/generate -d '{\"model\":\"llama3.1:8b\",\"prompt\":\"Hello\",\"stream\":false}'"
