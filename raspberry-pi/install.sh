#!/bin/bash
# SafeScribe Raspberry Pi installer
# Run from project root: ./raspberry-pi/install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== SafeScribe Raspberry Pi Installer ==="
echo "Project: $PROJECT_ROOT"
echo ""

# 1. Install system packages
echo "Step 1/11: Installing system packages..."
sudo apt-get update
sudo apt-get install -y chromium unclutter python3-venv python3-pip nodejs npm curl x11-xserver-utils libportaudio2 portaudio19-dev zstd network-manager

# 2. Create Python virtual environment
echo "Step 2/11: Setting up Python virtual environment..."
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
./venv/bin/pip install uvicorn fastapi

# 3. Download NLTK data (punkt and punkt_tab for sentence tokenization)
echo "Step 3/11: Downloading NLTK data..."
./venv/bin/python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('punkt_tab', quiet=True)"

# 4. Install Ollama (needed for meeting summaries)
echo "Step 4/11: Installing Ollama..."
if ! command -v ollama >/dev/null 2>&1; then
  if ! curl -fsSL https://ollama.com/install.sh | sh 2>/dev/null; then
    echo "Official install failed (404), using GitHub releases..."
    OLLAMA_VER="v0.16.3"
    curl -fsSL "https://github.com/ollama/ollama/releases/download/${OLLAMA_VER}/ollama-linux-arm64.tar.zst" \
      | zstd -d | sudo tar -xf - -C /usr/local
    sudo ln -sf /usr/local/ollama /usr/local/bin/ollama
    if ! id ollama >/dev/null 2>&1; then
      sudo useradd -r -s /bin/false -U -m -d /usr/share/ollama ollama
    fi
    sudo tee /etc/systemd/system/ollama.service > /dev/null << 'OLLAMASVC'
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

[Install]
WantedBy=default.target
OLLAMASVC
  fi
  sudo systemctl daemon-reload
  sudo systemctl enable ollama
  sudo systemctl start ollama
  sleep 5
fi
echo "Step 5/11: Pulling Ollama model (gemma2:2b-instruct-q4_0)..."
ollama pull gemma2:2b-instruct-q4_0 2>/dev/null || echo "Ollama model pull - run 'ollama pull gemma2:2b-instruct-q4_0' manually if needed"

# 6. Build frontend
echo "Step 6/11: Building frontend..."
cd "Dev Stuff/AI Note-Taking Device"
npm install
npm run build
cd "$PROJECT_ROOT"

# 7. Make kiosk script executable
echo "Step 7/11: Making kiosk script executable..."
chmod +x raspberry-pi/kiosk.sh

# 8. Install systemd service for backend only (kiosk uses autostart)
echo "Step 8/11: Installing backend systemd service..."
SAFESCRIBE_PATH="$PROJECT_ROOT"
SAFESCRIBE_USER="$(whoami)"
sed -e "s|SAFESCRIBE_PATH|$SAFESCRIBE_PATH|g" -e "s|SAFESCRIBE_USER|$SAFESCRIBE_USER|g" raspberry-pi/safescribe.service | sudo tee /etc/systemd/system/safescribe.service > /dev/null
sudo systemctl daemon-reload
sudo systemctl enable safescribe.service
sudo systemctl disable safescribe-kiosk.service 2>/dev/null || true
# Brevo email: create env file if missing (user must add SMTP key)
sudo mkdir -p /etc/safescribe
if [ ! -f /etc/safescribe/env ]; then
  sudo tee /etc/safescribe/env > /dev/null << 'ENVFILE'
# Brevo SMTP - get key from Brevo: Settings → SMTP & API → SMTP key
BREVO_SMTP_LOGIN=
BREVO_SMTP_KEY=
BREVO_SMTP_FROM=notes@safescribe.site
ENVFILE
  echo "  Created /etc/safescribe/env — add your Brevo SMTP key and restart: sudo systemctl restart safescribe"
fi

# 9. Allow SafeScribe user to control WiFi (fixes "Not Authorized to control networking")
echo "Step 9/11: Configuring WiFi permissions..."
SAFESCRIBE_USER="$(whoami)"
sudo tee /etc/polkit-1/rules.d/50-safescribe-network.rules > /dev/null << POLKIT
polkit.addRule(function(action, subject) {
    if (action.id.indexOf("org.freedesktop.NetworkManager.") === 0 && subject.user === "${SAFESCRIBE_USER}") {
        return polkit.Result.YES;
    }
});
POLKIT
if getent group netdev >/dev/null 2>&1; then
  sudo usermod -aG netdev "$SAFESCRIBE_USER" 2>/dev/null || true
fi

# 10. Set SafeScribe wallpaper as Pi desktop default
echo "Step 10/11: Setting desktop wallpaper..."
WALLPAPER_SRC="$PROJECT_ROOT/Wallpaper.png"
if [ -f "$WALLPAPER_SRC" ]; then
  for conf in "$HOME/.config/pcmanfm/LXDE-pi/desktop-items-0.conf" "$HOME/.config/pcmanfm/LXDE/desktop-items-0.conf"; do
    mkdir -p "$(dirname "$conf")"
    if [ -f "$conf" ]; then
      sed -i "s|^wallpaper=.*|wallpaper=$WALLPAPER_SRC|" "$conf" 2>/dev/null || true
      grep -q "^wallpaper=" "$conf" 2>/dev/null || echo "wallpaper=$WALLPAPER_SRC" >> "$conf"
    else
      printf "%s\n" "[*]" "wallpaper_mode=stretch" "wallpaper=$WALLPAPER_SRC" > "$conf"
    fi
  done
  # Apply immediately if desktop is running (pcmanfm for LXDE/Pixel)
  DISPLAY=:0 pcmanfm --set-wallpaper="$WALLPAPER_SRC" 2>/dev/null || true
  echo "  Wallpaper set to Wallpaper.png"
else
  echo "  Wallpaper.png not found, skipping"
fi

# 11. Install autostart for kiosk (runs when user logs into desktop)
echo "Step 11/11: Installing kiosk autostart..."
mkdir -p "$HOME/.config/autostart"
sed "s|SAFESCRIBE_PATH|$SAFESCRIBE_PATH|g" raspberry-pi/safescribe-kiosk.desktop > "$HOME/.config/autostart/safescribe-kiosk.desktop"

echo ""
echo "=== Installation complete ==="
echo ""
echo "Next steps:"
echo "1. Enable auto-login: sudo raspi-config -> Boot Options -> Desktop Autologin"
echo "2. Reboot to test: sudo reboot"
echo ""
echo "SafeScribe backend starts on boot; kiosk (Chromium) starts when you log in."
echo ""
echo "If system notifications (WiFi/updates banners) appear: right-click panel ->"
echo "  Notifications -> uncheck Show notifications. Or: sudo raspi-config ->"
echo "  System Options -> disable update notifications."
echo "To start kiosk now: $PROJECT_ROOT/raspberry-pi/kiosk.sh"
