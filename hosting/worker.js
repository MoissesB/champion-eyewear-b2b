const PRODUCT_IDS = new Set(/* product-ids:start */[]/* product-ids:end */);
const REVIEW_PARAMS = new Set(['champion_review', 'champion_review_exit']);

function permanentRedirect(url) {
  return Response.redirect(url.href, 308);
}

function protectReviewEntry(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
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
    const isReviewEntry = Array.from(REVIEW_PARAMS).some((name) => url.searchParams.has(name));
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

    const response = await env.ASSETS.fetch(new Request(url, request));
    return isReviewEntry ? protectReviewEntry(response) : response;
  },
};

export default worker;
