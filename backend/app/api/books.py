import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.book import Book, Chapter

router = APIRouter(prefix="/api/books", tags=["books"])


class ChapterBrief(BaseModel):
    index: int
    title: str
    has_audio: bool = False
    model_config = {"from_attributes": True}


class BookListItem(BaseModel):
    id: int
    title: str
    author: str
    category: str
    tagline: str
    time: int
    cover_url: Optional[str] = None
    is_featured: bool = False
    is_hot: bool = False
    is_free: bool = True
    model_config = {"from_attributes": True}


class BookDetail(BookListItem):
    original_title: Optional[str] = None
    quotes: list[str] = []
    chapters: list[ChapterBrief] = []


class ChapterDetail(BaseModel):
    index: int
    title: str
    content: Optional[str] = None
    audio_url: Optional[str] = None
    total_chapters: int = 0
    book_title: str = ""
    book_cover_url: Optional[str] = None


def _parse_quotes(raw: Optional[str]) -> list[str]:
    if not raw:
        return []
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return []


@router.get("", response_model=list[BookListItem])
def list_books(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Book).filter(Book.status == "published")
    if category:
        query = query.filter(Book.category == category)
    return query.order_by(Book.sort_order, Book.created_at.desc()).all()


@router.get("/featured", response_model=list[BookListItem])
def list_featured(db: Session = Depends(get_db)):
    return (
        db.query(Book)
        .filter(Book.status == "published", Book.is_featured == True)
        .order_by(Book.sort_order)
        .all()
    )


@router.get("/hot", response_model=list[BookListItem])
def list_hot(db: Session = Depends(get_db)):
    return (
        db.query(Book)
        .filter(Book.status == "published", Book.is_hot == True)
        .order_by(Book.sort_order)
        .all()
    )


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    rows = (
        db.query(Book.category)
        .filter(Book.status == "published")
        .distinct()
        .all()
    )
    return [r[0] for r in rows]


@router.get("/{book_id}", response_model=BookDetail)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    chapter_briefs = [
        ChapterBrief(index=ch.index, title=ch.title, has_audio=bool(ch.audio_url))
        for ch in book.chapters
    ]

    return BookDetail(
        id=book.id,
        title=book.title,
        author=book.author,
        original_title=book.original_title,
        category=book.category,
        tagline=book.tagline,
        quotes=_parse_quotes(book.quotes),
        time=book.time,
        cover_url=book.cover_url,
        is_featured=book.is_featured,
        is_hot=book.is_hot,
        is_free=book.is_free,
        chapters=chapter_briefs,
    )


@router.get("/{book_id}/chapters/{chapter_index}", response_model=ChapterDetail)
def get_chapter(book_id: int, chapter_index: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    chapter = (
        db.query(Chapter)
        .filter(Chapter.book_id == book_id, Chapter.index == chapter_index)
        .first()
    )
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    total = db.query(Chapter).filter(Chapter.book_id == book_id).count()

    return ChapterDetail(
        index=chapter.index,
        title=chapter.title,
        content=chapter.content,
        audio_url=chapter.audio_url,
        total_chapters=total,
        book_title=book.title,
        book_cover_url=book.cover_url,
    )
