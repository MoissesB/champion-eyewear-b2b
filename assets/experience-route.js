(function () {
  'use strict';

  // Audience choices remain regular links and open the catalog immediately.
  const profile = document.documentElement.dataset.championRouteProfile;
  if (profile === 'b2b' || profile === 'b2c') {
    document.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-language-toggle]');
      if (!toggle) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const next = /^\/en\//i.test(location.pathname) ? 'es' : 'en';
      location.href = `/${next}/${profile}/${location.hash}`;
    }, true);
  }

  const video = document.querySelector('[data-experience-video]');
  if (!video) return;
  const load = () => {
    if (video.src) return;
    video.src = video.dataset.videoSrc;
    video.load();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.play().catch(() => {});
    }
  };
  if (!('IntersectionObserver' in window)) { load(); return; }
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    load();
    observer.disconnect();
  }, { rootMargin: '400px 0px' });
  observer.observe(video);
})();
