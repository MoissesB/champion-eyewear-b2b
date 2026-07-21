(function () {
  'use strict';

  const catalog = window.CHAMPION_CATALOG;
  if (!catalog || !Array.isArray(catalog.products)) return;

  const STORAGE_KEY = 'champion-b2b-request-v2';
  const productMap = new Map(catalog.products.map((product) => [product.id, product]));
  const defaultClient = { name: '', company: '', email: '', phone: '', city: '', notes: '' };
  let toastTimer;
  let lastFocused;

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        items: parsed.items && typeof parsed.items === 'object' ? parsed.items : {},
        client: { ...defaultClient, ...(parsed.client || {}) },
      };
    } catch (_error) {
      return { items: {}, client: { ...defaultClient } };
    }
  }

  let state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function selectedEntries() {
    return Object.entries(state.items)
      .map(([id, quantity]) => ({ product: productMap.get(id), quantity: Math.max(1, Number(quantity) || 1) }))
      .filter((entry) => entry.product);
  }

  function showToast(message) {
    const toast = document.getElementById('siteToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function mount() {
    const portal = document.getElementById('requestPortal');
    if (!portal) return;
    portal.innerHTML = `
      <button class="request-fab" type="button" data-request-open aria-label="Abrir solicitud profesional B2B">
        Solicitud B2B <span data-request-count>0</span>
      </button>
      <div class="request-overlay" data-request-close></div>
      <aside class="request-drawer" id="requestDrawer" role="dialog" aria-modal="true" aria-labelledby="requestTitle" aria-hidden="true">
        <header class="request-drawer-header">
          <div>
            <span class="eyebrow">Selección profesional</span>
            <h2 id="requestTitle">Solicitud B2B</h2>
            <p>Referencias para cotización, disponibilidad y condiciones comerciales.</p>
          </div>
          <button class="drawer-close" type="button" data-request-close aria-label="Cerrar solicitud">×</button>
        </header>
        <div class="request-drawer-body">
          <div class="request-summary" id="requestSummary"></div>
          <div class="request-items" id="requestItems"></div>

          <form class="client-form" id="clientForm" novalidate>
            <h3>Datos del cliente profesional</h3>
            <p>Se incluirán automáticamente en el CSV y en el mensaje para Innova.</p>
            <div class="client-form-grid">
              <label class="field"><span>Nombre</span><input name="name" autocomplete="name" value="${escapeHtml(state.client.name)}" placeholder="Nombre y apellido"></label>
              <label class="field"><span>Empresa / Óptica</span><input name="company" autocomplete="organization" value="${escapeHtml(state.client.company)}" placeholder="Razón social"></label>
              <label class="field"><span>Correo profesional</span><input name="email" type="email" autocomplete="email" value="${escapeHtml(state.client.email)}" placeholder="nombre@empresa.com"></label>
              <label class="field"><span>Teléfono</span><input name="phone" autocomplete="tel" value="${escapeHtml(state.client.phone)}" placeholder="+1…"></label>
              <label class="field field-wide"><span>Ciudad / País</span><input name="city" autocomplete="address-level2" value="${escapeHtml(state.client.city)}" placeholder="Ciudad, país"></label>
              <label class="field field-wide"><span>Observaciones</span><textarea name="notes" placeholder="Disponibilidad requerida, surtido, fecha estimada…">${escapeHtml(state.client.notes)}</textarea></label>
            </div>
          </form>

          <div class="request-actions">
            <button class="action-primary" type="button" data-request-download>Descargar CSV</button>
            <button type="button" data-request-share>Compartir archivo</button>
            <button class="action-whatsapp" type="button" data-request-whatsapp>WhatsApp a Innova</button>
            <button type="button" data-request-email>Correo a Innova</button>
            <p class="request-note">“Compartir archivo” permite enviar el CSV como adjunto cuando el dispositivo lo admite. WhatsApp y correo preparan el mensaje y descargan el CSV para adjuntarlo.</p>
          </div>
        </div>
      </aside>`;

    bindEvents();
    render();
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const openButton = event.target.closest('[data-request-open]');
      if (openButton) {
        event.preventDefault();
        openDrawer(openButton);
        return;
      }

      const closeButton = event.target.closest('[data-request-close]');
      if (closeButton) {
        event.preventDefault();
        closeDrawer();
        return;
      }

      const addButton = event.target.closest('[data-request-add]');
      if (addButton) {
        event.preventDefault();
        const quantityTarget = addButton.dataset.quantityTarget;
        const quantityInput = quantityTarget ? document.getElementById(quantityTarget) : null;
        add(addButton.dataset.productId, quantityInput ? quantityInput.value : 1);
        return;
      }

      const removeButton = event.target.closest('[data-request-remove]');
      if (removeButton) {
        remove(removeButton.dataset.requestRemove);
        return;
      }

      if (event.target.closest('[data-request-download]')) downloadCsv();
      if (event.target.closest('[data-request-share]')) shareCsv();
      if (event.target.closest('[data-request-whatsapp]')) sendWhatsApp();
      if (event.target.closest('[data-request-email]')) sendEmail();
    });

    document.addEventListener('change', (event) => {
      const quantity = event.target.closest('[data-request-quantity]');
      if (quantity) updateQuantity(quantity.dataset.requestQuantity, quantity.value);
    });

    const form = document.getElementById('clientForm');
    if (form) {
      form.addEventListener('input', (event) => {
        if (!event.target.name || !(event.target.name in defaultClient)) return;
        state.client[event.target.name] = event.target.value;
        saveState();
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeDrawer();
    });
  }

  function openDrawer(trigger) {
    lastFocused = trigger || document.activeElement;
    document.body.classList.add('drawer-open');
    document.querySelector('.request-overlay')?.classList.add('is-open');
    const drawer = document.getElementById('requestDrawer');
    drawer?.classList.add('is-open');
    drawer?.setAttribute('aria-hidden', 'false');
    setTimeout(() => drawer?.querySelector('.drawer-close')?.focus(), 30);
  }

  function closeDrawer() {
    document.body.classList.remove('drawer-open');
    document.querySelector('.request-overlay')?.classList.remove('is-open');
    const drawer = document.getElementById('requestDrawer');
    drawer?.classList.remove('is-open');
    drawer?.setAttribute('aria-hidden', 'true');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function add(id, quantity = 1) {
    const product = productMap.get(id);
    if (!product) return;
    const requested = Math.max(1, Math.min(9999, Number(quantity) || 1));
    const existing = Number(state.items[id]) || 0;
    state.items[id] = existing > 0 ? existing + requested : requested;
    saveState();
    render();
    showToast(`${product.model} añadido a la solicitud B2B`);
  }

  function remove(id) {
    delete state.items[id];
    saveState();
    render();
  }

  function updateQuantity(id, quantity) {
    if (!productMap.has(id)) return;
    state.items[id] = Math.max(1, Math.min(9999, Number(quantity) || 1));
    saveState();
    render();
  }

  function render() {
    const entries = selectedEntries();
    const references = entries.length;
    const units = entries.reduce((sum, entry) => sum + entry.quantity, 0);

    document.querySelectorAll('[data-request-count]').forEach((node) => {
      node.textContent = String(references);
    });

    const summary = document.getElementById('requestSummary');
    if (summary) summary.innerHTML = `<span><strong>${references}</strong> referencia${references === 1 ? '' : 's'}</span><span><strong>${units}</strong> unidad${units === 1 ? '' : 'es'}</span>`;

    const items = document.getElementById('requestItems');
    if (items) {
      items.innerHTML = entries.length
        ? entries.map(({ product, quantity }) => `
            <article class="request-item">
              <img src="./${escapeHtml(product.cover)}" alt="${escapeHtml(product.model)}">
              <div><h3>${escapeHtml(product.model)}</h3><p>${escapeHtml(product.color)}</p><p>${escapeHtml(product.sku)}</p></div>
              <div class="request-item-controls">
                <label>Cantidad <input type="number" min="1" max="9999" value="${quantity}" data-request-quantity="${escapeHtml(product.id)}" aria-label="Cantidad de ${escapeHtml(product.model)}"></label>
                <button class="request-remove" type="button" data-request-remove="${escapeHtml(product.id)}">Quitar</button>
              </div>
            </article>`).join('')
        : '<div class="request-empty"><strong>Aún no hay referencias.</strong><br>Use “Añadir a solicitud” en cualquier producto.</div>';
    }

    document.querySelectorAll('[data-request-download], [data-request-share], [data-request-whatsapp], [data-request-email]').forEach((button) => {
      button.disabled = entries.length === 0;
    });
  }

  function csvEscape(value) {
    const text = String(value ?? '').replace(/\r?\n/g, ' ');
    return `"${text.replace(/"/g, '""')}"`;
  }

  function csvContent() {
    const headers = [
      'Fecha solicitud', 'Nombre contacto', 'Empresa / Óptica', 'Correo profesional', 'Teléfono', 'Ciudad / País',
      'Modelo', 'Familia', 'Colección', 'Variante', 'Color', 'Material', 'Forma', 'Tipo de lente', 'Protección UV',
      'Medidas', 'SKU', 'Cantidad', 'Estado de precio', 'Observaciones del cliente', 'Carpeta fuente'
    ];
    const date = new Date().toLocaleString('es-ES');
    const rows = selectedEntries().map(({ product, quantity }) => [
      date, state.client.name, state.client.company, state.client.email, state.client.phone, state.client.city,
      product.model, product.family === 'sun' ? 'Lentes de sol' : 'Montura óptica', product.collection, product.variant,
      product.color, product.material, product.shape, product.lens, product.protection, product.measurements, product.sku,
      quantity, 'A cotizar según volumen', state.client.notes, product.sourceFolder
    ]);
    return `\uFEFF${[headers, ...rows].map((row) => row.map(csvEscape).join(';')).join('\r\n')}`;
  }

  function csvBlob() {
    return new Blob([csvContent()], { type: 'text/csv;charset=utf-8' });
  }

  function fileName() {
    const stamp = new Date().toISOString().slice(0, 10);
    const company = (state.client.company || 'cliente').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `solicitud-b2b-champion-${company || 'cliente'}-${stamp}.csv`;
  }

  function downloadCsv(announce = true) {
    if (!selectedEntries().length) return;
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(csvBlob());
    link.href = objectUrl;
    link.download = fileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
    if (announce) showToast('CSV profesional descargado');
  }

  async function shareCsv() {
    if (!selectedEntries().length) return;
    const file = new File([csvBlob()], fileName(), { type: 'text/csv' });
    const shareData = {
      title: 'Solicitud B2B Champion Eyewear',
      text: professionalMessage(false),
      files: [file],
    };
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share(shareData);
        showToast('Solicitud compartida');
      } else {
        downloadCsv();
        showToast('El archivo quedó descargado para compartirlo');
      }
    } catch (error) {
      if (error && error.name !== 'AbortError') {
        downloadCsv();
        showToast('No se pudo compartir directamente; el CSV quedó descargado');
      }
    }
  }

  function professionalMessage(includeAttachmentNote = true) {
    const entries = selectedEntries();
    const units = entries.reduce((sum, entry) => sum + entry.quantity, 0);
    const lines = entries.slice(0, 18).map(({ product, quantity }) => `• ${product.model} — ${quantity} unidad${quantity === 1 ? '' : 'es'} — ${product.color}`);
    if (entries.length > 18) lines.push(`• …y ${entries.length - 18} referencias adicionales incluidas en el CSV.`);
    return [
      'Hola, equipo de Innova Eyewear:',
      '',
      `Mi nombre es ${state.client.name || '[nombre]'}. Escribo en representación de ${state.client.company || '[empresa / óptica]'}${state.client.city ? `, ubicada en ${state.client.city}` : ''}.`,
      '',
      `Deseo solicitar cotización, disponibilidad, mínimos de compra y condiciones comerciales para ${entries.length} referencias Champion (${units} unidades):`,
      ...lines,
      '',
      state.client.notes ? `Observaciones: ${state.client.notes}` : '',
      state.client.email ? `Correo de contacto: ${state.client.email}` : '',
      state.client.phone ? `Teléfono: ${state.client.phone}` : '',
      includeAttachmentNote ? 'He descargado el CSV detallado para adjuntarlo a esta conversación.' : '',
      '',
      'Quedo atento/a a su respuesta. Muchas gracias.'
    ].filter((line, index, array) => line !== '' || array[index - 1] !== '').join('\n');
  }

  function sendWhatsApp() {
    if (!selectedEntries().length) return;
    downloadCsv(false);
    const url = `https://wa.me/${catalog.contact.whatsapp}?text=${encodeURIComponent(professionalMessage(true))}`;
    window.open(url, '_blank', 'noopener');
    showToast('CSV descargado y mensaje de WhatsApp preparado');
  }

  function sendEmail() {
    if (!selectedEntries().length) return;
    downloadCsv(false);
    const company = state.client.company || 'cliente profesional';
    const subject = `Solicitud B2B Champion Eyewear — ${company}`;
    const body = `${professionalMessage(true)}\n\nArchivo: ${fileName()}`;
    window.location.href = `mailto:${catalog.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showToast('CSV descargado y correo profesional preparado');
  }

  window.ChampionRequest = {
    add,
    open: openDrawer,
    close: closeDrawer,
    count: () => selectedEntries().length,
    csvContent,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
