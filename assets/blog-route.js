(function () {
  'use strict';

  // The articles are shared editorial pages. Keep the originating catalog route explicit.
  const params = new URLSearchParams(location.search);
  const audience = params.get('audience') === 'b2c' ? 'b2c' : 'b2b';
  const language = params.get('lang') === 'en' ? 'en' : 'es';
  const catalogPath = `/${language}/${audience}/`;

  document.querySelectorAll('a[href]').forEach((link) => {
    const target = new URL(link.getAttribute('href'), location.href);
    if (target.origin !== location.origin) return;

    if (/^\/index\.html$/i.test(target.pathname)) {
      target.pathname = catalogPath;
      target.search = '';
    } else if (/^\/blog(?:\/[^/]+)?\.html$/i.test(target.pathname)) {
      target.searchParams.set('audience', audience);
      target.searchParams.set('lang', language);
    } else if (/^\/product\.html$/i.test(target.pathname)) {
      target.searchParams.set('audience', audience);
      target.searchParams.set('lang', language);
    } else if (audience === 'b2c' && /^\/catalogo\.html$/i.test(target.pathname)) {
      target.pathname = catalogPath;
      target.search = '';
      target.hash = 'monturas';
    } else {
      return;
    }

    link.href = target.href;
  });

  if (audience === 'b2c') {
    // The shared posts are expressly B2B editorial; don't expose professional contact controls to shoppers.
    document.querySelectorAll('.blog-header .header-request, .blog-header .mobile-nav a[href*="#contacto-comercial"], .site-footer .footer-grid > div:last-child').forEach((node) => node.remove());
  }
})();
