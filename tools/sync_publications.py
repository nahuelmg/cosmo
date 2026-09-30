"""Publication extraction, deduplication and public API synchronization."""
import json
import re
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from urllib.parse import urlencode
from xml.etree import ElementTree as ET
from .content import sort_publications
from .sync_common import fetch

BAI_RE = re.compile(r'^[A-Z][A-Za-z-]*(\.[A-Za-z-]+)+\.\d+$')


def strip_bibtex(text):
    return re.sub('[{}]', '', re.sub(r'\\[A-Za-z]+\{([^}]*)\}',r'\1',text)).strip()


def nfc(text): return unicodedata.normalize('NFC',text)


def inspire_publication(hit, warnings):
    m=hit['metadata']; arxiv=(m.get('arxiv_eprints') or [{}])[0].get('value')
    pi=(m.get('publication_info') or [{}])[0]; ti=m.get('thesis_info') or {}
    year=pi.get('year')
    for value in (m.get('preprint_date'),ti.get('defense_date'),m.get('earliest_date')):
        if year: break
        if value and re.match(r'^\d{4}',value): year=int(value[:4])
    if not year:
        year=datetime.now(timezone.utc).year; warnings.append(f"Missing year for {hit.get('id')}; defaulted to {year}")
    journal=' '.join(str(v) for v in (pi.get('journal_title'),pi.get('journal_volume'),f"({pi['year']})" if pi.get('year') else None,pi.get('artid')) if v)
    if not journal and ti:
        label={'phd':'PhD Thesis','master':"Master's Thesis",'bachelor':"Bachelor's Thesis",'diploma':'Diploma Thesis','habilitation':'Habilitation Thesis'}.get(ti.get('degree_type','').lower(),'Thesis')
        institution=(ti.get('institutions') or [{}])[0].get('name')
        journal=', '.join(v for v in (label,institution) if v)
    titles=m.get('titles') or []
    title=next((t['title'] for t in titles if t.get('source')!='arXiv'),titles[0]['title'] if titles else 'Untitled')
    row={'id':arxiv or f"inspire-{m['control_number']}",'authors':[nfc(a['full_name']) for a in m['authors']], 'title':nfc(strip_bibtex(title)), 'journal':journal or 'Preprint','year':int(year),'topic_tags':[],'source':'inspirehep'}
    dois=m.get('dois') or []
    doi=next((d['value'] for d in dois if d.get('material')=='publication'),dois[0]['value'] if dois else None)
    if doi: row['doi']=doi
    if arxiv: row['arxiv']=arxiv
    if m.get('abstracts') and m['abstracts'][0].get('value'): row['abstract']=nfc(m['abstracts'][0]['value'])
    return row


def arxiv_publications(xml):
    root=ET.fromstring(xml)
    if root.tag.split('}')[-1]!='feed': raise ValueError('Unexpected arXiv feed response')
    out=[]
    for entry in root.findall('{*}entry'):
        text=lambda name:entry.findtext('{*}'+name,default='')
        identifier=re.sub(r'v\d+$','',text('id').split('/abs/')[-1])
        if '/abs/' not in text('id'): raise ValueError('arXiv entry without parseable id')
        author_elements=entry.findall('{*}author')
        authors=[a.findtext('{*}name',default='') for a in author_elements]
        if len(authors)==1: authors=authors[0].split(', ')
        row={'id':identifier,'arxiv':identifier,'authors':[nfc(a.strip()) for a in authors if a.strip()] or ['Unknown'],'title':nfc(strip_bibtex(text('title'))),'journal':'Preprint','year':int(text('published')[:4]),'topic_tags':[],'source':'arxiv'}
        if text('summary'): row['abstract']=nfc(text('summary'))
        out.append(row)
    return out


def orcid_publication(group, owner):
    work=(group.get('work-summary') or [None])[0]
    if not work or work.get('type') not in ('journal-article','conference-paper'): return None
    code=work.get('put-code'); title=((work.get('title') or {}).get('title') or {}).get('value')
    if not isinstance(code,int) or not title: return None
    ids={}
    for item in (group.get('external-ids') or {}).get('external-id',[]): ids.setdefault(item['external-id-type'],item['external-id-value'])
    doi=ids.get('doi'); arxiv=ids.get('arxiv')
    year=(((work.get('publication-date') or {}).get('year') or {}).get('value'))
    row={'id':doi or arxiv or f'orcid-{code}','authors':[owner],'title':nfc(title),'journal':nfc((work.get('journal-title') or {}).get('value') or 'Preprint'),'year':int(year) if year and re.fullmatch(r'\d{4}',year) else datetime.now(timezone.utc).year,'source':'orcid','topic_tags':[]}
    if doi: row['doi']=re.sub(r'^https?://(?:dx\.)?doi\.org/','',doi,flags=re.I).strip()
    if arxiv: row['arxiv']=arxiv
    return row,code


def normalize_doi(doi):
    return re.sub(r'^https?://(?:dx\.)?doi\.org/','',doi.strip().lower())


def dedup_arxiv(rows):
    seen=set(); out=[]
    for row in rows:
        key=row.get('arxiv') or row['id']
        if key not in seen: out.append(row); seen.add(key)
    return out


