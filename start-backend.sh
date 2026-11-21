#!/usr/bin/env bash
set -e
echo "Starting AI Document Intelligence Backend..."
cd "$(dirname "$0")/backend"
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found at backend/.venv."
    exit 1
fi
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
