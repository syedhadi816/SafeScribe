#!/bin/bash
# Creates a source package for release distribution.
# Run from project root: ./scripts/create-deploy-package.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"
OUTPUT="$PROJECT_ROOT/SafeScribe-deploy.zip"

echo "Creating SafeScribe deploy package..."
rm -f "$OUTPUT"
zip -r "$OUTPUT" . \
  -x "venv/*" \
  -x "frontend/node_modules/*" \
  -x "frontend/build/*" \
  -x "*.git*" \
  -x ".DS_Store" \
  -x "data/*" \
  -x "__pycache__/*" \
  -x "*.pyc"

echo ""
echo "Created: $OUTPUT"
echo "Attach this file to a GitHub Release."
