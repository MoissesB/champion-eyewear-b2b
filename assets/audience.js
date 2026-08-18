(function () {
  'use strict';

  const VERSION = 'audience-20260818-12';
  const PROFILE_KEY = 'champion-audience-profile-v1';
  const B2C_PROFILE_KEY = 'champion-b2c-profile-v1';
  const B2B_PROFILE_KEY = 'champion-b2b-profile-v1';
  const LEGACY_COUNTRY_CODES = {
    islas_britanicas: 'GB', jamaica: 'JM', surinam: 'SR', guyana: 'GY', trinidad_y_tobago: 'TT',
    costa_rica: 'CR', honduras: 'HN', el_salvador: 'SV', republica_dominicana: 'DO', colombia: 'CO', nicaragua: 'NI',
  };
  const REGION_NAME_OVERRIDES = { AC: 'Isla de Ascensión', TA: 'Tristán da Cunha', XK: 'Kosovo' };
  const REGION_DIALS = 'AC:247,AD:376,AE:971,AF:93,AG:1,AI:1,AL:355,AM:374,AO:244,AR:54,AS:1,AT:43,AU:61,AW:297,AX:358,AZ:994,BA:387,BB:1,BD:880,BE:32,BF:226,BG:359,BH:973,BI:257,BJ:229,BL:590,BM:1,BN:673,BO:591,BQ:599,BR:55,BS:1,BT:975,BW:267,BY:375,BZ:501,CA:1,CC:61,CD:243,CF:236,CG:242,CH:41,CI:225,CK:682,CL:56,CM:237,CN:86,CO:57,CR:506,CU:53,CV:238,CW:599,CX:61,CY:357,CZ:420,DE:49,DJ:253,DK:45,DM:1,DO:1,DZ:213,EC:593,EE:372,EG:20,EH:212,ER:291,ES:34,ET:251,FI:358,FJ:679,FK:500,FM:691,FO:298,FR:33,GA:241,GB:44,GD:1,GE:995,GF:594,GG:44,GH:233,GI:350,GL:299,GM:220,GN:224,GP:590,GQ:240,GR:30,GT:502,GU:1,GW:245,GY:592,HK:852,HN:504,HR:385,HT:509,HU:36,ID:62,IE:353,IL:972,IM:44,IN:91,IO:246,IQ:964,IR:98,IS:354,IT:39,JE:44,JM:1,JO:962,JP:81,KE:254,KG:996,KH:855,KI:686,KM:269,KN:1,KP:850,KR:82,KW:965,KY:1,KZ:7,LA:856,LB:961,LC:1,LI:423,LK:94,LR:231,LS:266,LT:370,LU:352,LV:371,LY:218,MA:212,MC:377,MD:373,ME:382,MF:590,MG:261,MH:692,MK:389,ML:223,MM:95,MN:976,MO:853,MP:1,MQ:596,MR:222,MS:1,MT:356,MU:230,MV:960,MW:265,MX:52,MY:60,MZ:258,NA:264,NC:687,NE:227,NF:672,NG:234,NI:505,NL:31,NO:47,NP:977,NR:674,NU:683,NZ:64,OM:968,PA:507,PE:51,PF:689,PG:675,PH:63,PK:92,PL:48,PM:508,PR:1,PS:970,PT:351,PW:680,PY:595,QA:974,RE:262,RO:40,RS:381,RU:7,RW:250,SA:966,SB:677,SC:248,SD:249,SE:46,SG:65,SH:290,SI:386,SJ:47,SK:421,SL:232,SM:378,SN:221,SO:252,SR:597,SS:211,ST:239,SV:503,SX:1,SY:963,SZ:268,TA:290,TC:1,TD:235,TG:228,TH:66,TJ:992,TK:690,TL:670,TM:993,TN:216,TO:676,TR:90,TT:1,TV:688,TW:886,TZ:255,UA:380,UG:256,US:1,UY:598,UZ:998,VA:39,VC:1,VE:58,VG:1,VI:1,VN:84,VU:678,WF:681,WS:685,XK:383,YE:967,YT:262,ZA:27,ZM:260,ZW:263'.split(',').map((entry) => {
    const [code, dial] = entry.split(':');
    return { code, dial: `+${dial}` };
  });
  const displayNamesEs = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['es'], { type: 'region' }) : null;
  const regionName = (code) => REGION_NAME_OVERRIDES[code] || displayNamesEs?.of(code) || code;
  const flagForRegion = (code) => String(code).replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
  const flagImageUrl = (code) => `https://flagcdn.com/24x18/${String(code).toLowerCase()}.png`;
  const flagMarkup = (code, emoji) => ['AC', 'TA'].includes(code)
    ? `<span class="audience-phone-flag-fallback" aria-hidden="true">${emoji}</span>`
    : `<img src="${flagImageUrl(code)}" alt="" width="24" height="18" loading="lazy" decoding="async">`;
  const COUNTRY_CODES = [...new Set([...REGION_DIALS.map(({ code }) => code), 'AQ', 'BV', 'GS', 'HM', 'UM'])];
  const COUNTRIES = COUNTRY_CODES.map((code) => [code, regionName(code)]).sort((a, b) => a[1].localeCompare(b[1], 'es'));
  const PHONE_PREFIXES = REGION_DIALS.map(({ code, dial }) => ({ code, dial, flag: flagForRegion(code), label: regionName(code) })).sort((a, b) => a.label.localeCompare(b.label, 'es'));
  const countryValues = new Set(COUNTRIES.map(([value]) => value));
  const phonePrefixValues = new Set(PHONE_PREFIXES.map(({ code }) => code));
  const B2C_PRODUCT_OPTIONS = ['Montura óptica', 'Lentes de sol', 'Un modelo específico', 'Aún no estoy seguro(a)'];
  const CONTACT_OPTIONS = ['WhatsApp', 'Llamada telefónica', 'Correo electrónico', 'Solo quiero ver opciones por ahora'];
  const INITIAL_PURCHASE_OPTIONS = ['Sí, mi óptica puede evaluar esta compra inicial', 'No puedo evaluarla ahora (cerrar formulario sin enviar)'];
  const USUAL_PRICE_OPTIONS = [
    'Más de US$200 (Champion puede complementar marcas más premium)',
    'US$150 a US$200 (Champion encaja como opción deportiva accesible)',
    'US$120 a US$150 (Champion encaja muy bien aquí)',
    'US$80 a US$120 (Champion podría aplicar según el mercado)',
    'Menos de US$80 (Champion no encaja aquí)',
  ];
  const FRAME_STYLE_OPTIONS = [
    'Deportivo masculino (Champion encaja muy bien)',
    'Casual urbano (Champion encaja muy bien)',
    'Uso diario / funcional (Champion puede encajar)',
    'Marcas reconocidas de precio medio (Champion puede encajar)',
    'Económico básico (Champion no encaja aquí)',
  ];
  const b2cProductValues = new Set(B2C_PRODUCT_OPTIONS);
  const contactValues = new Set(CONTACT_OPTIONS);
  const initialPurchaseValues = new Set(INITIAL_PURCHASE_OPTIONS);
  const usualPriceValues = new Set(USUAL_PRICE_OPTIONS);
  const frameStyleValues = new Set(FRAME_STYLE_OPTIONS);
  const currentScript = document.currentScript;
  const assetBase = currentScript?.src ? new URL('.', currentScript.src) : new URL('./assets/', window.location.href);
  const siteBase = new URL('../', assetBase);
  const modulePromises = new Map();
  let runtimeProfile = null;
  let modal;
  let pendingIntent;
  let pendingResolver;
  let lastFocused;
  let lockedSiblings = [];

  function readSession(key) {
    try { return sessionStorage.getItem(key); } catch (_error) { return null; }
  }

  function writeSession(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_error) { /* Session-only fallback stays in memory. */ }
  }

  function readB2CProfile() {
    try {
      const parsed = JSON.parse(readSession(B2C_PROFILE_KEY) || '{}');
      return {
        name: String(parsed.name || '').trim(),
        phone: String(parsed.phone || parsed.whatsapp || '').trim(),
        phoneCountryCode: String(parsed.phoneCountryCode || '').trim().toUpperCase(),
        city: String(parsed.city || '').trim(),
        countryOrigin: normalizeCountryCode(parsed.countryOrigin),
        productInterest: String(parsed.productInterest || '').trim(),
        contactPreference: String(parsed.contactPreference || '').trim(),
      };
    } catch (_error) {
      return { name: '', phone: '', phoneCountryCode: '', city: '', countryOrigin: '', productInterest: '', contactPreference: '' };
    }
  }

  function readB2BProfile() {
    try {
      const parsed = JSON.parse(readSession(B2B_PROFILE_KEY) || '{}');
      return {
        firstName: String(parsed.firstName || '').trim(),
        lastName: String(parsed.lastName || '').trim(),
        phone: String(parsed.phone || '').trim(),
        phoneCountryCode: String(parsed.phoneCountryCode || '').trim().toUpperCase(),
        email: String(parsed.email || '').trim(),
        countryOrigin: normalizeCountryCode(parsed.countryOrigin),
        city: String(parsed.city || '').trim(),
        initialPurchase: String(parsed.initialPurchase || '').trim(),
        usualPrice: String(parsed.usualPrice || '').trim(),
        frameStyle: String(parsed.frameStyle || '').trim(),
        company: String(parsed.company || '').trim(),
        postalAddress: String(parsed.postalAddress || '').trim(),
        consentContact: Boolean(parsed.consentContact),
        consentMarketing: Boolean(parsed.consentMarketing),
      };
    } catch (_error) {
      return { firstName: '', lastName: '', phone: '', phoneCountryCode: '', email: '', countryOrigin: '', city: '', initialPurchase: '', usualPrice: '', frameStyle: '', company: '', postalAddress: '', consentContact: false, consentMarketing: false };
    }
  }

  function phonePrefix(code) {
    return PHONE_PREFIXES.find((item) => item.code === String(code || '').toUpperCase()) || null;
  }

  function validPhoneWithPrefix(code, value) {
    const prefix = phonePrefix(code);
    if (!prefix) return false;
    const digits = `${prefix.dial}${String(value || '')}`.replace(/\D/g, '');
    const localDigits = String(value || '').replace(/\D/g, '');
    return localDigits.length >= 6 && digits.length >= 7 && digits.length <= 15;
  }

  function formattedPhone(code, value) {
    const prefix = phonePrefix(code);
    return `${prefix?.dial || ''} ${String(value || '').trim()}`.trim();
  }

  function validB2CProfile(profile = readB2CProfile()) {
    return profile.name.length >= 2
      && validPhoneWithPrefix(profile.phoneCountryCode, profile.phone)
      && profile.city.length >= 2
      && countryValues.has(profile.countryOrigin)
      && b2cProductValues.has(profile.productInterest)
      && contactValues.has(profile.contactPreference);
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function validB2BProfile(profile = readB2BProfile()) {
    return profile.firstName.length >= 2
      && profile.lastName.length >= 2
      && validPhoneWithPrefix(profile.phoneCountryCode, profile.phone)
      && validEmail(profile.email)
      && countryValues.has(profile.countryOrigin)
      && profile.city.length >= 2
      && profile.company.length >= 2
      && profile.postalAddress.length >= 4
      && profile.initialPurchase === INITIAL_PURCHASE_OPTIONS[0]
      && initialPurchaseValues.has(profile.initialPurchase)
      && usualPriceValues.has(profile.usualPrice)
      && frameStyleValues.has(profile.frameStyle);
  }

  function storedProfile() {
    const value = runtimeProfile || readSession(PROFILE_KEY);
    if (value === 'b2b' && validB2BProfile()) return value;
    if (value === 'b2c' && validB2CProfile()) return value;
    return null;
  }

  function isProductPage() {
    return /\/product\.html$/i.test(window.location.pathname);
  }

  function setDocumentProfile(profile) {
    document.documentElement.dataset.championAudience = profile || (isProductPage() ? 'pending' : 'unknown');
  }

  function setProfile(profile) {
    runtimeProfile = profile;
    writeSession(PROFILE_KEY, profile);
    setDocumentProfile(profile);
    window.dispatchEvent(new CustomEvent('champion:audience-change', { detail: { profile } }));
  }

  setDocumentProfile(storedProfile());

  function loadScript(key, relativePath, ready) {
    if (ready()) return Promise.resolve();
    if (modulePromises.has(key)) return modulePromises.get(key);
    const source = new URL(relativePath, siteBase).href;
    const promise = new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find((script) => script.src === source || script.dataset.championModule === key);
      if (existing) {
        if (ready()) { resolve(); return; }
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = `${source}?v=${VERSION}`;
      script.async = true;
      script.dataset.championModule = key;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    }).then(() => {
      if (!ready()) throw new Error(`No se pudo inicializar ${key}`);
    });
    modulePromises.set(key, promise);
    return promise;
  }

  function loadBase() {
    return Promise.all([
      loadScript('catalog', 'data/products.min.js', () => Boolean(window.CHAMPION_CATALOG)),
      loadScript('i18n', 'assets/i18n.min.js', () => Boolean(window.ChampionI18n)),
    ]);
  }

  function ensureController(profile = storedProfile()) {
    if (profile === 'b2b') {
      return loadBase().then(() => loadScript('request', 'assets/request.min.js', () => Boolean(window.ChampionRequest))).then(() => window.ChampionRequest);
    }
    if (profile === 'b2c') {
      return loadBase().then(() => loadScript('interest', 'assets/interest.min.js', () => Boolean(window.ChampionInterest))).then(() => window.ChampionInterest);
    }
    return Promise.resolve(null);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function normalizeSearch(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function normalizeCountryCode(value) {
    const raw = String(value || '').trim();
    const upper = raw.toUpperCase();
    if (countryValues.has(upper)) return upper;
    const legacy = LEGACY_COUNTRY_CODES[normalizeSearch(raw).replace(/\s+/g, '_')];
    if (legacy) return legacy;
    const normalized = normalizeSearch(raw);
    return COUNTRIES.find(([code, label]) => normalizeSearch(label) === normalized || normalizeSearch(displayNamesEs?.of(code)) === normalized)?.[0] || '';
  }

  function optionsMarkup(options, selected, placeholder) {
    return `<option value="">${escapeHtml(placeholder)}</option>${options.map((option) => `<option value="${escapeHtml(option)}"${selected === option ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('')}`;
  }

  function renderControlledSelect(name, label, options, selected, className = 'audience-field-wide') {
    return `<label class="${className}"><span>${escapeHtml(label)} *</span><select name="${name}" required>${optionsMarkup(options, selected, 'Selecciona una opción')}</select></label>`;
  }

  function countryLabel(value) {
    const code = normalizeCountryCode(value);
    return COUNTRIES.find(([countryValue]) => countryValue === code)?.[1] || '';
  }

  function renderCountryCombobox(prefix, selected, name = 'countryOrigin', label = 'País o región', className = 'audience-field-wide') {
    const selectedCode = normalizeCountryCode(selected);
    const inputId = `${prefix}CountrySearch`;
    const labelId = `${prefix}CountryLabel`;
    const listId = `${prefix}CountryListbox`;
    const options = COUNTRIES.map(([value, countryName], index) => `<button id="${prefix}CountryOption${index}" class="audience-country-option" type="button" role="option" aria-selected="${selectedCode === value ? 'true' : 'false'}" data-country-option data-country-value="${value}" data-country-label="${escapeHtml(countryName)}" data-country-search-text="${escapeHtml(`${countryName} ${value}`)}">${escapeHtml(countryName)}</button>`).join('');
    const controlledOptions = COUNTRIES.map(([value, countryName]) => `<option value="${value}"${selectedCode === value ? ' selected' : ''}>${escapeHtml(countryName)}</option>`).join('');
    return `<div class="audience-country ${escapeHtml(className)}">
      <label id="${labelId}" for="${inputId}">${escapeHtml(label)} *</label>
      <div class="audience-country-combobox">
        <input id="${inputId}" class="audience-country-search" type="search" role="combobox" aria-labelledby="${labelId}" aria-controls="${listId}" aria-expanded="false" aria-autocomplete="list" aria-required="true" placeholder="Buscar país o región..." autocomplete="off" value="${escapeHtml(countryLabel(selectedCode))}" data-country-search required>
        <button class="audience-combobox-toggle" type="button" data-country-toggle aria-label="Abrir o cerrar la lista de países o regiones" aria-controls="${listId}" aria-expanded="false"><span aria-hidden="true">⌄</span></button>
        <div id="${listId}" class="audience-country-listbox" role="listbox" aria-labelledby="${labelId}" hidden>${options}<p class="audience-country-empty" role="status" hidden>No se encontraron países o regiones.</p></div>
        <select class="audience-country-value" name="${escapeHtml(name)}" autocomplete="country-name" data-country-value hidden><option value=""></option>${controlledOptions}</select>
      </div>
    </div>`;
  }

  function phonePrefixDisplay(code) {
    const item = phonePrefix(code);
    return item ? `${item.flag} ${item.code} · ${item.dial}` : '';
  }

  function renderPhonePrefix(prefix, selectedCode, label = 'Prefijo internacional', integrated = false) {
    const inputId = `${prefix}PhonePrefixSearch`;
    const labelId = `${prefix}PhonePrefixLabel`;
    const listId = `${prefix}PhonePrefixListbox`;
    const selected = phonePrefix(selectedCode);
    const options = PHONE_PREFIXES.map((item, index) => `<button id="${prefix}PhonePrefixOption${index}" class="audience-phone-option" type="button" role="option" aria-selected="${selected?.code === item.code ? 'true' : 'false'}" data-phone-option data-phone-code="${item.code}" data-phone-dial="${item.dial}" data-phone-label="${escapeHtml(item.label)}" data-phone-search-text="${escapeHtml(`${item.label} ${item.code} ${item.dial}`)}"><span class="audience-phone-flag" aria-hidden="true">${flagMarkup(item.code, item.flag)}</span><span><strong>${item.code}</strong><small>${escapeHtml(item.label)}</small></span><b>${item.dial}</b></button>`).join('');
    const controlledOptions = PHONE_PREFIXES.map((item) => `<option value="${item.code}"${selected?.code === item.code ? ' selected' : ''}>${escapeHtml(`${item.label} ${item.dial}`)}</option>`).join('');
    const selectedDisplay = selected ? (integrated ? selected.dial : phonePrefixDisplay(selectedCode)) : '';
    return `<div class="audience-phone-prefix${integrated ? ' is-integrated' : ''}">
      ${integrated ? `<span class="sr-only" id="${labelId}">${escapeHtml(label)}</span>` : `<label id="${labelId}" for="${inputId}">${escapeHtml(label)} *</label>`}
      <div class="audience-phone-combobox">
        ${integrated ? `<span class="audience-phone-selected-flag" data-phone-selected-flag${selected ? '' : ' hidden'}>${selected ? flagMarkup(selected.code, selected.flag) : ''}</span>` : ''}
        <input id="${inputId}" class="audience-phone-search${integrated && selected ? ' has-selected-flag' : ''}" type="search" role="combobox" aria-labelledby="${labelId}" aria-controls="${listId}" aria-expanded="false" aria-autocomplete="list" aria-required="true" placeholder="Prefijo" autocomplete="off" value="${escapeHtml(selectedDisplay)}" data-phone-search required>
        <button class="audience-combobox-toggle" type="button" data-phone-toggle aria-label="Abrir o cerrar la lista de prefijos internacionales" aria-controls="${listId}" aria-expanded="false"><span aria-hidden="true">⌄</span></button>
        <div id="${listId}" class="audience-phone-listbox" role="listbox" aria-labelledby="${labelId}" hidden>${options}<p class="audience-phone-empty" role="status" hidden>No se encontraron países o prefijos.</p></div>
        <select class="audience-phone-value" name="phoneCountryCode" hidden><option value=""></option>${controlledOptions}</select>
      </div>
    </div>`;
  }

  function renderPhoneField(prefix, selectedCode, numberName, numberLabel, numberValue, helpId, className = 'audience-field-wide') {
    const selectedPrefix = phonePrefix(selectedCode);
    const phoneHelp = selectedPrefix ? `Prefijo ${selectedPrefix.dial} seleccionado.` : 'Selecciona primero el prefijo internacional.';
    const labelId = `${prefix}PhoneFieldLabel`;
    return `<div class="audience-phone-field ${escapeHtml(className)}">
      <label id="${labelId}" for="${prefix}PhoneNumber">${escapeHtml(numberLabel)} *</label>
      <div class="audience-phone-control">
        ${renderPhonePrefix(prefix, selectedCode, 'Seleccionar prefijo internacional', true)}
        <input id="${prefix}PhoneNumber" class="audience-phone-number-input" name="${numberName}" type="tel" autocomplete="tel-national" inputmode="tel" value="${escapeHtml(numberValue)}" placeholder="Número sin prefijo" aria-labelledby="${labelId}" aria-describedby="${helpId}" required>
      </div>
      <small id="${helpId}">${escapeHtml(phoneHelp)}</small>
    </div>`;
  }

  function mountModal() {
    if (modal) return modal;
    const portal = document.createElement('div');
    portal.id = 'audiencePortal';
    const b2cProfile = readB2CProfile();
    const b2bProfile = readB2BProfile();
    portal.innerHTML = `<div class="audience-overlay" data-audience-cancel></div>
      <section class="audience-dialog" role="dialog" aria-modal="true" aria-labelledby="audienceTitle" aria-describedby="audienceIntro" aria-hidden="true">
        <div class="audience-accent" aria-hidden="true"></div>
        <button class="audience-close" type="button" data-audience-cancel aria-label="Cerrar">×</button>
        <div class="audience-brand"><img src="${new URL('assets/images/brand/champion-header-display.webp', siteBase).href}" alt="Champion Eyewear" width="420" height="78"></div>
        <div class="audience-step" data-audience-step="choice">
          <span class="audience-kicker">Encuentra tu experiencia Champion</span>
          <h2 id="audienceTitle">¿Cómo quieres explorar este modelo?</h2>
          <p id="audienceIntro">Elige tu perfil para mostrarte la ficha y las acciones correctas.</p>
          <div class="audience-choice-grid">
            <button class="audience-choice audience-choice-b2c" type="button" data-audience-select="b2c"><span>Compra personal</span><strong>Quiero comprar lentes</strong><small>Guarda los modelos que te interesan y solicita orientación.</small></button>
            <button class="audience-choice audience-choice-b2b" type="button" data-audience-select="b2b"><span>Compra profesional</span><strong>Soy óptica o distribuidor</strong><small>Conserva el pedido comercial, cantidades y mínimo profesional.</small></button>
          </div>
        </div>
        <div class="audience-step" data-audience-step="b2c" hidden>
          <button class="audience-back" type="button" data-audience-back>← Volver</button>
          <span class="audience-kicker">Atención para comprador final</span>
          <h2>Cuéntanos qué modelo te interesa</h2>
          <p>Completa tus datos y las dos preferencias aprobadas. La información queda solo en esta sesión y no se envía a ningún sistema.</p>
          <form class="audience-form" id="audienceB2CForm" novalidate>
            <label><span>Nombre y apellido *</span><input name="name" type="text" autocomplete="name" minlength="2" value="${escapeHtml(b2cProfile.name)}" placeholder="Tu nombre" required></label>
            ${renderPhoneField('b2c', b2cProfile.phoneCountryCode, 'phone', 'Número telefónico', b2cProfile.phone, 'audiencePhoneHelpB2C')}
            <label class="audience-field-wide"><span>Ciudad *</span><input name="city" type="text" autocomplete="address-level2" minlength="2" value="${escapeHtml(b2cProfile.city)}" required></label>
            ${renderCountryCombobox('b2c', b2cProfile.countryOrigin)}
            ${renderControlledSelect('productInterest', '¿Qué producto o modelo Champion te interesa?', B2C_PRODUCT_OPTIONS, b2cProfile.productInterest)}
            ${renderControlledSelect('contactPreference', '¿Cómo prefieres continuar la atención?', CONTACT_OPTIONS, b2cProfile.contactPreference)}
            <p class="audience-form-status" data-audience-form-status role="alert" aria-live="polite"></p>
            <button class="audience-continue" type="submit" disabled>Continuar a la experiencia B2C</button>
          </form>
        </div>
        <div class="audience-step" data-audience-step="b2b" hidden>
          <button class="audience-back" type="button" data-audience-back>← Volver</button>
          <span class="audience-kicker">Solicitud comercial Champion</span>
          <h2>Cuéntanos sobre tu óptica</h2>
          <p>Completa los campos y preguntas del formulario comercial de referencia. El pedido profesional y su mínimo vigente de 24 piezas permanecen intactos.</p>
          <form class="audience-form audience-form-b2b" id="audienceB2BForm" novalidate>
            <label><span>Nombre *</span><input name="firstName" type="text" autocomplete="given-name" minlength="2" value="${escapeHtml(b2bProfile.firstName)}" required></label>
            <label><span>Apellidos *</span><input name="lastName" type="text" autocomplete="family-name" minlength="2" value="${escapeHtml(b2bProfile.lastName)}" required></label>
            ${renderPhoneField('b2b', b2bProfile.phoneCountryCode, 'phone', 'Número telefónico', b2bProfile.phone, 'audiencePhoneHelpB2B')}
            <label><span>Correo electrónico *</span><input name="email" type="email" autocomplete="email" value="${escapeHtml(b2bProfile.email)}" required></label>
            ${renderCountryCombobox('b2b', b2bProfile.countryOrigin)}
            <label class="audience-field-wide"><span>Ciudad *</span><input name="city" type="text" autocomplete="address-level2" minlength="2" value="${escapeHtml(b2bProfile.city)}" required></label>
            ${renderControlledSelect('initialPurchase', 'Para iniciar con Champion, el pedido mínimo vigente es de 24 piezas a US$60 promedio por pieza. ¿Su óptica puede evaluar esta compra inicial?', INITIAL_PURCHASE_OPTIONS, b2bProfile.initialPurchase)}
            ${renderControlledSelect('usualPrice', 'Precio que vende mejor', USUAL_PRICE_OPTIONS, b2bProfile.usualPrice)}
            ${renderControlledSelect('frameStyle', '¿Qué estilo de marcos tiene mayor salida en su óptica?', FRAME_STYLE_OPTIONS, b2bProfile.frameStyle)}
            <label class="audience-field-wide"><span>Nombre de la empresa *</span><input name="company" type="text" autocomplete="organization" minlength="2" value="${escapeHtml(b2bProfile.company)}" required></label>
            <label class="audience-field-wide"><span>Dirección postal *</span><input name="postalAddress" type="text" autocomplete="street-address" minlength="4" value="${escapeHtml(b2bProfile.postalAddress)}" required></label>
            <label class="audience-consent audience-field-wide"><input name="consentContact" type="checkbox"${b2bProfile.consentContact ? ' checked' : ''}><span>Acepto que Champion e Innova Eyewear me contacten por WhatsApp y mensajes de texto para dar seguimiento a esta solicitud. La frecuencia puede variar; pueden aplicarse tarifas. Responda STOP para dejar de recibir mensajes.</span></label>
            <label class="audience-consent audience-field-wide"><input name="consentMarketing" type="checkbox"${b2bProfile.consentMarketing ? ' checked' : ''}><span>Acepto recibir por WhatsApp información comercial, novedades y ofertas de Champion e Innova Eyewear. La frecuencia puede variar; pueden aplicarse tarifas. Responda STOP para dejar de recibir mensajes.</span></label>
            <p class="audience-form-status" data-audience-form-status role="alert" aria-live="polite"></p>
            <button class="audience-continue" type="submit" disabled>Continuar a la experiencia B2B</button>
          </form>
        </div>
      </section>`;
    document.body.appendChild(portal);
    modal = portal;
    portal.addEventListener('click', onModalClick);
    const form = portal.querySelector('#audienceB2CForm');
    form?.addEventListener('submit', onB2CSubmit);
    form?.addEventListener('input', updateB2CValidity);
    form?.addEventListener('change', updateB2CValidity);
    updateB2CValidity({ currentTarget: form });
    const b2bForm = portal.querySelector('#audienceB2BForm');
    b2bForm?.addEventListener('submit', onB2BSubmit);
    b2bForm?.addEventListener('input', updateB2BValidity);
    b2bForm?.addEventListener('change', updateB2BValidity);
    updateB2BValidity({ currentTarget: b2bForm });
    return modal;
  }

  function setStep(step) {
    mountModal().querySelectorAll('[data-audience-step]').forEach((node) => { node.hidden = node.dataset.audienceStep !== step; });
    const title = modal.querySelector(`[data-audience-step="${step}"] h2`);
    if (title) title.id = 'audienceTitle';
    const stepNode = modal.querySelector(`[data-audience-step="${step}"]`);
    window.setTimeout(() => (stepNode?.querySelector('.audience-form input, .audience-form select') || stepNode?.querySelector('[data-audience-select], button'))?.focus(), 20);
  }

  function lockBackground() {
    lockedSiblings = Array.from(document.body.children).filter((node) => node !== modal).map((node) => ({ node, inert: node.inert, ariaHidden: node.getAttribute('aria-hidden') }));
    lockedSiblings.forEach(({ node }) => { node.inert = true; node.setAttribute('aria-hidden', 'true'); });
  }

  function unlockBackground() {
    lockedSiblings.forEach(({ node, inert, ariaHidden }) => {
      node.inert = inert;
      if (ariaHidden === null) node.removeAttribute('aria-hidden'); else node.setAttribute('aria-hidden', ariaHidden);
    });
    lockedSiblings = [];
  }

  function openGate(intent = { type: 'choose-profile' }) {
    mountModal();
    pendingIntent = intent;
    lastFocused = intent.trigger || document.activeElement;
    setStep('choice');
    modal.classList.add('is-open');
    modal.querySelector('.audience-dialog')?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('audience-modal-open');
    lockBackground();
    return new Promise((resolve) => { pendingResolver = resolve; });
  }

  function closeGate(cancelled = false) {
    if (!modal?.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.querySelector('.audience-dialog')?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('audience-modal-open');
    unlockBackground();
    const intent = pendingIntent;
    pendingIntent = null;
    if (cancelled && intent?.required) {
      window.location.href = new URL('index.html', siteBase).href;
      return;
    }
    if (cancelled) pendingResolver?.(null);
    pendingResolver = null;
    lastFocused?.focus?.();
  }

  function completeChoice(profile) {
    const intent = pendingIntent;
    const resolve = pendingResolver;
    setProfile(profile);
    closeGate(false);
    resolve?.(profile);
    pendingResolver = null;
    if (!intent?.deferDispatch) dispatchIntent(intent, profile);
  }

  function countryParts(input) {
    const root = input?.closest('.audience-country');
    return {
      root,
      listbox: root?.querySelector('.audience-country-listbox'),
      select: root?.querySelector('select[data-country-value]'),
      empty: root?.querySelector('.audience-country-empty'),
    };
  }

  function visibleCountryOptions(input) {
    const { listbox } = countryParts(input);
    return listbox ? Array.from(listbox.querySelectorAll('[data-country-option]')).filter((option) => !option.hidden) : [];
  }

  function setActiveCountryOption(input, option) {
    const { listbox } = countryParts(input);
    listbox?.querySelectorAll('.is-active').forEach((node) => node.classList.remove('is-active'));
    if (!option) { input.removeAttribute('aria-activedescendant'); return; }
    option.classList.add('is-active');
    input.setAttribute('aria-activedescendant', option.id);
    option.scrollIntoView({ block: 'nearest' });
  }

  function openCountryList(input) {
    const { root, listbox } = countryParts(input);
    if (!listbox) return;
    listbox.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    root?.querySelector('[data-country-toggle]')?.setAttribute('aria-expanded', 'true');
    const selected = listbox.querySelector('[aria-selected="true"]');
    setActiveCountryOption(input, selected || visibleCountryOptions(input)[0]);
  }

  function closeCountryList(input) {
    const { root, listbox } = countryParts(input);
    if (listbox) listbox.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    root?.querySelector('[data-country-toggle]')?.setAttribute('aria-expanded', 'false');
    setActiveCountryOption(input, null);
  }

  function filterCountryOptions(input) {
    const query = normalizeSearch(input.value);
    const { listbox, select, empty } = countryParts(input);
    if (!listbox || !select) return;
    select.value = '';
    listbox.querySelectorAll('[data-country-option]').forEach((option) => {
      option.hidden = !normalizeSearch(option.dataset.countrySearchText || option.dataset.countryLabel).includes(query);
      option.setAttribute('aria-selected', 'false');
    });
    if (empty) empty.hidden = visibleCountryOptions(input).length > 0;
    input.setCustomValidity('Selecciona un país o región válido de la lista.');
    openCountryList(input);
    setActiveCountryOption(input, visibleCountryOptions(input)[0] || null);
    const form = input.closest('form');
    if (form?.id === 'audienceB2CForm') updateB2CValidity({ currentTarget: form });
    if (form?.id === 'audienceB2BForm') updateB2BValidity({ currentTarget: form });
  }

  function selectCountryOption(input, option) {
    const { listbox, select } = countryParts(input);
    if (!listbox || !select || !countryValues.has(option.dataset.countryValue)) return;
    input.value = option.dataset.countryLabel;
    select.value = option.dataset.countryValue;
    input.setCustomValidity('');
    listbox.querySelectorAll('[data-country-option]').forEach((node) => node.setAttribute('aria-selected', String(node === option)));
    closeCountryList(input);
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.focus();
    closeCountryList(input);
  }

  function validateCountry(form) {
    const input = form?.querySelector('[data-country-search]');
    if (!input) return true;
    const { select } = countryParts(input);
    const valid = countryValues.has(String(select?.value || ''));
    input.setCustomValidity(valid ? '' : 'Selecciona un país o región válido de la lista.');
    return valid;
  }

  function onCountryFocus(event) {
    const input = event.target.closest?.('[data-country-search]');
    if (input) openCountryList(input);
  }

  function onCountryClick(event) {
    const option = event.target.closest?.('[data-country-option]');
    if (option) {
      const input = option.closest('.audience-country')?.querySelector('[data-country-search]');
      if (input) selectCountryOption(input, option);
      return;
    }
    const toggle = event.target.closest?.('[data-country-toggle]');
    if (!toggle) return;
    const input = toggle.closest('.audience-country')?.querySelector('[data-country-search]');
    if (!input) return;
    if (input.getAttribute('aria-expanded') === 'true') closeCountryList(input); else { openCountryList(input); input.focus(); }
  }

  function onCountryInput(event) {
    const input = event.target.closest?.('[data-country-search]');
    if (input) filterCountryOptions(input);
  }

  function onCountryKeydown(event) {
    const toggle = event.target.closest?.('[data-country-toggle]');
    if (toggle && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const toggleInput = toggle.closest('.audience-country')?.querySelector('[data-country-search]');
      if (!toggleInput) return;
      if (toggleInput.getAttribute('aria-expanded') === 'true') closeCountryList(toggleInput); else { openCountryList(toggleInput); toggleInput.focus(); }
      return;
    }
    const input = event.target.closest?.('[data-country-search]');
    if (!input) return;
    const options = visibleCountryOptions(input);
    const currentIndex = options.findIndex((option) => option.classList.contains('is-active'));
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openCountryList(input);
      if (!options.length) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = currentIndex < 0 ? (direction > 0 ? 0 : options.length - 1) : (currentIndex + direction + options.length) % options.length;
      setActiveCountryOption(input, options[nextIndex]);
    } else if (event.key === 'Enter' && input.getAttribute('aria-expanded') === 'true') {
      const active = options.find((option) => option.classList.contains('is-active'));
      if (active) { event.preventDefault(); selectCountryOption(input, active); }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeCountryList(input);
    } else if (event.key === 'Tab') {
      closeCountryList(input);
    }
  }

  function phoneParts(input) {
    const root = input?.closest('.audience-phone-prefix');
    return {
      root,
      listbox: root?.querySelector('.audience-phone-listbox'),
      select: root?.querySelector('select[name="phoneCountryCode"]'),
      empty: root?.querySelector('.audience-phone-empty'),
    };
  }

  function updatePhoneHelp(input, dial = '') {
    const help = input?.closest('.audience-phone-field')?.querySelector(':scope > small');
    if (help) help.textContent = dial ? `Prefijo ${dial} seleccionado.` : 'Selecciona primero el prefijo internacional.';
  }

  function updateSelectedPhoneFlag(input, code = '') {
    const slot = input?.closest('.audience-phone-prefix')?.querySelector('[data-phone-selected-flag]');
    if (!slot) return;
    const prefix = phonePrefix(code);
    slot.innerHTML = prefix ? flagMarkup(prefix.code, prefix.flag) : '';
    slot.hidden = !prefix;
    input.classList.toggle('has-selected-flag', Boolean(prefix));
  }

  function visiblePhoneOptions(input) {
    const { listbox } = phoneParts(input);
    return listbox ? Array.from(listbox.querySelectorAll('[data-phone-option]')).filter((option) => !option.hidden) : [];
  }

  function setActivePhoneOption(input, option) {
    const { listbox } = phoneParts(input);
    listbox?.querySelectorAll('.is-active').forEach((node) => node.classList.remove('is-active'));
    if (!option) { input.removeAttribute('aria-activedescendant'); return; }
    option.classList.add('is-active');
    input.setAttribute('aria-activedescendant', option.id);
    option.scrollIntoView({ block: 'nearest' });
  }

  function openPhoneList(input) {
    const { root, listbox } = phoneParts(input);
    if (!listbox) return;
    listbox.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    root?.querySelector('[data-phone-toggle]')?.setAttribute('aria-expanded', 'true');
    const selected = listbox.querySelector('[aria-selected="true"]');
    setActivePhoneOption(input, selected || visiblePhoneOptions(input)[0]);
  }

  function closePhoneList(input) {
    const { root, listbox } = phoneParts(input);
    if (listbox) listbox.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    root?.querySelector('[data-phone-toggle]')?.setAttribute('aria-expanded', 'false');
    setActivePhoneOption(input, null);
  }

  function notifyPhoneChange(input) {
    const form = input.closest('form');
    if (form?.id === 'audienceB2CForm') updateB2CValidity({ currentTarget: form });
    if (form?.id === 'audienceB2BForm') updateB2BValidity({ currentTarget: form });
  }

  function filterPhoneOptions(input) {
    const query = normalizeSearch(input.value);
    const { listbox, select, empty } = phoneParts(input);
    if (!listbox || !select) return;
    select.value = '';
    updateSelectedPhoneFlag(input);
    updatePhoneHelp(input);
    select.dispatchEvent(new Event('input', { bubbles: true }));
    listbox.querySelectorAll('[data-phone-option]').forEach((option) => {
      option.hidden = !normalizeSearch(option.dataset.phoneSearchText).includes(query);
      option.setAttribute('aria-selected', 'false');
    });
    if (empty) empty.hidden = visiblePhoneOptions(input).length > 0;
    input.setCustomValidity('Selecciona un prefijo internacional válido de la lista.');
    openPhoneList(input);
    const visible = visiblePhoneOptions(input);
    const exact = visible.find((option) => normalizeSearch(option.dataset.phoneCode) === query || normalizeSearch(option.dataset.phoneDial) === query);
    setActivePhoneOption(input, exact || visible[0] || null);
    notifyPhoneChange(input);
  }

  function selectPhoneOption(input, option) {
    const { listbox, select } = phoneParts(input);
    if (!listbox || !select || !phonePrefixValues.has(option.dataset.phoneCode)) return;
    const integrated = Boolean(input.closest('.audience-phone-field'));
    input.value = integrated ? option.dataset.phoneDial : `${option.dataset.phoneCode} · ${option.dataset.phoneDial}`;
    select.value = option.dataset.phoneCode;
    updateSelectedPhoneFlag(input, option.dataset.phoneCode);
    updatePhoneHelp(input, option.dataset.phoneDial);
    input.setCustomValidity('');
    listbox.querySelectorAll('[data-phone-option]').forEach((node) => node.setAttribute('aria-selected', String(node === option)));
    closePhoneList(input);
    select.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    notifyPhoneChange(input);
    const numberInput = input.closest('.audience-phone-field')?.querySelector('input[type="tel"]');
    if (numberInput) numberInput.focus(); else input.focus();
    closePhoneList(input);
  }

  function validatePhonePrefix(form) {
    const input = form?.querySelector('[data-phone-search]');
    if (!input) return true;
    const { select } = phoneParts(input);
    const valid = phonePrefixValues.has(String(select?.value || ''));
    input.setCustomValidity(valid ? '' : 'Selecciona un prefijo internacional válido de la lista.');
    return valid;
  }

  function onPhoneClick(event) {
    const option = event.target.closest?.('[data-phone-option]');
    if (option) {
      const input = option.closest('.audience-phone-prefix')?.querySelector('[data-phone-search]');
      if (input) selectPhoneOption(input, option);
      return;
    }
    const toggle = event.target.closest?.('[data-phone-toggle]');
    if (toggle) {
      const input = toggle.closest('.audience-phone-prefix')?.querySelector('[data-phone-search]');
      if (!input) return;
      if (input.getAttribute('aria-expanded') === 'true') closePhoneList(input); else { openPhoneList(input); input.focus(); }
    }
  }

  function onPhoneFocus(event) {
    const input = event.target.closest?.('[data-phone-search]');
    if (input) { openPhoneList(input); input.select(); }
  }

  function onPhoneInput(event) {
    const input = event.target.closest?.('[data-phone-search]');
    if (input) filterPhoneOptions(input);
  }

  function onPhoneKeydown(event) {
    const toggle = event.target.closest?.('[data-phone-toggle]');
    if (toggle && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const toggleInput = toggle.closest('.audience-phone-prefix')?.querySelector('[data-phone-search]');
      if (!toggleInput) return;
      if (toggleInput.getAttribute('aria-expanded') === 'true') closePhoneList(toggleInput); else { openPhoneList(toggleInput); toggleInput.focus(); }
      return;
    }
    const input = event.target.closest?.('[data-phone-search]');
    if (!input) return;
    const options = visiblePhoneOptions(input);
    const currentIndex = options.findIndex((option) => option.classList.contains('is-active'));
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openPhoneList(input);
      if (!options.length) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = currentIndex < 0 ? (direction > 0 ? 0 : options.length - 1) : (currentIndex + direction + options.length) % options.length;
      setActivePhoneOption(input, options[nextIndex]);
    } else if (event.key === 'Enter' && input.getAttribute('aria-expanded') === 'true') {
      const active = options.find((option) => option.classList.contains('is-active'));
      if (active) { event.preventDefault(); selectPhoneOption(input, active); }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closePhoneList(input);
    } else if (event.key === 'Tab') {
      closePhoneList(input);
    }
  }

  function onModalClick(event) {
    const select = event.target.closest('[data-audience-select]');
    if (select) {
      if (select.dataset.audienceSelect === 'b2c') setStep('b2c');
      else setStep('b2b');
      return;
    }
    if (event.target.closest('[data-audience-back]')) { setStep('choice'); return; }
    if (event.target.closest('[data-audience-cancel]')) closeGate(true);
  }

  function onB2CSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const profile = {
      name: String(fields.get('name') || '').trim(),
      phone: String(fields.get('phone') || '').trim(),
      phoneCountryCode: String(fields.get('phoneCountryCode') || '').trim().toUpperCase(),
      city: String(fields.get('city') || '').trim(),
      countryOrigin: String(fields.get('countryOrigin') || '').trim(),
      productInterest: String(fields.get('productInterest') || '').trim(),
      contactPreference: String(fields.get('contactPreference') || '').trim(),
    };
    const status = form.querySelector('[data-audience-form-status]');
    form.querySelector('[name="phone"]')?.setCustomValidity(validPhoneWithPrefix(profile.phoneCountryCode, profile.phone) ? '' : 'Escribe un número válido después del prefijo.');
    const phonePrefixValid = validatePhonePrefix(form);
    const countryValid = validateCountry(form);
    if (!phonePrefixValid || !countryValid || !form.checkValidity() || !validB2CProfile(profile)) {
      if (status) status.textContent = 'Completa nombre, prefijo, número telefónico, ciudad, país o región y las dos preferencias.';
      form.reportValidity();
      return;
    }
    if (status) status.textContent = '';
    writeSession(B2C_PROFILE_KEY, JSON.stringify(profile));
    completeChoice('b2c');
  }

  function updateB2CValidity(event) {
    const form = event?.currentTarget;
    if (!form) return;
    const name = form.querySelector('[name="name"]');
    const phone = form.querySelector('[name="phone"]');
    const phoneCountryCode = form.querySelector('[name="phoneCountryCode"]');
    const city = form.querySelector('[name="city"]');
    const country = form.querySelector('[name="countryOrigin"]');
    const productInterest = form.querySelector('[name="productInterest"]');
    const contactPreference = form.querySelector('[name="contactPreference"]');
    const phoneValid = validPhoneWithPrefix(phoneCountryCode?.value, phone?.value);
    phone?.setCustomValidity(phoneValid || !phone?.value ? '' : 'Escribe un número válido después del prefijo.');
    const complete = String(name?.value || '').trim().length >= 2
      && phoneValid
      && phonePrefixValues.has(String(phoneCountryCode?.value || ''))
      && String(city?.value || '').trim().length >= 2
      && countryValues.has(String(country?.value || ''))
      && b2cProductValues.has(String(productInterest?.value || ''))
      && contactValues.has(String(contactPreference?.value || ''));
    const button = form.querySelector('.audience-continue');
    if (button) button.disabled = !complete;
    if (complete) {
      const status = form.querySelector('[data-audience-form-status]');
      if (status) status.textContent = '';
    }
  }

  function onB2BSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const profile = {
      firstName: String(fields.get('firstName') || '').trim(),
      lastName: String(fields.get('lastName') || '').trim(),
      phone: String(fields.get('phone') || '').trim(),
      phoneCountryCode: String(fields.get('phoneCountryCode') || '').trim().toUpperCase(),
      email: String(fields.get('email') || '').trim(),
      countryOrigin: String(fields.get('countryOrigin') || '').trim(),
      city: String(fields.get('city') || '').trim(),
      initialPurchase: String(fields.get('initialPurchase') || '').trim(),
      usualPrice: String(fields.get('usualPrice') || '').trim(),
      frameStyle: String(fields.get('frameStyle') || '').trim(),
      company: String(fields.get('company') || '').trim(),
      postalAddress: String(fields.get('postalAddress') || '').trim(),
      consentContact: fields.get('consentContact') === 'on',
      consentMarketing: fields.get('consentMarketing') === 'on',
    };
    const status = form.querySelector('[data-audience-form-status]');
    form.querySelector('[name="phone"]')?.setCustomValidity(validPhoneWithPrefix(profile.phoneCountryCode, profile.phone) ? '' : 'Escribe un número válido después del prefijo.');
    form.querySelector('[name="email"]')?.setCustomValidity(validEmail(profile.email) ? '' : 'Escribe un correo electrónico válido.');
    const phonePrefixValid = validatePhonePrefix(form);
    const countryValid = validateCountry(form);
    if (profile.initialPurchase === INITIAL_PURCHASE_OPTIONS[1]) {
      if (status) status.textContent = 'La compra inicial vigente es de 24 piezas. Esta ruta no continúa si la óptica no puede evaluarla ahora.';
      return;
    }
    if (!phonePrefixValid || !countryValid || !form.checkValidity() || !validB2BProfile(profile)) {
      if (status) status.textContent = 'Completa todos los campos obligatorios y selecciona opciones válidas para continuar.';
      form.reportValidity();
      return;
    }
    if (status) status.textContent = '';
    writeSession(B2B_PROFILE_KEY, JSON.stringify(profile));
    completeChoice('b2b');
  }

  function updateB2BValidity(event) {
    const form = event?.currentTarget;
    if (!form) return;
    const profile = Object.fromEntries(new FormData(form).entries());
    profile.consentContact = form.querySelector('[name="consentContact"]')?.checked || false;
    profile.consentMarketing = form.querySelector('[name="consentMarketing"]')?.checked || false;
    const phone = form.querySelector('[name="phone"]');
    const phoneCountryCode = form.querySelector('[name="phoneCountryCode"]');
    const email = form.querySelector('[name="email"]');
    phone?.setCustomValidity(validPhoneWithPrefix(phoneCountryCode?.value, phone?.value) || !phone?.value ? '' : 'Escribe un número válido después del prefijo.');
    email?.setCustomValidity(validEmail(email?.value) || !email?.value ? '' : 'Escribe un correo electrónico válido.');
    const complete = validB2BProfile({
      firstName: String(profile.firstName || '').trim(),
      lastName: String(profile.lastName || '').trim(),
      phone: String(profile.phone || '').trim(),
      phoneCountryCode: String(profile.phoneCountryCode || '').trim().toUpperCase(),
      email: String(profile.email || '').trim(),
      countryOrigin: String(profile.countryOrigin || '').trim(),
      city: String(profile.city || '').trim(),
      initialPurchase: String(profile.initialPurchase || '').trim(),
      usualPrice: String(profile.usualPrice || '').trim(),
      frameStyle: String(profile.frameStyle || '').trim(),
      company: String(profile.company || '').trim(),
      postalAddress: String(profile.postalAddress || '').trim(),
      consentContact: Boolean(profile.consentContact),
      consentMarketing: Boolean(profile.consentMarketing),
    });
    const button = form.querySelector('.audience-continue');
    if (button) button.disabled = !complete;
    const status = form.querySelector('[data-audience-form-status]');
    if (status) {
      status.textContent = profile.initialPurchase === INITIAL_PURCHASE_OPTIONS[1]
        ? 'La compra inicial vigente es de 24 piezas. Esta ruta no continúa si la óptica no puede evaluarla ahora.'
        : '';
    }
  }

  function intentFromTarget(target) {
    const productLink = target.closest('a[href*="product.html?id="]');
    if (productLink) return { type: 'view-product', targetUrl: productLink.href, trigger: productLink };
    const add = target.closest('[data-request-add], [data-interest-add]');
    if (add) {
      const quantityInput = add.dataset.quantityTarget ? document.getElementById(add.dataset.quantityTarget) : null;
      return { type: 'add-product', productId: add.dataset.productId, quantity: quantityInput?.value || 1, trigger: add };
    }
    const open = target.closest('[data-request-open], [data-interest-open]');
    if (open) return { type: 'open-selection', trigger: open };
    const change = target.closest('[data-audience-change]');
    if (change) return { type: 'change-profile', trigger: change };
    return null;
  }

  async function dispatchIntent(intent, profile = storedProfile()) {
    if (!intent || !profile) return;
    if (intent.type === 'view-product') { window.location.href = intent.targetUrl; return; }
    if (intent.type === 'switch-profile') { window.location.reload(); return; }
    try {
      const controller = await ensureController(profile);
      if (!controller) return;
      if (intent.type === 'add-product') controller.add(intent.productId, profile === 'b2b' ? intent.quantity : undefined);
      if (intent.type === 'open-selection') controller.open(intent.trigger);
    } catch (_error) {
      document.getElementById('siteToast')?.replaceChildren(document.createTextNode('No se pudo abrir esta experiencia. Inténtalo de nuevo.'));
    }
  }

  function captureAction(event) {
    const intent = intentFromTarget(event.target);
    if (!intent) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const profile = storedProfile();
    if (intent.type === 'change-profile') { openGate({ type: 'switch-profile', trigger: intent.trigger }); return; }
    if (!profile) { openGate(intent); return; }
    dispatchIntent(intent, profile);
  }

  function guard(intent = {}) {
    const profile = storedProfile();
    if (profile) return Promise.resolve(profile);
    return openGate({ ...intent, deferDispatch: true });
  }

  function editB2CProfile(trigger) {
    pendingIntent = { type: 'edit-b2c-profile', trigger, deferDispatch: true };
    lastFocused = trigger || document.activeElement;
    mountModal();
    setStep('b2c');
    modal.classList.add('is-open');
    modal.querySelector('.audience-dialog')?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('audience-modal-open');
    lockBackground();
  }

  document.addEventListener('click', onCountryClick, true);
  document.addEventListener('focusin', onCountryFocus, true);
  document.addEventListener('input', onCountryInput, true);
  document.addEventListener('keydown', onCountryKeydown, true);
  document.addEventListener('click', onPhoneClick, true);
  document.addEventListener('focusin', onPhoneFocus, true);
  document.addEventListener('input', onPhoneInput, true);
  document.addEventListener('keydown', onPhoneKeydown, true);
  document.addEventListener('click', captureAction, true);
  document.addEventListener('keydown', (event) => {
    if (!modal?.classList.contains('is-open')) return;
    if (event.key === 'Escape') { event.preventDefault(); closeGate(true); return; }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(modal.querySelectorAll('button:not([hidden]), input:not([hidden]), select:not([hidden]):not([aria-hidden="true"])')).filter((node) => !node.disabled && node.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountModal, { once: true }); else mountModal();

  window.ChampionAudience = {
    countries: COUNTRIES.map(([value, label]) => ({ value, label })),
    phonePrefixes: PHONE_PREFIXES.map(({ code, flag, label, dial }) => ({ code, flag, label, dial })),
    getProfile: storedProfile,
    getB2CProfile: readB2CProfile,
    getB2BProfile: readB2BProfile,
    guard,
    open: openGate,
    close: closeGate,
    ensureController,
    loadBase,
    dispatchIntent,
    editB2CProfile,
    renderPhonePrefix,
    renderPhoneField,
    renderCountryCombobox,
    normalizeCountryCode,
    phonePrefixDisplay,
    validPhoneWithPrefix,
    formattedPhone,
  };
})();
