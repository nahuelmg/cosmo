import argparse
import copy
import json
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch
from tools.sync_common import parse_csv, atomic_json, fetch
from tools.sync_sheets import sessions_from_rows, normalize_date, normalize_time, academic_year, resolve_header, people_from_rows, split_interests, parse_doc, merge_areas
from tools.sync_publications import inspire_publication, arxiv_publications, orcid_publication, dedup_arxiv, dedup_doi, sync_publications
from tools.content import read_json, CONTENT
from tools.sync import run

FIXTURES=Path(__file__).parent/'fixtures'

class SyncTests(unittest.TestCase):
    def test_csv_quoting_newlines_and_bom(self):
        self.assertEqual(parse_csv('\ufeffa,b\r\n"A, B","line 1\nline 2"'),[['a','b'],['A, B','line 1\nline 2']])
        self.assertEqual(parse_csv('x\n"she said ""hi"""'),[['x'],['she said "hi"']])

    def test_date_time_seasons(self):
        self.assertEqual(normalize_date('9/25/2026'),'2026-09-25')
        self.assertIsNone(normalize_date('2/30/2026'))
        self.assertEqual(normalize_time('3:00:00 PM'),'15:00')
        self.assertEqual(normalize_time('3:00 p. m.'),'15:00')
        self.assertEqual(normalize_time('12:00 AM'),'00:00')
        self.assertIsNone(normalize_time('24:01'))
        self.assertEqual(academic_year('2026-07-31'),'2025-2026')
        self.assertEqual(academic_year('2026-08-01'),'2026-2027')

    def test_sessions_headers_collision_empty_and_invalid(self):
        self.assertEqual(resolve_header('Links (format https://...)'),'paper_link')
        self.assertIsNone(resolve_header('Timestamp'))
        headers=['Date of the journal','Complete name','Title of the journal','Hour','Place/room']
        rows=[headers,['9/25/2026','José Pérez','Title','3 PM','Federman'],['9/25/2026','José Pérez','Another','','']]
        sessions=sessions_from_rows(rows,'2026-09-25',[])
        self.assertEqual(sessions[0]['status'],'upcoming')
        self.assertEqual(sessions[0]['start_time'],'15:00')
        self.assertEqual(sessions[0]['location'],'Aula Federman')
        self.assertEqual(sessions[1]['id'],'2026-09-25-jose-perez-2')
        self.assertEqual(sessions_from_rows(rows,'2026-09-26',[])[0]['academic_year'],'2026-2027')
        self.assertEqual(sessions_from_rows([headers],'2026-09-25',[]),[])
        with self.assertRaises(ValueError): sessions_from_rows([['wrong']],'2026-09-25',[])

    def test_people_aliases_enrichment_and_blank_bios(self):
        rows=[['Investigadores'],['Nombre','Cargo en investigación','Cargo docente','EMAIL','Oficina','Mini Biografía','Líneas de investigación'],['Diana Lopez Nacir','Investigadora Independiente','Profesora Adjunta','new@example.org','123','A “bio”','Space-time - Galaxy; Stars'],['Postdocs / docs / lics'],['Nombre','Cargo en investigación'],['Tomas Chase','doctorando'],['Colaboradores externos y visitantes:'],['Someone (University)'],['Miembros Anteriores:'],['Old Member (2020)','Licenciando, 2020']]
        extra={'diana-lopez-nacir':{'contact':{'email':'old@example.org'},'photo':'people/Diana_LN.png'}}
        out=people_from_rows(rows,extra,[])
        self.assertEqual(out[0]['name'],'Diana López Nacir')
        self.assertEqual(out[0]['contact']['email'],'new@example.org')
        self.assertEqual(out[0]['full_bio']['es'],'A "bio"')
        self.assertEqual(out[0]['research_interests'][0]['es'],'Space-time')
        self.assertEqual(out[1]['slug'],'tomas-ferreira-chase')
        self.assertNotIn('full_bio',out[1])
        self.assertEqual(out[2]['affiliation']['en'],'University')
        self.assertEqual(out[3]['role']['en'],'Undergraduate Student, 2020')
        with self.assertRaises(ValueError): people_from_rows([['Wrong sheet']],{},[])

    def test_research_translations_and_incomplete_sections(self):
        existing=[{'id':'old','title':{'es':'Tema','en':'Topic'},'short_description':{'es':'Corto','en':'Short'},'full_description':{'es':'Largo','en':'Long'},'icon':'waves','order':0}]
        doc=parse_doc('Tema\nMini resumen:\nCorto\nExplicación:\nLargo',[])
        self.assertEqual(merge_areas(doc,existing,[]),existing)
        doc[0]['full']='Nuevo'; merged=merge_areas(doc,existing,[])
        self.assertEqual(merged[0]['full_description'],{'es':'Nuevo','en':'Nuevo'})
        self.assertEqual(merged[0]['id'],'old')
        doc[0]['short']=''; self.assertEqual(merge_areas(doc,existing,[])[0]['short_description']['en'],'Short')
        with self.assertRaises(ValueError): merge_areas([{'title':'New','short':'','full':'Text'}],existing,[])
        with self.assertRaises(ValueError): merge_areas([],existing,[])

    def test_inspire_thesis_and_title_preference(self):
        hit={'id':'1','metadata':{'control_number':1,'titles':[{'source':'arXiv','title':'Old'},{'title':r'\textit{New} title'}],'authors':[{'full_name':'A'}],'thesis_info':{'degree_type':'PhD','defense_date':'2020-03-01','institutions':[{'name':'UBA'}]},'dois':[{'value':'10.1234/a'},{'material':'publication','value':'10.1234/b'}]}}
        p=inspire_publication(hit,[])
        self.assertEqual(p['year'],2020); self.assertEqual(p['journal'],'PhD Thesis, UBA'); self.assertEqual(p['doi'],'10.1234/b'); self.assertEqual(p['title'],'New title')

    def test_atom_feed(self):
        xml='<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>http://arxiv.org/abs/2601.12345v2</id><published>2026-01-01</published><title>Test</title><author><name>A, B</name></author></entry></feed>'
        p=arxiv_publications(xml)[0]
        self.assertEqual(p['arxiv'],'2601.12345'); self.assertEqual(p['authors'],['A','B'])
        with self.assertRaises(ValueError): arxiv_publications('<html/>')

    def test_orcid_fixture_and_filtered_type(self):
        groups=read_json(FIXTURES/'orcid-works-tomas.json')['group']
        extracted=[v for group in groups if (v:=orcid_publication(group,'Tomas'))]
        self.assertTrue(extracted)
        self.assertTrue(any(p['doi']=='10.1016/j.nima.2020.164490' for p,_ in extracted if 'doi' in p))
        self.assertIsNone(orcid_publication({'work-summary':[{'type':'data-set'}]},'Tomas'))

    def test_source_precedence_and_missing_doi(self):
        rows=[{'id':'manual','arxiv':'2601.12345','doi':'10.1234/ABC','source':'manual'},{'id':'inspire','arxiv':'2601.12345','doi':'10.1234/abc','source':'inspirehep'},{'id':'orcid','doi':'https://doi.org/10.1234/abc','source':'orcid'},{'id':'other','source':'arxiv'}]
        result,dropped=dedup_doi(dedup_arxiv(rows))
        self.assertEqual([p['id'] for p in result],['manual','other']); self.assertEqual(dropped,1)

    def test_retry_and_404(self):
        with patch('urllib.request.urlopen',side_effect=urllib.error.HTTPError('https://test',503,'unavailable',{},None)) as request, patch('time.sleep'):
            with self.assertRaises(urllib.error.HTTPError): fetch('https://test',attempts=3)
            self.assertEqual(request.call_count,3)
        with patch('urllib.request.urlopen',side_effect=urllib.error.HTTPError('https://test',404,'missing',{},None)):
            self.assertIsNone(fetch('https://test',allow_404=True))

    def test_atomic_write_and_failure_keeps_content(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'content.json'; atomic_json(path,{'old':True}); before=path.read_bytes()
            with patch('os.replace',side_effect=OSError('failed')):
                with self.assertRaises(OSError): atomic_json(path,{'new':True})
            self.assertEqual(path.read_bytes(),before)
        path=CONTENT/'people.json'; before=path.read_bytes()
        with patch('tools.sync.fetch',side_effect=RuntimeError('offline')):
            with self.assertRaises(RuntimeError): run(argparse.Namespace(source='people',verbose=False,dry_run=False,member=None))
        self.assertEqual(path.read_bytes(),before)

    def test_sync_member_dry_run_never_changes_archive(self):
        path=CONTENT/'publications.json'; before=path.read_bytes()
        args=argparse.Namespace(source='publications',verbose=False,dry_run=True,member='esteban-calzetta',no_inspire=False,no_arxiv=True,no_orcid=True)
        with patch('tools.sync_publications.fetch_inspire',return_value=[]): run(args)
        self.assertEqual(path.read_bytes(),before)
        args.no_inspire=True
        with self.assertRaises(ValueError): sync_publications(read_json(CONTENT/'people.json'),read_json(path),args,[])

if __name__=='__main__': unittest.main()
