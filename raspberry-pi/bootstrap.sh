#!/bin/bash
# SafeScribe one-line install from GitHub
# Usage: curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/BRANCH/raspberry-pi/bootstrap.sh | bash
# Or:    curl -fsSL ... | bash -s -- /path/to/install/dir
#
# Set SAFESCRIBE_REPO to override the default repo (e.g. your fork):
#   SAFESCRIBE_REPO=https://github.com/youruser/SafeScribe bash -c "$(curl -fsSL ...)"

set -e

DEFAULT_REPO="${SAFESCRIBE_REPO:-https://github.com/safescribe/safescribe}"
INSTALL_DIR="${1:-$HOME/SafeScribe}"
BRANCH="${SAFESCRIBE_BRANCH:-main}"

# Git is required to clone the repo
if ! command -v git &>/dev/null; then
  echo "Installing git..."
  sudo apt-get update -qq && sudo apt-get install -y git
fi

echo "=== SafeScribe bootstrap ==="
echo "Repo: $DEFAULT_REPO"
echo "Install to: $INSTALL_DIR"
echo ""

if [ -d "$INSTALL_DIR/.git" ]; then
  echo "Existing SafeScribe found. Updating..."
  cd "$INSTALL_DIR"
  git fetch origin
  git checkout -q "$BRANCH" 2>/dev/null || true
  git pull origin "$BRANCH" || true
else
  echo "Cloning SafeScribe..."
  git clone --depth 1 --branch "$BRANCH" "$DEFAULT_REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

echo ""
echo "Running installer..."
chmod +x raspberry-pi/install.sh
./raspberry-pi/install.sh

echo ""
echo "Done. SafeScribe is installed at: $INSTALL_DIR"
