import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from tools.ci_sync import run


class CiSyncTests(unittest.TestCase):
    def test_refuses_local_push(self):
        with patch.dict(os.environ, {'GITHUB_ACTIONS': 'false'}):
            with self.assertRaises(RuntimeError): run('people')

    def test_concurrent_main_restarts_fresh_without_force_push(self):
        with tempfile.TemporaryDirectory() as tmp:
            revisions=iter(['old','new','new','new'])
            calls=[]
            def fake_git(*args, cwd=None):
                calls.append(args)
                if args == ('rev-parse','--show-toplevel'): return tmp
                if args == ('rev-parse','origin/main'): return next(revisions)
                if args[:2] == ('worktree','add'):
                    dist=Path(args[3])/'dist'
                    dist.mkdir(parents=True)
                    (dist/'index.html').write_text('validated website')
                if args[:2] == ('diff','--cached'): return 'en/people/index.html'
                return ''
            with patch.dict(os.environ, {'GITHUB_ACTIONS':'true'}), patch('tools.ci_sync.git',side_effect=fake_git), patch('tools.ci_sync.subprocess.run') as command:
                command.return_value.returncode=0
                run('people')
            adds=[c for c in calls if c[:2] == ('worktree','add')]
            self.assertEqual([c[-1] for c in adds],['old','new'])
            pushes=[c.args[0] for c in command.call_args_list if c.args[0][0]=='git']
            self.assertEqual(pushes,[['git','push','origin','HEAD:main']])
            self.assertEqual((Path(tmp)/'dist/index.html').read_text(),'validated website')
