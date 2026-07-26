(function () {
  'use strict';

  let ready = false;
  let loading;

  function loadRequest() {
    if (loading) return loading;

    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = './assets/request.min.js?v=performance-20260726';
      script.async = true;
      script.onload = () => {
        ready = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return loading;
  }

  document.addEventListener('click', (event) => {
    if (ready) return;
    const control = event.target.closest('[data-request-open], [data-request-add]');
    if (!control) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    loadRequest().then(() => control.click());
  }, true);

  ['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
    window.addEventListener(eventName, loadRequest, {
      once: true,
      passive: eventName !== 'keydown',
    });
  });

  window.addEventListener('load', () => {
    const delay = window.matchMedia('(max-width: 767px)').matches ? 4200 : 900;
    window.setTimeout(loadRequest, delay);
  }, { once: true });
})();
