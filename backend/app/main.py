from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.api.books import router as books_router
from app.api.user import router as user_router
from app.core.config import settings
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

settings.MEDIA_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(settings.MEDIA_DIR)), name="media")

app.include_router(books_router)
app.include_router(user_router)


@app.get("/health")
def health():
    return {"status": "ok"}


STATIC_DIR = Path(settings.STATIC_DIR)
if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
    app.mount(
        "/assets",
        StaticFiles(directory=str(STATIC_DIR / "assets")),
        name="frontend-assets",
    )

    @app.get("/{path:path}")
    async def serve_frontend(request: Request, path: str):
        file_path = STATIC_DIR / path
        if file_path.is_file() and path.startswith("assets/"):
            return FileResponse(file_path)
        html = (STATIC_DIR / "index.html").read_text()
        return HTMLResponse(
            content=html,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
