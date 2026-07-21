(function () {
  'use strict';

  const catalog = window.CHAMPION_CATALOG;
  if (!catalog || !Array.isArray(catalog.products)) return;

  const products = catalog.products;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function detailUrl(product) {
    return `./product.html?id=${encodeURIComponent(product.id)}`;
  }

  function productCard(product) {
    return `
      <article class="product-card related-card">
        <a class="product-card-image" href="${detailUrl(product)}">
          <img src="./${escapeHtml(product.cover)}" alt="${escapeHtml(product.displayModel)}" loading="lazy" decoding="async">
          <span class="product-family-badge">${product.family === 'sun' ? 'Champion Sun' : escapeHtml(product.collection)}</span>
        </a>
        <div class="product-card-body">
          <div class="product-card-topline"><span>${escapeHtml(product.collection)}</span><span>${escapeHtml(product.variant)}</span></div>
          <h3><a href="${detailUrl(product)}">${escapeHtml(product.displayModel)}</a></h3>
          <p class="product-card-color">${escapeHtml(product.color)}</p>
          <div class="product-card-actions">
            <a href="${detailUrl(product)}">Ver ficha</a>
            <button type="button" data-request-add data-product-id="${escapeHtml(product.id)}">Añadir</button>
          </div>
        </div>
      </article>`;
  }

  function gallery(product) {
    const images = Array.from(new Set([product.cover, ...(product.images || [])]));
    return `
      <div class="product-gallery" data-gallery>
        <div class="product-gallery-stage">
          <span class="gallery-collection">${escapeHtml(product.collection)}</span>
          <img id="productMainImage" src="./${escapeHtml(images[0])}" alt="${escapeHtml(product.displayModel)} — vista 1">
          <span class="gallery-counter"><strong id="galleryIndex">01</strong> / ${String(images.length).padStart(2, '0')}</span>
        </div>
        <div class="product-thumbnails" aria-label="Vistas del producto">
          ${images.map((image, index) => `
            <button class="${index === 0 ? 'is-active' : ''}" type="button" data-gallery-index="${index}" data-image="./${escapeHtml(image)}" aria-label="Vista ${index + 1}" aria-pressed="${index === 0}">
              <img src="./${escapeHtml(image)}" alt="" loading="lazy">
            </button>`).join('')}
        </div>
      </div>`;
  }

  function specs(product) {
    const rows = [
      ['Modelo', product.displayModel],
      ['SKU', product.sku],
      ['Colección', product.collection],
      ['Color', product.color],
      ['Material', product.material],
      ['Forma', product.shape],
      ['Tipo', product.lens],
      [product.family === 'sun' ? 'Protección' : 'Compatibilidad', product.protection],
      ['Medidas', product.measurements],
    ];
    return rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
  }

  function renderProduct(product) {
    const root = document.getElementById('productRoot');
    const variants = products.filter((candidate) => candidate.series === product.series);
    const backAnchor = product.family === 'sun' ? 'lentes-sol' : 'monturas';
    const whatsapp = `https://wa.me/${catalog.contact.whatsapp}?text=${encodeURIComponent(`Hola, equipo de Innova Eyewear. Deseo consultar disponibilidad, condiciones comerciales y mínimos de compra para ${product.displayModel} (${product.sku}).`)}`;

    document.title = `${product.displayModel} | Champion Eyewear B2B`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', `${product.displayModel}: ${product.subline} Ficha mayorista y solicitud B2B.`);
    document.querySelector('.back-control')?.setAttribute('href', `./index.html#${backAnchor}`);

    if (!root) return;
    root.innerHTML = `
      ${gallery(product)}
      <div class="product-details">
        <nav class="breadcrumbs" aria-label="Migas de pan">
          <a href="./index.html">Inicio</a><span>/</span><a href="./index.html#${backAnchor}">${product.family === 'sun' ? 'Lentes de sol' : 'Monturas'}</a><span>/</span><strong>${escapeHtml(product.displayModel)}</strong>
        </nav>
        <span class="eyebrow">${escapeHtml(product.family === 'sun' ? 'Champion Sun' : `Champion ${product.collection}`)}</span>
        <h1>${escapeHtml(product.displayModel)}</h1>
        <p class="product-subline">${escapeHtml(product.subline)}</p>
        <div class="product-tags">${(product.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>

        <div class="trade-price">
          <span>Condición mayorista</span>
          <strong>Precio a cotizar</strong>
          <p>Escalas por volumen, mínimos y disponibilidad se confirman con Innova Eyewear.</p>
        </div>

        ${variants.length > 1 ? `
          <div class="variant-picker">
            <span>Variantes de ${escapeHtml(product.series)}</span>
            <div>${variants.map((variant) => `<a class="${variant.id === product.id ? 'is-active' : ''}" href="${detailUrl(variant)}" aria-current="${variant.id === product.id ? 'page' : 'false'}">${escapeHtml(variant.variant)}</a>`).join('')}</div>
          </div>` : ''}

        <div class="product-request-box">
          <label for="productQuantity">Cantidad solicitada</label>
          <div>
            <input id="productQuantity" type="number" min="1" max="9999" value="1" inputmode="numeric">
            <button class="button button-primary" type="button" data-request-add data-product-id="${escapeHtml(product.id)}" data-quantity-target="productQuantity">Añadir a solicitud B2B</button>
          </div>
          <button class="request-link" type="button" data-request-open>Revisar selección profesional</button>
        </div>

        <div class="product-contact-row">
          <a href="${whatsapp}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          <a href="mailto:${escapeHtml(catalog.contact.email)}?subject=${encodeURIComponent(`Consulta B2B ${product.displayModel}`)}">Correo a Innova</a>
        </div>

        <div class="product-tabs">
          <div class="tab-list" role="tablist" aria-label="Información de producto">
            <button class="is-active" type="button" role="tab" aria-selected="true" data-tab="description">Descripción</button>
            <button type="button" role="tab" aria-selected="false" data-tab="specs">Ficha técnica</button>
            <button type="button" role="tab" aria-selected="false" data-tab="terms">Condiciones B2B</button>
          </div>
          <section class="tab-panel is-active" data-panel="description">
            <p>${escapeHtml(product.about?.p1 || product.shortDescription)}</p>
            <p>${escapeHtml(product.about?.p2 || '')}</p>
            <ul>${(product.about?.bullets || []).map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>
          </section>
          <section class="tab-panel" data-panel="specs" hidden><dl class="spec-list">${specs(product)}</dl></section>
          <section class="tab-panel" data-panel="terms" hidden>
            <p>Esta ficha corresponde a un catálogo profesional. La selección genera una solicitud de cotización; no constituye una compra ni confirma inventario.</p>
            <ul><li>Precio y disponibilidad sujetos a confirmación.</li><li>Mínimos y escalas de precio según volumen.</li><li>Despacho y condiciones de pago acordados con Innova Eyewear.</li></ul>
          </section>
        </div>
      </div>`;

    bindGallery(product);
    bindTabs();
  }

  function bindGallery(product) {
    const mainImage = document.getElementById('productMainImage');
    const counter = document.getElementById('galleryIndex');
    document.querySelector('[data-gallery]')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-gallery-index]');
      if (!button || !mainImage) return;
      const index = Number(button.dataset.galleryIndex);
      mainImage.src = button.dataset.image;
      mainImage.alt = `${product.displayModel} — vista ${index + 1}`;
      if (counter) counter.textContent = String(index + 1).padStart(2, '0');
      button.parentElement.querySelectorAll('[data-gallery-index]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
    });
  }

  function bindTabs() {
    document.querySelector('.product-tabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tab]');
      if (!button) return;
      const tabs = button.closest('.product-tabs');
      tabs.querySelectorAll('[data-tab]').forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      tabs.querySelectorAll('[data-panel]').forEach((panel) => {
        const active = panel.dataset.panel === button.dataset.tab;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    });
  }

  function renderRelated(product) {
    const related = [
      ...products.filter((candidate) => candidate.series === product.series && candidate.id !== product.id),
      ...products.filter((candidate) => candidate.family === product.family && candidate.collection === product.collection && candidate.series !== product.series),
      ...products.filter((candidate) => candidate.family === product.family && candidate.collection !== product.collection),
    ].filter((candidate, index, array) => array.findIndex((item) => item.id === candidate.id) === index).slice(0, 4);
    const grid = document.getElementById('relatedGrid');
    if (grid) grid.innerHTML = related.map(productCard).join('');
    const title = document.getElementById('relatedTitle');
    if (title) title.textContent = `Más referencias ${product.family === 'sun' ? 'solares' : 'ópticas'}`;
  }

  function renderNotFound() {
    const root = document.getElementById('productRoot');
    if (!root) return;
    root.innerHTML = `<div class="product-not-found"><span class="eyebrow">Referencia no encontrada</span><h1>Este producto no existe en el catálogo</h1><p>Regrese al catálogo para seleccionar una referencia disponible.</p><a class="button button-primary" href="./index.html#monturas">Volver al catálogo</a></div>`;
    document.getElementById('similares')?.remove();
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const product = products.find((candidate) => candidate.id === id);
    if (!product) {
      renderNotFound();
      return;
    }
    renderProduct(product);
    renderRelated(product);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
