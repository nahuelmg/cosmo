import { statSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { basePath } from '../src/config/paths';

const root = resolve('out');
const port = Number(process.env.PORT ?? 3000);
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
};
statSync(root);
createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === basePath) {
      res.writeHead(308, { Location: `${basePath}/${url.search}` }).end();
      return;
    }
    if (!pathname.startsWith(`${basePath}/`)) throw new Error('Outside site');
    let file = resolve(root, pathname.slice(basePath.length + 1));
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Outside export');
    if ((await stat(file)).isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(308, { Location: `${url.pathname}/${url.search}` }).end();
        return;
      }
      file = resolve(file, 'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file).toLowerCase()] ?? 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(resolve(root, '404.html')));
  }
}).listen(port, '127.0.0.1', () => console.log(`Static preview: http://localhost:${port}${basePath}/`));
