# SafeScribe – Raspberry Pi Deployment

This folder contains everything needed to run SafeScribe as a kiosk on Raspberry Pi 5.

## One-command install from GitHub

On a Raspberry Pi (with git installed), open Terminal and run **one** of these:

**Option A – one-liner (downloads and runs the installer):**

```bash
curl -fsSL https://raw.githubusercontent.com/OWNER/SafeScribe/main/raspberry-pi/bootstrap.sh | bash
```

Replace `OWNER` with the GitHub username or org that hosts the repo (e.g. `safescribe`). By default the app is installed to `~/SafeScribe`. To install elsewhere:

```bash
curl -fsSL https://raw.githubusercontent.com/OWNER/SafeScribe/main/raspberry-pi/bootstrap.sh | bash -s -- /path/to/install
```

**Option B – clone then install:**

```bash
git clone https://github.com/OWNER/SafeScribe.git
cd SafeScribe
./raspberry-pi/install.sh
```

After install: enable desktop autologin (`sudo raspi-config` → Boot Options → Desktop Autologin) and reboot.

**Using a different repo or branch?** Set `SAFESCRIBE_REPO` or `SAFESCRIBE_BRANCH` before running the one-liner, or use Option B with your clone URL.

---

## What to Copy to the Pi (manual install)

Copy the **entire SafeScribe folder** to the Pi, but **exclude** these to avoid issues:

- `venv/` – Python virtual environment (install creates it fresh)
- `Dev Stuff/AI Note-Taking Device/node_modules/` – Node dependencies (install creates them)
- `Dev Stuff/AI Note-Taking Device/build/` – Optional; install rebuilds it

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

See **PI-SETUP-GUIDE.md** in the project root for the full step-by-step guide.
