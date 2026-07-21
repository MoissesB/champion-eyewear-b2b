(function () {
  'use strict';

  const catalog = window.CHAMPION_CATALOG;
  if (!catalog || !Array.isArray(catalog.products)) return;

  const products = catalog.products;
  const state = {
    optical: { query: '', collection: 'all' },
    sun: { query: '', collection: 'all' },
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalize(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function searchable(product) {
    return normalize([
      product.model,
      product.displayModel,
      product.series,
      product.variant,
      product.color,
      product.measurements,
      product.material,
      product.shape,
      product.lens,
      product.sku,
      product.collection,
      ...(product.tags || []),
    ].join(' '));
  }

  function card(product) {
    const detailUrl = `./product.html?id=${encodeURIComponent(product.id)}`;
    return `
      <article class="product-card" data-product-id="${escapeHtml(product.id)}">
        <a class="product-card-image" href="${detailUrl}" aria-label="Ver ficha de ${escapeHtml(product.displayModel)}">
          <img src="./${escapeHtml(product.cover)}" alt="${escapeHtml(product.displayModel)} en ${escapeHtml(product.color)}" loading="lazy" decoding="async">
          <span class="product-family-badge">${product.family === 'sun' ? 'Champion Sun' : escapeHtml(product.collection)}</span>
        </a>
        <div class="product-card-body">
          <div class="product-card-topline"><span>${escapeHtml(product.collection)}</span><span>${escapeHtml(product.variant)}</span></div>
          <h3><a href="${detailUrl}">${escapeHtml(product.displayModel)}</a></h3>
          <p class="product-card-color">${escapeHtml(product.color)}</p>
          <p class="product-card-spec">${escapeHtml(product.family === 'sun' ? product.shape : `${product.material} · ${product.measurements}`)}</p>
          <div class="product-card-actions">
            <a href="${detailUrl}">Ver ficha</a>
            <button type="button" data-request-add data-product-id="${escapeHtml(product.id)}">Añadir a solicitud</button>
          </div>
        </div>
      </article>`;
  }

  function renderFamily(family) {
    const config = family === 'sun'
      ? { grid: 'sunGrid', status: 'sunStatus', singular: 'lente de sol', plural: 'lentes de sol' }
      : { grid: 'opticalGrid', status: 'opticalStatus', singular: 'montura', plural: 'monturas' };
    const familyState = state[family];
    const query = normalize(familyState.query);
    const matches = products.filter((product) => {
      if (product.family !== family) return false;
      if (familyState.collection !== 'all' && product.collection !== familyState.collection) return false;
      return !query || searchable(product).includes(query);
    });

    const grid = document.getElementById(config.grid);
    const status = document.getElementById(config.status);
    if (grid) {
      grid.innerHTML = matches.length
        ? matches.map(card).join('')
        : `<div class="catalog-empty"><strong>No encontramos coincidencias.</strong><span>Pruebe otro modelo, color o material.</span></div>`;
    }
    if (status) {
      const noun = matches.length === 1 ? config.singular : config.plural;
      status.textContent = `${matches.length} ${noun}${familyState.collection === 'all' ? '' : ` en ${familyState.collection}`}`;
    }
  }

  function bindCatalog(family) {
    const search = document.getElementById(family === 'sun' ? 'sunSearch' : 'opticalSearch');
    const filters = document.getElementById(family === 'sun' ? 'sunFilters' : 'opticalFilters');

    search?.addEventListener('input', (event) => {
      state[family].query = event.target.value;
      renderFamily(family);
    });

    filters?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      state[family].collection = button.dataset.filter;
      filters.querySelectorAll('[data-filter]').forEach((filter) => {
        const active = filter === button;
        filter.classList.toggle('is-active', active);
        filter.setAttribute('aria-pressed', String(active));
      });
      renderFamily(family);
    });

    filters?.querySelectorAll('[data-filter]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
    });
  }

  function bindHeader() {
    const header = document.getElementById('siteHeader');
    const menuButton = document.querySelector('[data-menu-toggle]');
    const mobileNav = document.getElementById('mobileNav');
    const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    menuButton?.addEventListener('click', () => {
      const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(willOpen));
      if (mobileNav) mobileNav.hidden = !willOpen;
    });

    mobileNav?.addEventListener('click', (event) => {
      if (!event.target.closest('a')) return;
      mobileNav.hidden = true;
      menuButton?.setAttribute('aria-expanded', 'false');
    });
  }

  function bindVideo() {
    const button = document.querySelector('[data-sound-toggle]');
    const video = document.getElementById('explainVideo');
    button?.addEventListener('click', () => {
      if (!video) return;
      video.muted = !video.muted;
      button.textContent = video.muted ? 'Activar sonido' : 'Silenciar';
      if (video.paused) video.play().catch(() => {});
    });
  }

  function initReveal() {
    const nodes = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    nodes.forEach((node) => observer.observe(node));
  }

  function init() {
    const opticalCount = products.filter((product) => product.family === 'optical').length;
    const sunCount = products.filter((product) => product.family === 'sun').length;
    document.querySelectorAll('[data-optical-count]').forEach((node) => { node.textContent = String(opticalCount); });
    document.querySelectorAll('[data-sun-count]').forEach((node) => { node.textContent = String(sunCount); });
    bindCatalog('optical');
    bindCatalog('sun');
    renderFamily('optical');
    renderFamily('sun');
    bindHeader();
    bindVideo();
    initReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
