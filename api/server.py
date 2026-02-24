"""SafeScribe FastAPI server - GUI-only backend."""
import threading
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import recording, meetings, export, settings, auth

app = FastAPI(
    title="SafeScribe API",
    description="AI notetaking desk device",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recording.router, prefix="/api")
app.include_router(meetings.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(auth.router, prefix="/api")


@app.on_event("startup")
def startup_preload_whisper():
    """Preload Whisper in background so Start Listening is responsive on first click."""
    def _preload():
        try:
            recording.recorder_service.preload_whisper()
        except Exception:
            pass  # Will load on first start_recording if preload fails

    threading.Thread(target=_preload, daemon=True).start()


@app.get("/health")
def health():
    return {"status": "ok"}


_FRONTEND_BUILD = Path(__file__).resolve().parent.parent / "frontend" / "build"
if _FRONTEND_BUILD.exists():
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=str(_FRONTEND_BUILD), html=True), name="frontend")
