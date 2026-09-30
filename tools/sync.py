"""Synchronize a content source: python -m tools.sync SOURCE [--dry-run]."""
import argparse
import os
import sys
from datetime import datetime, timezone
from .content import CONTENT, ROOT, read_json, validate
from .sync_common import fetch, parse_csv, atomic_json
from .sync_sheets import DEFAULT_URLS, ENV_KEYS, sessions_from_rows, people_from_rows, parse_doc, merge_areas
from .sync_publications import sync_publications


def run(args):
    warnings=[]; source=args.source
    path=CONTENT/f'{source}.json'
    existing=validate(source,read_json(path))
    if source=='publications':
        people=validate('people',read_json(CONTENT/'people.json'))
        data=sync_publications(people,existing,args,warnings)
    else:
        url=os.environ.get(ENV_KEYS[source]) or DEFAULT_URLS[source]
        if args.verbose: print('Fetching '+url,file=sys.stderr)
        text=fetch(url)
        if source=='journal-club': data=sessions_from_rows(parse_csv(text),datetime.now(timezone.utc).date().isoformat(),warnings)
        elif source=='people': data=people_from_rows(parse_csv(text),validate('people-extra',read_json(CONTENT/'people-extra.json')),warnings)
        else: data=merge_areas(parse_doc(text,warnings),existing,warnings)
    validate(source,data)
    for warning in warnings: print('Warning: '+warning,file=sys.stderr)
    if source=='publications' and args.member: path=ROOT/'tools/tmp'/f'sync-{args.member}.json'
    rows=data['publications'] if source=='publications' else data
    if args.dry_run: print(f'[dry-run] {len(rows)} {source} records; would write {path}'); return
    # Timestamp-only drift must not create daily publication commits.
    unchanged=source=='publications' and not args.member and data['publications']==existing['publications']
    changed=False if unchanged else atomic_json(path,data)
    print(f'{"Wrote" if changed else "Unchanged"}: {len(rows)} {source} records ({len(warnings)} warnings)')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',choices=['publications','people','journal-club','research'])
    parser.add_argument('--dry-run',action='store_true'); parser.add_argument('--verbose',action='store_true')
    parser.add_argument('--member'); parser.add_argument('--no-inspire',action='store_true'); parser.add_argument('--no-arxiv',action='store_true'); parser.add_argument('--no-orcid',action='store_true')
    args=parser.parse_args()
    if args.source!='publications' and (args.member or args.no_inspire or args.no_arxiv or args.no_orcid): parser.error('Member/source filters only apply to publications')
    try: run(args)
    except Exception as error: print(f'Sync failed; existing content retained: {error}',file=sys.stderr); return 1
    return 0

if __name__=='__main__': sys.exit(main())
