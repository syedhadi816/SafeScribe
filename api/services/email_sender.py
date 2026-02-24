"""Email sending via SMTP - OTP verification and meeting PDFs. Use your email + 16-char app password."""
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_APP_PASSWORD, SMTP_FROM


def _get_smtp_config() -> dict | None:
    """Return SMTP config if user and app password are set."""
    if not SMTP_USER or not SMTP_APP_PASSWORD:
        return None
    return {
        "host": SMTP_HOST,
        "port": SMTP_PORT,
        "login": SMTP_USER,
        "password": SMTP_APP_PASSWORD,
    }


def _from_address() -> str:
    return SMTP_FROM.strip() or SMTP_USER


def _send_email(to_email: str, subject: str, body_text: str, attachments: list[tuple[str, bytes, str]] | None = None) -> bool:
    """Send email via SMTP (Gmail, Outlook, etc. with app password)."""
    cfg = _get_smtp_config()
    if not cfg:
        raise ValueError("Email not configured. Set SMTP_USER and SMTP_APP_PASSWORD in /etc/safescribe/env (use a 16-character app password, not your normal password).")
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = _from_address()
    msg["To"] = to_email
    msg.attach(MIMEText(body_text, "plain"))
    if attachments:
        for name, data, ctype in attachments:
            part = MIMEApplication(data, _subtype=ctype.split("/")[-1] if "/" in ctype else "octet-stream")
            part.add_header("Content-Disposition", "attachment", filename=name)
            msg.attach(part)
    with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
        server.starttls()
        server.login(cfg["login"], cfg["password"])
        server.send_message(msg)
    return True


def send_otp_email(to_email: str, code: str) -> bool:
    """Send 4-digit OTP code to verify email address."""
    body = f"Your SafeScribe verification code is: {code}\n\nThis code expires in 10 minutes."
    _send_email(to_email, "SafeScribe verification code", body)
    return True


def _format_duration(seconds: int) -> str:
    """Format duration as e.g. '45 min' or '1h 30 min'."""
    if seconds < 60:
        return f"{seconds} sec"
    mins = seconds // 60
    if mins < 60:
        return f"{mins} min"
    hrs = mins // 60
    remain = mins % 60
    return f"{hrs}h {remain} min" if remain else f"{hrs} hr"


def _format_datetime(iso_string: str) -> str:
    """Format ISO datetime for display."""
    from datetime import datetime
    try:
        dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y at %I:%M %p")
    except (ValueError, TypeError):
        return iso_string


def _build_meeting_email_body(
    meeting_title: str,
    meeting_time: str | None = None,
    meeting_duration: int | None = None,
) -> str:
    """Build professional, concise email body for meeting notes."""
    lines = [
        meeting_title or "Meeting Notes",
        "",
    ]
    if meeting_time:
        lines.extend(["Time: " + meeting_time, ""])
    if meeting_duration is not None:
        lines.extend(["Length: " + _format_duration(meeting_duration), ""])
    lines.extend([
        "Your meeting notes are attached.",
        "",
        "Questions? Visit safescribe.site",
        "",
        "Please keep this email—your device does not retain notes or transcripts.",
    ])
    return "\n".join(lines)


def send_meeting_pdf(
    meeting_title: str,
    pdf_path: str,
    recipient_email: str,
    meeting_created_at: str | None = None,
    meeting_duration: int | None = None,
    smtp_config: dict | None = None,
) -> bool:
    """Send meeting PDF to recipient via SMTP (email + app password)."""
    body = _build_meeting_email_body(
        meeting_title,
        meeting_time=_format_datetime(meeting_created_at) if meeting_created_at else None,
        meeting_duration=meeting_duration,
    )
    if smtp_config:
        # Legacy/test path
        msg = MIMEMultipart()
        msg["Subject"] = f"SafeScribe: {meeting_title or 'Meeting Notes'}"
        msg["From"] = smtp_config["email"]
        msg["To"] = recipient_email
        msg.attach(MIMEText(body, "plain"))
        with open(pdf_path, "rb") as f:
            part = MIMEApplication(f.read(), _subtype="pdf")
            part.add_header("Content-Disposition", "attachment", filename=os.path.basename(pdf_path))
            msg.attach(part)
        with smtplib.SMTP(smtp_config["host"], smtp_config["port"]) as server:
            server.starttls()
            server.login(smtp_config["email"], smtp_config["password"])
            server.send_message(msg)
        return True
    # SMTP path (app password)
    if not _get_smtp_config():
        raise ValueError("Email not configured. Set SMTP_USER and SMTP_APP_PASSWORD in /etc/safescribe/env (use a 16-character app password).")
    with open(pdf_path, "rb") as f:
        pdf_data = f.read()
    _send_email(
        recipient_email,
        f"SafeScribe: {meeting_title or 'Meeting Notes'}",
        body,
        attachments=[(os.path.basename(pdf_path), pdf_data, "application/pdf")],
    )
    return True
