import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from tools.content import load_content, localize, matches, validate, CONTENT
from tools.build import build, route, publication_view
from tools.check import check

class ContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.data=load_content()

    def test_current_content_is_valid(self):
        self.assertGreater(len(self.data['people']), 10)
        self.assertGreater(len(self.data['publications']['publications']), 10)

    def test_translation_fallback_and_explicit_translation(self):
        table={'Investigador':'Researcher'}
        self.assertEqual(localize({'es':'Investigador','en':'Investigator'},'en',table),'Investigator')
        self.assertEqual(localize({'es':'Investigador','en':'Investigador'},'en',table),'Researcher')
        self.assertEqual(localize({'es':'Nuevo','en':'Nuevo'},'en',table),'Nuevo')
        person=next(p for p in self.data['people'] if p['slug']=='cecilia-scannapieco')
        self.assertEqual(localize(person,'en',self.data['translations'])['research_interests'][0],'Cosmological simulations of galaxy evolution')

    def test_member_matching_and_short_names(self):
        self.assertTrue(matches({'display_name_normalized':'diana lopez nacir'},{'authors':['López Nacir, Diana']}))
        self.assertFalse(matches({'display_name_normalized':'a li'},{'authors':['Alice Smith']}))

    def test_deep_member_never_hidden(self):
        pub={'id':'p','authors':['A','B','C','D','E','Calzetta, E.','F'],'title':'Title','journal':'Preprint','year':2026,'source':'manual'}
        row=publication_view(pub,self.data['people'])
        self.assertIn('Calzetta',row['author_text']); self.assertNotIn('; D;',row['author_text'])
        self.assertIn('et al.',row['author_text'])

    def test_duplicate_and_session_consistency(self):
        with self.assertRaises(ValueError): validate('people',[self.data['people'][0]]*2)
        with self.assertRaises(ValueError): validate('publications',{**self.data['publications'],'publications':[self.data['publications']['publications'][0]]*2})
        s={'id':'x','date':'2099-01-01','speaker':'Name','title':'Talk','status':'past','academic_year':'2098-2099'}
        with self.assertRaises(ValueError): validate('journal-club',[s],today='2026-01-01')

    def test_build_routes_metadata_content_and_atomicity(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/'site'
            urls=build(out,'https://example.org')
            expected=16+2*sum(p['category']!='past' for p in self.data['people'])
            self.assertEqual(len(urls),expected)
            self.assertEqual(check(out),expected+2)
            for locale,page,slug,path in urls:
                html=(out/path.lstrip('/')/'index.html').read_text()
                self.assertIn(f'<html lang="{locale}">',html)
                self.assertIn('https://example.org'+path,html)
                self.assertNotIn('/_next/',html)
            pubs=(out/'en/publications/index.html').read_text()
            self.assertIn('ScholarlyArticle',pubs)
            for pub in self.data['publications']['publications']:
                self.assertIn('pub-'+pub['id'],pubs)
            # Failed rendering/validation cannot replace an existing successful build.
            before=(out/'sitemap.xml').read_bytes()
            with patch('tools.build.load_content',side_effect=ValueError('invalid content')):
                with self.assertRaises(ValueError): build(out)
            self.assertEqual(before,(out/'sitemap.xml').read_bytes())
            build(out,'https://example.org',production=False)
            self.assertIn('Disallow: /',(out/'robots.txt').read_text())
            self.assertIn('noindex,nofollow',(out/'en/index.html').read_text())

if __name__=='__main__': unittest.main()
