import tempfile
import unittest
from pathlib import Path
from tools.check import check
from tools.urls import relative_url


class RelativeURLTests(unittest.TestCase):
    def test_links_at_different_depths(self):
        cases = [
            ('/', '/es/', 'es/'),
            ('/en/', '/en/', './'),
            ('/en/people/', '/people/photo.jpg', '../../people/photo.jpg'),
            ('/en/people/member/', '/es/personas/member/?a=1#bio', '../../../es/personas/member/?a=1#bio'),
            ('/en/people/member/', '/en/people/', '../'),
            ('/en/', '#main', '#main'),
            ('/en/', 'https://example.org/', 'https://example.org/'),
        ]
        for page, target, expected in cases:
            with self.subTest(page=page, target=target):
                self.assertEqual(relative_url(page, target), expected)

    def test_checker_validates_redirects_and_rejects_root_paths(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root/'es').mkdir()
            (root/'es/index.html').write_text('<h1>Home</h1>')
            index = root/'index.html'
            index.write_text('<meta http-equiv="refresh" content="0;url=es/">')
            self.assertEqual(check(root), 2)
            index.write_text('<meta http-equiv="refresh" content="0;url=missing/">')
            with self.assertRaisesRegex(ValueError, 'missing'):
                check(root)
            for html in ('<a href="/cosmo/es/">Home</a>', '<script src="/assets/site.js"></script>', '<meta http-equiv="refresh" content="0;url=/es/">'):
                index.write_text(html)
                with self.assertRaisesRegex(ValueError, 'document-relative'):
                    check(root)
