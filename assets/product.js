(function () {
  'use strict';

  const catalog = window.CHAMPION_CATALOG;
  const i18n = window.ChampionI18n;
  if (!catalog || !Array.isArray(catalog.products) || !i18n) return;
  const products = catalog.products;
  let currentProduct;

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function detailUrl(product) { return `./product.html?id=${encodeURIComponent(product.id)}`; }

  function productCard(source) {
    const product = i18n.localizeProduct(source);
    return `<article class="product-card related-card"><a class="product-card-image" href="${detailUrl(product)}"><img src="./${escapeHtml(product.cover)}" alt="${escapeHtml(product.displayModel)}" loading="lazy" decoding="async"><span class="product-family-badge">${product.family === 'sun' ? 'Champion Sun' : escapeHtml(product.collection)}</span></a><div class="product-card-body"><div class="product-card-topline"><span>${escapeHtml(product.collection)}</span><span>${escapeHtml(product.variant)}</span></div><h3><a href="${detailUrl(product)}">${escapeHtml(product.displayModel)}</a></h3><p class="product-card-color">${escapeHtml(product.color)}</p><div class="product-card-actions"><a href="${detailUrl(product)}">${escapeHtml(i18n.t('viewDetails'))}</a><button type="button" data-request-add data-product-id="${escapeHtml(product.id)}">${escapeHtml(i18n.t('addRequest'))}</button></div></div></article>`;
  }

  function gallery(product) {
    const images = Array.from(new Set([product.cover, ...(product.images || [])]));
    return `<div class="product-gallery" data-gallery><div class="product-gallery-stage"><span class="gallery-collection">${escapeHtml(product.collection)}</span><img id="productMainImage" src="./${escapeHtml(images[0])}" alt="${escapeHtml(i18n.t('viewNumber', { number: 1 }))}: ${escapeHtml(product.displayModel)}"><span class="gallery-counter"><strong id="galleryIndex">01</strong> / ${String(images.length).padStart(2, '0')}</span><div class="gallery-zoom-controls" aria-label="Zoom"><button type="button" data-gallery-zoom="out" aria-label="${escapeHtml(i18n.t('zoomOut'))}">−</button><button type="button" data-gallery-zoom="reset" aria-label="${escapeHtml(i18n.t('zoomReset'))}"><span data-gallery-zoom-level>100%</span></button><button type="button" data-gallery-zoom="in" aria-label="${escapeHtml(i18n.t('zoomIn'))}">+</button></div></div><div class="product-thumbnails" aria-label="${escapeHtml(i18n.t('productViews'))}">${images.map((image, index) => `<button class="${index === 0 ? 'is-active' : ''}" type="button" data-gallery-index="${index}" data-image="./${escapeHtml(image)}" aria-label="${escapeHtml(i18n.t('viewNumber', { number: index + 1 }))}" aria-pressed="${index === 0}"><img src="./${escapeHtml(image)}" alt="" loading="lazy"></button>`).join('')}</div></div>`;
  }

  function specs(product) {
    const rows = [
      ['specModel', product.displayModel], ['specSku', product.sku], ['specCollection', product.collection], ['specColor', product.color], ['specMaterial', product.material], ['specShape', product.shape], ['specType', product.lens], [product.family === 'sun' ? 'specProtection' : 'specCompatibility', product.protection], ['specMeasurements', product.measurements]
    ];
    return rows.map(([label, value]) => `<div><dt>${escapeHtml(i18n.t(label))}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
  }

  function renderProduct(source) {
    const product = i18n.localizeProduct(source);
    const root = document.getElementById('productRoot');
    const variants = products.filter((candidate) => candidate.series === source.series);
    const backAnchor = product.family === 'sun' ? 'lentes-sol' : 'monturas';
    document.title = `${product.displayModel} | Champion Eyewear`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', `${product.displayModel}: ${product.subline}`);
    document.querySelector('.back-control')?.setAttribute('href', `./index.html#${backAnchor}`);
    if (!root) return;
    root.innerHTML = `${gallery(product)}<div class="product-details">
      <nav class="breadcrumbs" aria-label="${escapeHtml(i18n.t('breadcrumbs'))}"><a href="./index.html">${escapeHtml(i18n.t('navHome'))}</a><span>/</span><a href="./index.html#${backAnchor}">${escapeHtml(i18n.t(product.family === 'sun' ? 'navSun' : 'navOptical'))}</a><span>/</span><strong>${escapeHtml(product.displayModel)}</strong></nav>
      <span class="eyebrow">${escapeHtml(product.family === 'sun' ? 'Champion Sun' : `Champion ${product.collection}`)}</span><h1>${escapeHtml(product.displayModel)}</h1><p class="product-subline">${escapeHtml(product.subline)}</p><div class="product-tags">${(product.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
      ${variants.length > 1 ? `<div class="variant-picker"><span>${escapeHtml(i18n.t('variants', { series: product.series }))}</span><div>${variants.map((variant) => `<a class="${variant.id === product.id ? 'is-active' : ''}" href="${detailUrl(variant)}" aria-current="${variant.id === product.id ? 'page' : 'false'}">${escapeHtml(variant.variant)}</a>`).join('')}</div></div>` : ''}
      <div class="product-request-box"><label for="productQuantity">${escapeHtml(i18n.t('requestedQuantity'))}</label><div><input id="productQuantity" type="number" min="1" max="9999" value="1" inputmode="numeric"><button class="button button-primary" type="button" data-request-add data-product-id="${escapeHtml(product.id)}" data-quantity-target="productQuantity">${escapeHtml(i18n.t('addRequest'))}</button></div><button class="request-link" type="button" data-request-open>${escapeHtml(i18n.t('reviewSelection'))}</button><p>${escapeHtml(i18n.t('directConsultationNote'))}</p><div class="product-order-actions"><button class="order-whatsapp" type="button" data-request-open data-order-channel="whatsapp">${escapeHtml(i18n.t('orderWhatsapp'))}</button><button class="order-email" type="button" data-request-open data-order-channel="email">${escapeHtml(i18n.t('orderEmail'))}</button></div></div>
      <div class="product-tabs"><div class="tab-list" role="tablist" aria-label="${escapeHtml(i18n.t('tabsAria'))}"><button class="is-active" type="button" role="tab" aria-selected="true" data-tab="description">${escapeHtml(i18n.t('tabDescription'))}</button><button type="button" role="tab" aria-selected="false" data-tab="specs">${escapeHtml(i18n.t('tabSpecs'))}</button><button type="button" role="tab" aria-selected="false" data-tab="terms">${escapeHtml(i18n.t('tabTerms'))}</button></div>
        <section class="tab-panel is-active" data-panel="description"><p>${escapeHtml(product.about?.p1 || product.shortDescription)}</p><p>${escapeHtml(product.about?.p2 || '')}</p><ul>${(product.about?.bullets || []).map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul></section>
        <section class="tab-panel" data-panel="specs" hidden><dl class="spec-list">${specs(product)}</dl></section>
        <section class="tab-panel" data-panel="terms" hidden><p>${escapeHtml(i18n.t('termIntro'))}</p><ul><li>${escapeHtml(i18n.t('term1'))}</li><li>${escapeHtml(i18n.t('term2'))}</li><li>${escapeHtml(i18n.t('term3'))}</li></ul></section>
      </div>
    </div>`;
    bindGallery(product); bindTabs();
  }

  function bindGallery(product) {
    const mainImage = document.getElementById('productMainImage');
    const counter = document.getElementById('galleryIndex');
    const zoomLevel = document.querySelector('[data-gallery-zoom-level]');
    const stage = document.querySelector('.product-gallery-stage');
    let zoom = 1;
    let touchTracking = false;
    const resetOrigin = () => { stage?.style.setProperty('--zoom-x', '50%'); stage?.style.setProperty('--zoom-y', '50%'); };
    const updateOrigin = (event) => {
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      stage.style.setProperty('--zoom-x', `${Math.max(0, Math.min(100, x))}%`);
      stage.style.setProperty('--zoom-y', `${Math.max(0, Math.min(100, y))}%`);
    };
    const applyZoom = () => { if (mainImage) mainImage.style.setProperty('--gallery-zoom', String(zoom)); if (zoomLevel) zoomLevel.textContent = `${Math.round(zoom * 100)}%`; if (zoom === 1) resetOrigin(); };

    stage?.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') stage.classList.add('is-zooming');
    });
    stage?.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' && (!touchTracking || zoom <= 1)) return;
      updateOrigin(event);
      if (event.pointerType !== 'touch') stage.classList.add('is-zooming');
    });
    stage?.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch' && zoom > 1) { touchTracking = true; updateOrigin(event); }
    });
    stage?.addEventListener('pointerup', () => { touchTracking = false; });
    stage?.addEventListener('pointercancel', () => { touchTracking = false; });
    stage?.addEventListener('pointerleave', () => { touchTracking = false; stage.classList.remove('is-zooming'); resetOrigin(); });

    document.querySelector('[data-gallery]')?.addEventListener('click', (event) => {
      const zoomButton = event.target.closest('[data-gallery-zoom]');
      if (zoomButton) { const action = zoomButton.dataset.galleryZoom; zoom = action === 'reset' ? 1 : Math.max(1, Math.min(3, zoom + (action === 'in' ? 0.35 : -0.35))); stage?.classList.remove('is-zooming'); applyZoom(); return; }
      const button = event.target.closest('[data-gallery-index]'); if (!button || !mainImage) return;
      const index = Number(button.dataset.galleryIndex); mainImage.src = button.dataset.image; mainImage.alt = `${i18n.t('viewNumber', { number: index + 1 })}: ${product.displayModel}`; if (counter) counter.textContent = String(index + 1).padStart(2, '0');
      zoom = 1; stage?.classList.remove('is-zooming'); resetOrigin(); applyZoom();
      button.parentElement.querySelectorAll('[data-gallery-index]').forEach((item) => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
    });
  }

  function renderProductFaq() {
    const root = document.getElementById('productFaqRoot'); if (!root) return;
    root.innerHTML = i18n.faq().map((group, groupIndex) => `<section class="product-faq-group"><h3>${escapeHtml(group.title)}</h3>${group.items.map(([question, answer], itemIndex) => `<details ${groupIndex === 0 && itemIndex === 0 ? 'open' : ''}><summary><span>${escapeHtml(question)}</span><span aria-hidden="true">⌄</span></summary><p>${escapeHtml(answer)}</p></details>`).join('')}</section>`).join('');
  }

  function bindTabs() {
    document.querySelector('.product-tabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tab]'); if (!button) return; const tabs = button.closest('.product-tabs');
      tabs.querySelectorAll('[data-tab]').forEach((tab) => { const active = tab === button; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); });
      tabs.querySelectorAll('[data-panel]').forEach((panel) => { const active = panel.dataset.panel === button.dataset.tab; panel.classList.toggle('is-active', active); panel.hidden = !active; });
    });
  }

  function renderRelated(source) {
    const related = [...products.filter((candidate) => candidate.series === source.series && candidate.id !== source.id), ...products.filter((candidate) => candidate.family === source.family && candidate.collection === source.collection && candidate.series !== source.series), ...products.filter((candidate) => candidate.family === source.family && candidate.collection !== source.collection)].filter((candidate, index, array) => array.findIndex((item) => item.id === candidate.id) === index).slice(0, 4);
    const grid = document.getElementById('relatedGrid'); if (grid) grid.innerHTML = related.map(productCard).join('');
    const title = document.getElementById('relatedTitle'); if (title) title.textContent = i18n.t(source.family === 'sun' ? 'moreSun' : 'moreOptical');
  }

  function renderNotFound() {
    const root = document.getElementById('productRoot'); if (!root) return;
    root.innerHTML = `<div class="product-not-found"><span class="eyebrow">${escapeHtml(i18n.t('productNotFoundKicker'))}</span><h1>${escapeHtml(i18n.t('productNotFoundTitle'))}</h1><p>${escapeHtml(i18n.t('productNotFoundText'))}</p><a class="button button-primary" href="./index.html#monturas">${escapeHtml(i18n.t('productNotFoundCta'))}</a></div>`;
  }

  function rerender() { if (currentProduct) { renderProduct(currentProduct); renderRelated(currentProduct); renderProductFaq(); } else renderNotFound(); }
  function init() {
    const id = new URLSearchParams(window.location.search).get('id'); currentProduct = products.find((candidate) => candidate.id === id);
    if (!currentProduct) { renderNotFound(); document.getElementById('similares')?.remove(); i18n.onChange(renderNotFound); return; }
    renderProduct(currentProduct); renderRelated(currentProduct); renderProductFaq(); i18n.onChange(rerender);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
