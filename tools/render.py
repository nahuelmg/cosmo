"""Render only automatic HTML regions; ordinary pages are never generated here."""
from datetime import datetime, timezone
from urllib.parse import quote
from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
from markupsafe import Markup
from .content import ROOT, read_json, localize, fold, matches, sort_publications
ROUTES = {
    'home': ('', ''), 'people': ('personas', 'people'),
    'research': ('investigacion', 'research'), 'publications': ('publicaciones', 'publications'),
    'journalClub': ('journal-club', 'journal-club'), 'resources': ('recursos', 'resources'),
    'outreach': ('divulgacion', 'outreach'), 'contact': ('contacto', 'contact'),
}
NAV = [key for key in ROUTES if key != 'outreach']


def route(locale, page, slug=None):
    part = ROUTES[page][locale == 'en']
    return '/' + '/'.join(x for x in (locale, part, slug) if x) + '/'


def long_date(value, locale):
    d = datetime.fromisoformat(value.replace('Z', '+00:00'))
    months = ('enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre' if locale == 'es' else 'January February March April May June July August September October November December').split()
    return f'{d.day} de {months[d.month-1]} de {d.year}' if locale == 'es' else f'{months[d.month-1]} {d.day}, {d.year}'


def publication_view(pub, people):
    surnames = [fold(p['display_name_normalized']).split()[-1] for p in people if p['display_name_normalized'].split()]
    members = lambda a: any(s in fold(a) for s in surnames if len(s) >= 3)
    authors = pub['authors']
    if len(authors) > 5:
        deep = [a for a in authors[3:] if members(a)]
        authors = authors[:3] + (['…'] + deep if deep else [])
    authors = ['Ferreira Chase, Tomás' if a == 'Chase, Tomás Ferreira' else a for a in authors]
    source = pub.get('source', 'manual')
    href = None
    if source == 'inspirehep':
        if pub.get('arxiv'): href = 'https://inspirehep.net/literature?q=arxiv:' + pub['arxiv']
        elif pub['id'].startswith('inspire-') and pub['id'][8:].isdigit(): href = 'https://inspirehep.net/literature/' + pub['id'][8:]
    elif source == 'arxiv' and pub.get('arxiv'): href = 'https://arxiv.org/abs/' + pub['arxiv']
    orcid = None
    for author in pub['authors']:
        for p in people:
            words = fold(p['display_name_normalized']).split()
            if words and len(words[-1]) >= 3 and words[-1] in fold(author) and p['contact'].get('orcid'):
                orcid = 'https://orcid.org/' + p['contact']['orcid']
                break
        if orcid: break
    return {**pub, 'author_text': '; '.join(authors) + (' et al.' if len(pub['authors']) > 5 else ''),
            'source_href': href, 'orcid_href': orcid,
            'source_label': {'inspirehep': 'InspireHEP', 'arxiv': 'arXiv', 'orcid': 'ORCID', 'manual': 'Manual'}[source],
            'member_slugs': [p['slug'] for p in people if matches(p, pub)],
            'search': fold(' '.join([pub['title'], *pub['authors'], pub['journal'], str(pub['year'])]))}


