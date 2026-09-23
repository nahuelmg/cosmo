import { writeFileSync } from 'node:fs';
import { withBasePath } from '../src/config/paths';
import { siteConfig } from '../src/config/site';

const spanish = withBasePath('/es/');
const english = withBasePath('/en/');
const shell = (title: string, head: string, body: string) => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>${head}
<style>body{font:1.2rem system-ui;max-width:42rem;margin:15vh auto;padding:1.5rem;line-height:1.6}a{color:#175f88} @media(prefers-color-scheme:dark){body{background:#15191e;color:#eee}a{color:#8ac9ee}}</style>
</head><body><main>${body}</main></body></html>\n`;

writeFileSync('out/index.html', shell(siteConfig.groupName,
  `<meta http-equiv="refresh" content="0;url=${spanish}"><link rel="canonical" href="${siteConfig.url}/es/">`,
  `<h1>${siteConfig.groupName}</h1><p><a href="${spanish}">Entrar al sitio en español</a></p><p lang="en"><a href="${english}">Visit the English website</a></p>`));
writeFileSync('out/404.html', shell('404 — Página no encontrada', '<meta name="robots" content="noindex">',
  `<h1>404 — Página no encontrada</h1><p><a href="${spanish}">Volver al inicio</a></p><p lang="en">Page not found. <a href="${english}">Return to the English homepage</a></p>`));
writeFileSync('out/.nojekyll', '');
console.log('Added the root landing page, bilingual 404 page, and .nojekyll.');
