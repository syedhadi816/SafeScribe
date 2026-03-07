"""WiFi scan and connect (Linux: nmcli, macOS: airport/networksetup)."""
import subprocess
import sys
from typing import TypedDict


def _wifi_status_nmcli_con() -> dict:
    """Use 'nmcli con show --active'. Handles both value:value and key:value output formats."""
    try:
        out = subprocess.run(
            ["nmcli", "-t", "-f", "GENERAL.STATE,NAME", "con", "show", "--active"],
            capture_output=True, text=True, timeout=5,
        )
        if out.returncode != 0 or not out.stdout.strip():
            return {"connected": False, "ssid": None}
        state_activated = False
        ssid_from_name = None
        for line in out.stdout.strip().splitlines():
            parts = line.split(":", 1)
            if len(parts) < 2:
                continue
            first = (parts[0] or "").strip()
            second = (parts[1] or "").strip()
            # Format 1: value:value e.g. "activated:MyWiFi" (state then name)
            if "activated" in first.lower() and second and second != "--":
                return {"connected": True, "ssid": second}
            # Format 2: value:value e.g. "MyWiFi:activated" (name then state - some versions)
            if "activated" in second.lower() and first and first != "--":
                return {"connected": True, "ssid": first}
            # Format 3: key:value e.g. "GENERAL.STATE:activated" and "NAME:MyWiFi"
            if "STATE" in first.upper() and "activated" in second.lower():
                state_activated = True
            if "NAME" in first.upper() and second and second != "--":
                ssid_from_name = second
        if state_activated and ssid_from_name:
            return {"connected": True, "ssid": ssid_from_name}
        return {"connected": False, "ssid": None}
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {"connected": False, "ssid": None}


def _wifi_status_nmcli_dev_fallback() -> dict:
    """Fallback: use device status (DEVICE:TYPE:STATE:CONNECTION) to find WiFi. Prefer wifi type."""
    try:
        out = subprocess.run(
            ["nmcli", "-t", "-f", "DEVICE,TYPE,STATE,CONNECTION", "dev", "status"],
            capture_output=True, text=True, timeout=5,
        )
        if out.returncode != 0 or not out.stdout.strip():
            return {"connected": False, "ssid": None}
        any_conn = None
        for line in out.stdout.strip().splitlines():
            fields = [f.strip() for f in line.split(":")]
            if len(fields) < 3:
                continue
            conn = fields[-1]
            state = (fields[-2] if len(fields) >= 2 else "").lower()
            if state not in ("connected", "activated") or not conn or conn == "--":
                continue
            dev_type = (fields[1] if len(fields) >= 2 else "").lower()
            if dev_type == "wifi":
                return {"connected": True, "ssid": conn}
            if not any_conn:
                any_conn = conn
        if any_conn:
            return {"connected": True, "ssid": any_conn}
        return {"connected": False, "ssid": None}
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {"connected": False, "ssid": None}


def wifi_status() -> dict:
    """Return { connected: bool, ssid: str | None }."""
    if sys.platform.startswith("linux"):
        result = _wifi_status_nmcli_con()
        if result["connected"]:
            return result
        return _wifi_status_nmcli_dev_fallback()
    elif sys.platform == "darwin":
        try:
            out = subprocess.run(
                ["networksetup", "-getairportnetwork", "en0"],
                capture_output=True, text=True, timeout=5,
            )
            if out.returncode == 0 and "Current Wi-Fi Network:" in (out.stdout or ""):
                for line in (out.stdout or "").splitlines():
                    if ":" in line:
                        ssid = line.split(":", 1)[1].strip()
                        if ssid:
                            return {"connected": True, "ssid": ssid}
            return {"connected": False, "ssid": None}
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return {"connected": False, "ssid": None}
    return {"connected": False, "ssid": None}


class NetworkInfo(TypedDict):
    ssid: str
    signal: int
    secure: bool


def wifi_scan() -> list[NetworkInfo]:
    result: list[NetworkInfo] = []
    if sys.platform.startswith("linux"):
        try:
            out = subprocess.run(
                ["nmcli", "-t", "-f", "SSID,SIGNAL,SECURITY", "dev", "wifi", "list"],
                capture_output=True, text=True, timeout=15,
            )
            if out.returncode != 0:
                return result
            for line in out.stdout.strip().splitlines():
                if not line:
                    continue
                parts = line.split(":")
                ssid = (parts[0] if len(parts) > 0 else "").strip()
                signal_s = (parts[1] if len(parts) > 1 else "0").strip()
                security = (parts[2] if len(parts) > 2 else "").strip().lower()
                if not ssid or ssid == "--":
                    continue
                try:
                    signal = int(signal_s)
                except ValueError:
                    signal = -1
                result.append({"ssid": ssid, "signal": signal, "secure": bool(security)})
            by_ssid = {}
            for n in result:
                if n["ssid"] not in by_ssid or n["signal"] > by_ssid[n["ssid"]]["signal"]:
                    by_ssid[n["ssid"]] = n
            result = list(by_ssid.values())
            result.sort(key=lambda x: -x["signal"] if x["signal"] >= 0 else 0)
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass
    elif sys.platform == "darwin":
        for airport in ["/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport", "/usr/sbin/airport"]:
            try:
                out = subprocess.run([airport, "-s"], capture_output=True, text=True, timeout=15)
                if out.returncode != 0:
                    continue
                for line in out.stdout.strip().splitlines()[1:]:
                    parts = line.split()
                    if parts:
                        result.append({"ssid": parts[0], "signal": -1, "secure": True})
                break
            except (FileNotFoundError, subprocess.TimeoutExpired, PermissionError):
                continue
    return result


def wifi_connect(ssid: str, password: str) -> tuple[bool, str]:
    if not (ssid or "").strip():
        return False, "Network name is required."
    ssid = ssid.strip()
    if sys.platform.startswith("linux"):
        try:
            cmd = ["nmcli", "dev", "wifi", "connect", ssid]
            if password:
                cmd.extend(["password", password])
            out = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            return (out.returncode == 0, out.stderr.strip() or out.stdout.strip() or "Connection failed.")
        except FileNotFoundError:
            return False, "NetworkManager (nmcli) not found."
        except subprocess.TimeoutExpired:
            return False, "Connection timed out."
    if sys.platform == "darwin":
        try:
            out = subprocess.run(["networksetup", "-listallhardwareports"], capture_output=True, text=True, timeout=5)
            if out.returncode != 0:
                return False, "Could not list network ports."
            dev = None
            in_wifi = False
            for line in out.stdout.splitlines():
                if "Wi-Fi" in line or "Airport" in line:
                    in_wifi = True
                    continue
                if in_wifi and "Device:" in line:
                    dev = line.split("Device:")[-1].strip()
                    break
            if not dev:
                return False, "Wi-Fi port not found."
            out = subprocess.run(["networksetup", "-setairportnetwork", dev, ssid, password], capture_output=True, text=True, timeout=15)
            return (out.returncode == 0, out.stderr.strip() or "Connection failed.")
        except FileNotFoundError:
            return False, "networksetup not found."
        except subprocess.TimeoutExpired:
            return False, "Connection timed out."
    return False, "WiFi connect not supported."
