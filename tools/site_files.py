"""Explicit publish boundary: only ordinary website files enter an artifact."""
from pathlib import Path

SITE_DIRS = ('es', 'en', 'assets', 'Portadas', 'people')
SITE_FILES = ('logo_cosmo.png', 'favicon.ico', 'sitemap.xml', 'robots.txt', '.nojekyll', 'build-info.json')


def site_files(root):
    root = Path(root).resolve()
    paths = list(root.glob('*.html')) + [root / name for name in SITE_FILES]
    for name in SITE_DIRS:
        directory = root / name
        if directory.is_symlink():
            raise ValueError(f'Website directory must not be a symlink: {directory}')
        if directory.exists():
            paths.extend(directory.rglob('*'))
    for path in sorted(set(paths)):
        if path.is_symlink():
            raise ValueError(f'Website assets must not be symlinks: {path}')
        if path.is_file():
            yield path.relative_to(root)
