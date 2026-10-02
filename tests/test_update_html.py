import copy
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from tools.content import ROOT, load_content
from tools.update_html import update, snapshot, replace_regions, apply_changes, write_bytes


class UpdateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for relative, data in snapshot(ROOT).items():
            target = self.root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)

    def test_idempotence_and_manual_edits(self):
        page = self.root/'en/people/index.html'
        manual = b'\r\n<!-- Maintainer text: keep exactly -->\r\n'
        page.write_bytes(page.read_bytes().replace(b'<main', manual+b'<main', 1))
        home = self.root/'en/index.html'
        home.write_bytes(home.read_bytes().replace(b'</main>', b'<p>Edited directly</p></main>'))
        before_home = home.read_bytes()
        for source in ('people','publications','journal-club','research'):
            update(source, root=self.root)
            self.assertEqual(update(source, root=self.root), [])
        self.assertIn(manual, page.read_bytes())
        self.assertEqual(before_home, home.read_bytes())

    def test_invalid_markers_leave_data_and_html_untouched(self):
        page = self.root/'en/people/index.html'
        page.write_text(page.read_text().replace('<!-- AUTO:people:START -->',''))
        before = snapshot(self.root)
        payload = load_content(self.root)['people']
        payload[0]['name'] += ' Updated'
        with self.assertRaises(ValueError): update('people', payload, root=self.root)
        self.assertEqual(snapshot(self.root), before)
        with self.assertRaises(ValueError):
            replace_regions('<!-- AUTO:x:START --><!-- AUTO:x:END -->'*2, {'x':'new'})

    def test_new_and_retired_profiles_and_dry_run(self):
        people = load_content(self.root)['people']
        new = copy.deepcopy(next(p for p in people if p['category'] != 'past'))
        new.update(slug='test-new-member', name='Test New Member', display_name_normalized='test new member')
        payload = people+[new]
        before = snapshot(self.root)
        self.assertTrue(update('people', payload, root=self.root, dry_run=True))
        self.assertEqual(snapshot(self.root),before)
        update('people', payload, root=self.root)
        page = self.root/'en/people/test-new-member/index.html'
        self.assertIn('Test New Member',page.read_text())
        self.assertIn('src="../../../assets/js/site.js"', page.read_text())
        self.assertIn('href="../../../es/personas/test-new-member/"', page.read_text())
        self.assertNotIn('href="/cosmo/', page.read_text())
        self.assertNotIn('src="/cosmo/', page.read_text())
        self.assertIn('test-new-member/',(self.root/'sitemap.xml').read_text())
        page.write_text(page.read_text().replace('</article>','<p>Personal history</p></article>'))
        update('people', people, root=self.root)
        self.assertIn('Former member',page.read_text())
        self.assertIn('Personal history',page.read_text())
        self.assertTrue((self.root/'es/personas/test-new-member/index.html').exists())

    def test_publication_updates_profile_and_metadata(self):
        payload = load_content(self.root)['publications']
        pub = copy.deepcopy(payload['publications'][0])
        pub.update(id='test-publication', title='Unique migration test publication', authors=['Calzetta, Esteban'], year=2026)
        payload['publications'].append(pub)
        update('publications', payload, root=self.root)
        self.assertIn(pub['title'],(self.root/'en/publications/index.html').read_text())
        self.assertIn(pub['title'],(self.root/'en/people/esteban-calzetta/index.html').read_text())

    def test_concurrent_edit_and_write_failure(self):
        before=snapshot(self.root)
        path=self.root/'index.html'
        path.write_bytes(path.read_bytes()+b'<!-- concurrent -->')
        with self.assertRaisesRegex(ValueError,'changed during sync'):
            apply_changes(self.root,before,{'index.html':b'bad'})
        before=snapshot(self.root)
        calls=0
        def fail_second(path,data):
            nonlocal calls
            calls+=1
            if calls == 2: raise OSError('simulated failure')
            write_bytes(path,data)
        with patch('tools.update_html.write_bytes',side_effect=fail_second):
            with self.assertRaises(OSError):
                apply_changes(self.root,before,{'index.html':b'new','robots.txt':b'new'})
        self.assertEqual(snapshot(self.root),before)


if __name__ == '__main__': unittest.main()
