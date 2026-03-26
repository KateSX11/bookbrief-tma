#!/bin/sh
set -e

if [ ! -f /app/data/bookbrief.db ]; then
    echo "Database not found, seeding..."
    python /app/scripts/seed_books.py
    echo "Database seeded."
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
