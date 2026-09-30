"""CI-only sync/commit driver. Retry from fresh main after concurrent pushes.

Every attempt runs in a disposable Git worktree. Never reset a maintainer's
checkout or force-push: content and HTML are committed as one normal commit.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def git(*args, cwd=None):
    return subprocess.check_output(['git', *args], cwd=cwd, text=True).strip()


def run(source):
    if os.environ.get('GITHUB_ACTIONS') != 'true':
        raise RuntimeError('This commit/push driver is only for GitHub Actions; use tools.sync locally')
    root = Path(git('rev-parse', '--show-toplevel'))
    for attempt in range(3):
        git('fetch', 'origin', 'main', cwd=root)
        base = git('rev-parse', 'origin/main', cwd=root)
        with tempfile.TemporaryDirectory(prefix='cosmo-ci-') as tmp:
            work = Path(tmp) / 'checkout'
            git('worktree', 'add', '--detach', str(work), base, cwd=root)
            try:
                subprocess.run([sys.executable, '-m', 'tools.sync', source], cwd=work, check=True)
                subprocess.run([sys.executable, '-m', 'tools.content'], cwd=work, check=True)
                subprocess.run([sys.executable, '-m', 'tools.build'], cwd=work, check=True)
                git('fetch', 'origin', 'main', cwd=root)
                if git('rev-parse', 'origin/main', cwd=root) != base:
                    print('main changed during sync; restarting from the latest commit', flush=True)
                    continue
                git('add', '--', f'content/{source}.json', 'content/profile-history.json', 'es', 'en', 'sitemap.xml', cwd=work)
                if git('diff', '--cached', '--name-only', cwd=work):
                    git('-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com', 'commit', '-m', f'chore: sync {source} data and HTML', cwd=work)
                    result = subprocess.run(['git', 'push', 'origin', 'HEAD:main'], cwd=work)
                    if result.returncode:
                        git('fetch', 'origin', 'main', cwd=root)
                        if git('rev-parse', 'origin/main', cwd=root) != base:
                            print('Concurrent push; retrying without overwriting it', flush=True)
                            continue
                        raise RuntimeError('Push failed; check repository permissions and branch protection')
                output = root / 'dist'
                if output.exists():
                    shutil.rmtree(output)
                shutil.copytree(work / 'dist', output)
                print(f'Validated {source} sync and website artifact ready', flush=True)
                return
            finally:
                git('worktree', 'remove', '--force', str(work), cwd=root)
    raise RuntimeError('main changed during all three attempts; retry this workflow later')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', choices=('publications', 'people', 'journal-club', 'research'))
    run(parser.parse_args().source)