def render_regions(data, root, profiles):
    site = read_json(root / 'content/site.json')
    site['url'] = site['url'].rstrip('/')
    info = read_json(root / 'build-info.json')
    if site['url'] != info['site_url'].rstrip('/'):
        raise ValueError('Site URL differs from committed HTML')
    base_path = info['base_path']
    env = Environment(loader=FileSystemLoader(ROOT / 'tools/templates'), autoescape=select_autoescape(['html']), undefined=StrictUndefined)
    env.filters['date'] = long_date
    env.filters['year_label'] = lambda rows: '-'.join(dict.fromkeys([min(s['date'][:4] for s in rows), max(s['date'][:4] for s in rows)]))
    env.globals.update(
        route=lambda locale, page, slug=None: base_path + route(locale, page, slug),
        raw_route=route,
        asset=lambda path: base_path + '/' + path.lstrip('/'),
        nav=NAV,
        year=datetime.now(timezone.utc).year,
    )
    icons = {p.stem: Markup(p.read_text()) for p in (ROOT / 'assets/icons').glob('*.svg')}
    env.globals['icon'] = lambda key: icons.get(key, icons['fallback'])
    matching_people = {p['slug']: p for p in profiles.values()}
    matching_people.update({p['slug']: p for p in data['people']})
    views = [publication_view(p, list(matching_people.values())) for p in sort_publications(data['publications']['publications'])]
    options = sorted([p for p in data['people'] if p['category'] in ('pi','postdoc','phd','undergrad') and any(p['slug'] in v['member_slugs'] for v in views)], key=lambda p: fold(p['name']))
    rendered = {}
    for locale in ('es', 'en'):
        t = read_json(root / 'messages' / f'{locale}.json')
        localized = {name: localize(data[name], locale, data['translations']) for name in ('people', 'research', 'outreach', 'journal-club')}
        for session in localized['journal-club']:
            for field in ('title', 'abstract', 'notes', 'speaker_position', 'location'):
                if locale == 'en' and field in session:
                    session[field] = data['translations'].get(session[field], session[field])
        pages = [(key, None) for key in ('people', 'publications', 'journalClub', 'research')] + [('people', localize(p, locale, data['translations'])) for p in profiles.values()]
        for page, person in pages:
            slug = person['slug'] if person else None
            path = route(locale, page, slug)
            title = person['name'] if person else (site['groupName'] if page == 'home' else t['seo'][page]['title'])
            description = person['role'] + ' — ' + site['groupName'] if person else t['seo'][page]['description']
            org = {'@context': 'https://schema.org', '@type': 'ResearchOrganization', '@id': site['url'] + '/#organization', 'name': site['groupName'], 'url': site['url'] + route(locale, 'home'), 'logo': site['url'] + '/logo_cosmo.png', 'parentOrganization': [{'@type': a.get('schemaType', 'Organization'), 'name': a['name'][locale], **{k:a[k] for k in ('url','sameAs') if k in a}} for a in site['affiliations']], 'contactPoint': {'@type': 'ContactPoint', 'url': site['url'] + route(locale, 'contact')}}
            structured = [org]
            if person:
                structured.append({'@context':'https://schema.org', '@type':'Person', 'name':person['name'], 'url':site['url']+path, 'jobTitle':person['role'], 'affiliation':{'@id':site['url']+'/#organization'}, 'sameAs':[s['url'] for s in person.get('social_links', [])] + ([f"https://orcid.org/{person['contact']['orcid']}"] if person['contact'].get('orcid') else [])})
            if person:
                schema = structured[-1]
                if person['category'] != 'past':
                    schema['worksFor'] = {'@id': site['url'] + '/#organization'}
                if person.get('affiliation'): schema['affiliation'] = {'@type':'Organization', 'name':person['affiliation']}
                if person.get('short_bio'): schema['description'] = person['short_bio']
                if person.get('photo'): schema['image'] = site['url'] + '/' + person['photo']
                if person['contact'].get('scholar'): schema['sameAs'].append(person['contact']['scholar'])
                if person['contact'].get('orcid'): schema['identifier'] = {'@type':'PropertyValue','propertyID':'ORCID','value':'https://orcid.org/'+person['contact']['orcid']}
            if page == 'publications':
                for pub in views:
                    article = {'@context':'https://schema.org', '@type':'ScholarlyArticle', 'headline':pub['title'], 'author':[{'@type':'Person','name':a} for a in pub['authors']], 'datePublished':str(pub['year']), 'isPartOf':{'@type':'Periodical','name':pub['journal']}, 'sameAs':[]}
                    if pub.get('arxiv'): article['sameAs'].append('https://arxiv.org/abs/'+pub['arxiv'])
                    if pub.get('doi'):
                        article['sameAs'].append('https://doi.org/'+pub['doi'])
                        article['identifier'] = {'@type':'PropertyValue','propertyID':'DOI','value':'https://doi.org/'+pub['doi']}
                    structured.append(article)
            past_groups = {}
            for session in localized['journal-club']:
                if session['status'] == 'past': past_groups.setdefault(session['academic_year'], []).append(session)
            archive_labels = {key:env.filters['year_label'](rows) for key, rows in past_groups.items()}
            label_counts = {v:list(archive_labels.values()).count(v) for v in archive_labels.values()}
            archive_labels = {key:key if label_counts[value]>1 else value for key,value in archive_labels.items()}
            ctx = dict(archive_labels=archive_labels,locale=locale, other='en' if locale == 'es' else 'es', t=t, site=localize(site,locale,data['translations']), page=page, person=person, title=title, description=description, path=path, structured=structured, production=True,
                       people=localized['people'], research=sorted(localized['research'],key=lambda a:a['order']), outreach=sorted(localized['outreach'],key=lambda a:a['date'],reverse=True), sessions=localized['journal-club'], publications=views, member_options=options, pub_meta=data['publications']['_meta'], resources=localize(read_json(root / 'content/resources.json'),locale,data['translations']), map_query=quote(site['mapQuery']))
            if person:
                ctx['member_pubs'] = [p for p in views if person['slug'] in p['member_slugs'] and p['year'] >= datetime.now(timezone.utc).year - 10]
            blocks = {}
            if person:
                names = ['profile-details', 'profile-publications', 'profile-links', 'profile-meta']
                blocks['profile-schema'] = env.get_template('structured.html').render(**ctx).strip()
            else:
                names = [{'journalClub': 'journal-club'}.get(page, page)]
                if page == 'publications':
                    blocks['publications-schema'] = env.get_template('structured.html').render(**ctx).strip()
            for name in names:
                blocks[name] = env.get_template(name + '.html').render(**ctx).strip()
            rendered[path.lstrip('/') + 'index.html'] = blocks
    return rendered
