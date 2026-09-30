"""Optional migration comparison while the original server is running.
Run: python tests/visual_compare.py http://127.0.0.1:3000 http://127.0.0.1:8000
"""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

shots=Path('test-results/comparison'); shots.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    report=[]
    for label,base in zip(('original','static'),sys.argv[1:3]):
        context=browser.new_context(reduced_motion='reduce')
        context.route('https://www.google.com/maps**',lambda r:r.fulfill(status=200,body='Map'))
        page=context.new_page()
        for route in ('','people','research','publications','journal-club','resources','contact','outreach','people/cecilia-scannapieco'):
            page.goto(base+'/en/'+route,wait_until='networkidle')
            page.evaluate('document.fonts.ready')
            report.append({'version':label,'route':route,'h1':page.locator('h1').inner_text(),'text':page.locator('main').inner_text()})
            for width in (390,768,1440):
                page.set_viewport_size({'width':width,'height':1000})
                page.screenshot(path=str(shots/f'{label}-{route.replace("/","-") or "home"}-{width}.png'))
        context.close()
    browser.close()
(shots/'content.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('Reference screenshots and content comparison saved to',shots)
