(function () {
  'use strict';

  const catalog = window.CHAMPION_CATALOG;
  const i18n = window.ChampionI18n;
  const audience = window.ChampionAudience;
  if (!catalog || !Array.isArray(catalog.products) || !i18n) return;
  const SITE_ORIGIN = 'https://champion-innova.com';
  const GHL_FORM_IDS = Object.freeze({
    es: 'kZyMWdBrTHxC2y7HNzAi',
    en: 'tRr6lFGaKP8TSoIuyHTT',
  });
  let measuredProductId = null;
  const products = catalog.products;
  const newModelIds = new Set([
    'ch03-c5', 'ch04-c5', 'ch05-c5', 'ch07-c5',
    'ch17-c1', 'ch17-c2', 'ch17-c3', 'ch17-c4',
    'ch18-c1', 'ch18-c2', 'ch18-c3', 'ch18-c4',
    'ch19-c1', 'ch19-c2', 'ch19-c3', 'ch19-c4',
    'ch20-c1', 'ch20-c2', 'ch20-c3', 'ch20-c4',
    'ch21-c1', 'ch21-c2', 'ch21-c3', 'ch21-c4',
    'ch22-c1', 'ch22-c2', 'ch22-c3', 'ch22-c4',
    'ch23-c1', 'ch23-c2', 'ch23-c3', 'ch23-c4',
    'ch24-c1', 'ch24-c2', 'ch24-c3', 'ch24-c4',
    'ch25-c1', 'ch25-c2', 'ch25-c3', 'ch25-c4',
  ]);
  let currentProduct;

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function detailUrl(product) { return `./${i18n.language}/${isB2C() ? 'b2c' : 'b2b'}/modelos/${encodeURIComponent(product.id)}/`; }
  function isB2C() { return audience?.getProfile?.() === 'b2c'; }
  function consumerProduct(product) {
    if (!isB2C()) return product;
    const english = i18n.language === 'en';
    return {
      ...product,
      subline: `${product.displayModel} · ${product.color}`,
      shortDescription: english ? `Explore ${product.displayModel} by Champion in ${product.color}.` : `Explora ${product.displayModel} de Champion en color ${product.color}.`,
      about: {
        p1: english ? `View the images, color variants and technical details for ${product.displayModel}.` : `Consulta las imágenes, variantes de color y ficha técnica de ${product.displayModel}.`,
        p2: english ? 'Visit a nearby optical store in your country to ask about Champion. Confirm availability of this model and color directly with the store.' : 'Consulta en una óptica cercana en tu país por Champion. Confirma directamente con la óptica la disponibilidad de este modelo y color.',
        bullets: [],
      },
    };
  }
  function isNewModel(product) { return newModelIds.has(product.id); }
  function cardCover(product) { return isNewModel(product) && product.images?.[0] ? product.images[0] : product.cover; }

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
    return `${SITE_ORIGIN}/${i18n.language}/${isB2C() ? 'b2c' : 'b2b'}/modelos/${encodeURIComponent(id)}/`;
  }

  function updateSearchMetadata(product) {
    if (!document.body.dataset.productId) {
      document.title = `${product.displayModel} | Champion Eyewear`;
      upsertMeta('description', `${product.displayModel}: ${product.subline}`);
    }
    if (document.body.dataset.productId) document.querySelector('meta[name="robots"][data-product-seo]')?.remove();
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
    upsertMeta('description', isB2C()
      ? (i18n.language === 'en' ? 'This Champion Eyewear style is not in the catalog.' : 'Este modelo Champion Eyewear no está en el catálogo.')
      : 'La referencia solicitada no existe en el catálogo profesional Champion Eyewear.');
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
    'Negro': '#15171c',
    'Marrón y naranja': 'linear-gradient(135deg, #795039 0 50%, #df722c 50% 100%)',
    'Azul oscuro': '#172f55',
    'Transparente y gris': 'linear-gradient(135deg, #f3f8fb 0 50%, #858b94 50% 100%)',
    'Champán': '#c5a982',
    'Negro y transparente': 'linear-gradient(135deg, #15171c 0 50%, #f3f8fb 50% 100%)',
    'Negro y rojo': 'linear-gradient(135deg, #15171c 0 50%, #bf2435 50% 100%)',
    'Verde oliva oscuro': '#363b2c',
    'Transparente y azul oscuro': 'linear-gradient(135deg, #f3f8fb 0 50%, #172f55 50% 100%)',
    'Champán y plateado': 'linear-gradient(135deg, #ccb89a 0 48%, #c5c9cf 52% 100%)',
    'Gris metalizado': '#777e87',
    'Cobrizo y marrón': 'linear-gradient(135deg, #ae704f 0 48%, #76503a 52% 100%)',
    'Marrón y verde': 'linear-gradient(135deg, #76503a 0 48%, #476b4b 52% 100%)',
    'Azul': '#245a9c',
    'Black': '#15171c',
    'Black & Gold': 'linear-gradient(135deg, #15171c 0 48%, #d6ad37 52% 100%)',
    'Black & Gunmetal': 'linear-gradient(135deg, #15171c 0 48%, #555c64 52% 100%)',
    'Black & Wine': 'linear-gradient(135deg, #15171c 0 48%, #722f4b 52% 100%)',
    'Blue': '#245a9c',
    'Brown': '#76503a',
    'Brown & Gold': 'linear-gradient(135deg, #76503a 0 48%, #d6ad37 52% 100%)',
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
    'Gunmetal & Wine': 'linear-gradient(135deg, #59616b 0 48%, #722f4b 52% 100%)',
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
    const action = isB2C()
      ? `<a href="${detailUrl(product)}#findOptics">${i18n.language === 'en' ? 'Find nearby optical stores' : 'Buscar ópticas cercanas'}</a>`
      : `<button type="button" data-request-add data-product-id="${escapeHtml(product.id)}">${escapeHtml(i18n.t('addRequest'))}</button>`;
    return `<article class="product-card related-card${isNewModel(source) ? ' is-new-model' : ''}"><a class="product-card-image" href="${detailUrl(product)}"><img src="./${escapeHtml(cardCover(source))}" alt="${escapeHtml(product.displayModel)}" loading="lazy" decoding="async"><span class="product-family-badge">${product.family === 'sun' ? 'Champion Sun' : escapeHtml(product.collection)}</span>${isNewModel(source) ? `<span class="product-new-badge">${i18n.language === 'en' ? 'New model' : 'Modelo nuevo'}</span>` : ''}</a><div class="product-card-body"><div class="product-card-topline"><span>${escapeHtml(product.collection)}</span><span>${escapeHtml(product.variant)}</span></div><h3><a href="${detailUrl(product)}">${escapeHtml(product.displayModel)}</a></h3><p class="product-card-color">${escapeHtml(product.color)}</p><div class="product-card-actions"><a href="${detailUrl(product)}">${escapeHtml(i18n.t('viewDetails'))}</a>${action}</div></div></article>`;
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
    if (isB2C()) {
      return `<div class="consumer-optics-bar"><span>${escapeHtml(product.displayModel)}</span><button class="button button-primary" type="button" data-find-optics-open>${i18n.language === 'en' ? 'Find nearby optical stores' : 'Buscar ópticas cercanas'}</button></div>`;
    }
    return `<div class="mobile-product-order-bar"><div class="mobile-order-product"><strong>${escapeHtml(product.displayModel)}</strong><span>${escapeHtml(product.color)}</span></div><label><span class="sr-only">${escapeHtml(i18n.t('requestedQuantity'))}</span><input id="mobileProductQuantity" type="number" min="1" max="9999" value="1" inputmode="numeric" aria-label="${escapeHtml(i18n.t('requestedQuantity'))}"></label><button class="button button-primary" type="button" data-request-add data-product-id="${escapeHtml(product.id)}" data-quantity-target="mobileProductQuantity">${escapeHtml(i18n.t('addRequest'))}</button></div>`;
  }

  function productActionBox(product) {
    if (isB2C()) {
      return `<div class="product-request-box product-interest-box"><span class="eyebrow">${i18n.language === 'en' ? 'Where to find Champion' : 'Dónde encontrar Champion'}</span><h2>${i18n.language === 'en' ? 'Find an optical store near you' : 'Busca una óptica cerca de ti'}</h2><p>${i18n.language === 'en' ? 'Choose your country and city below to search for nearby optical stores. Ask the store whether this Champion model and color are available.' : 'Elige tu país y ciudad abajo para buscar ópticas cercanas. Pregunta allí si tienen disponible este modelo y color Champion.'}</p></div>`;
    }
    return `<div class="product-request-box"><label for="productQuantity">${escapeHtml(i18n.t('requestedQuantity'))}</label><div class="product-order-entry"><input id="productQuantity" type="number" min="1" max="9999" value="1" inputmode="numeric"><button class="button button-primary" type="button" data-request-add data-product-id="${escapeHtml(product.id)}" data-quantity-target="productQuantity">${escapeHtml(i18n.t('addRequest'))}</button></div><button class="request-link" type="button" data-request-open>${escapeHtml(i18n.t('reviewSelection'))}</button><p>${escapeHtml(i18n.t('directConsultationNote'))}</p><div class="product-order-actions"><button class="order-whatsapp" type="button" data-request-open data-order-channel="whatsapp"><span class="order-action-icon" aria-hidden="true">☎</span><span>${escapeHtml(i18n.t('orderWhatsapp'))}</span></button><button class="order-email" type="button" data-request-open data-order-channel="email"><span class="order-action-icon" aria-hidden="true">✉</span><span>${escapeHtml(i18n.t('orderEmail'))}</span></button></div></div>`;
  }

  function productAudienceChoices(product) {
    const language = i18n.language;
    const otherProfile = isB2C() ? 'b2b' : 'b2c';
    const otherUrl = `./${language}/${otherProfile}/modelos/${encodeURIComponent(product.id)}/`;
    const personal = isB2C();
    const heading = personal
      ? (language === 'en' ? 'Where to look for this frame' : 'Dónde buscar esta montura')
      : (language === 'en' ? 'Professional inquiry' : 'Consulta para ópticas y distribuidores');
    const formLabel = personal
      ? (language === 'en' ? 'Find nearby optical stores' : 'Buscar ópticas cercanas')
      : (language === 'en' ? 'Contact as an optical store or distributor' : 'Consultar como óptica o distribuidor');
    const otherLabel = personal
      ? (language === 'en' ? 'I am an optical store or distributor' : 'Soy óptica o distribuidor')
      : (language === 'en' ? 'I want to explore frames for myself' : 'Quiero ver monturas para mí');
    return `<div class="product-audience-choices"><h2>${heading}</h2><div class="product-audience-actions"><button class="button button-primary" type="button" ${personal ? 'data-find-optics-open aria-controls="findOptics"' : 'data-product-contact-open aria-controls="productContact" aria-expanded="false"'}>${formLabel}</button><a class="button product-audience-switch" href="${otherUrl}">${otherLabel}</a></div></div>`;
  }

  function updateAudienceChrome() {
    const profile = isB2C() ? 'b2c' : 'b2b';
    document.body.dataset.audience = profile;
    document.documentElement.dataset.championAudience = profile;
    const home = `./${i18n.language}/${profile}/`;
    document.querySelector('.product-brand')?.setAttribute('href', home);
    document.querySelectorAll('.product-header nav a[href^="./index.html"]').forEach((link) => {
      link.setAttribute('href', `${home}${link.hash || ''}`);
    });
    const announcement = document.querySelector('.product-announcement');
    const requestButton = document.querySelector('.product-header [data-request-open], .product-header [data-interest-open]');
    if (profile === 'b2c') {
      if (announcement) { announcement.removeAttribute('data-i18n'); announcement.textContent = i18n.language === 'en' ? 'CHAMPION EYEWEAR · Explore styles and ask where to find them' : 'CHAMPION EYEWEAR · Explora modelos y consulta dónde encontrarlos'; }
      requestButton?.remove();
      const contact = document.querySelector('.product-footer .footer-grid > div:last-child');
      if (contact) {
        contact.querySelectorAll('a[href^="https://wa.me/"], a[href^="mailto:"]').forEach((link) => link.remove());
        const heading = contact.querySelector('strong');
        if (heading) { heading.removeAttribute('data-i18n'); heading.textContent = i18n.language === 'en' ? 'Guidance' : 'Orientación'; }
        let note = contact.querySelector('[data-consumer-guidance]');
        if (!note) { note = document.createElement('span'); note.dataset.consumerGuidance = ''; contact.appendChild(note); }
        note.textContent = i18n.language === 'en' ? 'Ask a nearby optical store in your country about Champion.' : 'Consulta en una óptica cercana en tu país por Champion.';
      }
      const conditions = document.querySelector('[data-i18n="footerConditions"]');
      const minimum = document.querySelector('[data-i18n="footerMinimum"]');
      const mix = document.querySelector('[data-i18n="footerMix"]');
      [conditions, minimum, mix].forEach((node) => node?.removeAttribute('data-i18n'));
      if (conditions) conditions.textContent = i18n.language === 'en' ? 'Where to find Champion' : 'Dónde encontrar Champion';
      if (minimum) minimum.textContent = i18n.language === 'en' ? 'Ask at a nearby optical store in your country' : 'Consulta en una óptica cercana en tu país';
      if (mix) mix.textContent = i18n.language === 'en' ? 'Check model and color availability with the store' : 'Confirma allí la disponibilidad del modelo y color';
      const brandText = document.querySelector('.product-brand span');
      if (brandText) { brandText.removeAttribute('data-i18n'); brandText.textContent = i18n.language === 'en' ? 'Champion models for your style.' : 'Modelos Champion para tu estilo.'; }
      const footerText = document.querySelector('.product-footer [data-i18n="footerText"]');
      if (footerText) { footerText.removeAttribute('data-i18n'); footerText.textContent = i18n.language === 'en' ? 'Explore Champion Eyewear with Innova.' : 'Descubre Champion Eyewear con Innova.'; }
      const footerIndex = document.querySelector('.product-footer [data-i18n="footerIndex"]');
      if (footerIndex) { footerIndex.removeAttribute('data-i18n'); footerIndex.href = `${home}#monturas`; footerIndex.textContent = i18n.language === 'en' ? 'Explore the collection' : 'Explorar la colección'; }
      const faqHeading = document.querySelector('.product-faq-section .section-heading');
      if (faqHeading) {
        faqHeading.querySelectorAll('[data-i18n]').forEach((node) => node.removeAttribute('data-i18n'));
        const [kicker, title, intro] = faqHeading.children;
        if (kicker) kicker.textContent = i18n.language === 'en' ? 'Helpful information' : 'Información útil';
        if (title) title.textContent = i18n.language === 'en' ? 'Questions about your Champion frames' : 'Preguntas sobre tus lentes Champion';
        if (intro) intro.textContent = i18n.language === 'en' ? 'Explore the catalog and confirm details and availability with a nearby optical store.' : 'Explora el catálogo y confirma los detalles y la disponibilidad en una óptica cercana.';
      }
    }
    const nav = document.querySelector('.product-header nav');
    if (nav && !nav.querySelector('[data-audience-change]')) {
      const change = document.createElement('button');
      change.type = 'button';
      change.className = 'audience-switch';
      change.dataset.audienceChange = '';
      change.textContent = i18n.language === 'en' ? 'Change audience' : 'Cambiar perfil';
      nav.insertBefore(change, requestButton?.isConnected ? requestButton : null);
    }
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
    const product = consumerProduct(i18n.localizeProduct(source));
    const root = document.getElementById('productRoot');
    const variants = products.filter((candidate) => candidate.series === source.series);
    const backAnchor = product.family === 'sun' ? 'lentes-sol' : 'monturas';
    updateSearchMetadata(product);
    updateAudienceChrome();
    const experienceBase = `./${i18n.language}/${isB2C() ? 'b2c' : 'b2b'}/`;
    document.querySelector('.back-control')?.setAttribute('href', `${experienceBase}#${backAnchor}`);
    if (!root) return;
    root.innerHTML = `<div class="product-media-column">${gallery(product)}${relatedSection()}</div><div class="product-details">
      <nav class="breadcrumbs" aria-label="${escapeHtml(i18n.t('breadcrumbs'))}"><a href="${experienceBase}">${escapeHtml(i18n.t('navHome'))}</a><span>/</span><a href="${experienceBase}#${backAnchor}">${escapeHtml(i18n.t(product.family === 'sun' ? 'navSun' : 'navOptical'))}</a><span>/</span><strong>${escapeHtml(product.displayModel)}</strong></nav>
      <span class="eyebrow">${escapeHtml(product.family === 'sun' ? 'Champion Sun' : `Champion ${product.collection}`)}</span>${isNewModel(source) ? `<span class="product-new-detail-badge">${i18n.language === 'en' ? 'New model' : 'Modelo nuevo'}</span>` : ''}<h1>${escapeHtml(product.displayModel)}</h1>${variantPickerMarkup(variants, product, 'mobile-product-variants')}<p class="product-subline">${escapeHtml(product.subline)}</p>${isB2C() ? '' : `<div class="product-tags">${(product.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>`}
      ${variantPickerMarkup(variants, product, 'desktop-product-variants')}
      ${productActionBox(product)}
      ${productAudienceChoices(product)}
      <div class="product-tabs"><div class="tab-list" role="tablist" aria-label="${escapeHtml(i18n.t('tabsAria'))}"><button class="is-active" type="button" role="tab" aria-selected="true" data-tab="description">${escapeHtml(i18n.t('tabDescription'))}</button><button type="button" role="tab" aria-selected="false" data-tab="specs">${escapeHtml(i18n.t('tabSpecs'))}</button>${isB2C() ? '' : `<button type="button" role="tab" aria-selected="false" data-tab="terms">${escapeHtml(i18n.t('tabTerms'))}</button>`}</div>
        <section class="tab-panel is-active" data-panel="description"><p>${escapeHtml(product.about?.p1 || product.shortDescription)}</p><p>${escapeHtml(product.about?.p2 || '')}</p><ul>${(product.about?.bullets || []).map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul></section>
        <section class="tab-panel" data-panel="specs" hidden><dl class="spec-list">${specs(product)}</dl></section>
        ${isB2C() ? '' : `<section class="tab-panel" data-panel="terms" hidden><p>${escapeHtml(i18n.t('termIntro'))}</p><ul><li>${escapeHtml(i18n.t('term1'))}</li><li>${escapeHtml(i18n.t('term2'))}</li><li>${escapeHtml(i18n.t('term3'))}</li></ul></section>`}
      </div>
    </div>${mobileOrderBar(product)}`;
    bindGallery(product); bindTabs(); renderContactForm(product); bindContactActions(); trackProductView(product);
  }

  function renderContactForm(product) {
    const section = document.getElementById('productContact');
    const frame = document.getElementById('productContactFrame');
    if (!section || !frame) return;
    const language = i18n.language === 'en' ? 'en' : 'es';
    const profile = 'b2b';
    const formId = GHL_FORM_IDS[language];
    const title = document.getElementById('productContactTitle');
    const description = document.getElementById('productContactText');
    title.textContent = language === 'en'
      ? (profile === 'b2b' ? `Ask about ${product.displayModel}` : `Where to find ${product.displayModel}`)
      : (profile === 'b2b' ? `Consulta profesional sobre ${product.displayModel}` : `Dónde encontrar ${product.displayModel}`);
    description.textContent = language === 'en'
      ? (profile === 'b2b' ? 'Contact Champion about this frame. Your product selection and order remain separate.' : 'Ask about Champion availability at an optical store in your country.')
      : (profile === 'b2b' ? 'Contacta sobre esta montura. La selección de modelos y el pedido permanecen separados.' : 'Consulta la disponibilidad de Champion en una óptica de tu país.');
    frame.title = language === 'en' ? `Champion ${profile} contact form` : `Formulario Champion ${profile === 'b2b' ? 'para ópticas' : 'para particulares'}`;
    const url = `https://api.leadconnectorhq.com/widget/form/${encodeURIComponent(formId)}`;
    const directLink = document.getElementById('productContactLink');
    if (directLink) {
      directLink.href = url;
      directLink.textContent = language === 'en' ? 'If the form does not appear, open it in a new tab' : 'Si el formulario no aparece, ábrelo en una pestaña nueva';
    }
    const openedFromCatalog = window.location.hash === '#productContact';
    if (!section.hidden || openedFromCatalog) {
      section.hidden = false;
      if (frame.src !== url) frame.src = url;
      document.querySelector('[data-product-contact-open]')?.setAttribute('aria-expanded', 'true');
      if (openedFromCatalog) {
        const reveal = () => section.scrollIntoView({ block: 'start' });
        requestAnimationFrame(() => requestAnimationFrame(reveal));
        if (document.readyState !== 'complete') {
          window.addEventListener('load', () => {
            requestAnimationFrame(reveal);
            window.setTimeout(reveal, 300);
          }, { once: true });
        }
      }
    }
  }

  function bindContactActions() {
    document.querySelector('[data-product-contact-open]')?.addEventListener('click', () => {
      const section = document.getElementById('productContact');
      const frame = document.getElementById('productContactFrame');
      const formUrl = document.getElementById('productContactLink')?.href;
      if (!section || !frame || !formUrl) return;
      section.hidden = false;
      if (frame.src !== formUrl) frame.src = formUrl;
      document.querySelector('[data-product-contact-open]')?.setAttribute('aria-expanded', 'true');
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function trackProductView(product) {
    if (measuredProductId || typeof window.gtag !== 'function') return;
    if (!document.querySelector('#productRoot h1')) return;
    measuredProductId = product.id;
    window.gtag('event', 'page_view', {
      send_to: 'G-10EF1REGL8',
      page_title: document.title,
      page_location: window.location.href,
    });
    window.gtag('event', 'view_item', {
      send_to: 'G-10EF1REGL8',
      items: [{
        item_id: product.id,
        item_name: product.displayModel,
        item_brand: 'Champion',
        item_category: product.family,
        item_category2: product.series,
        item_variant: product.variant,
      }],
    });
    if (['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
      document.documentElement.dataset.championAnalyticsPreview = JSON.stringify(
        (window.dataLayer || []).filter((entry) => entry[0] === 'event')
          .map((entry) => ({ name: entry[1], parameters: entry[2] })),
      );
    }
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
    if (isB2C()) {
      const questions = i18n.language === 'en' ? [
        ['Can I buy these frames on this website?', 'No. This is an informational catalog, with no direct online purchase. Ask at a nearby optical store in your country about Champion.'],
        ['How do I check a model and color?', 'Use the model and color shown on this page when asking an optical store. The store must confirm whether it has that specific item available.'],
      ] : [
        ['¿Puedo comprar estas monturas en esta web?', 'No. Este catálogo es informativo y no ofrece compra directa en línea. Consulta en una óptica cercana en tu país por Champion.'],
        ['¿Cómo confirmo un modelo y color?', 'Indica a la óptica el modelo y color que ves en esta ficha. La óptica debe confirmar si tiene disponible esa referencia.'],
      ];
      root.innerHTML = `<section class="product-faq-group"><h3>${i18n.language === 'en' ? 'For consumers' : 'Para consumidores'}</h3>${questions.map(([question, answer], index) => `<details ${index === 0 ? 'open' : ''}><summary><span>${escapeHtml(question)}</span><span aria-hidden="true">⌄</span></summary><p>${escapeHtml(answer)}</p></details>`).join('')}</section>`;
      return;
    }
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
    renderRelated(source);
    if ('requestIdleCallback' in window) window.requestIdleCallback(renderProductFaq, { timeout: 1200 });
    else window.setTimeout(renderProductFaq, 120);
  }

  function renderNotFound() {
    const root = document.getElementById('productRoot'); if (!root) return;
    root.innerHTML = `<div class="product-not-found"><span class="eyebrow">${escapeHtml(i18n.t('productNotFoundKicker'))}</span><h1>${escapeHtml(i18n.t('productNotFoundTitle'))}</h1><p>${escapeHtml(i18n.t('productNotFoundText'))}</p><a class="button button-primary" href="./${i18n.language}/${isB2C() ? 'b2c' : 'b2b'}/#monturas">${escapeHtml(i18n.t('productNotFoundCta'))}</a></div>`;
  }

  function rerender() { if (currentProduct) { renderProduct(currentProduct); renderRelated(currentProduct); renderProductFaq(); } else renderNotFound(); }
  async function init() {
    const id = document.body.dataset.productId || new URLSearchParams(window.location.search).get('id'); currentProduct = products.find((candidate) => candidate.id === id);
    if (!currentProduct) { if (markProductNotFound()) return; renderNotFound(); document.getElementById('similares')?.remove(); i18n.onChange(renderNotFound); return; }
    const profile = await (audience?.guard?.({ type: 'view-product', productId: id, required: true, deferDispatch: true }) || Promise.resolve('b2b'));
    if (!profile) return;
    await audience?.ensureController?.(profile);
    renderProduct(currentProduct); renderSecondaryContent(currentProduct); i18n.onChange(rerender);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
