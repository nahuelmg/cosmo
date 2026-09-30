"""Google Sheets/Docs importers preserving the original sources and overrides."""
import re
from datetime import date, datetime
from .content import CONTENT, fold, read_json
from .sync_common import slugify, parse_csv
from pathlib import Path

TABLES = read_json(Path(__file__).with_name('sync_tables.json'))
DEFAULT_URLS = {
 'people': 'https://docs.google.com/spreadsheets/d/1SMJ3gXrW-KJi-bFUXkCHZRimL4mpuqcil77iRQq0EoQ/export?format=csv',
 'journal-club': 'https://docs.google.com/spreadsheets/d/1fBfnMGPPQ_dgz-hdYmJDyuntg1rqRT2YiJADTo92vfA/export?format=csv',
 'research': 'https://docs.google.com/document/d/1GdMShbn3RJ-yNmXC70-7xGm-9TL-Q__v429kqLTL2P4/export?format=txt',
}
ENV_KEYS = {'people':'PEOPLE_SHEET_CSV_URL', 'journal-club':'JOURNAL_CLUB_SHEET_CSV_URL', 'research':'RESEARCH_DOC_TXT_URL'}


def normalize_date(raw):
    try:
        return (date.fromisoformat(raw.strip()) if re.fullmatch(r'\d{4}-\d{2}-\d{2}',raw.strip()) else datetime.strptime(raw.strip(), '%m/%d/%Y').date()).isoformat()
    except ValueError: return None


def normalize_time(raw):
    m = re.fullmatch(r'(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(a\.? ?m\.?|p\.? ?m\.?)?',fold(raw).strip())
    if not m: return None
    hour, minute = int(m[1]), int(m[2] or 0)
    if minute>59: return None
    if m[3]:
        if not 1<=hour<=12: return None
        hour = hour%12 + (12 if m[3][0]=='p' else 0)
    elif hour>23: return None
    return f'{hour:02}:{minute:02}'


def academic_year(value):
    d=date.fromisoformat(value); start=d.year if d.month>=8 else d.year-1
    return f'{start}-{start+1}'


def resolve_header(label):
    cleaned=re.sub(r'\s+',' ',re.sub(r'\([^)]*\)',' ',fold(label))).rstrip(' :.*').strip()
    if not cleaned: return None
    headers=TABLES['HEADER_MAP']
    if cleaned in headers: return headers[cleaned]
    matches={v for k,v in headers.items() if k.startswith(cleaned) or cleaned.startswith(k)}
    return next(iter(matches)) if len(matches)==1 else None


def sessions_from_rows(table, today, warnings):
    if not table: return []
    columns=[resolve_header(h) for h in table[0]]
    if not all(k in columns for k in ('date','speaker','title')): raise ValueError('Journal club header needs date, speaker and title columns')
    sessions=[]; used={}
    for cells in table[1:]:
        raw={k:v.strip() for k,v in zip(columns,cells) if k and v.strip()}
        if not any(raw.get(k) for k in ('date','speaker','title')): continue
        value=normalize_date(raw.get('date',''))
        if not value or not raw.get('speaker') or not raw.get('title'):
            warnings.append(f'Skipped incomplete session: {raw}'); continue
        session={k:v for k,v in raw.items() if k not in ('date','start_time','location','paper_link')}
        key=f"{value}-{slugify(raw['speaker'])}"; used[key]=used.get(key,0)+1
        session.update(id=key+(f'-{used[key]}' if used[key]>1 else ''),date=value,status='upcoming' if value>=today else 'past')
        if session['status']=='past': session['academic_year']=academic_year(value)
        if raw.get('start_time'):
            time=normalize_time(raw['start_time'])
            if time: session['start_time']=time
            else: warnings.append(f'{value}: dropped invalid time')
        if raw.get('location'):
            location=' '.join(raw['location'].split())
            session['location']=location if re.match(r'^aulas?\b',fold(location)) else 'Aula '+location
        if raw.get('paper_link'):
            if re.match(r'^https?://',raw['paper_link'],re.I): session['paper_link']=raw['paper_link']
            else: warnings.append(f'{value}: dropped invalid paper link')
        sessions.append(session)
    return sorted(sessions,key=lambda s:s['date'],reverse=True)


def straighten(value):
    return value.translate(str.maketrans({'‘':"'",'’':"'",'‛':"'",'“':'"','”':'"','‟':'"'}))


def split_interests(value):
    return [s for item in re.split(r'[\n;]+|\s+[-–—•·*]+\s+',value) if (s:=re.sub(r'^[\s\-–—•·*]+','',straighten(item)).strip())]


