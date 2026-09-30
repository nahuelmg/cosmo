"""Preview generated files at the same URL prefix used in production."""
import argparse
import functools
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


def read_base_path(directory):
    info = Path(directory) / 'build-info.json'
    return json.loads(info.read_text())['base_path'] if info.exists() else ''


class SiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory, base_path='', **kwargs):
        self.base_path = base_path
        super().__init__(*args, directory=directory, **kwargs)

    def send_head(self):
        path = urlsplit(self.path)
        if self.base_path:
            if path.path in ('/', self.base_path):
                self.send_response(302)
                self.send_header('Location', urlunsplit(('', '', self.base_path + '/', path.query, '')))
                self.send_header('Content-Length', '0')
                self.end_headers()
                return None
            if not path.path.startswith(self.base_path + '/'):
                self.send_error(404)
                return None
        return super().send_head()

    def translate_path(self, path):
        parsed = urlsplit(path)
        local = parsed.path
        if self.base_path and local.startswith(self.base_path + '/'):
            local = local[len(self.base_path):]
        return super().translate_path(urlunsplit(('', '', local, parsed.query, '')))

    def send_error(self, code, message=None, explain=None):
        error_page = Path(self.directory) / '404.html'
        if code == 404 and error_page.exists():
            body = error_page.read_bytes()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            if self.command != 'HEAD': self.wfile.write(body)
        else:
            super().send_error(code, message, explain)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', type=Path, default=Path('dist'))
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--bind', default='127.0.0.1')
    args = parser.parse_args()
    if not (args.directory / 'index.html').exists(): parser.error('Build the website first: python -m tools.build')
    base_path = read_base_path(args.directory)
    handler = functools.partial(SiteHandler, directory=str(args.directory.resolve()), base_path=base_path)
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f'Preview: http://{args.bind}:{server.server_port}{base_path}/', flush=True)
        try: server.serve_forever()
        except KeyboardInterrupt: pass


if __name__ == '__main__': main()
