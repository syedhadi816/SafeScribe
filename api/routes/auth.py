"""OTP email verification - send and verify 4-digit code."""
import random
import string
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.services import storage
from api.services import email_sender

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory: email -> {code, expires_at}
_otp_pending: dict[str, dict] = {}
OTP_EXPIRY_SEC = 600  # 10 minutes


class SendOtpBody(BaseModel):
    email: str


class VerifyOtpBody(BaseModel):
    email: str
    code: str


def _normalize_email(e: str) -> str:
    return e.strip().lower()


@router.get("/email-status")
def email_status():
    """Check if Brevo SMTP is configured (for debugging)."""
    cfg = email_sender._get_brevo_config()
    return {"configured": cfg is not None, "hasKey": bool(cfg)}


@router.post("/send-otp")
def send_otp(body: SendOtpBody):
    email = _normalize_email(body.email)
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    code = "".join(random.choices(string.digits, k=4))
    try:
        email_sender.send_otp_email(email, code)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")
    _otp_pending[email] = {"code": code, "expires_at": time.time() + OTP_EXPIRY_SEC}
    return {"status": "sent"}


@router.post("/verify-otp")
def verify_otp(body: VerifyOtpBody):
    email = _normalize_email(body.email)
    code = body.code.strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    if not code or len(code) != 4 or not code.isdigit():
        raise HTTPException(status_code=400, detail="Invalid code. Enter the 4-digit code.")
    pending = _otp_pending.get(email)
    if not pending:
        raise HTTPException(status_code=400, detail="No code sent to this email. Request a new code.")
    if time.time() > pending["expires_at"]:
        del _otp_pending[email]
        raise HTTPException(status_code=400, detail="Code expired. Request a new code.")
    if pending["code"] != code:
        raise HTTPException(status_code=400, detail="Incorrect code. Try again.")
    del _otp_pending[email]
    storage.set_setting("email_address", email)
    storage.set_setting("setup_complete", "true")
    return {"status": "verified", "email": email}
