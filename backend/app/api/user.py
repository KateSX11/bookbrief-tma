from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.book import Book, ReadingHistory

router = APIRouter(prefix="/api/user", tags=["user"])


class HistoryItem(BaseModel):
    book_id: int
    book_title: str
    book_cover_url: Optional[str] = None
    book_category: str = ""
    last_chapter: int
    mode: str
    updated_at: str


class SaveProgressRequest(BaseModel):
    tg_user_id: str
    book_id: int
    last_chapter: int
    mode: str = "read"


@router.get("/history", response_model=list[HistoryItem])
def get_history(tg_user_id: str = Query(...), db: Session = Depends(get_db)):
    records = (
        db.query(ReadingHistory)
        .filter(ReadingHistory.tg_user_id == tg_user_id)
        .order_by(ReadingHistory.updated_at.desc())
        .limit(20)
        .all()
    )

    items = []
    for r in records:
        book = db.query(Book).filter(Book.id == r.book_id).first()
        if not book:
            continue
        items.append(
            HistoryItem(
                book_id=r.book_id,
                book_title=book.title,
                book_cover_url=book.cover_url,
                book_category=book.category,
                last_chapter=r.last_chapter,
                mode=r.mode,
                updated_at=r.updated_at.isoformat() if r.updated_at else "",
            )
        )
    return items


@router.post("/history")
def save_progress(req: SaveProgressRequest, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == req.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    record = (
        db.query(ReadingHistory)
        .filter(
            ReadingHistory.tg_user_id == req.tg_user_id,
            ReadingHistory.book_id == req.book_id,
        )
        .first()
    )

    if record:
        record.last_chapter = req.last_chapter
        record.mode = req.mode
        record.updated_at = datetime.utcnow()
    else:
        record = ReadingHistory(
            tg_user_id=req.tg_user_id,
            book_id=req.book_id,
            last_chapter=req.last_chapter,
            mode=req.mode,
        )
        db.add(record)

    db.commit()
    return {"ok": True}
