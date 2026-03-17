#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
git config core.hooksPath "$REPO_ROOT/.githooks"
chmod +x "$REPO_ROOT/.githooks/pre-commit"
echo "Git hooks configured: using .githooks/pre-commit"
