#!/usr/bin/env python3
"""Test SMTP (email + app password) - run from project root: python test_smtp.py your@email.com"""
import sys
import smtplib
from email.mime.text import MIMEText

from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_APP_PASSWORD, SMTP_FROM


def _from_addr():
    return (SMTP_FROM or SMTP_USER or "").strip()


def main():
    to_email = sys.argv[1] if len(sys.argv) > 1 else (SMTP_USER or "test@example.com")
    print("Testing SMTP (email + app password)...")
    print(f"  Host: {SMTP_HOST}:{SMTP_PORT}")
    print(f"  User: {SMTP_USER or '(not set)'}")
    print(f"  From: {_from_addr() or SMTP_USER or '(not set)'}")
    print(f"  App password: {'*' * 4}...{SMTP_APP_PASSWORD[-4:] if SMTP_APP_PASSWORD else 'NOT SET'}")
    print(f"  To: {to_email}")
    if not SMTP_USER or not SMTP_APP_PASSWORD:
        print("ERROR: Set SMTP_USER and SMTP_APP_PASSWORD (16-char app password) in /etc/safescribe/env or environment.")
        sys.exit(1)
    msg = MIMEText("Test from SafeScribe - if you see this, SMTP works!")
    msg["Subject"] = "SafeScribe test"
    msg["From"] = _from_addr() or SMTP_USER
    msg["To"] = to_email
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            print("  Connecting...")
            server.starttls()
            print("  Logging in...")
            server.login(SMTP_USER, SMTP_APP_PASSWORD)
            print("  Sending...")
            server.send_message(msg)
        print("SUCCESS: Email sent. Check inbox (and spam) at", to_email)
    except Exception as e:
        print(f"FAILED: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
