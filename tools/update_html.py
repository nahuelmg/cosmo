"""Update marked HTML regions transactionally, preserving all manual markup.

Run python -m tools.update_html SOURCE to render existing JSON without fetching.
"""
import argparse
import copy
import json
import os
import re
import shutil
import tempfile
from contextlib import contextmanager
from pathlib import Path
from html.parser import HTMLParser
from xml.etree.ElementTree import Element, SubElement, ElementTree
from .content import ROOT, read_json, load_content, validate
from .site_files import site_files
from .check import check

MARKER = re.compile(r'<!-- AUTO:([a-z-]+):(START|END) -->')


def regions(html):
    """Require unique, ordered, non-nested marker pairs."""
    result = {}
    opened = None
    for match in MARKER.finditer(html):
        name, kind = match.groups()
        if kind == 'START':
            if opened or name in result:
                raise ValueError(f'Duplicate or nested AUTO marker: {name}')
            opened = (name, match.end())
        else:
            if not opened or opened[0] != name:
                raise ValueError(f'Unmatched AUTO marker: {name}')
            result[name] = (opened[1], match.start())
            opened = None
    if opened:
        raise ValueError(f'Missing AUTO end marker: {opened[0]}')
    return result


def replace_regions(html, replacements):
    spans = regions(html)
    missing = set(replacements) - set(spans)
    if missing:
        raise ValueError(f'Missing AUTO markers: {", ".join(sorted(missing))}')
    for name in sorted(replacements, key=lambda key: spans[key][0], reverse=True):
        start, end = spans[name]
        html = html[:start] + '\n' + replacements[name].strip() + '\n' + html[end:]
    return html


@contextmanager
def workspace_lock(root):
    # POSIX flock is released even if the process terminates unexpectedly.
    import fcntl
    with (root / '.cosmo-sync.lock').open('a') as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield


def snapshot(root):
    paths = set(site_files(root))
    for directory in ('content', 'messages'):
        paths.update(p.relative_to(root) for p in (root / directory).glob('*.json'))
    return {str(path): (root / path).read_bytes() for path in paths}


def write_bytes(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(payload)
        os.replace(temporary, path)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


def apply_changes(root, before, changes):
    # Detect edits made while a staged update was being validated.
    if snapshot(root) != before:
        raise ValueError('Website/content changed during sync; rerun against the latest files')
    applied = []
    try:
        for relative, payload in sorted(changes.items()):
            write_bytes(root / relative, payload)
            applied.append(relative)
    except BaseException:
        for relative in reversed(applied):
            if relative in before:
                write_bytes(root / relative, before[relative])
            else:
                (root / relative).unlink()
        raise


class Metadata(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.canonical = None
        self.alternates = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')
        if tag == 'link' and attrs.get('rel') == 'alternate' and attrs.get('hreflang'):
            self.alternates.append(attrs)


def sitemap(root):
    tree = Element('urlset', {'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'xmlns:xhtml': 'http://www.w3.org/1999/xhtml'})
    for relative in site_files(root):
        if relative.suffix != '.html' or relative.name == '404.html':
            continue
        meta = Metadata((root / relative).read_text(encoding='utf-8'))
        if not meta.canonical:
            continue
        entry = SubElement(tree, 'url')
        SubElement(entry, 'loc').text = meta.canonical
        for alt in meta.alternates:
            SubElement(entry, 'xhtml:link', {key: alt[key] for key in ('rel', 'hreflang', 'href')})
    ElementTree(tree).write(root / 'sitemap.xml', encoding='utf-8', xml_declaration=True)


def update(source, payload=None, root=ROOT, dry_run=False):
    """Fetch-free transaction used by both the importer and the offline renderer."""
    from .render import render_regions
    root = Path(root).resolve()
    if source not in ('people', 'publications', 'journal-club', 'research'):
        raise ValueError(f'Unknown source: {source}')
    with workspace_lock(root):
        before = snapshot(root)
        with tempfile.TemporaryDirectory(prefix='.cosmo-update-', dir=root) as temporary:
            stage = Path(temporary)
            for relative, contents in before.items():
                path = stage / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(contents)
            if payload is not None:
                validate(source, payload)
                (stage / 'content' / f'{source}.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            data = load_content(stage)
            history = read_json(stage / 'content/profile-history.json')
            if source == 'people':
                current = {p['slug']: p for p in data['people']}
                for slug in list(history):
                    if slug not in current:
                        history[slug] = {**history[slug], 'category': 'past'}
                for slug, person in current.items():
                    if person['category'] != 'past' or slug in history:
                        history[slug] = copy.deepcopy(person)
                validate('people', list(history.values()))
                (stage / 'content/profile-history.json').write_text(json.dumps(history, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            rendered = render_regions(data, stage, history)
            for relative, blocks in rendered.items():
                is_profile = 'profile-details' in blocks
                if source in ('people', 'publications'):
                    if not (is_profile or 'publications' in blocks or (source == 'people' and 'people' in blocks)):
                        continue
                    if is_profile and source == 'publications':
                        blocks = {'profile-publications': blocks['profile-publications']}
                elif source not in blocks:
                    continue
                target = stage / relative
                if not target.exists():
                    if not is_profile or source != 'people':
                        raise ValueError(f'Missing editable page: {relative}; run the people update to create new profiles')
                    locale = relative.split('/')[0]
                    slug = relative.split('/')[-2]
                    shell = (ROOT / 'tools/templates' / f'new-profile-{locale}.html').read_text(encoding='utf-8')
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_text(shell.replace('@@SLUG@@', slug), encoding='utf-8')
                target.write_text(replace_regions(target.read_bytes().decode('utf-8'), blocks), encoding='utf-8')
            sitemap(stage)
            check(stage)
            after = snapshot(stage)
            changes = {path: value for path, value in after.items() if before.get(path) != value}
            if not dry_run:
                apply_changes(root, before, changes)
            print(f'{"Would update" if dry_run else "Updated"} {len(changes)} files for {source}')
            return sorted(changes)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', choices=('people', 'publications', 'journal-club', 'research'))
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    update(args.source, dry_run=args.dry_run)
