(function () {
  'use strict';

  const catalog = window.CHAMPION_CATALOG;
  const i18n = window.ChampionI18n;
  if (!catalog || !Array.isArray(catalog.products) || !i18n) return;

  const products = catalog.products;
  const state = { optical: { query: '', collection: 'all' }, sun: { query: '', collection: 'all' } };

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function normalize(value) {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function searchable(product) {
    const localized = i18n.localizeProduct(product);
    return normalize([product.model, product.displayModel, product.series, product.variant, product.color, localized.color, product.measurements, product.material, localized.material, product.shape, localized.shape, product.lens, localized.lens, product.sku, product.collection, ...(product.tags || []), ...(localized.tags || [])].join(' '));
  }

  function card(source) {
    const product = i18n.localizeProduct(source);
    const detailUrl = `./product.html?id=${encodeURIComponent(product.id)}`;
    return `
      <article class="product-card" data-product-id="${escapeHtml(product.id)}">
        <a class="product-card-image" href="${detailUrl}" aria-label="${escapeHtml(i18n.t('viewDetails'))}: ${escapeHtml(product.displayModel)}">
          <img src="./${escapeHtml(product.cover)}" alt="${escapeHtml(product.displayModel)} — ${escapeHtml(product.color)}" loading="lazy" decoding="async">
          <span class="product-family-badge">${product.family === 'sun' ? 'Champion Sun' : escapeHtml(product.collection)}</span>
        </a>
        <div class="product-card-body">
          <div class="product-card-topline"><span>${escapeHtml(product.collection)}</span><span>${escapeHtml(product.variant)}</span></div>
          <h3><a href="${detailUrl}">${escapeHtml(product.displayModel)}</a></h3>
          <p class="product-card-color">${escapeHtml(product.color)}</p>
          <p class="product-card-spec">${escapeHtml(product.family === 'sun' ? product.shape : `${product.material} · ${product.measurements}`)}</p>
          <div class="product-card-actions"><a href="${detailUrl}">${escapeHtml(i18n.t('viewDetails'))}</a><button type="button" data-request-add data-product-id="${escapeHtml(product.id)}">${escapeHtml(i18n.t('addRequest'))}</button></div>
        </div>
      </article>`;
  }

  function renderFamily(family) {
    const config = family === 'sun'
      ? { grid: 'sunGrid', status: 'sunStatus', singular: 'sunOne', plural: 'sunMany' }
      : { grid: 'opticalGrid', status: 'opticalStatus', singular: 'opticalOne', plural: 'opticalMany' };
    const familyState = state[family];
    const query = normalize(familyState.query);
    const matches = products.filter((product) => product.family === family && (familyState.collection === 'all' || product.collection === familyState.collection) && (!query || searchable(product).includes(query)));
    const grid = document.getElementById(config.grid);
    const status = document.getElementById(config.status);
    if (grid) grid.innerHTML = matches.length ? matches.map(card).join('') : `<div class="catalog-empty"><strong>${escapeHtml(i18n.t('noMatchesTitle'))}</strong><span>${escapeHtml(i18n.t('noMatchesText'))}</span></div>`;
    if (status) status.textContent = `${matches.length} ${i18n.t(matches.length === 1 ? config.singular : config.plural)}${familyState.collection === 'all' ? '' : ` ${i18n.t('inCollection')} ${familyState.collection}`}`;
    renderCollectionInfo(family);
  }

  function renderCollectionInfo(family) {
    const root = document.getElementById(family === 'sun' ? 'sunCollectionInfo' : 'opticalCollectionInfo');
    const info = i18n.collectionInfo(family, state[family].collection);
    if (!root || !info) return;
    root.innerHTML = `<div><span class="collection-explainer-label">${escapeHtml(state[family].collection === 'all' ? i18n.t('allMasculine') : state[family].collection)}</span><h3>${escapeHtml(info.title)}</h3><p>${escapeHtml(info.description)}</p></div><div class="collection-explainer-details"><p><strong>${i18n.language === 'es' ? 'Diferencia:' : 'Difference:'}</strong> ${escapeHtml(info.difference)}</p><p><strong>${i18n.language === 'es' ? 'Ejemplo:' : 'Example:'}</strong> ${escapeHtml(info.example.replace(/^(Ejemplo:|Example:)\s*/i, ''))}</p></div>`;
  }

  function renderFaq() {
    const root = document.getElementById('faqRoot');
    if (!root) return;
    const groups = i18n.faq();
    root.innerHTML = `
      <aside class="faq-topics" aria-label="${escapeHtml(i18n.t('faqTopics'))}">
        <span class="eyebrow">${escapeHtml(i18n.t('faqTopics'))}</span>
        <div class="faq-topic-list" role="tablist">${groups.map((group, index) => `<button type="button" class="${index === 0 ? 'is-active' : ''}" role="tab" aria-selected="${index === 0}" data-faq-topic="${escapeHtml(group.id)}">${escapeHtml(group.title)}</button>`).join('')}</div>
      </aside>
      <div class="faq-content">${groups.map((group, groupIndex) => `
        <section class="faq-group ${groupIndex === 0 ? 'is-active' : ''}" data-faq-panel="${escapeHtml(group.id)}" ${groupIndex === 0 ? '' : 'hidden'}>
          <h3>${escapeHtml(group.title)}</h3>${group.intro ? `<p class="faq-intro">${escapeHtml(group.intro)}</p>` : ''}
          ${group.items.map(([question, answer], itemIndex) => `<details class="faq-item" ${groupIndex === 0 && itemIndex === 0 ? 'open' : ''}><summary><span>${escapeHtml(question)}</span><span class="faq-chevron" aria-hidden="true">⌄</span></summary><div><p>${escapeHtml(answer)}</p></div></details>`).join('')}
        </section>`).join('')}</div>`;
  }

  function bindFaq() {
    document.getElementById('faqRoot')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-faq-topic]');
      if (!button) return;
      const topic = button.dataset.faqTopic;
      document.querySelectorAll('[data-faq-topic]').forEach((item) => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-selected', String(active)); });
      document.querySelectorAll('[data-faq-panel]').forEach((panel) => { const active = panel.dataset.faqPanel === topic; panel.classList.toggle('is-active', active); panel.hidden = !active; });
    });
  }

  function bindCatalog(family) {
    const search = document.getElementById(family === 'sun' ? 'sunSearch' : 'opticalSearch');
    const filters = document.getElementById(family === 'sun' ? 'sunFilters' : 'opticalFilters');
    search?.addEventListener('input', (event) => { state[family].query = event.target.value; renderFamily(family); });
    filters?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      state[family].collection = button.dataset.filter;
      filters.querySelectorAll('[data-filter]').forEach((filter) => { const active = filter === button; filter.classList.toggle('is-active', active); filter.setAttribute('aria-pressed', String(active)); });
      renderFamily(family);
    });
    filters?.querySelectorAll('[data-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.classList.contains('is-active'))));
  }

  function bindHeader() {
    const header = document.getElementById('siteHeader');
    const menuButton = document.querySelector('[data-menu-toggle]');
    const mobileNav = document.getElementById('mobileNav');
    const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
    updateHeader(); window.addEventListener('scroll', updateHeader, { passive: true });
    menuButton?.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); if (mobileNav) mobileNav.hidden = !open; });
    mobileNav?.addEventListener('click', (event) => { if (!event.target.closest('a,button')) return; mobileNav.hidden = true; menuButton?.setAttribute('aria-expanded', 'false'); });
  }

  function bindVideo() {
    const button = document.querySelector('[data-sound-toggle]');
    const video = document.getElementById('explainVideo');
    button?.addEventListener('click', () => { if (!video) return; video.muted = !video.muted; button.textContent = i18n.t(video.muted ? 'soundOn' : 'soundOff'); if (video.paused) video.play().catch(() => {}); });
  }

  function initReveal() {
    const nodes = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { nodes.forEach((node) => node.classList.add('is-visible')); return; }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (!entry.isIntersecting) return; entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }), { threshold: 0.12, rootMargin: '0px 0px -40px' });
    nodes.forEach((node) => observer.observe(node));
  }

  function rerenderLocalized() { renderFamily('optical'); renderFamily('sun'); renderFaq(); }

  function init() {
    const opticalCount = products.filter((product) => product.family === 'optical').length;
    const sunCount = products.filter((product) => product.family === 'sun').length;
    document.querySelectorAll('[data-optical-count]').forEach((node) => { node.textContent = String(opticalCount); });
    document.querySelectorAll('[data-sun-count]').forEach((node) => { node.textContent = String(sunCount); });
    bindCatalog('optical'); bindCatalog('sun'); renderFamily('optical'); renderFamily('sun'); renderFaq(); bindFaq(); bindHeader(); bindVideo(); initReveal();
    i18n.onChange(rerenderLocalized);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
