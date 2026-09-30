"""Shared HTTP, CSV and safe-write utilities for the importers."""
import csv
import io
import json
import os
import re
import tempfile
import time
import urllib.error
import urllib.request
from .content import fold


def slugify(value):
    return re.sub('[^a-z0-9]+', '-', fold(value).strip()).strip('-')


def fetch(url, accept='*/*', allow_404=False, attempts=4, timeout=15):
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers={'User-Agent':'cosmo-sync/1.0 (academic group site)', 'Accept':accept})
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read().decode('utf-8-sig')
        except urllib.error.HTTPError as error:
            if error.code == 404 and allow_404: return None
            if error.code not in (429, 500, 502, 503, 504) or attempt == attempts-1: raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == attempts-1: raise
        time.sleep(min(2 ** (attempt+1), 30))
    raise RuntimeError(f'Could not fetch {url}')


def parse_csv(text):
    return list(csv.reader(io.StringIO(text.lstrip('\ufeff')), strict=True))


def atomic_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    if path.exists() and path.read_text() == text: return False
    temporary = None
    try:
        with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=path.parent, delete=False) as f:
            temporary = f.name
            f.write(text)
        os.replace(temporary, path)
    finally:
        if temporary and os.path.exists(temporary): os.unlink(temporary)
    return True
