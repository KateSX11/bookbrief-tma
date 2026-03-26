import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.book import Book

router = APIRouter(prefix="/api/books", tags=["books"])


class BookListItem(BaseModel):
    id: int
    title_zh: str
    title_ru: str
    author_zh: str
    author_ru: str
    cover_url: Optional[str] = None
    category: str
    read_time_minutes: int
    listen_time_minutes: int

    model_config = {"from_attributes": True}


class BookDetail(BookListItem):
    summary_zh: Optional[dict] = None
    summary_ru: Optional[dict] = None
    audio_zh_url: Optional[str] = None
    audio_ru_url: Optional[str] = None


@router.get("", response_model=list[BookListItem])
def list_books(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Book)
    if category:
        query = query.filter(Book.category == category)
    query = query.order_by(Book.created_at.desc())
    return query.all()


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Book.category).distinct().all()
    return [r[0] for r in rows]


@router.get("/{book_id}", response_model=BookDetail)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    def parse_json(raw: Optional[str]) -> Optional[dict]:
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None

    data = {
        "id": book.id,
        "title_zh": book.title_zh,
        "title_ru": book.title_ru,
        "author_zh": book.author_zh,
        "author_ru": book.author_ru,
        "cover_url": book.cover_url,
        "category": book.category,
        "read_time_minutes": book.read_time_minutes,
        "listen_time_minutes": book.listen_time_minutes,
        "summary_zh": parse_json(book.summary_zh),
        "summary_ru": parse_json(book.summary_ru),
        "audio_zh_url": book.audio_zh_url,
        "audio_ru_url": book.audio_ru_url,
    }
    return BookDetail(**data)
