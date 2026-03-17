#!/bin/bash
# Auto-install davit binary when source is newer than installed binary.
# Runs on UserPromptSubmit — checks mtime, only installs if stale.

SRC_DIR="$(git -C "$(dirname "$0")/../.." rev-parse --show-toplevel)/src"
BIN="$HOME/.deno/bin/davit"

# No binary → install
if [ ! -f "$BIN" ]; then
  cd "$(dirname "$SRC_DIR")" && deno task install 2>/dev/null
  exit 0
fi

# Check if any source file is newer than binary
STALE=$(find "$SRC_DIR" -name "*.ts" -newer "$BIN" 2>/dev/null | head -1)
if [ -n "$STALE" ]; then
  cd "$(dirname "$SRC_DIR")" && deno task install 2>/dev/null
fi

exit 0
