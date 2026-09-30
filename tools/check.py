"""Check generated pages and local links without network requests."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.links=[]; self.ids=set(); self.headings=0; self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids: raise ValueError(f'Duplicate HTML id: {attrs["id"]}')
            self.ids.add(attrs['id'])
        if tag=='h1': self.headings+=1
        for key in ('href','src'):
            if key in attrs: self.links.append(attrs[key])
        if tag=='img' and 'alt' not in attrs: raise ValueError('Image missing alt text')

def check(root):
    root=Path(root).resolve()
    pages={p:Page(p.read_text()) for p in root.rglob('*.html')}
    errors=[]
    for path,page in pages.items():
        if path.name=='index.html' and path.parent!=root and page.headings!=1: errors.append(f'{path}: expected one h1')
        for link in page.links:
            url=urlsplit(link)
            if url.scheme or url.netloc: continue
            target=((root/unquote(url.path).lstrip('/')) if url.path.startswith('/') else path.parent/unquote(url.path)).resolve() if url.path else path
            if target.is_dir(): target=target/'index.html'
            if not target.is_relative_to(root) or not target.exists(): errors.append(f'{path.relative_to(root)}: missing {link}')
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids: errors.append(f'{path.relative_to(root)}: missing anchor {link}')
    if errors: raise ValueError('\n'.join(errors[:30]))
    return len(pages)

if __name__=='__main__': print(f'Checked {check(sys.argv[1] if len(sys.argv)>1 else "dist")} HTML files.')
