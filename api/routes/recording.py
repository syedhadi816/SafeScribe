"""Recording API."""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

from api.services.recorder_service import RecorderService

router = APIRouter(prefix="/recording", tags=["recording"])
recorder_service = RecorderService()


class StopRecordingBody(BaseModel):
    start_time: int | None = None


@router.post("/start")
def start_recording():
    if recorder_service.state == "RECORDING":
        raise HTTPException(status_code=400, detail="Already recording")
    if recorder_service.state == "PAUSED":
        raise HTTPException(status_code=400, detail="Already recording")
    try:
        recorder_service.start_recording()
    except Exception as e:
        recorder_service.abort_recording()
        raise HTTPException(
            status_code=500,
            detail=str(e) or "Failed to start recording. Check audio device and Whisper model."
        )
    return {"status": "recording"}


@router.post("/abort")
def abort_recording():
    """Stop recording without processing. Resets backend so user can retry."""
    recorder_service.abort_recording()
    return {"status": "aborted"}


@router.post("/pause")
def pause_recording():
    recorder_service.pause_recording()
    return {"status": "paused"}


@router.post("/resume")
def resume_recording():
    recorder_service.resume_recording()
    return {"status": "recording"}


@router.post("/stop")
def stop_recording(body: StopRecordingBody = Body(default_factory=StopRecordingBody)):
    import time
    start_time = body.start_time if body else None
    if recorder_service.state not in ("RECORDING", "PAUSED"):
        raise HTTPException(status_code=400, detail="Not recording")
    duration_seconds = max(1, int((time.time() * 1000 - start_time) / 1000)) if start_time else 60
    try:
        meeting_id = recorder_service.stop_recording(duration_seconds)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e) or "Processing failed. Check Ollama is running and model is pulled."
        )
    if not meeting_id:
        raise HTTPException(status_code=400, detail="No transcript captured.")
    return {"meetingId": meeting_id}


@router.get("/transcript")
def get_transcript():
    return {"transcript": recorder_service.get_live_transcript()}


@router.get("/status")
def get_status():
    return {"state": recorder_service.state}
