"""Document-relative URLs, independent of the server's mounting prefix."""
import posixpath
from urllib.parse import urlsplit, urlunsplit


def relative_url(page, target):
    """Resolve a site-root target relative to a page's directory URL."""
    url = urlsplit(target)
    if url.scheme or url.netloc or not url.path:
        return target
    path = posixpath.relpath('/' + url.path.lstrip('/'), start=page)
    if url.path.endswith('/'):
        path = './' if path == '.' else path + '/'
    return urlunsplit(('', '', path, url.query, url.fragment))
