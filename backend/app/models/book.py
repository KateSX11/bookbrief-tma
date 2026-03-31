from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    original_title = Column(String, nullable=True)
    category = Column(String, nullable=False, index=True)
    tagline = Column(String, nullable=False)
    quotes = Column(Text, nullable=True)
    time = Column(Integer, default=15)
    cover_url = Column(String, nullable=True)
    is_featured = Column(Boolean, default=False, index=True)
    is_hot = Column(Boolean, default=False, index=True)
    is_free = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    status = Column(String, default="published", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chapters = relationship("Chapter", back_populates="book", order_by="Chapter.index")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    index = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    audio_url = Column(String, nullable=True)

    book = relationship("Book", back_populates="chapters")


class ReadingHistory(Base):
    __tablename__ = "reading_history"

    id = Column(Integer, primary_key=True, index=True)
    tg_user_id = Column(String, nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    last_chapter = Column(Integer, default=1)
    mode = Column(String, default="read")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    book = relationship("Book")
