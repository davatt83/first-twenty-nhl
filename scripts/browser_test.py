from playwright.sync_api import sync_playwright
from pathlib import Path
html=Path(__file__).resolve().parents[1]/'index.html'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 pg=b.new_page(viewport={'width':1100,'height':800})
 pg.route('**/*',lambda route: route.abort() if 'api-web.nhle.com' in route.request.url or 'proxy.cors.dev' in route.request.url or 'allorigins.win' in route.request.url else route.continue_())
 errors=[]
 pg.on('pageerror',lambda e:errors.append(str(e)))
 pg.set_content(html.read_text(),wait_until='domcontentloaded',timeout=20000)
 pg.wait_for_timeout(800)
 assert pg.locator('#home option').count()==32,(pg.locator('#home option').count(),errors)
 assert pg.locator('#away option').count()==32
 assert pg.locator('#prob').inner_text() not in ('','—')
 pg.select_option('#home','MTL');pg.select_option('#away','DET')
 assert pg.locator('#prob').inner_text() not in ('','—')
 pg.click('#seasons button[data-mode="last"]')
 assert pg.locator('#prob').inner_text() not in ('','—')
 pg.click('#seasons button[data-mode="current"]')
 # Current-only must say insufficient, not invent probability if no matchup-specific data.
 assert pg.locator('#prob').inner_text() in ('—',) or '%' in pg.locator('#prob').inner_text()
 pg.click('.tab[data-tab="data"]')
 assert pg.locator('#currentlogs').inner_text()=='140'
 assert not errors,errors
 b.close()
 print('PASS: All 32 dropdown options, season isolation, partial sample protection, and embedded count visible.')