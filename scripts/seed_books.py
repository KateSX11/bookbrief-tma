"""
Seed the database from content/zh/ resource folders.

Reads meta.json + ch*.md files from each book folder,
imports into the SQLite database.

Usage:
    python seed_books.py
"""

import json
import os
import re
import shutil
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent

if (SCRIPT_DIR.parent / "backend" / "app").exists():
    BACKEND_DIR = SCRIPT_DIR.parent / "backend"
    CONTENT_DIR = SCRIPT_DIR.parent / "content" / "zh"
else:
    BACKEND_DIR = Path("/app")
    CONTENT_DIR = Path("/app/content/zh")

sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.book import Book, Chapter, ReadingHistory

DB_DIR = BACKEND_DIR / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "bookbrief.db"
DB_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

MEDIA_DIR = BACKEND_DIR / "media"


def load_book_folder(book_path: Path) -> dict | None:
    meta_file = book_path / "meta.json"
    if not meta_file.exists():
        print(f"  [SKIP] {book_path.name}: no meta.json")
        return None

    with open(meta_file, "r", encoding="utf-8") as f:
        meta = json.load(f)

    if meta.get("status") != "published":
        print(f"  [SKIP] {meta.get('title', book_path.name)}: status={meta.get('status')}")
        return None

    chapters = []
    for ch_def in meta.get("chapters", []):
        idx = ch_def["index"]
        ch_file = book_path / f"ch{idx:02d}.md"
        content = ""
        if ch_file.exists():
            content = ch_file.read_text(encoding="utf-8")
        else:
            print(f"  [WARN] {meta['title']} ch{idx:02d}.md not found")

        audio_url = None
        mp3_file = book_path / f"ch{idx:02d}.mp3"
        if mp3_file.exists():
            audio_dest = MEDIA_DIR / "audio" / f"{meta['id']}_ch{idx:02d}.mp3"
            audio_dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(mp3_file, audio_dest)
            audio_url = f"/media/audio/{meta['id']}_ch{idx:02d}.mp3"

        chapters.append({
            "index": idx,
            "title": ch_def["title"],
            "content": content,
            "audio_url": audio_url,
        })

    cover_url = None
    for ext in ("webp", "jpg", "png"):
        cover_file = book_path / f"cover.{ext}"
        if cover_file.exists():
            cover_dest = MEDIA_DIR / "covers" / f"{meta['id']}.{ext}"
            cover_dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(cover_file, cover_dest)
            cover_url = f"/media/covers/{meta['id']}.{ext}"
            break

    return {
        "id": int(meta["id"]),
        "title": meta["title"],
        "author": meta["author"],
        "original_title": meta.get("original_title"),
        "category": meta["category"],
        "tagline": meta["tagline"],
        "quotes": meta.get("quotes", []),
        "time": meta.get("time", 15),
        "cover_url": cover_url,
        "is_featured": meta.get("is_featured", False),
        "is_hot": meta.get("is_hot", False),
        "is_free": meta.get("is_free", True),
        "sort_order": meta.get("sort_order", 0),
        "chapters": chapters,
    }


def main():
    engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    session.query(ReadingHistory).delete()
    session.query(Chapter).delete()
    session.query(Book).delete()

    if not CONTENT_DIR.exists():
        print(f"Content directory not found: {CONTENT_DIR}")
        print("No books to seed.")
        session.commit()
        session.close()
        return

    book_folders = sorted(
        [d for d in CONTENT_DIR.iterdir() if d.is_dir() and d.name.isdigit()],
        key=lambda d: int(d.name),
    )

    print(f"Found {len(book_folders)} book folder(s) in {CONTENT_DIR}\n")

    total_books = 0
    total_chapters = 0

    for folder in book_folders:
        data = load_book_folder(folder)
        if data is None:
            continue

        print(f"  Importing: {data['title']} (id={data['id']}, {len(data['chapters'])} chapters)")

        book = Book(
            id=data["id"],
            title=data["title"],
            author=data["author"],
            original_title=data["original_title"],
            category=data["category"],
            tagline=data["tagline"],
            quotes=json.dumps(data["quotes"], ensure_ascii=False),
            time=data["time"],
            cover_url=data["cover_url"],
            is_featured=data["is_featured"],
            is_hot=data["is_hot"],
            is_free=data["is_free"],
            sort_order=data["sort_order"],
            status="published",
        )
        session.add(book)
        session.flush()

        for ch in data["chapters"]:
            chapter = Chapter(
                book_id=data["id"],
                index=ch["index"],
                title=ch["title"],
                content=ch["content"],
                audio_url=ch["audio_url"],
            )
            session.add(chapter)
            total_chapters += 1

        total_books += 1

    session.commit()
    print(f"\nDone! {total_books} books, {total_chapters} chapters seeded into {DB_PATH}")
    session.close()


if __name__ == "__main__":
    main()
