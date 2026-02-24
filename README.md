# SafeScribe

**AI meeting notes on a Raspberry Pi kiosk — record, transcribe, summarize, and email.**

SafeScribe runs on a Raspberry Pi 5 as a touch-friendly kiosk. Record a meeting, get a transcript (Whisper) and summary (Ollama), then receive the notes by email. No cloud required for transcription or summarization; only email delivery uses your own account (e.g. Gmail with an app password).

---

## Features

- **Record** — One-tap recording with visual feedback
- **Transcribe** — On-device Whisper (faster-whisper) for speech-to-text
- **Summarize** — Local Ollama (e.g. Gemma 2) for meeting summaries
- **Email** — Notes sent to you as PDF using your email + 16-character app password (Gmail, Outlook, etc.)
- **Touch-first** — On-screen keyboard, WiFi setup, and kiosk UI for a dedicated device

---

## Quick install (Raspberry Pi)

On a Raspberry Pi with internet, run:

```bash
curl -fsSL https://raw.githubusercontent.com/syedhadi816/SafeScribe/main/raspberry-pi/bootstrap.sh | bash
```

This clones the repo to `~/SafeScribe`, installs dependencies, builds the frontend, and configures the kiosk. Then:

1. Enable desktop autologin: `sudo raspi-config` → **Boot Options** → **Desktop Autologin**
2. Configure email (optional but recommended): edit `/etc/safescribe/env` and add your **email** and **16-character app password** ([Gmail](https://myaccount.google.com/apppasswords), [Outlook](https://account.microsoft.com/security))
3. Reboot: `sudo reboot`

After reboot, SafeScribe opens in fullscreen. First run: connect WiFi and set the email address that will receive notes.

**Alternative — clone then install:**

```bash
git clone https://github.com/syedhadi816/SafeScribe.git
cd SafeScribe
./raspberry-pi/install.sh
```

---

## Requirements

- **Raspberry Pi 5** (recommended; Pi 4 may work with slower performance)
- **Raspberry Pi OS** (desktop)
- **Network** — For install and (optionally) email; transcription and summarization run locally
- **Email** — Your email address + a 16-character app password (no separate service sign-up)

---

## Project structure

| Path | Description |
|------|-------------|
| `frontend/` | React (Vite) kiosk UI — recording, settings, WiFi, email setup |
| `api/` | FastAPI backend — recording, STT, summarization, email, settings |
| `raspberry-pi/` | Install script, kiosk launcher, systemd service, one-command bootstrap |
| `docs/` | Step-by-step Pi setup guide |
| `config.py` | Paths, Ollama, SMTP (env-based); no secrets in repo |
| `run.py` | Entry point: starts API server and serves frontend build |

---

## Documentation

- **[raspberry-pi/README.md](raspberry-pi/README.md)** — Pi deployment, one-command install, email (app password) setup
- **[docs/PI-SETUP-GUIDE.md](docs/PI-SETUP-GUIDE.md)** — Full step-by-step setup and troubleshooting

---

## License

MIT.
