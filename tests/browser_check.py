"""Browser smoke tests. Run after building: python tests/browser_check.py.
Uses installed Chrome, or Playwright Chromium when CHROME_PATH=chromium.
"""
import functools
import http.server
import os
import threading
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from tools.preview import SiteHandler, read_base_path

BASE_PATH = read_base_path(ROOT / 'dist')
class QuietHandler(SiteHandler):
    def log_message(self,*args): pass
handler=functools.partial(QuietHandler,directory=str(ROOT/'dist'),base_path=BASE_PATH)


def run():
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    origin=f'http://127.0.0.1:{server.server_port}'
    base=origin+BASE_PATH
    shots=ROOT/'test-results'; shots.mkdir(exist_ok=True)
    try:
        with sync_playwright() as p:
            executable=os.environ.get('CHROME_PATH','/usr/bin/google-chrome')
            browser=p.chromium.launch(**({'executable_path':executable} if executable!='chromium' else {}),args=['--no-sandbox'])
            context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
            # External map availability is unrelated to local UI correctness.
            context.route('https://www.google.com/maps**',lambda route:route.fulfill(status=200,body='<html><title>Map test</title></html>'))
            page=context.new_page(); errors=[]; page.on('pageerror',lambda error:errors.append(str(error)))
            page.on('response', lambda response: errors.append(f'HTTP {response.status}: {response.url}') if response.status >= 400 and response.url.startswith(origin) else None)
            page.goto(base + '/')
            page.wait_for_url(base + '/es/')
            missing = context.request.get(base + '/does-not-exist/')
            assert missing.status == 404
            assert f'href="{BASE_PATH}/es/"' in missing.text()
            if BASE_PATH:
                assert context.request.get(origin + '/en/').status == 404
            profile = base + '/en/people/cecilia-scannapieco/?from=profile'
            page.goto(profile)
            page.locator('.desktop-controls .locale-toggle').click()
            assert page.url == base + '/es/personas/cecilia-scannapieco/?from=profile'
            page.reload()
            assert page.locator('h1').inner_text() == 'Cecilia Scannapieco'
            for generated in (ROOT/'dist').rglob('index.html'):
                url = base + '/' + generated.parent.relative_to(ROOT/'dist').as_posix().strip('.')
                assert context.request.get(url).status == 200, url
            paths={'es':['','personas','investigacion','publicaciones','journal-club','recursos','divulgacion','contacto','personas/cecilia-scannapieco'], 'en':['','people','research','publications','journal-club','resources','outreach','contact','people/cecilia-scannapieco']}
            for locale,routes in paths.items():
                for route in routes:
                    response=page.goto(f'{base}/{locale}/{route}'+('/' if route else ''))
                    assert response.status==200
                    assert page.locator('h1').count()==1
                    assert page.locator('html').get_attribute('lang')==locale
                    page.evaluate('document.fonts.ready')
                    for width in (390,768,1440):
                        page.set_viewport_size({'width':width,'height':1000})
                        for dark in (False, True):
                            page.evaluate('(dark)=>document.documentElement.classList.toggle("dark",dark)',dark)
                            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'Horizontal overflow: {locale}/{route} at {width}, dark={dark}'
                        page.evaluate('document.documentElement.classList.remove("dark")')
                    if locale=='en': page.screenshot(path=str(shots/((route.replace('/','-') or 'home')+'.png')))
            page.set_viewport_size({'width':1440,'height':1000})
            page.goto(base+'/en/publications/')
            total=page.locator('.publication:visible').count(); assert total>0
            page.locator('#publication-query').fill('zzzz-no-such-paper')
            assert page.locator('.publication:visible').count()==0
            assert page.locator('#publication-empty').is_visible()
            page.locator('#publication-clear').click(); assert page.locator('.publication:visible').count()==total
            page.locator('#publication-member').select_option(index=1)
            count=page.locator('.publication:visible').count(); assert 0<count<=total
            member=page.locator('#publication-member').input_value()
            assert page.locator('.publication:visible').evaluate_all('(rows,member)=>rows.every(r=>r.dataset.members.split(" ").includes(member))',member)
            page.locator('#publication-clear').click()
            page.locator('#publication-query').fill('COSMOLOGY')
            assert page.locator('.publication:visible').count()>0
            page.locator('.desktop-controls .theme-toggle').click() # system -> light
            page.locator('.desktop-controls .theme-toggle').click() # light -> dark
            assert 'dark' in page.locator('html').get_attribute('class')
            page.reload(); assert 'dark' in page.locator('html').get_attribute('class')
            page.screenshot(path=str(shots/'publications-dark.png'))
            page.goto(base+'/en/research/?test=1#detail-gravitational-waves')
            link=page.locator('.desktop-controls .locale-toggle')
            assert '?test=1#detail-' in link.get_attribute('href')
            link.click(); assert '/es/investigacion/' in page.url
            page.set_viewport_size({'width':390,'height':844})
            page.locator('.menu-open').click(); assert page.locator('#mobile-menu').is_visible()
            for _ in range(15):
                page.keyboard.press('Tab'); assert page.evaluate('document.querySelector("#mobile-menu").contains(document.activeElement)')
            page.keyboard.press('Escape'); assert not page.locator('#mobile-menu').is_visible()
            assert page.locator('.menu-open').evaluate('(e)=>e===document.activeElement')
            page.screenshot(path=str(shots/'research-mobile-dark.png'))
            page.goto(base+'/es/')
            assert page.locator('.carousel-pause').get_attribute('aria-label')==page.locator('.carousel-pause').get_attribute('data-play')
            page.locator('[data-slide="1"]').click(); assert page.locator('.slide.active').get_attribute('aria-label')=='2 / 3'
            page.locator('.carousel-pause').click(); assert page.locator('#carousel-slides').get_attribute('aria-live')=='off'
            page.goto(base+'/en/people/cecilia-scannapieco/')
            assert page.locator('a[href^="mailto:"]').count()>0
            page.goto(base+'/en/resources/'); page.locator('summary').first.click(); assert page.locator('.resource-card').first.is_visible()
            page.goto(base+'/en/journal-club/'); page.locator('summary').first.click(); assert page.locator('details[open]').count()==1
            page.goto(base+'/en/contact/'); page.locator('.map').scroll_into_view_if_needed(); page.wait_for_function('document.querySelector("iframe").src.includes("google.com/maps")')
            assert not errors,errors
            nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
            fallback=nojs.new_page(); fallback.goto(base+'/es/publicaciones/')
            assert fallback.locator('.publication').count()==total
            assert fallback.locator('.fallback-nav').is_visible()
            assert not fallback.locator('.publication-filters').is_visible()
            fallback.goto(base+'/en/contact/'); assert fallback.locator('.map>a').is_visible()
            browser.close()
            print('Browser checks passed: all committed routes served, 18 representative pages at 3 viewport sizes in both themes, filters, themes, locale links, mobile focus, carousel, email, disclosures, map, and no-JS content.')
    finally: server.shutdown(); server.server_close()

if __name__=='__main__': run()
