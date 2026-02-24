"""SafeScribe configuration - paths, Ollama, audio, etc."""
import os

# Data paths - use project-relative path for dev, ~/safescribe for Pi
_PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
_DATA_DIR_DEFAULT = os.path.join(_PROJECT_ROOT, "data") if os.path.exists(_PROJECT_ROOT) else os.path.expanduser("~/safescribe")
DATA_DIR = os.environ.get("SAFESCRIBE_DATA_DIR", _DATA_DIR_DEFAULT)
MEETINGS_DIR = os.path.join(DATA_DIR, "meetings")
DB_PATH = os.path.join(DATA_DIR, "safescribe.db")

# Ensure directories exist on import
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MEETINGS_DIR, exist_ok=True)

# Ollama
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

# Audio (for sounddevice - device index or name)
AUDIO_DEVICE = os.environ.get("AUDIO_DEVICE", None)  # None = default system device

# USB mount points (check in order)
USB_MOUNT_POINTS = [
    "/media/usb0",
    "/media/usb1",
    "/media/pi",
]

# API
API_HOST = os.environ.get("SAFESCRIBE_API_HOST", "0.0.0.0")
API_PORT = int(os.environ.get("SAFESCRIBE_API_PORT", "8765"))

# Email (SMTP) – use your email + 16-character app password (e.g. Gmail App Password)
# Set via environment (e.g. /etc/safescribe/env on Pi). Defaults below are for Gmail.
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")           # Your email (e.g. you@gmail.com)
SMTP_APP_PASSWORD = os.environ.get("SMTP_APP_PASSWORD", "")  # 16-char app password, not your normal password
SMTP_FROM = os.environ.get("SMTP_FROM", "")          # Optional; defaults to SMTP_USER when sending
