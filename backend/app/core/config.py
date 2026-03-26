import os
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "BookBrief TMA"
    DATABASE_URL: str = "sqlite:///./data/bookbrief.db"
    MEDIA_DIR: Path = Path("media")
    STATIC_DIR: Path = Path("static")
    TELEGRAM_BOT_TOKEN: str = ""
    OPENAI_API_KEY: str = ""
    WEBAPP_URL: str = ""
    CORS_ORIGINS: list[str] = []

    model_config = {"env_prefix": "", "extra": "ignore"}


settings = Settings()

if not settings.CORS_ORIGINS:
    webapp_url = settings.WEBAPP_URL or os.getenv("RAILWAY_PUBLIC_DOMAIN", "")
    if webapp_url:
        origins = [webapp_url]
        if not webapp_url.startswith("http"):
            origins = [f"https://{webapp_url}"]
        settings.CORS_ORIGINS = origins
    else:
        settings.CORS_ORIGINS = ["*"]
