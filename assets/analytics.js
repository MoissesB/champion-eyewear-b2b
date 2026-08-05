(() => {
  const measurementId = 'G-10EF1REGL8';

  if (window.__championAnalyticsMeasurementId === measurementId) return;
  window.__championAnalyticsMeasurementId = measurementId;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  // Do not set or override Consent Mode here. Any consent manager remains authoritative.
  window.gtag('js', new Date());

  const isLocalPreview = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  window.gtag('config', measurementId, { send_page_view: !isLocalPreview });

  const existingLoader = document.querySelector(
    `script[src*="googletagmanager.com/gtag/js"][src*="${measurementId}"]`,
  );
  if (existingLoader) return;

  const loader = document.createElement('script');
  loader.async = true;
  loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  loader.dataset.measurementId = measurementId;
  document.head.appendChild(loader);
})();
