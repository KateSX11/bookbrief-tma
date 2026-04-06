#!/bin/sh
set -e

echo "Seeding database from content/..."
python /app/scripts/seed_books.py
echo "Database ready."

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
