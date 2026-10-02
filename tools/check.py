"""Check generated pages and local links without network requests."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys
import re
from .site_files import site_files

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.links=[]; self.ids=set(); self.headings=0; self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids: raise ValueError(f'Duplicate HTML id: {attrs["id"]}')
            self.ids.add(attrs['id'])
        if tag=='h1': self.headings+=1
        if tag == 'base': raise ValueError('Base elements defeat document-relative site URLs')
        if tag == 'meta' and attrs.get('http-equiv', '').lower() == 'refresh':
            refresh = re.search(r';\s*url\s*=\s*(.+)', attrs.get('content', ''), re.I)
            if refresh: self.links.append(refresh[1].strip().strip('\"\''))
        for key in ('href','src','data-src','action','poster'):
            if key in attrs: self.links.append(attrs[key])
        if tag=='img' and 'alt' not in attrs: raise ValueError('Image missing alt text')

def check(root):
    root=Path(root).resolve()
    pages={root / p:Page((root / p).read_text()) for p in site_files(root) if p.suffix == '.html'}
    errors=[]
    for path,page in pages.items():
        if path.name=='index.html' and path.parent!=root and page.headings!=1: errors.append(f'{path}: expected one h1')
        for link in page.links:
            url=urlsplit(link)
            if url.scheme or url.netloc: continue
            local_path = unquote(url.path)
            if local_path.startswith('/'):
                errors.append(f'{path.relative_to(root)}: use a document-relative URL: {link}')
                continue
            target=(path.parent/local_path).resolve() if local_path else path
            if target.is_dir(): target=target/'index.html'
            if not target.is_relative_to(root) or not target.exists(): errors.append(f'{path.relative_to(root)}: missing {link}')
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids: errors.append(f'{path.relative_to(root)}: missing anchor {link}')
    if errors: raise ValueError('\n'.join(errors[:30]))
    return len(pages)

if __name__=='__main__': print(f'Checked {check(sys.argv[1] if len(sys.argv)>1 else ".")} HTML files.')
