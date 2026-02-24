"""Meetings API."""
from fastapi import APIRouter, HTTPException

from api.services import storage

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("")
def list_meetings():
    meetings = storage.list_meetings()
    jobs = storage.list_processing_jobs()
    # Merge processing jobs as synthetic meetings (status=processing) at top
    merged = list(jobs) + meetings
    merged.sort(key=lambda m: m["createdAt"], reverse=True)
    stats = storage.get_storage_stats()
    return {"meetings": merged, "storageUsedMB": stats["usedMB"], "storageTotalMB": stats["totalMB"]}


@router.get("/{meeting_id}")
def get_meeting(meeting_id: str):
    meeting = storage.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: str):
    if not storage.delete_meeting(meeting_id):
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"status": "deleted"}
