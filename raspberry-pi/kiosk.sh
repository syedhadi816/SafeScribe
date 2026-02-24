#!/bin/bash
# Wait for SafeScribe backend and display, then launch Chromium in kiosk mode

URL="http://localhost:8765"

# Wait for display to be ready
for i in $(seq 1 30); do
  xset q -display :0 >/dev/null 2>&1 && break
  sleep 1
done
MAX_WAIT=60
ELAPSED=0

# Wait for backend to be ready
while [ $ELAPSED -lt $MAX_WAIT ]; do
  if curl -s -o /dev/null -w "%{http_code}" "$URL/health" 2>/dev/null | grep -q "200"; then
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

# Disable screen blanking
xset s noblank 2>/dev/null || true
xset s off 2>/dev/null || true
xset -dpms 2>/dev/null || true

# Hide cursor after 0.5 seconds idle
unclutter -idle 0.5 -root &

# Fix Chromium "crashed" state to avoid restore dialog on reboot
CHROMIUM_PREFS="${HOME}/.config/chromium/Default/Preferences"
if [ -f "$CHROMIUM_PREFS" ]; then
  sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CHROMIUM_PREFS" 2>/dev/null
  sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' "$CHROMIUM_PREFS" 2>/dev/null
fi

# Suppress system notifications (WiFi/update banners) where possible
if command -v gsettings >/dev/null 2>&1; then
  gsettings set org.gnome.desktop.notifications show-banners false 2>/dev/null || true
fi
# Hide the LXDE panel to avoid notification banners (optional - uncomment if banners persist)
# killall lxpanel 2>/dev/null || true

# Launch Chromium in kiosk mode (use 'chromium' on newer Pi OS)
# --disable-features=TranslateUI and --disable-session-crashed-bubble help reduce UI overlays
if command -v chromium >/dev/null 2>&1; then
  chromium --kiosk --noerrdialogs --disable-infobars --disable-features=TranslateUI --disable-session-crashed-bubble --app="$URL" 2>/dev/null
else
  chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-features=TranslateUI --disable-session-crashed-bubble --app="$URL" 2>/dev/null
fi
