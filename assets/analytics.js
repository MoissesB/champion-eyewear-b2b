(() => {
  'use strict';
  const measurementId = 'G-10EF1REGL8';
  if (window.__championAnalyticsMeasurementId === measurementId) return;
  window.__championAnalyticsMeasurementId = measurementId;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  // Any consent manager remains authoritative.
  window.gtag('js', new Date());
  // Exactly one explicit page_view per document, after product titles are ready.
  window.gtag('config', measurementId, { send_page_view: false });

  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';
  const route = location.pathname.match(/^\/(es|en)\/(b2b|b2c)\/(?:(modelos)\/([a-z0-9-]+)\/|((?:monturas|lentes-sol|frames|sunglasses))\/)?$/i);
  const productPage = Boolean(route?.[4]) || /\/product(?:-consumer)?\.html$/i.test(location.pathname);
  const context = () => ({
    audience: route?.[2] || document.body?.dataset.audience || 'general',
    content_language: route?.[1] || (document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'es'),
    page_type: productPage ? 'product' : route?.[5] ? 'category' : route ? 'catalog' : /\/blog\//.test(location.pathname)
      ? 'article' : /\/blog\.html$/.test(location.pathname) ? 'blog' : 'other',
  });
  const track = (name, parameters = {}) => {
    window.gtag('event', name, { send_to: measurementId, ...context(), ...parameters });
    if (local) document.documentElement.dataset.championAnalyticsPreview = JSON.stringify(
      Array.from(window.dataLayer).filter((entry) => entry[0] === 'event')
        .map((entry) => ({ name: entry[1], parameters: entry[2] })),
    );
  };
  window.ChampionAnalytics = { track, measurementId };

  document.addEventListener('click', (event) => {
    const control = event.target.closest('a,button');
    if (!control) return;
    const href = control.getAttribute('href') || '';
    const productId = href.match(/\/modelos\/([a-z0-9-]+)\//i)?.[1];
    const source = control.closest('.related-card') ? 'related' : control.closest('.catalog-index-section')
      ? 'model_index' : context().page_type === 'category' ? 'category' : 'catalog';
    if (productId && !productPage) {
      const product = window.CHAMPION_CATALOG?.products?.find((item) => item.id === productId);
      track('select_item', {
        item_list_name: source,
        items: [{ item_id: productId, ...(product ? { item_name: product.displayModel, item_brand: 'Champion',
          item_category: product.family, item_category2: product.series, item_variant: product.variant } : {}) }],
      });
    }
    if (control.matches('[data-find-optics-open]')) track('optics_locator_open', { product_id: document.body.dataset.productId || undefined });
    if (control.matches('#opticsMapLink') && /^https:\/\/www\.google\.com\/maps\//.test(control.href)) {
      track('optics_map_open', { product_id: document.body.dataset.productId || undefined,
        country_code: document.getElementById('opticsCountry')?.value || undefined });
    }
    if (control.matches('[data-product-contact-open]')) track('professional_contact_open', { product_id: document.body.dataset.productId || undefined });
    if (control.matches('[data-request-open]')) track('order_review_open', { product_id: document.body.dataset.productId || undefined });
    if (control.matches('.product-audience-switch') || /\/(?:b2b|b2c)\/modelos\/[^/]+\/$/.test(href) && productPage) {
      const destination = href.match(/\/(b2b|b2c)\//)?.[1];
      if (destination && destination !== context().audience) track('audience_switch', { destination_audience: destination, product_id: document.body.dataset.productId || undefined });
    }
    const segment = href.match(/\/(monturas|lentes-sol|frames|sunglasses)\/$/)?.[1];
    if (segment) track('catalog_segment_select', { product_family: /monturas|frames/.test(segment) ? 'optical' : 'sun' });
  });

  if (!productPage) {
    const pageView = () => track('page_view', {
      page_title: document.title, page_location: location.href,
      product_family: route?.[5] ? (/monturas|frames/.test(route[5]) ? 'optical' : 'sun') : undefined,
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pageView, { once: true });
    else pageView();
  }

  // Local QA records dataLayer calls without contacting GA4.
  if (local) return;
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"][src*="${measurementId}"]`)) return;
  const loader = document.createElement('script');
  loader.async = true;
  loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  loader.dataset.measurementId = measurementId;
  document.head.appendChild(loader);
})();
