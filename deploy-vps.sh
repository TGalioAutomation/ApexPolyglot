#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 user@host /remote/path/lingopilot"
  exit 1
fi

TARGET="$1"
REMOTE_DIR="$2"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Uploading LingoPilot to ${TARGET}:${REMOTE_DIR}"
ssh "$TARGET" "mkdir -p '$REMOTE_DIR'"
rsync -az --delete \
  --exclude='.git' --exclude='.env' --exclude='node_modules' \
  "$SCRIPT_DIR/" "$TARGET:$REMOTE_DIR/"
ssh "$TARGET" "cd '$REMOTE_DIR' && test -f .env || cp .env.example .env && docker compose up -d --build"
echo "Done. Configure $REMOTE_DIR/.env on the VPS, then rerun: cd $REMOTE_DIR && docker compose up -d"
