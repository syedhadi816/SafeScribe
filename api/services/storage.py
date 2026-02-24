"""Storage: SQLite for meeting metadata."""
import json
import os
import re
import sqlite3
from typing import Optional

from config import MEETINGS_DIR, DB_PATH


def _init_db() -> None:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS meetings (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                duration INTEGER NOT NULL,
                title TEXT,
                transcript_path TEXT NOT NULL,
                pdf_path TEXT NOT NULL,
                transcript TEXT NOT NULL,
                summary TEXT NOT NULL,
                action_items TEXT NOT NULL,
                decisions TEXT NOT NULL,
                topics TEXT NOT NULL,
                audio_size_mb REAL DEFAULT 0,
                transcript_size_mb REAL DEFAULT 0,
                pdf_size_mb REAL DEFAULT 0,
                exported_usb INTEGER DEFAULT 0,
                emailed INTEGER DEFAULT 0,
                emailed_at TEXT
            )
        """)
        try:
            conn.execute("ALTER TABLE meetings ADD COLUMN emailed_at TEXT")
            conn.commit()
        except sqlite3.OperationalError:
            pass
        conn.execute("""
            CREATE TABLE IF NOT EXISTS processing_jobs (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                duration INTEGER NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        conn.commit()
    finally:
        conn.close()


def _json_list(value: str) -> list:
    if not value:
        return []
    try:
        return json.loads(value)
    except Exception:
        return []


def _serialize_list(lst: list) -> str:
    return json.dumps(lst)


def create_meeting(
    meeting_id: str,
    created_at: str,
    duration: int,
    title: str,
    transcript_path: str,
    pdf_path: str,
    transcript: str,
    summary: str,
    action_items: list,
    decisions: list,
    topics: list,
    audio_size_mb: float = 0,
    transcript_size_mb: float = 0,
    pdf_size_mb: float = 0,
) -> dict:
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            """
            INSERT INTO meetings (
                id, created_at, duration, title, transcript_path, pdf_path,
                transcript, summary, action_items, decisions, topics,
                audio_size_mb, transcript_size_mb, pdf_size_mb, exported_usb, emailed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
            """,
            (
                meeting_id, created_at, duration, title, transcript_path, pdf_path,
                transcript, summary, _serialize_list(action_items), _serialize_list(decisions), _serialize_list(topics),
                audio_size_mb, transcript_size_mb, pdf_size_mb,
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return get_meeting(meeting_id)


def get_meeting(meeting_id: str) -> Optional[dict]:
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
        if not row:
            return None
        return _row_to_meeting(row)
    finally:
        conn.close()


def _row_to_meeting(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "createdAt": row["created_at"],
        "duration": row["duration"],
        "title": row["title"] or "",
        "transcript": row["transcript"],
        "summary": row["summary"],
        "actionItems": _json_list(row["action_items"]),
        "decisions": _json_list(row["decisions"]),
        "topics": _json_list(row["topics"]),
        "exportedUsb": bool(row["exported_usb"]),
        "emailed": bool(row["emailed"]),
        "emailedAt": row["emailed_at"] if "emailed_at" in row.keys() else None,
        "audioSize": row["audio_size_mb"] or 0,
        "transcriptSize": row["transcript_size_mb"] or 0,
        "pdfSize": row["pdf_size_mb"] or 0,
        "transcriptPath": row["transcript_path"],
        "pdfPath": row["pdf_path"],
    }


def create_processing_job(job_id: str, created_at: str, duration: int) -> None:
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "INSERT INTO processing_jobs (id, created_at, duration) VALUES (?, ?, ?)",
            (job_id, created_at, duration),
        )
        conn.commit()
    finally:
        conn.close()


def list_processing_jobs() -> list:
    """Return processing jobs as meeting-like dicts for frontend."""
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute("SELECT * FROM processing_jobs ORDER BY created_at DESC").fetchall()
        return [
            {
                "id": r["id"],
                "createdAt": r["created_at"],
                "duration": r["duration"],
                "title": "Processing...",
                "status": "processing",
                "emailed": False,
                "emailedAt": None,
                "exportedUsb": False,
            }
            for r in rows
        ]
    finally:
        conn.close()


def delete_processing_job(job_id: str) -> bool:
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.execute("DELETE FROM processing_jobs WHERE id = ?", (job_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def list_meetings() -> list:
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute("SELECT * FROM meetings ORDER BY created_at DESC").fetchall()
        return [_row_to_meeting(r) for r in rows]
    finally:
        conn.close()


def update_meeting_exported_usb(meeting_id: str, exported: bool) -> None:
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("UPDATE meetings SET exported_usb = ? WHERE id = ?", (1 if exported else 0, meeting_id))
        conn.commit()
    finally:
        conn.close()


def update_meeting_emailed(meeting_id: str, emailed: bool, emailed_at: str | None = None) -> None:
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    try:
        if emailed_at is not None:
            conn.execute(
                "UPDATE meetings SET emailed = ?, emailed_at = ? WHERE id = ?",
                (1 if emailed else 0, emailed_at, meeting_id),
            )
        else:
            conn.execute("UPDATE meetings SET emailed = ? WHERE id = ?", (1 if emailed else 0, meeting_id))
        conn.commit()
    finally:
        conn.close()


def delete_meeting_files(meeting_id: str) -> None:
    """Delete transcript and PDF files after successful email. Keep meeting row."""
    meeting = get_meeting(meeting_id)
    if not meeting:
        return
    for path in (meeting.get("transcriptPath"), meeting.get("pdfPath")):
        if path and os.path.isfile(path):
            try:
                os.remove(path)
            except OSError:
                pass


def delete_meeting(meeting_id: str) -> bool:
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.execute("DELETE FROM meetings WHERE id = ?", (meeting_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def get_storage_stats() -> dict:
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    try:
        row = conn.execute(
            "SELECT COALESCE(SUM(audio_size_mb + transcript_size_mb + pdf_size_mb), 0) as used FROM meetings"
        ).fetchone()
        used_mb = row[0] if row else 0
    finally:
        conn.close()
    return {"usedMB": used_mb, "totalMB": 32000}


def get_setting(key: str) -> Optional[str]:
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    try:
        row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
        return row[0] if row else None
    finally:
        conn.close()


def set_setting(key: str, value: str) -> None:
    _init_db()
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
        conn.commit()
    finally:
        conn.close()
