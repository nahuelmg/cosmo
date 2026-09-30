/* Progressive enhancements: all page content and navigation is generated HTML. */
(() => {
  const root = document.documentElement;
  const modes = ['system', 'light', 'dark'];
  const mq = matchMedia('(prefers-color-scheme: dark)');
  function updateTheme() {
    const mode = root.dataset.theme;
    root.classList.toggle('dark', mode === 'dark' || (mode === 'system' && mq.matches));
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.hidden = false;
      const next = modes[(modes.indexOf(mode) + 1) % modes.length];
      button.setAttribute('aria-label', button.dataset.label.replace('{next}', button.dataset[next]));
      button.querySelectorAll('[data-theme-icon]').forEach(icon => { icon.hidden = icon.dataset.themeIcon !== mode; });
    });
  }
  document.querySelectorAll('.theme-toggle').forEach(button => button.addEventListener('click', () => {
    root.dataset.theme = modes[(modes.indexOf(root.dataset.theme) + 1) % modes.length];
    try { document.cookie = `theme=${root.dataset.theme};path=/;max-age=31536000;SameSite=Lax`; } catch {}
    updateTheme();
  }));
  mq.addEventListener('change', updateTheme);
  updateTheme();
  document.querySelectorAll('.locale-toggle').forEach(link => { link.search = location.search; link.hash = location.hash; });
  document.querySelectorAll('.email-link').forEach(span => {
    const a = document.createElement('a');
    a.textContent = `${span.dataset.user}@${span.dataset.domain}`;
    a.href = `mailto:${a.textContent}`;
    span.replaceWith(a);
  });
  const dialog = document.querySelector('#mobile-menu');
  const opener = document.querySelector('.menu-open');
  if (dialog && opener) {
    opener.hidden = false;
    opener.addEventListener('click', () => {
      dialog.showModal(); opener.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-active');
    });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const items = [...dialog.querySelectorAll('a[href], button:not([disabled])')].filter(el => !el.hidden);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    const close = () => dialog.close();
    dialog.querySelector('.menu-close').addEventListener('click', close);
    dialog.addEventListener('click', e => { if (e.target === dialog && e.clientX < dialog.getBoundingClientRect().left) close(); });
    dialog.addEventListener('close', () => { opener.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-active'); opener.focus(); });
    const desktop = matchMedia('(min-width: 768px)');
    desktop.addEventListener('change', () => { if (desktop.matches && dialog.open) close(); });
  }
  const carousel = document.querySelector('.hero');
  if (carousel) {
    const slides = [...carousel.querySelectorAll('.slide')];
    const dots = [...carousel.querySelectorAll('[data-slide]')];
    const pause = carousel.querySelector('.carousel-pause');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0, paused = reduced.matches, timer;
    carousel.querySelector('.carousel-controls').hidden = false;
    function render() {
      clearTimeout(timer);
      slides.forEach((slide, n) => { slide.classList.toggle('active', n === index); slide.setAttribute('aria-hidden', String(n !== index)); });
      dots.forEach((dot, n) => dot.setAttribute('aria-pressed', String(n === index)));
      pause.querySelector('[data-play-icon]').hidden = !paused;
      pause.querySelector('[data-pause-icon]').hidden = paused;
      pause.setAttribute('aria-label', paused ? pause.dataset.play : pause.dataset.pause);
      carousel.querySelector('#carousel-slides').setAttribute('aria-live', paused ? 'polite' : 'off');
      if (!paused && !document.hidden) timer = setTimeout(() => { index = (index + 1) % slides.length; render(); }, 7000);
    }
    carousel.addEventListener('focusin', () => { paused = true; render(); });
    pause.addEventListener('click', () => { paused = !paused; render(); });
    dots.forEach((dot, n) => dot.addEventListener('click', () => { index = n; render(); }));
    document.addEventListener('visibilitychange', render);
    reduced.addEventListener('change', () => { if (reduced.matches) paused = true; render(); });
    render();
  }
  const filters = document.querySelector('.publication-filters');
  if (filters) {
    filters.hidden = false;
    const query = document.querySelector('#publication-query');
    const member = document.querySelector('#publication-member');
    const rows = [...document.querySelectorAll('.publication')];
    const groups = [...document.querySelectorAll('.publication-year')];
    const fold = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    function filter() {
      const terms = fold(query.value).split(/\s+/).filter(Boolean);
      let count = 0;
      rows.forEach(row => {
        row.hidden = !terms.every(term => row.dataset.search.includes(term)) || !!(member.value && !row.dataset.members.split(' ').includes(member.value));
        if (!row.hidden) count++;
      });
      groups.forEach(group => { group.hidden = !group.querySelector('.publication:not([hidden])'); });
      document.querySelector('#publication-empty').hidden = count !== 0;
      document.querySelector('#publication-count').textContent = root.lang === 'es' ? `${count} ${count === 1 ? 'publicación' : 'publicaciones'}` : `${count} ${count === 1 ? 'publication' : 'publications'}`;
      document.querySelector('#publication-clear').hidden = !query.value.trim() && !member.value;
    }
    query.addEventListener('input', filter); member.addEventListener('change', filter);
    document.querySelector('#publication-clear').addEventListener('click', () => { query.value = ''; member.value = ''; filter(); query.focus(); });
    filter();
  }
  document.querySelectorAll('iframe[data-src]').forEach(frame => {
    const load = () => { frame.src = frame.dataset.src; frame.hidden = false; };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { load(); observer.disconnect(); } }, {rootMargin: '200px'});
      observer.observe(frame.parentElement);
    } else load();
  });
})();
