#!/usr/bin/env bash
set -euo pipefail

# Extract skills and references from a project repo back to the web_dev template.
# Step 10 of the project workflow — run this from inside a project repo.

# --- Colors ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✔${RESET} $1"; }
warn() { echo -e "  ${YELLOW}⚠${RESET} $1"; }
err()  { echo -e "  ${RED}✘${RESET} $1"; }

echo ""
echo -e "${BOLD}web_dev — extract learnings to template${RESET}"
echo "────────────────────────────────────────"
echo ""

# ------------------------------------------------------------------
# 1. Detect template repo location
# ------------------------------------------------------------------
TEMPLATE="${WEB_DEV_TEMPLATE:-/home/tomas/Projects/web_dev}"
TEMPLATE="$(cd "$TEMPLATE" 2>/dev/null && pwd)" # resolve to absolute path
PROJECT_DIR="$(pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

echo -e "${BOLD}[1/4] Verify environment${RESET}"

# ------------------------------------------------------------------
# 2. Verify we're in a project repo, not the template
# ------------------------------------------------------------------
if [ ! -d "skills" ]; then
    err "No skills/ directory found in current directory."
    err "Run this script from the root of a project repo."
    exit 1
fi

if [ ! -d "references" ]; then
    warn "No references/ directory found — only skills/ will be synced."
fi

RESOLVED_PROJECT="$(cd "$PROJECT_DIR" && pwd -P)"
RESOLVED_TEMPLATE="$(cd "$TEMPLATE" && pwd -P)"

if [ "$RESOLVED_PROJECT" = "$RESOLVED_TEMPLATE" ]; then
    err "This script should be run from a project repo, not the template."
    exit 1
fi

if [ ! -d "$TEMPLATE/skills" ]; then
    err "Template repo at $TEMPLATE does not contain a skills/ directory."
    err "Set WEB_DEV_TEMPLATE to the correct path."
    exit 1
fi

ok "Project repo: $PROJECT_DIR"
ok "Template repo: $TEMPLATE"

# ------------------------------------------------------------------
# 3. Dry-run summary — show what differs
# ------------------------------------------------------------------
echo ""
echo -e "${BOLD}[2/4] Detect changes${RESET}"

HAS_CHANGES=false

# Files that differ or are new in skills/
echo ""
echo -e "  ${BOLD}skills/${RESET}"
SKILLS_DIFF="$(rsync -avn --exclude='.git' --exclude='design/ui-ux-pro-max' skills/ "$TEMPLATE/skills/" 2>/dev/null | grep -E '^\S' | grep -v '^\.\/$' | grep -v '^sending' | grep -v '^sent ' | grep -v '^total ' | grep -v '^$' || true)"
if [ -n "$SKILLS_DIFF" ]; then
    HAS_CHANGES=true
    while IFS= read -r line; do
        if [ -f "$TEMPLATE/skills/$line" ]; then
            echo -e "    ${YELLOW}modified${RESET}  $line"
        else
            echo -e "    ${GREEN}new${RESET}       $line"
        fi
    done <<< "$SKILLS_DIFF"
else
    echo "    (no changes)"
fi

# Files that differ or are new in references/
if [ -d "references" ]; then
    echo ""
    echo -e "  ${BOLD}references/${RESET}"
    REFS_DIFF="$(rsync -avn --exclude='.git' references/ "$TEMPLATE/references/" 2>/dev/null | grep -E '^\S' | grep -v '^\.\/$' | grep -v '^sending' | grep -v '^sent ' | grep -v '^total ' | grep -v '^$' || true)"
    if [ -n "$REFS_DIFF" ]; then
        HAS_CHANGES=true
        while IFS= read -r line; do
            if [ -f "$TEMPLATE/references/$line" ]; then
                echo -e "    ${YELLOW}modified${RESET}  $line"
            else
                echo -e "    ${GREEN}new${RESET}       $line"
            fi
        done <<< "$REFS_DIFF"
    else
        echo "    (no changes)"
    fi
fi

if [ "$HAS_CHANGES" = false ]; then
    echo ""
    ok "Nothing to sync — template is already up to date."
    exit 0
fi

# ------------------------------------------------------------------
# 4. Ask for confirmation, then copy
# ------------------------------------------------------------------
echo ""
echo -e "${BOLD}[3/4] Sync files to template${RESET}"
echo ""
read -rp "  Copy these files to the template repo? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    warn "Aborted."
    exit 0
fi

echo ""
rsync -av --exclude='.git' --exclude='design/ui-ux-pro-max' skills/ "$TEMPLATE/skills/"
if [ -d "references" ]; then
    rsync -av --exclude='.git' references/ "$TEMPLATE/references/"
fi
ok "Files synced."

# ------------------------------------------------------------------
# 5. Prompt to commit in the template repo
# ------------------------------------------------------------------
echo ""
echo -e "${BOLD}[4/4] Commit in template repo${RESET}"
echo ""

cd "$TEMPLATE"
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    ok "No uncommitted changes in template repo (files may already be identical)."
    exit 0
fi

echo -e "  ${BOLD}Diff preview:${RESET}"
echo ""
git --no-pager diff --stat
git --no-pager diff --stat --cached 2>/dev/null || true
git ls-files --others --exclude-standard | while IFS= read -r f; do
    echo -e "  ${GREEN}new file${RESET}:   $f"
done
echo ""

SUGGESTED_MSG="chore: update skills and references from $PROJECT_NAME"
read -rp "  Commit with message \"$SUGGESTED_MSG\"? [y/N/custom] " commit_choice
case "$commit_choice" in
    [Yy])
        git add skills/ references/
        git commit -m "$SUGGESTED_MSG"
        ok "Committed."
        ;;
    [Nn]|"")
        warn "Skipped commit. Changes are unstaged in $TEMPLATE."
        ;;
    *)
        git add skills/ references/
        git commit -m "$commit_choice"
        ok "Committed with custom message."
        ;;
esac

echo ""
ok "Done."
