"""Settings API."""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

from api.services import storage
from api.services import wifi as wifi_service
from config import DB_PATH

router = APIRouter(prefix="/settings", tags=["settings"])


class EmailSettings(BaseModel):
    email: str
    password: str


class WifiConnectBody(BaseModel):
    ssid: str
    password: str = ""


class SetupCompleteBody(BaseModel):
    complete: bool = True


@router.get("/wifi/status")
def wifi_status():
    return wifi_service.wifi_status()


@router.get("/wifi/scan")
def wifi_scan():
    return {"networks": wifi_service.wifi_scan()}


@router.post("/wifi/connect")
def wifi_connect(body: WifiConnectBody):
    ok, message = wifi_service.wifi_connect(body.ssid, body.password or "")
    if not ok:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "connected", "message": message}


@router.get("")
def get_settings():
    email = storage.get_setting("email_address")
    return {
        "emailConfigured": bool(email),
        "emailAddress": email,
        "setupComplete": storage.get_setting("setup_complete") == "true",
    }


@router.post("/email")
def save_email(data: EmailSettings):
    storage.set_setting("email_address", data.email)
    storage.set_setting("email_password", data.password)
    storage.set_setting("setup_complete", "true")
    return {"status": "saved"}


@router.post("/setup-complete")
def set_setup_complete(body: SetupCompleteBody | None = Body(default=None)):
    complete = body.complete if body else True
    storage.set_setting("setup_complete", "true" if complete else "false")
    return {"status": "updated"}


@router.post("/factory-reset")
def factory_reset():
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("DELETE FROM meetings")
        conn.execute("DELETE FROM settings")
        conn.commit()
    finally:
        conn.close()
    return {"status": "reset"}
