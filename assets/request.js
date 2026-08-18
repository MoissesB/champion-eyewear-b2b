(function () {
  'use strict';

  const catalog = window.CHAMPION_CATALOG;
  const i18n = window.ChampionI18n;
  if (!catalog || !Array.isArray(catalog.products) || !i18n) return;

  const STORAGE_KEY = 'champion-professional-request-v3';
  const LEGACY_KEY = 'champion-b2b-request-v2';
  const MINIMUM_UNITS = 24;
  const productMap = new Map(catalog.products.map((product) => [product.id, product]));
  const defaultClient = { name: '', company: '', optical: '', email: '', phoneCountryCode: '', phone: '', city: '', country: '', notes: '' };
  const requiredFields = ['name', 'company', 'optical', 'email', 'phoneCountryCode', 'phone', 'city', 'country'];
  let toastTimer;
  let lastFocused;
  let pdfLibraryPromise;

  const copy = {
    es: {
      fab: 'Mi pedido', fabAria: 'Abrir mi pedido Champion', kicker: 'Selección profesional', title: 'Pedido Champion para revisión', intro: 'Seleccione todos los productos y cantidades. Innova revisará la óptica, confirmará disponibilidad, realizará el cobro y coordinará el envío.', close: 'Cerrar pedido', requestNumber: 'Pedido', references: 'referencias', reference: 'referencia', units: 'piezas', unit: 'pieza', minimum: 'Mínimo 24 piezas', ready: 'La selección ya cumple el mínimo de 24 piezas.', remaining: 'Faltan {count} piezas para completar el mínimo de 24 piezas.', quantity: 'Cantidad', remove: 'Quitar', emptyTitle: 'Todavía no ha seleccionado productos.', emptyText: 'Vaya al catálogo, abra una montura o lente de sol y pulse “Añadir a mi pedido”. Puede combinar modelos hasta llegar a 24 piezas.', goCatalog: 'Ir a seleccionar productos', clientTitle: 'Datos de la óptica', clientIntro: 'Complete todos los campos obligatorios. Se incluirán en el PDF, CSV, correo y mensaje para Innova.', name: 'Nombre y apellido', company: 'Empresa / razón social', optical: 'Nombre de la óptica', email: 'Correo profesional', phonePrefix: 'Prefijo internacional', phone: 'Número telefónico', city: 'Ciudad', country: 'País o región', notes: 'Observaciones', namePh: 'Nombre del contacto', companyPh: 'Razón social', opticalPh: 'Nombre comercial', emailPh: 'nombre@empresa.com', phonePh: 'Número sin prefijo', cityPh: 'Ciudad', countryPh: 'País o región', notesPh: 'Surtido, fecha requerida o comentarios…', requiredHelp: 'Para habilitar el envío faltan: {fields}.', invalidEmail: 'Escriba un correo profesional válido.', invalidPhone: 'Selecciona un prefijo y escribe un número telefónico válido.', readyHelp: 'Pedido completo y listo para enviar.', pdf: 'Descargar PDF de mi pedido', whatsapp: 'Descargar PDF y abrir WhatsApp', emailAction: 'Descargar archivos y preparar correo', copyText: 'Copiar pedido en texto', actionNote: 'Al pulsar WhatsApp se descargará el PDF y se abrirá el mensaje con todos sus datos y productos. Antes de enviarlo, adjunte manualmente el PDF descargado. Por correo se descargan el PDF y el CSV: adjunte ambos archivos al mensaje. El envío se coordina con el cliente y no es gratuito.', noItems: 'Seleccione productos antes de continuar.', incomplete: 'Complete los datos obligatorios y llegue a 24 piezas.', pdfDownloaded: 'PDF del pedido descargado', filesPreparedWhatsapp: 'PDF descargado. Adjúntelo en WhatsApp antes de enviar el pedido.', filesPreparedEmail: 'PDF y CSV descargados. Adjúntelos al correo antes de enviar el pedido.', copied: 'Pedido copiado', copyFailed: 'No se pudo copiar automáticamente.', pdfUnavailable: 'No se pudo generar el PDF. Inténtelo de nuevo.',
      missingNames: { name: 'nombre', company: 'empresa', optical: 'óptica', email: 'correo', phoneCountryCode: 'prefijo internacional', phone: 'número telefónico', city: 'ciudad', country: 'país' },
      pdfTitle: 'PEDIDO CHAMPION PARA REVISIÓN', pdfFor: 'Documento para la óptica', clientData: 'DATOS DEL CLIENTE', selection: 'PRODUCTOS DEL PEDIDO', summary: 'RESUMEN DEL PEDIDO', referenceTitle: 'SIGUIENTES PASOS', totalReferences: 'Referencias', totalUnits: 'Piezas', minimumLabel: 'Mínimo inicial', finalNote: 'Innova revisará la óptica y la disponibilidad, realizará el cobro y coordinará el envío con el cliente. No se ofrece envío gratuito. Este documento no es una factura ni un pedido confirmado.', model: 'Modelo', color: 'Color', sku: 'SKU', collection: 'Colección', material: 'Material', measurements: 'Medidas', page: 'Página', attachmentPdf: 'IMPORTANTE: antes de enviar este mensaje, adjunte manualmente el archivo {pdf} descargado.', attachmentEmail: 'IMPORTANTE: antes de enviar este correo, adjunte manualmente los archivos {pdf} y {csv} descargados.'
    },
    en: {
      fab: 'My order', fabAria: 'Open my Champion order', kicker: 'Professional selection', title: 'Champion order for review', intro: 'Select all products and quantities. Innova will review the optical store, confirm availability, process payment and coordinate shipping.', close: 'Close order', requestNumber: 'Order', references: 'references', reference: 'reference', units: 'pieces', unit: 'piece', minimum: '24-piece minimum', ready: 'The selection meets the 24-piece minimum.', remaining: '{count} more pieces are needed to reach the 24-piece minimum.', quantity: 'Quantity', remove: 'Remove', emptyTitle: 'You have not selected any products yet.', emptyText: 'Go to the catalog, open an optical frame or sunglass and click “Add to my order”. You may combine models until you reach 24 pieces.', goCatalog: 'Select products', clientTitle: 'Optical-store details', clientIntro: 'Complete every required field. These details will be included in the PDF, CSV, email and Innova message.', name: 'Full name', company: 'Company / legal name', optical: 'Optical-store name', email: 'Professional email', phonePrefix: 'International prefix', phone: 'Phone number', city: 'City', country: 'Country or region', notes: 'Notes', namePh: 'Contact name', companyPh: 'Legal company name', opticalPh: 'Trading name', emailPh: 'name@company.com', phonePh: 'Number without prefix', cityPh: 'City', countryPh: 'Country or region', notesPh: 'Assortment, required date or comments…', requiredHelp: 'To enable sending, complete: {fields}.', invalidEmail: 'Enter a valid professional email.', invalidPhone: 'Select an international prefix and enter a valid phone number.', readyHelp: 'The complete order is ready to send.', pdf: 'Download my order PDF', whatsapp: 'Download PDF and open WhatsApp', emailAction: 'Download files and prepare email', copyText: 'Copy order as text', actionNote: 'WhatsApp downloads the PDF and opens a message containing all customer and product details. Attach the downloaded PDF manually before sending. Email downloads the PDF and CSV: attach both files to the message. Shipping is coordinated with the customer and is not free.', noItems: 'Select products before continuing.', incomplete: 'Complete all required details and reach 24 pieces.', pdfDownloaded: 'Order PDF downloaded', filesPreparedWhatsapp: 'PDF downloaded. Attach it in WhatsApp before sending the order.', filesPreparedEmail: 'PDF and CSV downloaded. Attach them to the email before sending.', copied: 'Order copied', copyFailed: 'The order could not be copied automatically.', pdfUnavailable: 'The PDF could not be generated. Please try again.',
      missingNames: { name: 'name', company: 'company', optical: 'optical store', email: 'email', phoneCountryCode: 'international prefix', phone: 'phone', city: 'city', country: 'country' },
      pdfTitle: 'CHAMPION ORDER FOR REVIEW', pdfFor: 'Document for the optical store', clientData: 'CLIENT DETAILS', selection: 'ORDER PRODUCTS', summary: 'ORDER SUMMARY', referenceTitle: 'NEXT STEPS', totalReferences: 'References', totalUnits: 'Pieces', minimumLabel: 'Initial minimum', finalNote: 'Innova will review the optical store and availability, process payment and coordinate shipping with the customer. Free shipping is not offered. This document is not an invoice or a confirmed order.', model: 'Model', color: 'Color', sku: 'SKU', collection: 'Collection', material: 'Material', measurements: 'Measurements', page: 'Page', attachmentPdf: 'IMPORTANT: before sending this message, manually attach the downloaded {pdf} file.', attachmentEmail: 'IMPORTANT: before sending this email, manually attach the downloaded {pdf} and {csv} files.'
    }
  };

  function lang() { return i18n.language === 'en' ? 'en' : 'es'; }
  function tr(key, vars) {
    const value = copy[lang()][key] ?? key;
    return String(value).replace(/\{(\w+)\}/g, (_match, name) => vars && name in vars ? vars[name] : '');
  }
  function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function orderNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const bytes = new Uint8Array(3);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes); else bytes.forEach((_value, index) => { bytes[index] = Math.floor(Math.random() * 256); });
    return `CH-${date}-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY) || '{}';
      const parsed = JSON.parse(stored);
      const client = { ...defaultClient, ...(parsed.client || {}) };
      client.country = window.ChampionAudience?.normalizeCountryCode?.(client.country) || '';
      return { items: parsed.items && typeof parsed.items === 'object' ? parsed.items : {}, client, orderNumber: parsed.orderNumber || orderNumber() };
    } catch (_error) { return { items: {}, client: { ...defaultClient }, orderNumber: orderNumber() }; }
  }
  let state = loadState();
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function selectedEntries() {
    return Object.entries(state.items).map(([id, quantity]) => ({ product: productMap.get(id), quantity: Math.max(1, Number(quantity) || 1) })).filter((entry) => entry.product);
  }
  function totalUnits(entries = selectedEntries()) { return entries.reduce((sum, entry) => sum + entry.quantity, 0); }
  function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim()); }
  function readiness() {
    const entries = selectedEntries(); const units = totalUnits(entries);
    const missing = requiredFields.filter((field) => !String(state.client[field] || '').trim());
    const emailInvalid = !missing.includes('email') && !validEmail(state.client.email);
    const phoneInvalid = !missing.includes('phoneCountryCode') && !missing.includes('phone') && !window.ChampionAudience?.validPhoneWithPrefix?.(state.client.phoneCountryCode, state.client.phone);
    return { entries, units, missing, emailInvalid, phoneInvalid, ready: entries.length > 0 && units >= MINIMUM_UNITS && missing.length === 0 && !emailInvalid && !phoneInvalid };
  }

  function showToast(message) {
    const toast = document.getElementById('siteToast'); if (!toast) return;
    toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
  }

  function shellMarkup() {
    return `<button class="request-fab" type="button" data-request-open aria-label="${escapeHtml(tr('fabAria'))}">${escapeHtml(tr('fab'))} <span data-request-count>0</span></button>
      <div class="request-overlay" data-request-close></div>
      <aside class="request-drawer" id="requestDrawer" role="dialog" aria-modal="true" aria-labelledby="requestTitle" aria-hidden="true">
        <header class="request-drawer-header"><div><span class="eyebrow">${escapeHtml(tr('kicker'))}</span><h2 id="requestTitle">${escapeHtml(tr('title'))}</h2><p>${escapeHtml(tr('intro'))}</p><span class="request-number">${escapeHtml(tr('requestNumber'))} ${escapeHtml(state.orderNumber)}</span></div><button class="drawer-close" type="button" data-request-close aria-label="${escapeHtml(tr('close'))}">×</button></header>
        <div class="request-drawer-body"><div class="request-summary" id="requestSummary"></div><div class="request-progress" id="requestProgress"></div><div class="request-items" id="requestItems"></div>
          <form class="client-form" id="clientForm" novalidate><h3>${escapeHtml(tr('clientTitle'))}</h3><p>${escapeHtml(tr('clientIntro'))}</p><div class="client-form-grid">
            ${fieldMarkup('name', 'name', 'namePh', 'name')}${fieldMarkup('company', 'company', 'companyPh', 'organization')}${fieldMarkup('optical', 'optical', 'opticalPh', 'organization-title')}${fieldMarkup('email', 'email', 'emailPh', 'email', 'email')}${phoneFieldMarkup()}${fieldMarkup('city', 'city', 'cityPh', 'address-level2')}${countryFieldMarkup()}
            <label class="field field-wide"><span>${escapeHtml(tr('notes'))}</span><textarea name="notes" placeholder="${escapeHtml(tr('notesPh'))}">${escapeHtml(state.client.notes)}</textarea></label>
          </div><p class="request-requirements" id="requestRequirements" aria-live="polite"></p></form>
          <div class="request-actions"><button class="action-primary" type="button" data-request-pdf>${escapeHtml(tr('pdf'))}</button><button class="action-whatsapp" type="button" data-request-whatsapp>${escapeHtml(tr('whatsapp'))}</button><button type="button" data-request-email>${escapeHtml(tr('emailAction'))}</button><button type="button" data-request-copy>${escapeHtml(tr('copyText'))}</button><p class="request-note">${escapeHtml(tr('actionNote'))}</p></div>
        </div>
      </aside>`;
  }
  function fieldMarkup(name, labelKey, placeholderKey, autocomplete, type = 'text') {
    return `<label class="field"><span>${escapeHtml(tr(labelKey))} *</span><input name="${name}" type="${type}" autocomplete="${autocomplete}" value="${escapeHtml(state.client[name])}" placeholder="${escapeHtml(tr(placeholderKey))}" required></label>`;
  }

  function phoneFieldMarkup() {
    return window.ChampionAudience?.renderPhoneField?.('request', state.client.phoneCountryCode, 'phone', tr('phone'), state.client.phone, 'requestPhoneHelp', 'field-wide request-phone-field') || fieldMarkup('phone', 'phone', 'phonePh', 'tel');
  }

  function countryFieldMarkup() {
    return window.ChampionAudience?.renderCountryCombobox?.('request', state.client.country, 'country', tr('country'), 'audience-field-wide field field-wide') || fieldMarkup('country', 'country', 'countryPh', 'country-name');
  }

  function fullClientPhone() {
    return window.ChampionAudience?.formattedPhone?.(state.client.phoneCountryCode, state.client.phone) || state.client.phone;
  }

  function renderShell() {
    const portal = document.getElementById('requestPortal'); if (!portal) return;
    const wasOpen = document.body.classList.contains('drawer-open'); portal.innerHTML = shellMarkup(); render();
    if (wasOpen) { document.querySelector('.request-overlay')?.classList.add('is-open'); document.getElementById('requestDrawer')?.classList.add('is-open'); document.getElementById('requestDrawer')?.setAttribute('aria-hidden', 'false'); }
  }

  function render() {
    const status = readiness();
    document.querySelectorAll('[data-request-count]').forEach((node) => { node.textContent = String(status.entries.length); });
    const summary = document.getElementById('requestSummary');
    if (summary) summary.innerHTML = `<span><strong>${status.entries.length}</strong> ${escapeHtml(status.entries.length === 1 ? tr('reference') : tr('references'))}</span><span><strong>${status.units}</strong> ${escapeHtml(status.units === 1 ? tr('unit') : tr('units'))}</span>`;
    const progress = document.getElementById('requestProgress');
    if (progress) {
      const remaining = Math.max(0, MINIMUM_UNITS - status.units); const percent = Math.min(100, (status.units / MINIMUM_UNITS) * 100);
      progress.innerHTML = `<div class="request-progress-top"><strong>${escapeHtml(remaining ? tr('remaining', { count: remaining }) : tr('ready'))}</strong><span>${status.units}/${MINIMUM_UNITS}</span></div><div class="request-progress-track"><span style="width:${percent}%"></span></div>`;
    }
    const items = document.getElementById('requestItems');
    if (items) items.innerHTML = status.entries.length ? status.entries.map(({ product: source, quantity }) => {
      const product = i18n.localizeProduct(source);
      return `<article class="request-item"><img src="./${escapeHtml(product.cover)}" alt="${escapeHtml(product.displayModel)}"><div><h3>${escapeHtml(product.displayModel)}</h3><p>${escapeHtml(product.color)}</p><p>${escapeHtml(product.sku)}</p></div><div class="request-item-controls"><label>${escapeHtml(tr('quantity'))} <input type="number" min="1" max="9999" value="${quantity}" data-request-quantity="${escapeHtml(product.id)}" aria-label="${escapeHtml(tr('quantity'))}: ${escapeHtml(product.displayModel)}"></label><button class="request-remove" type="button" data-request-remove="${escapeHtml(product.id)}">${escapeHtml(tr('remove'))}</button></div></article>`;
    }).join('') : `<div class="request-empty"><strong>${escapeHtml(tr('emptyTitle'))}</strong><p>${escapeHtml(tr('emptyText'))}</p><a class="button button-dark" href="./index.html#monturas" data-request-go-catalog>${escapeHtml(tr('goCatalog'))}</a></div>`;
    updateReadiness(status);
  }

  function updateReadiness(status = readiness()) {
    const requirements = document.getElementById('requestRequirements');
    if (requirements) {
      if (status.emailInvalid) requirements.textContent = tr('invalidEmail');
      else if (status.phoneInvalid) requirements.textContent = tr('invalidPhone');
      else if (status.missing.length) requirements.textContent = tr('requiredHelp', { fields: status.missing.map((field) => copy[lang()].missingNames[field]).join(', ') });
      else if (status.units < MINIMUM_UNITS) requirements.textContent = tr('remaining', { count: MINIMUM_UNITS - status.units });
      else requirements.textContent = tr('readyHelp');
      requirements.classList.toggle('is-ready', status.ready);
    }
    requiredFields.forEach((field) => { const input = document.querySelector(`#clientForm [name="${field}"]`); if (input) input.setAttribute('aria-invalid', String((!state.client[field] || (field === 'email' && status.emailInvalid) || ((field === 'phone' || field === 'phoneCountryCode') && status.phoneInvalid)) && input === document.activeElement ? true : false)); });
    document.querySelectorAll('[data-request-pdf], [data-request-whatsapp], [data-request-email], [data-request-copy]').forEach((button) => { button.disabled = !status.ready; });
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const openButton = event.target.closest('[data-request-open]'); if (openButton) { event.preventDefault(); openDrawer(openButton); return; }
      if (event.target.closest('[data-request-close]')) { event.preventDefault(); closeDrawer(); return; }
      const catalogLink = event.target.closest('[data-request-go-catalog]'); if (catalogLink) { closeDrawer(); return; }
      const addButton = event.target.closest('[data-request-add]'); if (addButton) { event.preventDefault(); const input = addButton.dataset.quantityTarget ? document.getElementById(addButton.dataset.quantityTarget) : null; add(addButton.dataset.productId, input ? input.value : 1); return; }
      const removeButton = event.target.closest('[data-request-remove]'); if (removeButton) { remove(removeButton.dataset.requestRemove); return; }
      if (event.target.closest('[data-request-pdf]')) downloadPdf();
      if (event.target.closest('[data-request-whatsapp]')) sendWhatsApp();
      if (event.target.closest('[data-request-email]')) sendEmail();
      if (event.target.closest('[data-request-copy]')) copyRequest();
    });
    document.addEventListener('change', (event) => { const quantity = event.target.closest('[data-request-quantity]'); if (quantity) updateQuantity(quantity.dataset.requestQuantity, quantity.value); });
    document.addEventListener('input', (event) => {
      const field = event.target.closest('#clientForm [name]'); if (!field || !(field.name in defaultClient)) return;
      state.client[field.name] = field.value; saveState(); updateReadiness();
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !event.target.closest?.('[data-phone-search], [data-country-search]')) closeDrawer(); });
  }

  function openDrawer(trigger) {
    lastFocused = trigger || document.activeElement; document.body.classList.add('drawer-open'); document.querySelector('.request-overlay')?.classList.add('is-open'); const drawer = document.getElementById('requestDrawer'); drawer?.classList.add('is-open'); drawer?.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      const channel = trigger?.dataset?.orderChannel;
      if (!channel) { drawer?.querySelector('.drawer-close')?.focus(); return; }
      const status = readiness();
      const target = status.ready ? drawer?.querySelector(`[data-request-${channel}]`) : (status.entries.length ? document.getElementById('clientForm') : document.getElementById('requestItems'));
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!status.ready) showToast(status.entries.length ? tr('incomplete') : tr('noItems'));
    }, 60);
  }
  function closeDrawer() { document.body.classList.remove('drawer-open'); document.querySelector('.request-overlay')?.classList.remove('is-open'); const drawer = document.getElementById('requestDrawer'); drawer?.classList.remove('is-open'); drawer?.setAttribute('aria-hidden', 'true'); if (lastFocused?.focus) lastFocused.focus(); }
  function add(id, quantity = 1) { const product = productMap.get(id); if (!product) return; const requested = Math.max(1, Math.min(9999, Number(quantity) || 1)); state.items[id] = (Number(state.items[id]) || 0) + requested; saveState(); render(); showToast(i18n.t('added', { model: product.displayModel })); }
  function remove(id) { delete state.items[id]; saveState(); render(); }
  function updateQuantity(id, quantity) { if (!productMap.has(id)) return; state.items[id] = Math.max(1, Math.min(9999, Number(quantity) || 1)); saveState(); render(); }
  function guardReady() { const status = readiness(); if (status.ready) return status; showToast(status.entries.length ? tr('incomplete') : tr('noItems')); return null; }

  function csvEscape(value) { const valueText = String(value ?? '').replace(/\r?\n/g, ' '); return `"${valueText.replace(/"/g, '""')}"`; }
  function csvContent() {
    const headers = ['Número de pedido', 'Fecha', 'Nombre', 'Empresa / Razón social', 'Óptica', 'Correo profesional', 'Teléfono', 'Ciudad', 'País', 'Modelo', 'Familia', 'Colección', 'Variante', 'Color', 'Material', 'Forma', 'Tipo de lente', 'Protección / Compatibilidad', 'Medidas', 'SKU', 'Cantidad', 'Estado del pedido', 'Observaciones'];
    const entries = selectedEntries(); const units = totalUnits(entries); const date = new Date().toLocaleString('es-ES');
    const rows = entries.map(({ product, quantity }) => [state.orderNumber, date, state.client.name, state.client.company, state.client.optical, state.client.email, fullClientPhone(), state.client.city, state.client.country, product.displayModel, product.family === 'sun' ? 'Lentes de sol' : 'Montura óptica', product.collection, product.variant, product.color, product.material, product.shape, product.lens, product.protection, product.measurements, product.sku, quantity, 'Pendiente de revisión y confirmación de Innova', state.client.notes]);
    return `\uFEFF${[headers, ...rows].map((row) => row.map(csvEscape).join(';')).join('\r\n')}`;
  }
  function csvBlob() { return new Blob([csvContent()], { type: 'text/csv;charset=utf-8' }); }
  function slugCompany() { return (state.client.optical || state.client.company || 'cliente').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cliente'; }
  function csvFileName() { return `${state.orderNumber}-innova-${slugCompany()}.csv`; }
  function pdfFileName() { return `${state.orderNumber}-champion-${slugCompany()}.pdf`; }
  function triggerDownload(blob, name) { const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1800); }
  function downloadCsv() { triggerDownload(csvBlob(), csvFileName()); }

  function ensurePdfLibrary() {
    if (window.jspdf?.jsPDF) return Promise.resolve();
    if (pdfLibraryPromise) return pdfLibraryPromise;
    pdfLibraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = './assets/vendor/jspdf.umd.min.js';
      script.async = true;
      script.dataset.jspdfLoader = 'true';
      script.onload = () => (window.jspdf?.jsPDF ? resolve() : reject(new Error('jsPDF no está disponible')));
      script.onerror = () => {
        pdfLibraryPromise = null;
        reject(new Error('No se pudo cargar jsPDF'));
      };
      document.head.appendChild(script);
    });
    return pdfLibraryPromise;
  }

  function trimmedCanvas(sourceCanvas, background = [255, 255, 255]) {
    const context = sourceCanvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = sourceCanvas; const pixels = context.getImageData(0, 0, width, height).data;
    let left = width; let top = height; let right = -1; let bottom = -1; const tolerance = 10;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        if (pixels[offset + 3] < 16) continue;
        const differs = Math.max(Math.abs(pixels[offset] - background[0]), Math.abs(pixels[offset + 1] - background[1]), Math.abs(pixels[offset + 2] - background[2])) > tolerance;
        if (!differs) continue;
        left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    if (right < left || bottom < top) return sourceCanvas;
    const contentWidth = right - left + 1; const contentHeight = bottom - top + 1;
    const padX = Math.max(6, Math.round(contentWidth * 0.04)); const padY = Math.max(6, Math.round(contentHeight * 0.06));
    left = Math.max(0, left - padX); top = Math.max(0, top - padY); right = Math.min(width - 1, right + padX); bottom = Math.min(height - 1, bottom + padY);
    const result = document.createElement('canvas'); result.width = right - left + 1; result.height = bottom - top + 1;
    const resultContext = result.getContext('2d'); resultContext.fillStyle = '#ffffff'; resultContext.fillRect(0, 0, result.width, result.height); resultContext.drawImage(sourceCanvas, left, top, result.width, result.height, 0, 0, result.width, result.height);
    return result;
  }

  async function imageData(relativePath, background = '#ffffff', trim = false) {
    return new Promise((resolve, reject) => {
      const image = new Image(); image.decoding = 'async'; image.onload = () => {
        const max = 1000; const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale)); const context = canvas.getContext('2d'); context.fillStyle = background; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height); const output = trim ? trimmedCanvas(canvas) : canvas; resolve(output.toDataURL('image/jpeg', 0.88));
      }; image.onerror = reject; image.src = new URL(relativePath, window.location.href).href;
    });
  }

  async function pdfBlob() {
    await ensurePdfLibrary();
    if (!window.jspdf?.jsPDF) throw new Error('jsPDF no está disponible');
    const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true }); const width = 210; const height = 297; const margin = 15;
    const entries = selectedEntries(); const units = totalUnits(entries); const localized = entries.map((entry) => ({ ...entry, product: i18n.localizeProduct(entry.product) }));
    const [championLogo, innovaLogo, ...thumbs] = await Promise.all([imageData('./assets/images/brand/champion-header.png'), imageData('./assets/images/brand/innova-logo.png'), ...localized.map(({ product }) => imageData(`./${product.cover}`, '#ffffff', true).catch(() => null))]);
    const addContainedImage = (data, x, y, boxWidth, boxHeight) => {
      const properties = doc.getImageProperties(data); const sourceWidth = Number(properties.width) || boxWidth; const sourceHeight = Number(properties.height) || boxHeight;
      const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight); const drawWidth = sourceWidth * scale; const drawHeight = sourceHeight * scale;
      doc.addImage(data, 'JPEG', x + (boxWidth - drawWidth) / 2, y + (boxHeight - drawHeight) / 2, drawWidth, drawHeight);
    };
    const addHeader = () => { doc.setFillColor(248, 249, 252); doc.rect(0, 0, width, 29, 'F'); addContainedImage(championLogo, margin, 7, 65, 13); addContainedImage(innovaLogo, 154, 6, 40, 15); doc.setDrawColor(209, 18, 43); doc.setLineWidth(1.2); doc.line(0, 29, width, 29); };
    const addFooter = () => { doc.setDrawColor(224, 227, 235); doc.setLineWidth(0.3); doc.line(margin, height - 14, width - margin, height - 14); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(102, 112, 133); doc.text(`${state.orderNumber} · ${catalog.contact.email} · innova-eyewear.com`, margin, height - 8); };
    const sectionTitle = (text, y) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(28, 38, 89); doc.text(text, margin, y); doc.setDrawColor(28, 38, 89); doc.line(margin, y + 2, width - margin, y + 2); };
    addHeader(); doc.setTextColor(28, 38, 89); doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.text(tr('pdfTitle'), margin, 43); doc.setFontSize(9); doc.setTextColor(102, 112, 133); doc.text(`${tr('requestNumber')}: ${state.orderNumber}`, margin, 49); doc.text(`${tr('pdfFor')}: ${state.client.optical}`, margin, 54);
    sectionTitle(tr('clientData'), 65); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(31, 36, 50);
    const clientLines = [[tr('name'), state.client.name], [tr('company'), state.client.company], [tr('optical'), state.client.optical], [tr('email'), state.client.email], [tr('phone'), fullClientPhone()], [`${tr('city')} / ${tr('country')}`, `${state.client.city}, ${state.client.country}`]];
    clientLines.forEach(([label, value], index) => { const x = index % 2 === 0 ? margin : 108; const y = 72 + Math.floor(index / 2) * 10; doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(102, 112, 133); doc.text(`${label}:`, x, y); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(31, 36, 50); doc.text(doc.splitTextToSize(value, 78)[0] || '', x, y + 4.5); });
    sectionTitle(tr('summary'), 106); const summaryY = 114; const boxes = [[tr('totalReferences'), String(entries.length)], [tr('totalUnits'), String(units)], [tr('minimumLabel'), `${MINIMUM_UNITS}`]];
    boxes.forEach(([label, value], index) => { const x = margin + index * 45.2; doc.setFillColor(index === 2 ? 238 : 246, index === 2 ? 242 : 247, index === 2 ? 255 : 250); doc.roundedRect(x, summaryY, 41, 20, 2, 2, 'F'); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(102, 112, 133); doc.text(label, x + 3, summaryY + 6); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(28, 38, 89); doc.text(value, x + 3, summaryY + 15); });
    sectionTitle(tr('selection'), 141); let y = 148;
    localized.forEach(({ product, quantity }, index) => {
      if (y > 254) { addFooter(); doc.addPage(); addHeader(); sectionTitle(tr('selection'), 40); y = 47; }
      doc.setDrawColor(226, 229, 236); doc.setFillColor(252, 252, 253); doc.roundedRect(margin, y, width - margin * 2, 30, 2, 2, 'FD');
      if (thumbs[index]) addContainedImage(thumbs[index], margin + 2, y + 3, 38, 24);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(28, 38, 89); doc.text(product.displayModel, margin + 44, y + 8);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.4); doc.setTextColor(74, 85, 105); doc.text(`${tr('sku')}: ${product.sku}`, margin + 44, y + 14); doc.text(`${tr('color')}: ${doc.splitTextToSize(product.color, 62)[0]}`, margin + 44, y + 19); doc.text(`${tr('collection')}: ${product.collection}`, margin + 44, y + 24);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(28, 38, 89); doc.text(`${tr('quantity')}: ${quantity}`, width - margin - 31, y + 10); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(102, 112, 133); doc.text(doc.splitTextToSize(`${tr('material')}: ${product.material}`, 29), width - margin - 31, y + 16);
      y += 34;
    });
    if (state.client.notes) { if (y > 245) { addFooter(); doc.addPage(); addHeader(); y = 42; } sectionTitle(tr('notes'), y); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(74, 85, 105); doc.text(doc.splitTextToSize(state.client.notes, width - margin * 2), margin, y + 8); y += 24; }
    if (y > 250) { addFooter(); doc.addPage(); addHeader(); y = 43; }
    doc.setFillColor(255, 246, 247); doc.roundedRect(margin, y, width - margin * 2, 26, 2, 2, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(209, 18, 43); doc.text(tr('referenceTitle') || 'REFERENCE', margin + 4, y + 7); doc.setFont('helvetica', 'normal'); doc.setTextColor(74, 85, 105); doc.setFontSize(7.8); doc.text(doc.splitTextToSize(tr('finalNote'), width - margin * 2 - 8), margin + 4, y + 13);
    const pages = doc.getNumberOfPages(); for (let page = 1; page <= pages; page += 1) { doc.setPage(page); addFooter(); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(102, 112, 133); doc.text(`${tr('page')} ${page}/${pages}`, width - margin - 18, height - 8); }
    return doc.output('blob');
  }

  async function downloadPdf(announce = true) { if (!guardReady()) return null; try { const blob = await pdfBlob(); triggerDownload(blob, pdfFileName()); if (announce) showToast(tr('pdfDownloaded')); return blob; } catch (error) { console.error(error); showToast(tr('pdfUnavailable')); return null; } }

  function professionalMessage(attachmentKey) {
    const entries = selectedEntries(); const units = totalUnits(entries); const isEs = lang() === 'es'; const productLines = entries.map(({ product, quantity }) => { const localizedProduct = i18n.localizeProduct(product); return `• ${localizedProduct.displayModel} | ${localizedProduct.sku} | ${localizedProduct.color} | ${quantity} ${quantity === 1 ? tr('unit') : tr('units')}`; });
    const heading = isEs ? 'Hola, equipo de Innova Eyewear:' : 'Hello, Innova Eyewear team:';
    const requestLine = isEs ? `Deseo enviar este pedido Champion completo para revisión: ${entries.length} referencias y ${units} piezas.` : `I would like to send this complete Champion order for review: ${entries.length} references and ${units} pieces.`;
    const closing = isEs ? 'Quedo atento/a al contacto de Innova para revisar la óptica, confirmar disponibilidad, realizar el cobro y coordinar el envío. Entiendo que no se ofrece envío gratuito. Muchas gracias.' : 'I look forward to Innova contacting me to review the optical store, confirm availability, process payment and coordinate shipping. I understand that free shipping is not offered. Thank you.';
    const attachment = tr(attachmentKey, { pdf: pdfFileName(), csv: csvFileName() });
    return [heading, '', `${tr('requestNumber')}: ${state.orderNumber}`, '', tr('clientData'), `${tr('name')}: ${state.client.name}`, `${tr('company')}: ${state.client.company}`, `${tr('optical')}: ${state.client.optical}`, `${tr('email')}: ${state.client.email}`, `${tr('phone')}: ${fullClientPhone()}`, `${tr('city')}: ${state.client.city}`, `${tr('country')}: ${state.client.country}`, state.client.notes ? `${tr('notes')}: ${state.client.notes}` : '', '', tr('selection'), requestLine, ...productLines, '', attachment, '', closing].filter((line, index, lines) => line !== '' || lines[index - 1] !== '').join('\n');
  }

  async function sendWhatsApp() {
    if (!guardReady()) return; const popup = window.open('about:blank', '_blank'); const blob = await downloadPdf(false); if (!blob) { popup?.close(); return; }
    const url = `https://wa.me/${catalog.contact.whatsapp}?text=${encodeURIComponent(professionalMessage('attachmentPdf'))}`; if (popup) popup.location.href = url; else window.location.href = url; showToast(tr('filesPreparedWhatsapp'));
  }
  async function sendEmail() {
    if (!guardReady()) return; const blob = await downloadPdf(false); if (!blob) return; downloadCsv(); const subject = `${state.orderNumber} - Champion Eyewear - ${state.client.optical}`; const body = professionalMessage('attachmentEmail'); window.location.href = `mailto:${catalog.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; showToast(tr('filesPreparedEmail'));
  }
  async function copyRequest() { if (!guardReady()) return; try { await navigator.clipboard.writeText(professionalMessage('attachmentPdf')); showToast(tr('copied')); } catch (_error) { showToast(tr('copyFailed')); } }

  function mount() { saveState(); renderShell(); bindEvents(); i18n.onChange(renderShell); }
  window.ChampionRequest = { add, open: openDrawer, close: closeDrawer, count: () => selectedEntries().length, csvContent, readiness, constants: { minimumUnits: MINIMUM_UNITS } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
