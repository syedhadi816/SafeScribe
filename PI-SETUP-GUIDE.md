# SafeScribe on Raspberry Pi 5 – Step-by-Step Setup

Follow these steps exactly. You need:

- Raspberry Pi 5 with Raspberry Pi OS installed
- A computer to copy the SafeScribe folder to the Pi
- USB drive, or internet on the Pi (Wi‑Fi or ethernet)

---

## Step 1: Prepare Your Pi (first boot)

1. Power on the Pi and finish the initial setup wizard (language, timezone, keyboard, Wi‑Fi, password).
2. When the desktop appears, open **Terminal** (black icon in the top bar, or Menu → Accessories → Terminal).

---

## Step 2: Copy SafeScribe to the Pi

Copy the SafeScribe project to the Pi. **Exclude `venv/` and `node_modules/`** when copying—the installer creates these fresh and copying them causes permission/symlink issues.

**Option A – Create a clean zip (recommended)**

On your Mac/PC, in the SafeScribe folder, run:

```bash
chmod +x raspberry-pi/create-pi-package.sh
./raspberry-pi/create-pi-package.sh
```

Or create the zip manually:

```bash
zip -r SafeScribe-pi.zip . -x "venv/*" -x "Dev Stuff/AI Note-Taking Device/node_modules/*" -x "Dev Stuff/AI Note-Taking Device/build/*" -x "*.git*" -x ".DS_Store"
```

Copy `SafeScribe-pi.zip` to a USB drive, then on the Pi:

```bash
cd ~
unzip /media/pi/*/SafeScribe-pi.zip -d SafeScribe
```
(Adjust the USB path if needed; list with `ls /media/pi/`)

**Option B – Copy the folder directly**

1. Copy the SafeScribe folder to a USB drive (without `venv/` and `node_modules/` if possible).
2. Plug the USB into the Pi, open File Manager, copy SafeScribe to your home folder.

---

## Step 3: Install SafeScribe

1. Open **Terminal**.
2. Go into the SafeScribe folder (adjust the path to match where you copied it):

   ```bash
   cd ~/SafeScribe
   ```
   Or, if it’s on Desktop: `cd ~/Desktop/SafeScribe`

   The folder must contain a `raspberry-pi` folder and a `run.py` file.

3. Make the install script executable:

   ```bash
   chmod +x raspberry-pi/install.sh
   ```

4. Run the installer (you will be asked for your Pi password):

   ```bash
   ./raspberry-pi/install.sh
   ```

5. Wait for the script to finish (it can take several minutes). When it says “Installation complete,” continue.

---

## Step 4: Enable Auto-Login So SafeScribe Starts on Boot

1. In Terminal, run:

   ```bash
   sudo raspi-config
   ```

2. Use the **arrow keys** to select **Boot Options** and press **Enter**.
3. Select **Desktop / CLI** and press **Enter**.
4. Select **Desktop Autologin** and press **Enter**.
5. Select **Finish** and press **Enter**.
6. If it asks “Would you like to reboot now?”, select **Yes** and press **Enter**.

---

## Step 5: Reboot and Test

1. After the Pi reboots, it will log in automatically.
2. After a short time, Chromium will open in fullscreen with SafeScribe.
3. You should not see a normal browser window, only the SafeScribe interface.

---

## Ollama and Summaries

The installer installs Ollama and pulls the `gemma2:2b-instruct-q4_0` model automatically. Meeting summaries work after installation.

---

## Troubleshooting

**SafeScribe does not appear after boot**

The kiosk runs via autostart (when you log in), not as a system service. Check:

1. Backend status:
   ```bash
   sudo systemctl status safescribe
   ```

2. Autostart file exists:
   ```bash
   ls ~/.config/autostart/safescribe-kiosk.desktop
   ```
   If missing, run from inside your SafeScribe folder:
   ```bash
   cd ~/SafeScribe   # or your actual path
   mkdir -p ~/.config/autostart
   sed "s|SAFESCRIBE_PATH|$(pwd)|g" raspberry-pi/safescribe-kiosk.desktop > ~/.config/autostart/safescribe-kiosk.desktop
   ```

3. To start the kiosk manually:
   ```bash
   ~/SafeScribe/raspberry-pi/kiosk.sh
   ```
   (Use your actual SafeScribe path.)

**You see “Installation complete” but something fails**

- Run the installer again and read the error message.
- Ensure you have internet (Wi‑Fi or ethernet) so packages can download.

**The screen stays black or blank**

- Press **Ctrl+Alt+F2** to switch to a text console, log in, then:
  ```bash
  sudo systemctl restart safescribe
  ~/SafeScribe/raspberry-pi/kiosk.sh
  ```

**To exit fullscreen / kiosk mode**

- Press **Alt+F4** or **Ctrl+W** to close Chromium.
- To start again: `~/SafeScribe/raspberry-pi/kiosk.sh` (adjust path if needed).
