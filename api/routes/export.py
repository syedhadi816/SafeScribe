"""Export API: email only."""
import os
from datetime import datetime

from fastapi import APIRouter, HTTPException

from api.services import storage
from api.services.email_sender import send_meeting_pdf

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/email/{meeting_id}")
def email_meeting(meeting_id: str):
    meeting = storage.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    pdf_path = meeting.get("pdfPath")
    if not pdf_path or not os.path.isfile(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    try:
        send_meeting_pdf(
            meeting.get("title") or "Meeting Notes",
            pdf_path,
            storage.get_setting("email_address") or "",
            meeting_created_at=meeting.get("createdAt"),
            meeting_duration=meeting.get("duration"),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")
    emailed_at = datetime.now().isoformat()
    storage.update_meeting_emailed(meeting_id, True, emailed_at=emailed_at)
    storage.delete_meeting_files(meeting_id)
    return {"status": "sent"}
