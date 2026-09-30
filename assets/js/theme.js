/* Runs before first paint. Keep the existing theme cookie across migration. */
(() => {
  let mode = 'system';
  try { mode = decodeURIComponent(document.cookie.match(/(?:^|;\s*)theme=([^;]+)/)?.[1] || 'system'); } catch {}
  if (!['system', 'light', 'dark'].includes(mode)) mode = 'system';
  document.documentElement.dataset.theme = mode;
  document.documentElement.classList.toggle('dark', mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches));
})();
