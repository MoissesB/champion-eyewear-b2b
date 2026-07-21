(function () {
  'use strict';

  const catalog = window.CHAMPION_CATALOG;
  const i18n = window.ChampionI18n;
  if (!catalog || !Array.isArray(catalog.products) || !i18n) return;

  const products = catalog.products;
  const facetConfig = {
    optical: [
      { key: 'collection', label: 'filterCollection' },
      { key: 'series', label: 'filterModel' },
      { key: 'material', label: 'filterMaterial' },
      { key: 'color', label: 'filterColor', color: true },
      { key: 'measurements', label: 'filterMeasurements' },
      { key: 'shape', label: 'filterShape' },
    ],
    sun: [
      { key: 'collection', label: 'filterCollection' },
      { key: 'series', label: 'filterModel' },
      { key: 'material', label: 'filterMaterial' },
      { key: 'color', label: 'filterColor', color: true },
      { key: 'shape', label: 'filterShape' },
      { key: 'lens', label: 'filterLens' },
    ],
  };

  function emptyFacets(family) {
    return Object.fromEntries(facetConfig[family].map(({ key }) => [key, new Set()]));
  }

  const state = {
    optical: { query: '', facets: emptyFacets('optical') },
    sun: { query: '', facets: emptyFacets('sun') },
  };

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

  function facetValues(family, key) {
    return [...new Set(products.filter((product) => product.family === family).map((product) => String(product[key] ?? '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, i18n.language === 'es' ? 'es' : 'en', { numeric: true, sensitivity: 'base' }));
  }

  function facetValueLabel(family, key, value) {
    if (key === 'collection' || key === 'series' || key === 'measurements') return value;
    const product = products.find((item) => item.family === family && String(item[key]) === value);
    return product ? (i18n.localizeProduct(product)[key] || value) : value;
  }

  function colorSwatch(value) {
    const source = normalize(value);
    const colors = [];
    const add = (pattern, color) => { if (pattern.test(source) && !colors.includes(color)) colors.push(color); };
    add(/black|negro/, '#15171c'); add(/navy|marino|dark blue|azul oscuro/, '#172b52'); add(/blue|azul/, '#2b82d9');
    add(/brown|marron|habana/, '#79513c'); add(/gunmetal|plomizo/, '#5f6670'); add(/grey|gris|humo/, '#8b9098');
    add(/green|verde/, '#319467'); add(/wine|vino|red|rojo/, '#a92d4f'); add(/gold|dorado/, '#d5a83c');
    add(/silver|plateado/, '#c8cdd3'); add(/white|blanco|clear|crystal|cristal|transparente/, '#f4f5f6');
    if (!colors.length) colors.push('#d7dbe4');
    return colors.length === 1 ? colors[0] : `linear-gradient(135deg, ${colors.slice(0, 3).map((color, index, list) => `${color} ${Math.round(index * 100 / list.length)}% ${Math.round((index + 1) * 100 / list.length)}%`).join(', ')})`;
  }

  function selectedCollection(family) {
    const selected = [...state[family].facets.collection];
    return selected.length === 1 ? selected[0] : 'all';
  }

  function activeFilterCount(family) {
    return Object.values(state[family].facets).reduce((total, values) => total + values.size, 0);
  }

  function matchesFacets(product, facets) {
    return Object.entries(facets).every(([key, selected]) => !selected.size || selected.has(String(product[key] ?? '')));
  }

  function renderFacets(family) {
    const grid = document.getElementById(family === 'sun' ? 'sunFacetGrid' : 'opticalFacetGrid');
    if (!grid) return;
    grid.innerHTML = facetConfig[family].map((facet) => {
      const choices = facetValues(family, facet.key).map((value) => {
        const label = facetValueLabel(family, facet.key, value);
        const active = state[family].facets[facet.key].has(value);
        const swatch = facet.color ? `<span class="facet-color" style="--facet-color:${escapeHtml(colorSwatch(value))}" aria-hidden="true"></span>` : '';
        return `<button class="facet-choice${active ? ' is-active' : ''}" type="button" data-facet-key="${escapeHtml(facet.key)}" data-facet-value="${escapeHtml(value)}" aria-pressed="${active}">${swatch}<span>${escapeHtml(label)}</span><span class="facet-check" aria-hidden="true">✓</span></button>`;
      }).join('');
      return `<section class="facet-group" aria-labelledby="${family}-${facet.key}-label"><h3 id="${family}-${facet.key}-label">${escapeHtml(i18n.t(facet.label))}</h3><div class="facet-options">${choices}</div></section>`;
    }).join('');
    renderActiveFilters(family);
  }

  function renderActiveFilters(family) {
    const root = document.getElementById(family === 'sun' ? 'sunActiveFilters' : 'opticalActiveFilters');
    const countNode = document.querySelector(`[data-filter-count="${family}"]`);
    const count = activeFilterCount(family);
    if (countNode) { countNode.textContent = String(count); countNode.hidden = count === 0; }
    if (!root) return;
    const chips = [];
    Object.entries(state[family].facets).forEach(([key, selected]) => selected.forEach((value) => {
      const label = facetValueLabel(family, key, value);
      chips.push(`<button type="button" data-filter-remove-key="${escapeHtml(key)}" data-filter-remove-value="${escapeHtml(value)}" aria-label="${escapeHtml(i18n.t('removeFilter', { value: label }))}"><span>${escapeHtml(label)}</span><b aria-hidden="true">×</b></button>`);
    }));
    root.innerHTML = chips.length ? `<span>${escapeHtml(i18n.t('filtersActive'))}</span>${chips.join('')}` : '';
    root.hidden = chips.length === 0;
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
    const matches = products.filter((product) => product.family === family && matchesFacets(product, familyState.facets) && (!query || searchable(product).includes(query)));
    const grid = document.getElementById(config.grid);
    const status = document.getElementById(config.status);
    if (grid) grid.innerHTML = matches.length ? matches.map(card).join('') : `<div class="catalog-empty"><strong>${escapeHtml(i18n.t('noMatchesTitle'))}</strong><span>${escapeHtml(i18n.t('noMatchesText'))}</span></div>`;
    const collection = selectedCollection(family);
    if (status) status.textContent = `${matches.length} ${i18n.t(matches.length === 1 ? config.singular : config.plural)}${collection === 'all' ? '' : ` ${i18n.t('inCollection')} ${collection}`}`;
    renderCollectionInfo(family);
  }

  function renderCollectionInfo(family) {
    const root = document.getElementById(family === 'sun' ? 'sunCollectionInfo' : 'opticalCollectionInfo');
    const collection = selectedCollection(family);
    const info = i18n.collectionInfo(family, collection);
    if (!root || !info) return;
    root.innerHTML = `<div><span class="collection-explainer-label">${escapeHtml(collection === 'all' ? i18n.t('allMasculine') : collection)}</span><h3>${escapeHtml(info.title)}</h3><p>${escapeHtml(info.description)}</p></div><div class="collection-explainer-details"><p><strong>${i18n.language === 'es' ? 'Diferencia:' : 'Difference:'}</strong> ${escapeHtml(info.difference)}</p><p><strong>${i18n.language === 'es' ? 'Ejemplo:' : 'Example:'}</strong> ${escapeHtml(info.example.replace(/^(Ejemplo:|Example:)\s*/i, ''))}</p></div>`;
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
    const wrapper = document.querySelector(`[data-filter-family="${family}"]`);
    const panel = document.querySelector(`[data-filter-panel="${family}"]`);
    const toggle = document.querySelector(`[data-filter-toggle="${family}"]`);
    search?.addEventListener('input', (event) => { state[family].query = event.target.value; renderFamily(family); });
    wrapper?.addEventListener('click', (event) => {
      const toggleButton = event.target.closest(`[data-filter-toggle="${family}"]`);
      if (toggleButton && panel) {
        const open = panel.hidden;
        panel.hidden = !open;
        toggleButton.setAttribute('aria-expanded', String(open));
        wrapper.classList.toggle('is-open', open);
        return;
      }
      const choice = event.target.closest('[data-facet-key][data-facet-value]');
      if (choice) {
        const selected = state[family].facets[choice.dataset.facetKey];
        if (!selected) return;
        if (selected.has(choice.dataset.facetValue)) selected.delete(choice.dataset.facetValue);
        else selected.add(choice.dataset.facetValue);
        renderFacets(family);
        renderFamily(family);
        return;
      }
      const remove = event.target.closest('[data-filter-remove-key][data-filter-remove-value]');
      if (remove) {
        state[family].facets[remove.dataset.filterRemoveKey]?.delete(remove.dataset.filterRemoveValue);
        renderFacets(family);
        renderFamily(family);
        return;
      }
      if (event.target.closest(`[data-filter-clear="${family}"]`)) {
        Object.values(state[family].facets).forEach((values) => values.clear());
        renderFacets(family);
        renderFamily(family);
      }
    });
    wrapper?.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !panel || panel.hidden) return;
      panel.hidden = true;
      toggle?.setAttribute('aria-expanded', 'false');
      wrapper.classList.remove('is-open');
      toggle?.focus();
    });
    renderFacets(family);
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

  function rerenderLocalized() { renderFacets('optical'); renderFacets('sun'); renderFamily('optical'); renderFamily('sun'); renderFaq(); }

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
