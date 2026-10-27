(function () {
  'use strict';

  const version = 'catalog-20261027-11';
  const reviewMode = document.documentElement.hasAttribute('data-champion-review');
  const assetBase = new URL('.', document.currentScript?.src || new URL('./assets/', location.href));
  let ready = false;
  let loading;

  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${new URL(path.replace(/^\.\/assets\//, ''), assetBase).href}?v=${version}`;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadApplication() {
    if (loading) return loading;

    const audience = window.ChampionAudience;
    const base = audience?.loadBase?.() || Promise.all([
      loadScript('../data/products.min.js'),
      loadScript('./assets/i18n.min.js'),
    ]);
    loading = base
      .then(() => reviewMode ? undefined : (audience?.ensureController?.(audience.getProfile()) || loadScript('./assets/request.min.js')))
      .then(() => loadScript('./assets/home.min.js'))
      .then(() => audience?.getProfile?.() === 'b2c' ? loadScript('./assets/optics-locator.min.js') : undefined)
      .then(() => {
        ready = true;
      });

    return loading;
  }

  document.addEventListener('click', (event) => {
    if (ready) return;
    const control = event.target.closest('[data-language-toggle], [data-menu-toggle], [data-video-restart-sound]');
    if (!control) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (control.matches('[data-video-restart-sound]')) {
      const video = document.getElementById('explainVideo');
      const language = document.documentElement.lang.startsWith('en') ? 'en' : 'es';
      const source = language === 'en' ? video?.dataset.videoEn : video?.dataset.videoEs;
      if (video && source) {
        if (video.dataset.soundStarted === 'true') {
          if (video.paused) { video.muted = false; video.play().catch(() => {}); }
          else video.pause();
        } else {
          if (video.getAttribute('src') !== source) { video.src = source; video.load(); }
          video.pause();
          try { video.currentTime = 0; } catch (_error) { /* Metadata may still be loading. */ }
          video.muted = false;
          video.volume = 1;
          video.dataset.soundStarted = 'true';
          video.play().catch(() => {});
        }
        control.textContent = language === 'en'
          ? (video.paused ? 'Resume with sound' : 'Pause')
          : (video.paused ? 'Continuar con sonido' : 'Pausar');
      }
      loadApplication();
      return;
    }
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
