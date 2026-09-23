/** GitHub project Pages serves all pages and assets below this prefix. */
export const basePath = "/cosmo";

/** For public assets and plain HTML links; Next Link adds basePath itself. */
export function withBasePath(path: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path)) return path;
  const rooted = `/${path.replace(/^\/+/, "")}`;
  if (rooted === basePath || rooted.startsWith(`${basePath}/`)) return rooted;
  return `${basePath}${rooted}`;
}