def people_from_rows(table, extra, warnings):
    section=None; columns={0:'name',1:'roleEs',2:'teachingEs'}; people=[]
    for cells in table:
        a=cells[0].strip() if cells else ''
        if not a: continue
        header=TABLES['SECTION_HEADERS'].get(fold(a).rstrip(':'))
        if header: section=header; continue
        if not section: continue
        if fold(a)=='nombre':
            for i,c in enumerate(cells):
                if fold(c.strip()) in TABLES['COLUMN_HEADERS']: columns[i]=TABLES['COLUMN_HEADERS'][fold(c.strip())]
            continue
        raw={field:cells[i].strip() for i,field in columns.items() if i<len(cells)}
        paren=None; name=a
        m=re.fullmatch(r'(.*?)\s*\(([^)]*)\)\s*',a) if section in ('past','collaborators') else None
        if m: name,paren=m[1].strip(),m[2].strip()
        key=slugify(name); alias=TABLES['ALIASES'].get(key,{})
        slug=alias.get('slug',key); name=alias.get('name',name); e=extra.get(slug,{})
        role_es=raw.get('roleEs','')
        category={'pi':'pi','past':'past','collaborators':'visitors'}.get(section)
        if not category:
            category='postdoc' if re.search('pos.?doc',fold(role_es)) else ('undergrad' if re.search('licenciand|licenciatura',fold(role_es)) else 'phd')
            if category=='phd' and role_es and not re.search('doctorand|doctorado',fold(role_es)): warnings.append(f'{slug}: unknown role, defaulted to PhD')
        if category=='past':
            description=cells[1].strip() if len(cells)>1 else ''
            if description:
                description=straighten(description); m=re.fullmatch(r'(.*?)(\s*,\s*\d{4})?',description)
                translated=TABLES['ROLE_EN'].get(fold(m[1]).strip())
                role={'es':description,'en':translated+(m[2] or '') if translated else description}
                if not translated: warnings.append(f'{slug}: untranslated past member role')
            else:
                yr=re.search(r'\b\d{4}\b',paren or ''); suffix=' ('+yr[0]+')' if yr else ''
                role={'es':'Estudiante de licenciatura'+suffix,'en':'Undergraduate student'+suffix}
        elif role_es and section!='collaborators':
            en=TABLES['ROLE_EN'].get(fold(role_es).strip(), e.get('role',{}).get('en',role_es))
            role={'es':role_es,'en':en}
            if en==role_es: warnings.append(f'{slug}: untranslated research role')
        else: role=e.get('role',{'es':'Investigador Visitante','en':'Visiting Researcher'})
        person={'slug':slug,'name':name,'category':category,'role':role,'display_name_normalized':fold(name),'contact':dict(e.get('contact',{})),'social_links':e.get('social_links',[])}
        for field in ('photo','inspirehep_id','orcid_id','years','thesis_topic','current_position','teaching_role','affiliation'):
            if e.get(field): person[field]=e[field]
        if not person.get('affiliation') and section=='collaborators' and paren: person['affiliation']={'es':paren,'en':paren}
        if section in ('pi','researchStaff'):
            email=raw.get('email','')
            if email:
                if re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+',email): person['contact']['email']=email
                else: warnings.append(f'{slug}: invalid email ignored')
            if raw.get('office'): person['contact']['office']=raw['office']
            if raw.get('bioEs'):
                bio=straighten(raw['bioEs']); person['short_bio']=person['full_bio']={'es':bio,'en':bio}
            interests=split_interests(raw.get('interestsEs',''))
            if interests: person['research_interests']=[{'es':v,'en':v} for v in interests]
            teaching=raw.get('teachingEs')
            if teaching:
                mapped=TABLES['TEACHING'].get(fold(teaching).strip())
                person['teaching_role']=mapped or {'es':teaching,'en':e.get('teaching_role',{}).get('en',teaching)}
                if not mapped and not e.get('teaching_role'): warnings.append(f'{slug}: untranslated teaching role')
        people.append(person)
    if not people: raise ValueError('People sheet has no recognized members; retaining existing content')
    return people


def marker(line):
    label=fold(line).rstrip(' :.*').strip()
    if label in ('mini resumen','resumen','mini-resumen'): return 'short'
    if label in ('explicacion','explicacion larga','descripcion','descripcion larga'): return 'full'
    return None


def parse_doc(text,warnings):
    lines=[s.strip() for s in text.lstrip('\ufeff').splitlines() if s.strip()]; areas=[]; current=None; block=None
    for i,line in enumerate(lines):
        kind=marker(line)
        if kind: block=kind; continue
        if i+1<len(lines) and marker(lines[i+1])=='short':
            current={'title':line,'short':[],'full':[]}; areas.append(current); block=None
        elif current and block: current[block].append(line)
        else: warnings.append('Ignored stray document line: '+line[:60])
    return [{**a,'short':' '.join(a['short']),'full':'\n\n'.join(a['full'])} for a in areas]


def merge_areas(doc,existing,warnings):
    if not doc: raise ValueError('Research document has no areas; retaining existing content')
    by_title={fold(a['title']['es']).strip():a for a in existing}; used=set(); matched=set(); result=[]
    for order,area in enumerate(doc):
        previous=by_title.get(fold(area['title']).strip())
        if previous is None and fold(area['title']).strip()=='pulsares': previous=next((a for a in existing if a['id']=='binary-pulsars'),None)
        if not previous and (not area['short'] or not area['full']): raise ValueError('New research area is incomplete: '+area['title'])
        if previous: key=previous['id']; matched.add(key)
        else:
            key=base=slugify(area['title']); n=2
            while key in used: key=f'{base}-{n}'; n+=1
            warnings.append('Added research area: '+key)
        used.add(key)
        row={'id':key,'order':order}
        for src,dst in [('title','title'),('short','short_description'),('full','full_description')]:
            text=area[src] or previous[dst]['es']
            if not area[src]: warnings.append(f'{key}: blank {src}, retaining existing text')
            en=previous[dst]['en'] if previous and previous[dst]['es']==text else text
            if previous and previous[dst]['es']!=text: warnings.append(f'{key}: {src} changed; English mirrors Spanish until translated')
            row[dst]={'es':text,'en':en}
        for field in ('icon','image'):
            if previous and previous.get(field): row[field]=previous[field]
        result.append(row)
    for a in existing:
        if a['id'] not in matched: warnings.append('Removed research area: '+a['id'])
    return result
