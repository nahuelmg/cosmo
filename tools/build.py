"""Package committed HTML and assets; never render or overwrite source pages."""
import argparse
import json
import os
import shutil
import tempfile
from pathlib import Path
from .content import ROOT, read_json
from .site_files import site_files
from .check import check


def build(output=ROOT / 'dist', site_url=None, production=True, source=ROOT):
    source = Path(source).resolve()
    output = Path(output).resolve()
    if output == source or source.is_relative_to(output):
        raise ValueError('Output must not replace the source directory')
    if output.is_relative_to(source) and output.relative_to(source).parts[0] != 'dist':
        raise ValueError('In-project output must be inside dist/')
    info = read_json(source / 'build-info.json')
    configured = read_json(source / 'content/site.json')['url'].rstrip('/') if (source / 'content/site.json').exists() else info['site_url']
    requested = site_url or os.environ.get('SITE_URL') or configured
    if requested.rstrip('/') != info['site_url'].rstrip('/') or configured != info['site_url'].rstrip('/'):
        raise ValueError('Site URL differs from committed HTML. Update HTML URLs, content/site.json and build-info.json together before packaging.')
    paths = list(site_files(source))
    if Path('index.html') not in paths:
        raise ValueError('Missing editable index.html in the website root')
    output.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix='.cosmo-build-', dir=output.parent))
    try:
        for relative in paths:
            target = stage / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source / relative, target)
            if relative.suffix == '.html':
                html = target.read_text(encoding='utf-8')
                if '{%' in html or '{{' in html:
                    raise ValueError(f'Unrendered template syntax in {relative}')
                if not production and '<head>' in html:
                    target.write_text(html.replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow">', 1), encoding='utf-8')
        if not production:
            (stage / 'robots.txt').write_text('User-agent: *\nDisallow: /\n', encoding='utf-8')
        total = check(stage)
        backup = output.with_name(output.name + '.previous')
        if backup.exists():
            raise ValueError(f'Recover interrupted packaging backup first: {backup}')
        if output.exists():
            output.rename(backup)
        try:
            stage.rename(output)
        except BaseException:
            if backup.exists():
                backup.rename(output)
            raise
        if backup.exists():
            shutil.rmtree(backup)
        print(f'Packaged {total} HTML files in {output}')
    finally:
        if stage.exists():
            shutil.rmtree(stage)
    return [str(p) for p in paths if p.suffix == '.html']


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist')
    parser.add_argument('--site-url', help='Assert the URL matches the committed website')
    parser.add_argument('--preview', action='store_true', help='Block indexing in the packaged copy only')
    args = parser.parse_args()
    build(args.output, args.site_url, not args.preview)
