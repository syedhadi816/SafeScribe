# SafeScribe – Raspberry Pi Deployment

This folder contains everything needed to run SafeScribe as a kiosk on Raspberry Pi 5.

## One-command install from GitHub

On a Raspberry Pi (with internet), open Terminal and run **one command**. No GitHub account or login required.

**Option A – one-liner (recommended):**

```bash
curl -fsSL https://raw.githubusercontent.com/syedhadi816/SafeScribe/main/raspberry-pi/bootstrap.sh | bash
```

This installs to `~/SafeScribe`. To install elsewhere:

```bash
curl -fsSL https://raw.githubusercontent.com/syedhadi816/SafeScribe/main/raspberry-pi/bootstrap.sh | bash -s -- /path/to/install
```

**Option B – clone then install:**

```bash
git clone https://github.com/syedhadi816/SafeScribe.git
cd SafeScribe
./raspberry-pi/install.sh
```

After install: enable desktop autologin (`sudo raspi-config` → Boot Options → Desktop Autologin) and reboot.

**Using a fork or different branch?** Set `SAFESCRIBE_REPO` or `SAFESCRIBE_BRANCH` before running the one-liner, or use Option B with your clone URL.

### Enabling email (your email + app password)

Meeting notes are sent by email using **your own email account** and a **16-character app password** (no separate sign-up needed).

1. **Create an app password** (not your normal email password):
   - **Gmail:** [Google App Passwords](https://myaccount.google.com/apppasswords) – you may need 2-Step Verification on first. Copy the 16-character password.
   - **Outlook/Hotmail:** [Microsoft Security → Advanced security → App passwords](https://account.microsoft.com/security).
   - **Yahoo/others:** Check your provider’s “app password” or “application password” in account security.
2. In the app: **Get Started** → **Email setup** (or **Settings** → **Email** after setup) to enter your email and the 16-character app password.

Emails will be sent **from** your email address. Until email is configured, recording and summaries still work; only the “email when ready” step will fail.

---

## What to Copy to the Pi (manual install)

Copy the **entire SafeScribe folder** to the Pi, but **exclude** these to avoid issues:

- `venv/` – Python virtual environment (install creates it fresh)
- `frontend/node_modules/` – Node dependencies (install creates them)
- `frontend/build/` – Optional; install rebuilds it

**To create a clean zip for transfer:**

```bash
# From the SafeScribe project root (on your Mac/PC)
chmod +x raspberry-pi/create-pi-package.sh
./raspberry-pi/create-pi-package.sh
```

Then copy `SafeScribe-pi.zip` to the Pi and unzip in your home folder.

## Quick Install

1. Copy SafeScribe to the Pi (e.g. `/home/pi/SafeScribe` or `/home/youruser/Desktop/SafeScribe`).
2. Open Terminal and run:

   ```bash
   cd /path/to/SafeScribe
   chmod +x raspberry-pi/install.sh
   ./raspberry-pi/install.sh
   ```

3. Enable auto-login: `sudo raspi-config` → Boot Options → Desktop Autologin
4. Reboot: `sudo reboot`

See [docs/PI-SETUP-GUIDE.md](https://github.com/safescribe-ai/SafeScribe/blob/main/docs/PI-SETUP-GUIDE.md) for the full step-by-step guide.
