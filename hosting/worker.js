const PRODUCT_IDS = new Set(/* product-ids:start */[]/* product-ids:end */);

function permanentRedirect(url) {
  return Response.redirect(url.href, 308);
}

async function notFound(request, env, url) {
  const fallbackUrl = new URL('/404.html', url);
  const fallback = await env.ASSETS.fetch(new Request(fallbackUrl, request));
  const headers = new Headers(fallback.headers);
  headers.set('X-Robots-Tag', 'noindex, follow');
  return new Response(fallback.body, { status: 404, headers });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    let needsRedirect = false;

    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      needsRedirect = true;
    }

    if (url.hostname === 'www.champion-innova.com') {
      url.hostname = 'champion-innova.com';
      needsRedirect = true;
    }

    if (url.pathname === '/index.html') {
      url.pathname = '/';
      needsRedirect = true;
    }

    if (needsRedirect) return permanentRedirect(url);

    if (url.pathname === '/product.html') {
      const id = url.searchParams.get('id');
      if (!id || !PRODUCT_IDS.has(id)) return notFound(request, env, url);
    }

    if (url.pathname === '/404.html') return notFound(request, env, url);

    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = '/index.html';
    }

    return env.ASSETS.fetch(new Request(url, request));
  },
};

export default worker;
