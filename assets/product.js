(function () {
  'use strict';

  const catalog = window.CHAMPION_CATALOG;
  const i18n = window.ChampionI18n;
  if (!catalog || !Array.isArray(catalog.products) || !i18n) return;
  const SITE_ORIGIN = 'https://champion-innova.com';
  const products = catalog.products;
  let currentProduct;

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function detailUrl(product) { return `./product.html?id=${encodeURIComponent(product.id)}`; }

  function upsertMeta(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
    return meta;
  }

  function productCanonicalUrl(id) {
    const canonical = new URL('/product.html', SITE_ORIGIN);
    canonical.searchParams.set('id', id);
    return canonical.href;
  }

  function updateSearchMetadata(product) {
    document.title = `${product.displayModel} | Champion Eyewear`;
    upsertMeta('description', `${product.displayModel}: ${product.subline}`);
    document.querySelector('meta[name="robots"][data-product-seo]')?.remove();
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', productCanonicalUrl(product.id));
  }

  function markProductNotFound() {
    document.title = 'Producto no encontrado | Champion Eyewear';
    upsertMeta('description', 'La referencia solicitada no existe en el catálogo profesional Champion Eyewear.');
    const robots = upsertMeta('robots', 'noindex, follow');
    robots.setAttribute('data-product-seo', '');
    document.querySelector('link[rel="canonical"]')?.remove();
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      window.location.replace('/referencia-no-encontrada');
      return true;
    }
    return false;
  }

  const variantSwatches = Object.freeze({
    'Black': '#15171c',
    'Black & Gold': 'linear-gradient(135deg, #15171c 0 48%, #d6ad37 52% 100%)',
    'Black & Gunmetal': 'linear-gradient(135deg, #15171c 0 48%, #555c64 52% 100%)',
    'Black & Wine': 'linear-gradient(135deg, #15171c 0 48%, #722f4b 52% 100%)',
    'Blue': '#245a9c',
    'Brown': '#76503a',
    'Brown & Green': 'linear-gradient(135deg, #76503a 0 48%, #476b4b 52% 100%)',
    'Clear': 'linear-gradient(135deg, #ffffff 0 38%, #cfe4ef 48% 54%, #f8fbfd 64% 100%)',
    'Crystal': 'linear-gradient(135deg, #ffffff 0 35%, #bddce9 48% 56%, #eef8fb 68% 100%)',
    'Dark Blue': '#172f55',
    'Dark Green': '#244b3b',
    'Dark Gunmetal': '#3e444c',
    'Green': '#3e7a55',
    'Grey': '#858b94',
    'Gunmetal': '#59616b',
    'Gunmetal & Red': 'linear-gradient(135deg, #59616b 0 48%, #c92b3b 52% 100%)',
    'Matt blue': '#365c82',
    'Silver & Blue': 'linear-gradient(135deg, #c9cdd3 0 48%, #2f64a4 52% 100%)',
    'Transl. Brown': 'linear-gradient(135deg, rgba(129, 82, 54, 0.62), rgba(224, 194, 167, 0.75))',
    'Azul marino / lente azul espejado': 'linear-gradient(135deg, #132b4d 0 45%, #2b8ee8 52% 100%)',
    'Azul marino / lente multicolor espejado': 'conic-gradient(#132b4d, #2b8ee8, #7b4acb, #e08b35, #2f9d78, #132b4d)',
    'Blanco / lente azul espejado': 'linear-gradient(135deg, #f7f7f3 0 45%, #328cdf 52% 100%)',
    'Cristal / lente azul espejado': 'linear-gradient(135deg, #eef8fb 0 45%, #2786dc 52% 100%)',
    'Azul oscuro / lente azul espejado': 'linear-gradient(135deg, #172b52 0 45%, #2b8ee8 52% 100%)',
    'Gunmetal / lente azul espejado': 'linear-gradient(135deg, #59616b 0 45%, #2b8ee8 52% 100%)',
    'Gunmetal / lente dorado espejado': 'linear-gradient(135deg, #59616b 0 45%, #d7aa35 52% 100%)',
    'Gunmetal / lente verde espejado': 'linear-gradient(135deg, #59616b 0 45%, #3d9b6f 52% 100%)',
    'Habana / lente dorado espejado': 'linear-gradient(135deg, #684329 0 22%, #a36f3f 23% 45%, #d7aa35 52% 100%)',
    'Negro / lente azul espejado': 'linear-gradient(135deg, #15171c 0 45%, #2b8ee8 52% 100%)',
    'Negro / lente azul-verde espejado': 'linear-gradient(135deg, #15171c 0 40%, #2b8ee8 48%, #31bf91 100%)',
    'Negro / lente azul-violeta espejado': 'linear-gradient(135deg, #15171c 0 42%, #287bd8 50%, #7046bb 100%)',
    'Negro / lente dorado espejado': 'linear-gradient(135deg, #15171c 0 45%, #d7aa35 52% 100%)',
    'Negro / lente dorado-verde espejado': 'linear-gradient(135deg, #15171c 0 40%, #d7aa35 48%, #3d9b6f 100%)',
    'Negro / lente humo': 'linear-gradient(135deg, #15171c 0 45%, #73777d 52% 100%)',
    'Negro / lente multicolor espejado': 'conic-gradient(#15171c, #2b8ee8, #7046bb, #dc475b, #d7aa35, #3d9b6f, #15171c)',
    'Negro / lente naranja espejado': 'linear-gradient(135deg, #15171c 0 45%, #f48a1f 52% 100%)',
    'Negro / lente naranja-dorado espejado': 'linear-gradient(135deg, #15171c 0 40%, #e77b2f 48%, #d7aa35 100%)',
    'Negro / lente rojo-violeta espejado': 'linear-gradient(135deg, #15171c 0 40%, #d13e52 48%, #7046bb 100%)',
    'Negro / lente verde espejado': 'linear-gradient(135deg, #15171c 0 45%, #3d9b6f 52% 100%)',
    'Negro / lente verde-azul espejado': 'linear-gradient(135deg, #15171c 0 40%, #3d9b6f 48%, #2b8ee8 100%)',
    'Negro / lente verde-violeta espejado': 'linear-gradient(135deg, #15171c 0 40%, #3d9b6f 48%, #7046bb 100%)',
    'Transparente / lente azul-dorado espejado': 'linear-gradient(135deg, #f4f7f8 0 38%, #2b8ee8 46%, #d7aa35 100%)'
  });

  function variantSwatch(color) {
    return variantSwatches[color] || '#c8ccd4';
  }

  function productCard(source) {
    const product = i18n.localizeProduct(source);
    return `<article class="product-card related-card"><a class="product-card-image" href="${detailUrl(product)}"><img src="./${escapeHtml(product.cover)}" alt="${escapeHtml(product.displayModel)}" loading="lazy" decoding="async"><span class="product-family-badge">${product.family === 'sun' ? 'Champion Sun' : escapeHtml(product.collection)}</span></a><div class="product-card-body"><div class="product-card-topline"><span>${escapeHtml(product.collection)}</span><span>${escapeHtml(product.variant)}</span></div><h3><a href="${detailUrl(product)}">${escapeHtml(product.displayModel)}</a></h3><p class="product-card-color">${escapeHtml(product.color)}</p><div class="product-card-actions"><a href="${detailUrl(product)}">${escapeHtml(i18n.t('viewDetails'))}</a><button type="button" data-request-add data-product-id="${escapeHtml(product.id)}">${escapeHtml(i18n.t('addRequest'))}</button></div></div></article>`;
  }

  function relatedSection() {
    return `<section class="related-section related-section-inline" id="similares"><div class="related-inline-heading"><span class="eyebrow">${escapeHtml(i18n.t('relatedKicker'))}</span><h2 id="relatedTitle">${escapeHtml(i18n.t('relatedTitle'))}</h2></div><div class="product-grid related-grid" id="relatedGrid"></div></section>`;
  }

  function variantPickerMarkup(variants, product, extraClass = '') {
    if (variants.length < 2) return '';
    const links = variants.map((variant) => {
      const localizedVariant = i18n.localizeProduct(variant);
      const active = variant.id === product.id;
      const label = i18n.t(active ? 'currentColorVariant' : 'viewColorVariant', { color: localizedVariant.color });
      return `<a class="${active ? 'is-active' : ''}" href="${detailUrl(variant)}" style="--variant-swatch: ${escapeHtml(variantSwatch(variant.color))}" aria-label="${escapeHtml(label)}" title="${escapeHtml(localizedVariant.color)}" aria-current="${active ? 'page' : 'false'}"><span class="sr-only">${escapeHtml(label)}</span></a>`;
    }).join('');
    return `<div class="variant-picker ${extraClass}"><span>${escapeHtml(i18n.t('variants', { series: product.series }))}</span><div>${links}</div></div>`;
  }

  function mobileOrderBar(product) {
    return `<div class="mobile-product-order-bar"><div class="mobile-order-product"><strong>${escapeHtml(product.displayModel)}</strong><span>${escapeHtml(product.color)}</span></div><label><span class="sr-only">${escapeHtml(i18n.t('requestedQuantity'))}</span><input id="mobileProductQuantity" type="number" min="1" max="9999" value="1" inputmode="numeric" aria-label="${escapeHtml(i18n.t('requestedQuantity'))}"></label><button class="button button-primary" type="button" data-request-add data-product-id="${escapeHtml(product.id)}" data-quantity-target="mobileProductQuantity">${escapeHtml(i18n.t('addRequest'))}</button></div>`;
  }

  function gallery(product) {
    const images = product.family === 'optical'
      ? Array.from(new Set(product.images || [])).slice(0, 4)
      : Array.from(new Set([product.cover, ...(product.images || [])]));
    return `<div class="product-gallery" data-gallery><div class="product-gallery-stage"><span class="gallery-collection">${escapeHtml(product.collection)}</span><img id="productMainImage" src="./${escapeHtml(images[0])}" alt="${escapeHtml(i18n.t('viewNumber', { number: 1 }))}: ${escapeHtml(product.displayModel)}" fetchpriority="high" draggable="false"><span class="gallery-counter"><strong id="galleryIndex">01</strong> / ${String(images.length).padStart(2, '0')}</span><div class="gallery-zoom-controls" aria-label="Zoom"><button class="gallery-zoom-menu" type="button" data-gallery-zoom-menu aria-label="${escapeHtml(i18n.t('zoomIn'))}" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" stroke-width="2.4"/><path d="M21 21l-5.2-5.2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M10.5 8v5M8 10.5h5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button><div class="gallery-zoom-actions"><button type="button" data-gallery-zoom="toggle" aria-label="${escapeHtml(i18n.t('zoomIn'))}"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" stroke-width="2"/><path d="M21 21l-5.2-5.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10.5 8v5M8 10.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><button type="button" data-gallery-zoom="out" aria-label="${escapeHtml(i18n.t('zoomOut'))}">−</button><button type="button" data-gallery-zoom="in" aria-label="${escapeHtml(i18n.t('zoomIn'))}">+</button><button type="button" data-gallery-zoom="reset" aria-label="${escapeHtml(i18n.t('zoomReset'))}">↻</button><span class="sr-only" data-gallery-zoom-level>100%</span></div></div></div><div class="product-thumbnails" aria-label="${escapeHtml(i18n.t('productViews'))}">${images.map((image, index) => `<button class="${index === 0 ? 'is-active' : ''}" type="button" data-gallery-index="${index}" data-image="./${escapeHtml(image)}" aria-label="${escapeHtml(i18n.t('viewNumber', { number: index + 1 }))}" aria-pressed="${index === 0}"><img src="./${escapeHtml(image)}" alt="" loading="lazy"></button>`).join('')}</div></div>`;
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
    updateSearchMetadata(product);
    document.querySelector('.back-control')?.setAttribute('href', `./index.html#${backAnchor}`);
    if (!root) return;
    root.innerHTML = `<div class="product-media-column">${gallery(product)}${relatedSection()}</div><div class="product-details">
      <nav class="breadcrumbs" aria-label="${escapeHtml(i18n.t('breadcrumbs'))}"><a href="./index.html">${escapeHtml(i18n.t('navHome'))}</a><span>/</span><a href="./index.html#${backAnchor}">${escapeHtml(i18n.t(product.family === 'sun' ? 'navSun' : 'navOptical'))}</a><span>/</span><strong>${escapeHtml(product.displayModel)}</strong></nav>
      <span class="eyebrow">${escapeHtml(product.family === 'sun' ? 'Champion Sun' : `Champion ${product.collection}`)}</span><h1>${escapeHtml(product.displayModel)}</h1>${variantPickerMarkup(variants, product, 'mobile-product-variants')}<p class="product-subline">${escapeHtml(product.subline)}</p><div class="product-tags">${(product.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
      ${variantPickerMarkup(variants, product, 'desktop-product-variants')}
      <div class="product-request-box"><label for="productQuantity">${escapeHtml(i18n.t('requestedQuantity'))}</label><div class="product-order-entry"><input id="productQuantity" type="number" min="1" max="9999" value="1" inputmode="numeric"><button class="button button-primary" type="button" data-request-add data-product-id="${escapeHtml(product.id)}" data-quantity-target="productQuantity">${escapeHtml(i18n.t('addRequest'))}</button></div><button class="request-link" type="button" data-request-open>${escapeHtml(i18n.t('reviewSelection'))}</button><p>${escapeHtml(i18n.t('directConsultationNote'))}</p><div class="product-order-actions"><button class="order-whatsapp" type="button" data-request-open data-order-channel="whatsapp"><span class="order-action-icon" aria-hidden="true">☎</span><span>${escapeHtml(i18n.t('orderWhatsapp'))}</span></button><button class="order-email" type="button" data-request-open data-order-channel="email"><span class="order-action-icon" aria-hidden="true">✉</span><span>${escapeHtml(i18n.t('orderEmail'))}</span></button></div></div>
      <div class="product-tabs"><div class="tab-list" role="tablist" aria-label="${escapeHtml(i18n.t('tabsAria'))}"><button class="is-active" type="button" role="tab" aria-selected="true" data-tab="description">${escapeHtml(i18n.t('tabDescription'))}</button><button type="button" role="tab" aria-selected="false" data-tab="specs">${escapeHtml(i18n.t('tabSpecs'))}</button><button type="button" role="tab" aria-selected="false" data-tab="terms">${escapeHtml(i18n.t('tabTerms'))}</button></div>
        <section class="tab-panel is-active" data-panel="description"><p>${escapeHtml(product.about?.p1 || product.shortDescription)}</p><p>${escapeHtml(product.about?.p2 || '')}</p><ul>${(product.about?.bullets || []).map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul></section>
        <section class="tab-panel" data-panel="specs" hidden><dl class="spec-list">${specs(product)}</dl></section>
        <section class="tab-panel" data-panel="terms" hidden><p>${escapeHtml(i18n.t('termIntro'))}</p><ul><li>${escapeHtml(i18n.t('term1'))}</li><li>${escapeHtml(i18n.t('term2'))}</li><li>${escapeHtml(i18n.t('term3'))}</li></ul></section>
      </div>
    </div>${mobileOrderBar(product)}`;
    bindGallery(product); bindTabs();
  }

  function bindGallery(product) {
    const mainImage = document.getElementById('productMainImage');
    const counter = document.getElementById('galleryIndex');
    const zoomLevel = document.querySelector('[data-gallery-zoom-level]');
    const stage = document.querySelector('.product-gallery-stage');
    const galleryRoot = document.querySelector('[data-gallery]');
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    const pointers = new Map();
    let startDrag = null;
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let movedEnough = false;
    let suppressClickUntil = 0;
    const mobileZoom = () => window.matchMedia('(max-width: 680px)').matches;
    const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
    const resetOrigin = () => { stage?.style.setProperty('--zoom-x', '50%'); stage?.style.setProperty('--zoom-y', '50%'); };
    const updateOrigin = (event) => {
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      stage.style.setProperty('--zoom-x', `${Math.max(0, Math.min(100, x))}%`);
      stage.style.setProperty('--zoom-y', `${Math.max(0, Math.min(100, y))}%`);
    };
    const applyZoom = () => {
      if (mainImage) {
        mainImage.style.setProperty('--gallery-zoom', String(zoom));
        mainImage.style.setProperty('--gallery-pan-x', `${panX}px`);
        mainImage.style.setProperty('--gallery-pan-y', `${panY}px`);
      }
      if (zoomLevel) zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
      stage?.classList.toggle('is-manual-zoom', mobileZoom() && zoom > 1);
      if (zoom === 1) resetOrigin();
    };
    const resetZoom = () => {
      zoom = 1;
      panX = 0;
      panY = 0;
      pointers.clear();
      startDrag = null;
      pinchStartDist = 0;
      stage?.classList.remove('is-manual-zoom', 'is-dragging', 'is-zooming');
      applyZoom();
    };
    const activateMobileZoom = () => {
      if (!mobileZoom()) return;
      if (zoom < 1.35) {
        zoom = 2;
        panX = 0;
        panY = 0;
      }
      applyZoom();
    };

    stage?.addEventListener('pointerenter', (event) => {
      if (!mobileZoom() && event.pointerType !== 'touch') stage.classList.add('is-zooming');
    });
    stage?.addEventListener('pointermove', (event) => {
      if (mobileZoom()) {
        if (!pointers.has(event.pointerId) || zoom <= 1) return;
        event.preventDefault();
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 2) {
          const points = Array.from(pointers.values());
          const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
          if (pinchStartDist > 0) {
            const previous = zoom;
            zoom = clamp(pinchStartScale * (distance / pinchStartDist), 1, 7);
            const ratio = zoom / previous;
            panX *= ratio;
            panY *= ratio;
            movedEnough = true;
            suppressClickUntil = Date.now() + 260;
            if (zoom <= 1.01) resetZoom(); else applyZoom();
          }
          return;
        }
        if (pointers.size === 1 && startDrag) {
          const deltaX = event.clientX - startDrag.x;
          const deltaY = event.clientY - startDrag.y;
          if (!movedEnough && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
            movedEnough = true;
            suppressClickUntil = Date.now() + 260;
          }
          panX = startDrag.baseX + deltaX;
          panY = startDrag.baseY + deltaY;
          applyZoom();
        }
        return;
      }
      updateOrigin(event);
      if (event.pointerType !== 'touch') stage?.classList.add('is-zooming');
    });
    stage?.addEventListener('pointerdown', (event) => {
      if (!mobileZoom() || zoom <= 1) return;
      event.preventDefault();
      stage.setPointerCapture?.(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      movedEnough = false;
      if (pointers.size === 1) {
        startDrag = { x: event.clientX, y: event.clientY, baseX: panX, baseY: panY };
        stage.classList.add('is-dragging');
      } else if (pointers.size === 2) {
        const points = Array.from(pointers.values());
        pinchStartDist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        pinchStartScale = zoom;
        startDrag = null;
        stage.classList.remove('is-dragging');
        suppressClickUntil = Date.now() + 260;
      }
    });
    const endPointer = (event) => {
      if (!mobileZoom()) return;
      pointers.delete(event.pointerId);
      if (movedEnough) suppressClickUntil = Date.now() + 260;
      if (pointers.size === 0) {
        startDrag = null;
        pinchStartDist = 0;
        stage?.classList.remove('is-dragging');
      } else if (pointers.size === 1) {
        const point = Array.from(pointers.values())[0];
        startDrag = { x: point.x, y: point.y, baseX: panX, baseY: panY };
        pinchStartDist = 0;
        stage?.classList.add('is-dragging');
      }
    };
    stage?.addEventListener('pointerup', endPointer);
    stage?.addEventListener('pointercancel', endPointer);
    stage?.addEventListener('lostpointercapture', endPointer);
    stage?.addEventListener('pointerleave', (event) => {
      if (mobileZoom()) { if (pointers.has(event.pointerId)) endPointer(event); return; }
      stage.classList.remove('is-zooming');
      resetOrigin();
    });
    stage?.addEventListener('click', (event) => {
      if (!mobileZoom() || event.target.closest('.gallery-zoom-controls') || Date.now() < suppressClickUntil) return;
      if (zoom === 1) activateMobileZoom();
    });

    galleryRoot?.addEventListener('click', (event) => {
      const menuButton = event.target.closest('[data-gallery-zoom-menu]');
      if (menuButton) {
        const controls = menuButton.closest('.gallery-zoom-controls');
        const open = !controls?.classList.contains('is-open');
        controls?.classList.toggle('is-open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        return;
      }
      const zoomButton = event.target.closest('[data-gallery-zoom]');
      if (zoomButton) {
        const action = zoomButton.dataset.galleryZoom;
        const maximum = mobileZoom() ? 7 : 3;
        if (action === 'reset' || (action === 'toggle' && zoom > 1)) { resetZoom(); return; }
        if (action === 'toggle') zoom = 2;
        else if (mobileZoom()) zoom = clamp(zoom * (action === 'in' ? 1.18 : 1 / 1.18), 1, maximum);
        else zoom = clamp(zoom + (action === 'in' ? 0.35 : -0.35), 1, maximum);
        if (zoom <= 1.01) { resetZoom(); return; }
        stage?.classList.remove('is-zooming'); applyZoom(); return;
      }
      const button = event.target.closest('[data-gallery-index]'); if (!button || !mainImage) return;
      const index = Number(button.dataset.galleryIndex); mainImage.src = button.dataset.image; mainImage.alt = `${i18n.t('viewNumber', { number: index + 1 })}: ${product.displayModel}`; if (counter) counter.textContent = String(index + 1).padStart(2, '0');
      resetZoom();
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

  function renderSecondaryContent(source) {
    const tasks = [
      () => renderRelated(source),
      () => renderProductFaq(),
    ];
    const runNext = () => {
      const task = tasks.shift();
      if (!task) return;
      task();
      if (tasks.length) window.setTimeout(runNext, 0);
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(runNext, { timeout: 1200 });
    else window.setTimeout(runNext, 120);
  }

  function renderNotFound() {
    const root = document.getElementById('productRoot'); if (!root) return;
    root.innerHTML = `<div class="product-not-found"><span class="eyebrow">${escapeHtml(i18n.t('productNotFoundKicker'))}</span><h1>${escapeHtml(i18n.t('productNotFoundTitle'))}</h1><p>${escapeHtml(i18n.t('productNotFoundText'))}</p><a class="button button-primary" href="./index.html#monturas">${escapeHtml(i18n.t('productNotFoundCta'))}</a></div>`;
  }

  function rerender() { if (currentProduct) { renderProduct(currentProduct); renderRelated(currentProduct); renderProductFaq(); } else renderNotFound(); }
  function init() {
    const id = new URLSearchParams(window.location.search).get('id'); currentProduct = products.find((candidate) => candidate.id === id);
    if (!currentProduct) { if (markProductNotFound()) return; renderNotFound(); document.getElementById('similares')?.remove(); i18n.onChange(renderNotFound); return; }
    renderProduct(currentProduct); renderSecondaryContent(currentProduct); i18n.onChange(rerender);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