def dedup_doi(rows):
    seen=set(); out=[]; dropped=0
    for row in rows:
        key=normalize_doi(row['doi']) if row.get('doi') else None
        if key and key in seen: dropped+=1; continue
        if key: seen.add(key)
        out.append(row)
    return out,dropped


def batches(function, items):
    out=[]
    with ThreadPoolExecutor(max_workers=5) as pool:
        for start in range(0,len(items),5):
            if start: time.sleep(2)
            out.extend(pool.map(function,items[start:start+5]))
    return out


def fetch_inspire(bai,warnings):
    hits=[]; total=1
    fields='arxiv_eprints,titles,authors,publication_info,preprint_date,dois,control_number,abstracts,thesis_info,earliest_date'
    for page in range(1,11):
        params=urlencode({'q':'a '+bai,'size':200,'sort':'mostrecent','fields':fields,'page':page})
        data=json.loads(fetch('https://inspirehep.net/api/literature?'+params,timeout=10))
        block=data['hits']; total=block['total']; chunk=block['hits']
        hits.extend(chunk)
        if len(hits)>=total: break
        if not chunk: raise ValueError('InspireHEP pagination stopped before total was reached')
    if len(hits)<total: warnings.append(f'InspireHEP pagination cap for {bai}: {len(hits)} of {total}')
    return [inspire_publication(hit,warnings) for hit in hits]


def sync_publications(people, existing, args, warnings):
    for p in people:
        if p.get('inspirehep_id') and not BAI_RE.fullmatch(p['inspirehep_id']): raise ValueError('Invalid InspireHEP BAI for '+p['slug'])
    enabled=[s for s,skip in [('inspirehep',args.no_inspire),('orcid',args.no_orcid),('arxiv',args.no_arxiv)] if not skip]
    if not enabled: raise ValueError('No publication sources enabled')
    targets=[p for p in people if p['slug']==args.member] if args.member else [p for p in people if p.get('inspirehep_id') or p.get('orcid_id')]
    if args.member and not targets: raise ValueError('Unknown member: '+args.member)
    if not targets: raise ValueError('No members have publication source identifiers')
    def worker(person):
        rows={s:[] for s in enabled}; lookup={}; notes=[]
        for source in enabled:
            if source=='inspirehep':
                if not person.get('inspirehep_id'): notes.append(f"{person['slug']}: no InspireHEP ID"); continue
                rows[source]=fetch_inspire(person['inspirehep_id'],notes)
            elif source=='arxiv':
                if not person.get('orcid_id'): notes.append(f"{person['slug']}: no ORCID ID for arXiv"); continue
                xml=fetch(f"https://arxiv.org/a/{person['orcid_id']}.atom2",allow_404=True,timeout=10)
                if xml is None: notes.append(f"arXiv ORCID not registered: {person['orcid_id']}")
                rows[source]=arxiv_publications(xml) if xml else []
            else:
                if not person.get('orcid_id'): notes.append(f"{person['slug']}: no ORCID ID"); continue
                response=fetch(f"https://pub.orcid.org/v3.0/{person['orcid_id']}/works",'application/json',allow_404=True,timeout=10)
                if response is None: notes.append(f"ORCID profile not public: {person['orcid_id']}"); continue
                for group in json.loads(response).get('group',[]):
                    extracted=orcid_publication(group,person['name'])
                    if extracted:
                        row,code=extracted; rows[source].append(row); lookup.setdefault(row['id'],(person['orcid_id'],code))
            if source!='orcid' and not rows[source]: notes.append(f"No {source} results for {person['slug']}")
        return rows,lookup,notes
    results=batches(worker,targets)
    sources={s:dedup_arxiv([p for rows,_,_ in results for p in rows.get(s,[])]) for s in enabled}
    lookup={}
    for _,mapping,notes in results:
        warnings.extend(notes)
        for key,value in mapping.items(): lookup.setdefault(key,value)
    manual=[{**p,'source':'manual'} for p in existing['publications'] if p.get('source','manual')=='manual']
    ordered=manual+[p for source in ('inspirehep','orcid','arxiv') for p in sources.get(source,[])]
    survivors,dropped=dedup_doi(dedup_arxiv(ordered))
    def enrich(row):
        orcid,code=lookup[row['id']]
        text=fetch(f'https://pub.orcid.org/v3.0/{orcid}/work/{code}','application/json',allow_404=True,timeout=10)
        if not text: return row
        contributors=(json.loads(text).get('contributors') or {}).get('contributor') or []
        authors=[nfc(c['credit-name']['value']) for c in contributors if c.get('credit-name') and c['credit-name'].get('value')]
        return {**row,'authors':authors} if authors else row
    enriched={p['id']:p for p in batches(enrich,[p for p in survivors if p['source']=='orcid' and p['id'] in lookup])}
    merged=sort_publications([enriched.get(p['id'],p) for p in survivors])
    return {'_meta':{'synced_at':datetime.now(timezone.utc).isoformat(timespec='seconds'),'sources':enabled,'counts':{**{s:len(sources.get(s,[])) for s in ('inspirehep','arxiv','orcid')},'manual':len(manual),'deduped':dropped},'warnings':warnings},'publications':merged}
