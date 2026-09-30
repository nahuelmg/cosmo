#!/usr/bin/env bash
set -euo pipefail
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m tools.build
printf '%s\n' 'Ready. Preview with: .venv/bin/python -m tools.preview'
