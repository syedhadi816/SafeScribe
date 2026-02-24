#!/bin/bash
# Creates a clean SafeScribe zip for copying to Raspberry Pi.
# Run from project root: ./raspberry-pi/create-pi-package.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"
OUTPUT="$PROJECT_ROOT/SafeScribe-pi.zip"

echo "Creating SafeScribe Pi package..."
rm -f "$OUTPUT"
zip -r "$OUTPUT" . \
  -x "venv/*" \
  -x "Dev Stuff/AI Note-Taking Device/node_modules/*" \
  -x "Dev Stuff/AI Note-Taking Device/build/*" \
  -x "*.git*" \
  -x ".DS_Store" \
  -x "data/*" \
  -x "__pycache__/*" \
  -x "*.pyc"

echo ""
echo "Created: $OUTPUT"
echo "Copy this file to your Pi, then: unzip SafeScribe-pi.zip -d SafeScribe"
