(function () {
  'use strict';

  const version = 'commercial-20260807-24';
  let ready = false;
  let loading;

  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${path}?v=${version}`;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadApplication() {
    if (loading) return loading;

    loading = Promise.all([
      loadScript('./data/products.min.js'),
      loadScript('./assets/i18n.min.js'),
    ])
      .then(() => loadScript('./assets/request.min.js'))
      .then(() => loadScript('./assets/home.min.js'))
      .then(() => {
        ready = true;
      });

    return loading;
  }

  document.addEventListener('click', (event) => {
    if (ready) return;
    const control = event.target.closest('[data-language-toggle], [data-request-open], [data-menu-toggle]');
    if (!control) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    loadApplication().then(() => control.click());
  }, true);

  ['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
    window.addEventListener(eventName, loadApplication, {
      once: true,
      passive: eventName !== 'keydown',
    });
  });

  if (window.location.hash) {
    loadApplication();
  } else {
    window.addEventListener('load', () => {
      const delay = window.matchMedia('(max-width: 767px)').matches ? 4200 : 700;
      window.setTimeout(loadApplication, delay);
    }, { once: true });
  }
})();
