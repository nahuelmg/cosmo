#!/usr/bin/env bash
set -euo pipefail

# Bootstrap script for new projects cloned from the web_dev template.
# Sets up symlinks, checks tool dependencies, and prints a readiness summary.
# Safe to run multiple times (idempotent).

# --- Colors ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✔${RESET} $1"; }
warn() { echo -e "  ${YELLOW}⚠${RESET} $1"; }
err()  { echo -e "  ${RED}✘${RESET} $1"; }

ISSUES=()

echo ""
echo -e "${BOLD}web_dev template — project setup${RESET}"
echo "─────────────────────────────────"
echo ""

# ------------------------------------------------------------------
# 1. ui-ux-pro-max symlink
# ------------------------------------------------------------------
echo -e "${BOLD}[1/3] ui-ux-pro-max symlink${RESET}"

LINK_PATH="skills/design/ui-ux-pro-max"
TARGET="/home/tomas/Projects/ui-ux-pro-max/src/ui-ux-pro-max"

if [ -L "$LINK_PATH" ] && [ -e "$LINK_PATH" ]; then
    ok "Symlink already exists and is valid → $(readlink "$LINK_PATH")"
elif [ -L "$LINK_PATH" ] && [ ! -e "$LINK_PATH" ]; then
    # Broken symlink — recreate
    rm "$LINK_PATH"
    if [ -d "$TARGET" ]; then
        ln -s "$TARGET" "$LINK_PATH"
        ok "Replaced broken symlink → $TARGET"
    else
        warn "Target does not exist: $TARGET"
        warn "Skipping symlink creation. Clone ui-ux-pro-max first."
        ISSUES+=("ui-ux-pro-max symlink not created (target missing)")
    fi
elif [ -e "$LINK_PATH" ]; then
    warn "$LINK_PATH exists but is not a symlink — leaving it alone."
    ISSUES+=("$LINK_PATH is not a symlink; verify manually")
else
    if [ -d "$TARGET" ]; then
        mkdir -p "$(dirname "$LINK_PATH")"
        ln -s "$TARGET" "$LINK_PATH"
        ok "Created symlink → $TARGET"
    else
        warn "Target does not exist: $TARGET"
        warn "Skipping symlink creation. Clone ui-ux-pro-max first."
        ISSUES+=("ui-ux-pro-max symlink not created (target missing)")
    fi
fi

echo ""

# ------------------------------------------------------------------
# 2. Python 3
# ------------------------------------------------------------------
echo -e "${BOLD}[2/3] Python 3${RESET}"

if command -v python3 &>/dev/null; then
    ok "python3 found — $(python3 --version 2>&1)"
else
    err "python3 not found (required by ui-ux-pro-max search tool)"
    echo ""
    echo "    Install Python 3:"
    echo "      Ubuntu/Debian : sudo apt install python3"
    echo "      macOS         : brew install python"
    echo "      Windows (WSL) : sudo apt install python3"
    echo ""
    ISSUES+=("Python 3 not installed")
fi

echo ""

# ------------------------------------------------------------------
# 3. Node.js
# ------------------------------------------------------------------
echo -e "${BOLD}[3/3] Node.js${RESET}"

if command -v node &>/dev/null; then
    ok "node found — $(node --version 2>&1)"
else
    err "node not found"
    echo ""
    echo "    Install Node.js:"
    echo "      Ubuntu/Debian : curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt install -y nodejs"
    echo "      macOS         : brew install node"
    echo "      Or use nvm    : https://github.com/nvm-sh/nvm"
    echo ""
    ISSUES+=("Node.js not installed")
fi

echo ""

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ ${#ISSUES[@]} -eq 0 ]; then
    echo -e "${GREEN}${BOLD}All checks passed. Ready to go.${RESET}"
else
    echo -e "${YELLOW}${BOLD}Setup completed with ${#ISSUES[@]} item(s) needing attention:${RESET}"
    for issue in "${ISSUES[@]}"; do
        warn "$issue"
    done
fi
echo ""
