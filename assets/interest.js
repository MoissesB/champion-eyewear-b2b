(function () {
  'use strict';

  const catalog = window.CHAMPION_CATALOG;
  const i18n = window.ChampionI18n;
  if (!catalog || !Array.isArray(catalog.products) || !i18n) return;

  const STORAGE_KEY = 'champion-b2c-interest-v1';
  const productMap = new Map(catalog.products.map((product) => [product.id, product]));
  let lastFocused;
  let toastTimer;

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const items = Array.isArray(parsed.items) ? parsed.items.filter((id) => productMap.has(id)) : [];
      return { items: Array.from(new Set(items)) };
    } catch (_error) { return { items: [] }; }
  }

  let state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items }));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function selectedProducts() {
    return state.items.map((id) => productMap.get(id)).filter(Boolean);
  }

  function profile() {
    return window.ChampionAudience?.getB2CProfile?.() || { name: '', phone: '', phoneCountryCode: '', city: '', countryOrigin: '', productInterest: '', contactPreference: '' };
  }

  function countryLabel(value) {
    return window.ChampionAudience?.countries?.find((country) => country.value === value)?.label || value;
  }

  function showToast(message) {
    const toast = document.getElementById('siteToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
  }

  function ensurePortal() {
    let portal = document.getElementById('interestPortal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'interestPortal';
      document.body.appendChild(portal);
    }
    return portal;
  }

  function shellMarkup() {
    const lead = profile();
    const internationalPhone = window.ChampionAudience?.formattedPhone?.(lead.phoneCountryCode, lead.phone) || lead.phone;
    return `<button class="interest-fab" type="button" data-interest-open aria-label="Abrir mis modelos Champion">Mis modelos <span data-interest-count>0</span></button>
      <div class="interest-overlay" data-interest-close></div>
      <aside class="interest-drawer" id="interestDrawer" role="dialog" aria-modal="true" aria-labelledby="interestTitle" aria-hidden="true">
        <header class="interest-drawer-header"><div><span class="eyebrow">Selección personal</span><h2 id="interestTitle">Modelos que me interesan</h2><p>Guarda varias referencias para solicitar orientación. Esto no es una compra, reserva ni pedido.</p></div><button class="drawer-close" type="button" data-interest-close aria-label="Cerrar mis modelos">×</button></header>
        <div class="interest-drawer-body">
          <div class="interest-profile"><div><span>Nombre</span><strong>${escapeHtml(lead.name || 'Pendiente')}</strong></div><div><span>Número telefónico</span><strong>${escapeHtml(internationalPhone || 'Pendiente')}</strong></div><div><span>Ciudad</span><strong>${escapeHtml(lead.city || 'Pendiente')}</strong></div><div><span>País o región</span><strong>${escapeHtml(countryLabel(lead.countryOrigin) || 'Pendiente')}</strong></div><div><span>Interés</span><strong>${escapeHtml(lead.productInterest || 'Pendiente')}</strong></div><div><span>Atención</span><strong>${escapeHtml(lead.contactPreference || 'Pendiente')}</strong></div><button type="button" data-interest-edit-profile>Editar datos</button></div>
          <div class="interest-summary" aria-live="polite"><strong data-interest-summary-count>0</strong><span>modelos guardados</span></div>
          <div class="interest-items" id="interestItems"></div>
          <div class="interest-actions"><p>La selección se conserva en este navegador. El envío permanece desactivado hasta habilitar la integración correspondiente.</p><button type="button" disabled>Enviar selección — pendiente de conexión</button></div>
        </div>
      </aside>`;
  }

  function render() {
    const items = selectedProducts();
    document.querySelectorAll('[data-interest-count]').forEach((node) => { node.textContent = String(items.length); });
    document.querySelectorAll('[data-interest-summary-count]').forEach((node) => { node.textContent = String(items.length); });
    const root = document.getElementById('interestItems');
    if (!root) return;
    root.innerHTML = items.length ? items.map((source) => {
      const product = i18n.localizeProduct(source);
      return `<article class="interest-item"><img src="./${escapeHtml(product.cover)}" alt="${escapeHtml(product.displayModel)}"><div><h3>${escapeHtml(product.displayModel)}</h3><p>${escapeHtml(product.color)}</p><span>${escapeHtml(product.sku)}</span></div><button type="button" data-interest-remove="${escapeHtml(product.id)}">Quitar</button></article>`;
    }).join('') : `<div class="interest-empty"><strong>Todavía no has guardado modelos.</strong><p>Explora el catálogo y pulsa “Me interesa este modelo” en las referencias que quieras comparar.</p><a class="button button-dark" href="./index.html#monturas">Explorar modelos</a></div>`;
  }

  function adaptB2CControls() {
    document.querySelectorAll('[data-request-open]').forEach((button) => {
      button.setAttribute('data-interest-open', '');
      button.removeAttribute('data-i18n');
      button.setAttribute('aria-label', 'Abrir mis modelos Champion');
      const desktop = button.querySelector('.header-request-label-desktop');
      const mobile = button.querySelector('.header-request-label-mobile');
      if (desktop || mobile) {
        desktop?.removeAttribute('data-i18n');
        mobile?.removeAttribute('data-i18n');
        if (desktop) desktop.textContent = 'Mis modelos';
        if (mobile) mobile.textContent = 'Mis modelos';
        const count = button.querySelector('[data-request-count]');
        count?.removeAttribute('data-request-count');
        count?.setAttribute('data-interest-count', '');
      } else {
        button.textContent = 'Ver mis modelos';
      }
    });
    document.querySelectorAll('[data-request-add]').forEach((button) => {
      button.setAttribute('data-interest-add', '');
      button.removeAttribute('data-i18n');
      button.textContent = 'Me interesa este modelo';
    });
    render();
  }

  function open(trigger) {
    lastFocused = trigger || document.activeElement;
    document.body.classList.add('interest-open');
    document.querySelector('.interest-overlay')?.classList.add('is-open');
    const drawer = document.getElementById('interestDrawer');
    drawer?.classList.add('is-open');
    drawer?.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => drawer?.querySelector('.drawer-close')?.focus(), 20);
  }

  function close() {
    document.body.classList.remove('interest-open');
    document.querySelector('.interest-overlay')?.classList.remove('is-open');
    const drawer = document.getElementById('interestDrawer');
    drawer?.classList.remove('is-open');
    drawer?.setAttribute('aria-hidden', 'true');
    lastFocused?.focus?.();
  }

  function add(id) {
    const product = productMap.get(id);
    if (!product) return;
    if (!state.items.includes(id)) state.items.push(id);
    saveState();
    render();
    showToast(`${product.displayModel} se guardó en Mis modelos.`);
  }

  function remove(id) {
    state.items = state.items.filter((item) => item !== id);
    saveState();
    render();
  }

  function buildLocalPayload() {
    const lead = profile();
    const prefix = window.ChampionAudience?.phonePrefixes?.find((item) => item.code === lead.phoneCountryCode);
    return {
      brand: 'champion',
      leadProfile: 'b2c',
      name: lead.name,
      phone: lead.phone,
      phoneCountryCode: lead.phoneCountryCode,
      phoneDialCode: prefix?.dial || '',
      phoneInternational: window.ChampionAudience?.formattedPhone?.(lead.phoneCountryCode, lead.phone) || lead.phone,
      city: lead.city,
      countryOrigin: lead.countryOrigin,
      productInterest: lead.productInterest,
      contactPreference: lead.contactPreference,
      models: selectedProducts().map((product) => ({ id: product.id, sku: product.sku, displayModel: product.displayModel, family: product.family, color: product.color, productUrl: new URL(`product.html?id=${encodeURIComponent(product.id)}`, window.location.href).href })),
    };
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-interest-close]')) { event.preventDefault(); close(); return; }
      const removeButton = event.target.closest('[data-interest-remove]');
      if (removeButton) { event.preventDefault(); remove(removeButton.dataset.interestRemove); return; }
      const edit = event.target.closest('[data-interest-edit-profile]');
      if (edit) { event.preventDefault(); close(); window.ChampionAudience?.editB2CProfile?.(edit); }
    });
    document.addEventListener('keydown', (event) => {
      if (!document.body.classList.contains('interest-open')) return;
      if (event.key === 'Escape') { close(); return; }
      if (event.key !== 'Tab') return;
      const drawer = document.getElementById('interestDrawer');
      const focusable = Array.from(drawer?.querySelectorAll('button:not([disabled]), a[href], input, select') || []).filter((node) => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  function mount() {
    const portal = ensurePortal();
    portal.innerHTML = shellMarkup();
    adaptB2CControls();
    bindEvents();
  }

  window.ChampionInterest = { add, remove, open, close, count: () => selectedProducts().length, selection: selectedProducts, buildLocalPayload, adaptControls: adaptB2CControls };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
