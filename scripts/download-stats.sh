#!/bin/bash
# Print GitHub release asset download counts.
# Usage:
#   ./scripts/download-stats.sh safescribe-ai SafeScribe

set -euo pipefail

OWNER="${1:-safescribe-ai}"
REPO="${2:-SafeScribe}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required: https://cli.github.com/"
  exit 1
fi

echo "Download counts for ${OWNER}/${REPO}:"
echo ""

gh api "repos/${OWNER}/${REPO}/releases" --paginate \
  --jq '.[] | .tag_name as $tag | .assets[]? | "\($tag)\t\(.name)\t\(.download_count)"' \
  | awk -F '\t' '{
      printf "%-12s %-30s %s\n", $1, $2, $3;
      total += $3
    }
    END {
      print "";
      print "Total downloads:", total + 0
    }'
