#!/bin/bash
set -e

echo "[Entrypoint] Starting scheduler in background..."
cd /app
python scheduler.py &

echo "[Entrypoint] Starting Gunicorn..."
exec gunicorn --bind 0.0.0.0:5099 --workers 2 --timeout 120 app:application
