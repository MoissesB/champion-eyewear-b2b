(function () {
  'use strict';

  // Champion-only form IDs verified in its GHL sub-account. These forms remain drafts.
  const GHL_FORM_IDS = Object.freeze({
    es: Object.freeze({ b2b: 'kZyMWdBrTHxC2y7HNzAi', b2c: 'FVIgsfZ93xU1DPqMZNLs' }),
    en: Object.freeze({ b2b: 'tRr6lFGaKP8TSoIuyHTT', b2c: 'xF4foEKfP63JiD3Y75s7' }),
  });
  const FORM_ORIGIN = 'https://api.leadconnectorhq.com/widget/form/';
  const routeProfile = document.documentElement.dataset.championRouteProfile;
  const selectorPage = document.body.classList.contains('experience-selector');
  const productPage = /\/product\.html$/i.test(location.pathname);
  const params = new URLSearchParams(location.search);
  const profile = routeProfile || (productPage ? (params.get('audience') === 'b2c' ? 'b2c' : 'b2b') : null);
  if (!selectorPage && !['b2b', 'b2c'].includes(profile)) return;

  const copy = {
    es: {
      unavailable: 'El formulario de Champion aún no está conectado. No se ha enviado información.',
      titleB2B: 'Contacto profesional Champion',
      titleB2C: 'Orientación personal Champion',
      description: 'Complete el formulario de GoHighLevel para que el equipo de Champion pueda atenderle.',
      selectorDescription: 'Puedes completar el formulario o continuar al catálogo sin enviarlo.',
      close: 'Cerrar formulario',
      continue: 'Continuar al catálogo',
      frameB2B: 'Formulario Champion para ópticas y distribuidores',
      frameB2C: 'Formulario Champion para compradores personales',
    },
    en: {
      unavailable: 'The Champion contact form is not connected yet. No information has been sent.',
      titleB2B: 'Champion professional contact',
      titleB2C: 'Champion personal guidance',
      description: 'Complete the GoHighLevel form so the Champion team can assist you.',
      selectorDescription: 'You can complete the form or continue to the catalog without submitting it.',
      close: 'Close form',
      continue: 'Continue to catalog',
      frameB2B: 'Champion form for optical stores and distributors',
      frameB2C: 'Champion form for personal shoppers',
    },
  };
  let dialog;
  let lastTrigger;

  function currentLanguage() {
    if (routeProfile) return /^\/en\//i.test(location.pathname) ? 'en' : 'es';
    if (selectorPage) return /^\/en(?:\/|$)/i.test(location.pathname) ? 'en' : 'es';
    const liveLanguage = window.ChampionI18n?.language;
    if (liveLanguage === 'en' || liveLanguage === 'es') return liveLanguage;
    return params.get('lang') === 'en' ? 'en' : 'es';
  }

  function configuredFormId(language, audience) {
    const id = GHL_FORM_IDS[language]?.[audience] || '';
    return /^[A-Za-z0-9_-]{10,80}$/.test(id) ? id : null;
  }

  function ensureStyles() {
    if (!productPage) return;
    const stylesheet = new URL('experience.css', document.currentScript?.src || new URL('/assets/', location.href)).href;
    if (Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((link) => link.href === stylesheet)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = stylesheet;
    document.head.appendChild(link);
  }

  function showUnavailable(trigger, language) {
    document.querySelectorAll('[data-lead-form-status]').forEach((status) => status.remove());
    const status = document.createElement('p');
    status.className = 'lead-form-status';
    status.dataset.leadFormStatus = '';
    status.setAttribute('role', 'status');
    status.textContent = copy[language].unavailable;
    trigger.insertAdjacentElement('afterend', status);
  }

  function closeDialog() {
    if (dialog?.open) dialog.close();
  }

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'champion-lead-dialog';
    dialog.id = 'championLeadDialog';
    dialog.setAttribute('aria-labelledby', 'championLeadTitle');
    dialog.setAttribute('aria-describedby', 'championLeadDescription');
    dialog.setAttribute('aria-modal', 'true');
    dialog.innerHTML = '<div class="champion-lead-panel"><header class="champion-lead-header"><div><span class="champion-lead-kicker">Champion Eyewear</span><h2 id="championLeadTitle"></h2><p id="championLeadDescription"></p></div><button type="button" class="champion-lead-close" data-lead-form-close aria-label="Cerrar formulario">×</button></header><iframe class="champion-lead-frame" title="Formulario Champion" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="champion-lead-footer" data-lead-continue-wrap hidden><a class="champion-lead-continue" data-lead-continue href="#"></a></div></div>';
    document.body.appendChild(dialog);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-lead-form-close]')) closeDialog();
    });
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(); });
    dialog.addEventListener('close', () => {
      dialog.querySelector('iframe')?.removeAttribute('src');
      document.body.classList.remove('champion-lead-modal-open');
      lastTrigger?.focus({ preventScroll: true });
    });
    return dialog;
  }

  function openForm(trigger, audience, destination) {
    const language = currentLanguage();
    const id = configuredFormId(language, audience);
    if (!id || typeof HTMLDialogElement === 'undefined' || typeof HTMLDialogElement.prototype.showModal !== 'function') {
      showUnavailable(trigger, language);
      return;
    }
    document.querySelectorAll('[data-lead-form-status]').forEach((status) => status.remove());
    const text = copy[language];
    const form = ensureDialog();
    lastTrigger = trigger;
    form.querySelector('#championLeadTitle').textContent = audience === 'b2b' ? text.titleB2B : text.titleB2C;
    form.querySelector('#championLeadDescription').textContent = destination ? text.selectorDescription : text.description;
    const close = form.querySelector('[data-lead-form-close]');
    close.setAttribute('aria-label', text.close);
    const continueWrap = form.querySelector('[data-lead-continue-wrap]');
    continueWrap.hidden = !destination;
    if (destination) {
      const continueLink = continueWrap.querySelector('[data-lead-continue]');
      continueLink.href = destination;
      continueLink.textContent = text.continue;
    }
    const frame = form.querySelector('iframe');
    frame.title = audience === 'b2b' ? text.frameB2B : text.frameB2C;
    document.body.classList.add('champion-lead-modal-open');
    form.showModal();
    close.focus({ preventScroll: true });
    frame.src = new URL(encodeURIComponent(id), FORM_ORIGIN).href;
  }

  ensureStyles();
  document.addEventListener('click', (event) => {
    const languageToggle = event.target.closest('[data-language-toggle]');
    if (languageToggle && routeProfile) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const next = currentLanguage() === 'es' ? 'en' : 'es';
      location.href = `/${next}/${profile}/${location.hash}`;
      return;
    }
    const choice = event.target.closest('[data-experience-choice]');
    if (choice && selectorPage) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const audience = choice.dataset.experienceChoice;
      if (!['b2b', 'b2c'].includes(audience)) return;
      if (!configuredFormId(currentLanguage(), audience) || typeof HTMLDialogElement === 'undefined' || typeof HTMLDialogElement.prototype.showModal !== 'function') return;
      event.preventDefault();
      openForm(choice, audience, `/${currentLanguage()}/${audience}/`);
      return;
    }
    const leadButton = event.target.closest('[data-lead-form-open]');
    if (!leadButton) return;
    event.preventDefault();
    openForm(leadButton, profile, null);
  }, true);
})();
