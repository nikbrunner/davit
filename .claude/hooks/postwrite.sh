#!/bin/bash
INPUT=$(cat /dev/stdin)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path
if [[ -z "$FILE" ]]; then
  exit 0
fi

# Only run on .ts files
if [[ "$FILE" != *.ts ]]; then
  exit 0
fi

# Format
deno fmt "$FILE" 2>/dev/null

# Lint (non-blocking)
deno lint "$FILE" 2>/dev/null

exit 0
