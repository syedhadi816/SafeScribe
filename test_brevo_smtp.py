#!/usr/bin/env python3
"""Test Brevo SMTP - run from project root: python test_brevo_smtp.py your@email.com"""
import sys
import smtplib
from email.mime.text import MIMEText

# Use same config as the app
from config import BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_LOGIN, BREVO_SMTP_KEY, BREVO_SMTP_FROM

def main():
    to_email = sys.argv[1] if len(sys.argv) > 1 else "test@example.com"
    print(f"Testing Brevo SMTP...")
    print(f"  Host: {BREVO_SMTP_HOST}:{BREVO_SMTP_PORT}")
    print(f"  Login: {BREVO_SMTP_LOGIN}")
    print(f"  From: {BREVO_SMTP_FROM}")
    print(f"  Key: {'*' * 20}...{BREVO_SMTP_KEY[-8:] if BREVO_SMTP_KEY else 'NOT SET'}")
    print(f"  To: {to_email}")
    if not BREVO_SMTP_LOGIN or not BREVO_SMTP_KEY:
        print("ERROR: BREVO_SMTP_LOGIN or BREVO_SMTP_KEY is empty!")
        sys.exit(1)
    msg = MIMEText("Test from SafeScribe - if you see this, Brevo SMTP works!")
    msg["Subject"] = "SafeScribe test"
    msg["From"] = BREVO_SMTP_FROM
    msg["To"] = to_email
    try:
        with smtplib.SMTP(BREVO_SMTP_HOST, BREVO_SMTP_PORT, timeout=30) as server:
            print("  Connecting...")
            server.starttls()
            print("  Logging in...")
            server.login(BREVO_SMTP_LOGIN, BREVO_SMTP_KEY)
            print("  Sending...")
            server.send_message(msg)
        print("SUCCESS: Email sent. Check inbox (and spam) at", to_email)
    except Exception as e:
        print(f"FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
