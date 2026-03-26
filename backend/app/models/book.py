from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title_zh = Column(String, nullable=False)
    title_ru = Column(String, nullable=False)
    author_zh = Column(String, nullable=False)
    author_ru = Column(String, nullable=False)
    cover_url = Column(String, nullable=True)
    category = Column(String, nullable=False, index=True)
    summary_zh = Column(Text, nullable=True)
    summary_ru = Column(Text, nullable=True)
    audio_zh_url = Column(String, nullable=True)
    audio_ru_url = Column(String, nullable=True)
    read_time_minutes = Column(Integer, default=15)
    listen_time_minutes = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.utcnow)
