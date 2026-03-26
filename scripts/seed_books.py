"""
Seed the database with book data, summaries, and audio paths.

Works in both local dev and Docker container environments.

Usage:
    python seed_books.py
"""

import json
import os
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent

if (SCRIPT_DIR.parent / "backend" / "app").exists():
    BACKEND_DIR = SCRIPT_DIR.parent / "backend"
else:
    BACKEND_DIR = Path("/app")

sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.book import Book

DB_DIR = BACKEND_DIR / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "bookbrief.db"

DB_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

BOOK_LIST = SCRIPT_DIR / "book_list.json"
SUMMARIES_DIR = SCRIPT_DIR / "output" / "summaries"
AUDIO_DIR = BACKEND_DIR / "media" / "audio"


def estimate_read_time(summary: dict) -> int:
    text = json.dumps(summary, ensure_ascii=False)
    return max(5, len(text) // 400)


def estimate_listen_time(audio_name: str) -> int:
    audio_path = AUDIO_DIR / audio_name
    if audio_path.exists():
        size_kb = audio_path.stat().st_size / 1024
        return max(3, int(size_kb / 16))
    return 12


def main():
    engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    session.query(Book).delete()

    with open(BOOK_LIST, "r", encoding="utf-8") as f:
        books = json.load(f)

    for i, book_data in enumerate(books):
        idx = i + 1
        print(f"[{idx}/{len(books)}] {book_data['title_zh']}")

        summary_zh = None
        summary_ru = None
        zh_file = SUMMARIES_DIR / f"book_{idx}_zh-TW.json"
        ru_file = SUMMARIES_DIR / f"book_{idx}_ru.json"

        if zh_file.exists():
            with open(zh_file, "r", encoding="utf-8") as f:
                summary_zh = json.load(f)
        if ru_file.exists():
            with open(ru_file, "r", encoding="utf-8") as f:
                summary_ru = json.load(f)

        audio_zh_name = f"book_{idx}_zh-TW.mp3"
        audio_ru_name = f"book_{idx}_ru.mp3"
        audio_zh_url = f"/media/audio/{audio_zh_name}" if (AUDIO_DIR / audio_zh_name).exists() else None
        audio_ru_url = f"/media/audio/{audio_ru_name}" if (AUDIO_DIR / audio_ru_name).exists() else None

        read_time = estimate_read_time(summary_zh) if summary_zh else 15
        listen_time = estimate_listen_time(audio_zh_name)

        book = Book(
            id=idx,
            title_zh=book_data["title_zh"],
            title_ru=book_data["title_ru"],
            author_zh=book_data["author_zh"],
            author_ru=book_data["author_ru"],
            cover_url=book_data.get("cover_url"),
            category=book_data["category"],
            summary_zh=json.dumps(summary_zh, ensure_ascii=False) if summary_zh else None,
            summary_ru=json.dumps(summary_ru, ensure_ascii=False) if summary_ru else None,
            audio_zh_url=audio_zh_url,
            audio_ru_url=audio_ru_url,
            read_time_minutes=read_time,
            listen_time_minutes=listen_time,
        )
        session.add(book)

    session.commit()
    count = session.query(Book).count()
    print(f"\nDone! {count} books seeded into {DB_PATH}")
    session.close()


if __name__ == "__main__":
    main()
