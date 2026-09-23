import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { basePath, withBasePath } from '../src/config/paths';
import { siteConfig } from '../src/config/site';
import { routing } from '../src/i18n/routing';
import { sectionKeys, localizedSection } from '../src/i18n/sections';
import { getPeople } from '../src/content';

const expected = ['index.html', '404.html', 'sitemap.xml', 'robots.txt', '.nojekyll'];
for (const locale of routing.locales) {
  expected.push(`${locale}/index.html`);
  for (const section of sectionKeys) expected.push(`${locale}/${localizedSection(section, locale)}/index.html`);
  for (const person of getPeople().filter((person) => person.category !== 'past')) {
    expected.push(`${locale}/${localizedSection('people', locale)}/${person.slug}/index.html`);
  }
}
for (const path of expected) assert(existsSync(join('out', path)), `Missing export: ${path}`);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}
const origin = new URL(siteConfig.url).origin;
const errors = new Set<string>();
let checked = 0;
for (const file of files('out').filter((file) => file.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  assert(!html.includes('cosmo.vercel.app'), `Old canonical host in ${file}`);
  assert(!html.includes(`${basePath}${basePath}/`), `Doubled base path in ${file}`);
  const pageUrl = `${origin}${withBasePath('/' + file.slice(4).replace(/index\.html$/, ''))}`;
  for (const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
    const raw = match[1].replaceAll('&amp;', '&');
    if (raw.startsWith('#')) continue;
    const url = new URL(raw, pageUrl);
    if (url.origin !== origin) continue;
    if (!url.pathname.startsWith(`${basePath}/`)) {
      errors.add(`${file}: URL outside base path: ${raw}`);
      continue;
    }
    const relative = decodeURIComponent(url.pathname.slice(basePath.length + 1));
    const target = join('out', relative);
    if (!existsSync(target) || (statSync(target).isDirectory() && !existsSync(join(target, 'index.html')))) {
      errors.add(`${file}: missing target: ${raw}`);
    }
    checked++;
  }
}
assert.equal(errors.size, 0, [...errors].join('\n'));
console.log(`Verified ${expected.length} required export files and ${checked} local HTML references.`);
