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

# Brevo transactional email (SMTP)
# Set BREVO_SMTP_* via environment (e.g. /etc/safescribe/env on Pi). No defaults for secrets.
BREVO_SMTP_HOST = os.environ.get("BREVO_SMTP_HOST", "smtp-relay.brevo.com")
BREVO_SMTP_PORT = int(os.environ.get("BREVO_SMTP_PORT", "587"))
BREVO_SMTP_LOGIN = os.environ.get("BREVO_SMTP_LOGIN", "")
BREVO_SMTP_KEY = os.environ.get("BREVO_SMTP_KEY", "")
BREVO_SMTP_FROM = os.environ.get("BREVO_SMTP_FROM", "")
