(function () {
  'use strict';
  const root = document.documentElement;
  const routeProfile = root.dataset.championRouteProfile;
  const productPage = /\/product\.html$/i.test(location.pathname);
  const params = new URLSearchParams(location.search);
  const profile = routeProfile || (productPage ? (params.get('audience') === 'b2c' ? 'b2c' : 'b2b') : null);
  const language = /^\/en\//.test(location.pathname) || params.get('lang') === 'en' ? 'en' : 'es';
  if (!['b2b', 'b2c'].includes(profile)) return;

  document.addEventListener('click', (event) => {
    const languageToggle = event.target.closest('[data-language-toggle]');
    if (languageToggle && routeProfile) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const next = language === 'es' ? 'en' : 'es';
      location.href = `/${next}/${profile}/${location.hash}`;
      return;
    }
    const leadButton = event.target.closest('[data-lead-form-open]');
    if (!leadButton) return;
    event.preventDefault();
    const message = language === 'en'
      ? 'The Champion contact form is not connected yet. No information has been sent.'
      : 'El formulario de Champion aún no está conectado. No se ha enviado información.';
    let status = document.getElementById('leadFormStatus');
    if (!status) {
      status = document.createElement('p');
      status.id = 'leadFormStatus';
      status.setAttribute('role', 'status');
      status.className = 'lead-form-status';
      leadButton.insertAdjacentElement('afterend', status);
    }
    status.textContent = message;
    status.scrollIntoView({ block: 'nearest' });
  }, true);
})();
