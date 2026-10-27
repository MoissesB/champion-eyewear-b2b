(function () {
  'use strict';

  const section = document.getElementById('findOptics');
  const country = document.getElementById('opticsCountry');
  const city = document.getElementById('opticsCity');
  const link = document.getElementById('opticsMapLink');
  const status = document.getElementById('opticsSearchStatus');
  const i18n = window.ChampionI18n;
  if (!section || !country || !city || !link || !i18n) return;

  const countries = [
    'AG', 'AR', 'AW', 'BB', 'BM', 'BO', 'BQ', 'BR', 'BS', 'BZ', 'CA', 'CL', 'CO',
    'CR', 'CU', 'CW', 'DM', 'DO', 'EC', 'GD', 'GF', 'GP', 'GT', 'GY', 'HN', 'HT',
    'JM', 'KN', 'KY', 'LC', 'MQ', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SR', 'SV',
    'SX', 'TC', 'TT', 'US', 'UY', 'VC', 'VE', 'VG', 'VI',
  ];
  const copy = {
    es: {
      kicker: 'Para ti', title: 'Busca una óptica cerca de ti',
      intro: 'Elige tu país y ciudad para buscar ópticas en Google Maps. Pregunta directamente por el modelo y color Champion que estás viendo.',
      country: 'País o territorio', countryPlaceholder: 'Selecciona tu país', city: 'Ciudad o zona', cityPlaceholder: 'Escribe tu ciudad',
      action: 'Buscar ópticas en Google Maps', note: 'La búsqueda muestra ópticas generales. No confirma que vendan Champion ni que tengan este modelo disponible.',
      missing: 'Selecciona un país y escribe una ciudad o zona para buscar ópticas cercanas.',
    },
    en: {
      kicker: 'For you', title: 'Find optical stores near you',
      intro: 'Choose your country and city to search for optical stores on Google Maps. Ask the store about the Champion model and color shown on this page.',
      country: 'Country or territory', countryPlaceholder: 'Choose your country', city: 'City or area', cityPlaceholder: 'Enter your city',
      action: 'Search optical stores on Google Maps', note: 'This search shows general optical stores. It does not confirm Champion stock or availability of this model.',
      missing: 'Choose a country and enter a city or area to find nearby optical stores.',
    },
  };

  function language() { return i18n.language === 'en' ? 'en' : 'es'; }
  function countryName(code) {
    try { return new Intl.DisplayNames([language()], { type: 'region' }).of(code) || code; }
    catch (_error) { return code; }
  }
  function updateLink() {
    const place = city.value.trim();
    const code = country.value;
    const valid = Boolean(code && place);
    const query = `${language() === 'en' ? 'optical stores' : 'ópticas'} ${place}, ${countryName(code)}`;
    link.href = valid ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '#findOptics';
    if (valid) status.textContent = '';
  }
  function render() {
    const lang = language();
    const labels = copy[lang];
    section.querySelector('[data-optics-kicker]').textContent = labels.kicker;
    section.querySelector('[data-optics-title]').textContent = labels.title;
    section.querySelector('[data-optics-intro]').textContent = document.getElementById('productRoot')
      ? labels.intro
      : (lang === 'en'
        ? 'Choose your country and city to search for optical stores on Google Maps. Ask the store whether it carries Champion.'
        : 'Elige tu país y ciudad para buscar ópticas en Google Maps. Pregunta allí si trabajan con Champion.');
    section.querySelector('[data-optics-country-label]').textContent = labels.country;
    section.querySelector('[data-optics-city-label]').textContent = labels.city;
    section.querySelector('[data-optics-note]').textContent = document.getElementById('productRoot')
      ? labels.note
      : (lang === 'en'
        ? 'This search shows general optical stores. It does not confirm Champion stock or availability of a particular model.'
        : 'La búsqueda muestra ópticas generales. No confirma que vendan Champion ni la disponibilidad de un modelo concreto.');
    link.textContent = labels.action;
    city.placeholder = labels.cityPlaceholder;
    const selected = country.value;
    const sorted = countries.map((code) => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name, lang));
    country.replaceChildren(new Option(labels.countryPlaceholder, ''), ...sorted.map(({ code, name }) => new Option(name, code)));
    country.value = selected;
    updateLink();
  }

  document.addEventListener('click', (event) => {
    const control = event.target.closest('[data-find-optics-open]');
    if (!control) return;
    section.scrollIntoView({ block: 'start' });
    window.setTimeout(() => section.scrollIntoView({ block: 'start' }), 300);
  });
  country.addEventListener('change', updateLink);
  city.addEventListener('input', updateLink);
  link.addEventListener('click', (event) => {
    if (country.value && city.value.trim()) return;
    event.preventDefault();
    status.textContent = copy[language()].missing;
    (country.value ? city : country).focus();
  });

  render();
  i18n.onChange(render);
  if (window.location.hash === '#findOptics' || window.location.hash === '#productContact') {
    const reveal = () => section.scrollIntoView({ block: 'start' });
    const root = document.getElementById('productRoot');
    const observer = new MutationObserver(() => {
      if (!root?.querySelector('h1')) return;
      observer.disconnect();
      requestAnimationFrame(() => requestAnimationFrame(reveal));
    });
    if (root?.querySelector('h1')) requestAnimationFrame(reveal);
    else if (root) observer.observe(root, { childList: true });
    if (!root) {
      const grids = [document.getElementById('opticalGrid'), document.getElementById('sunGrid')].filter(Boolean);
      const afterCatalog = () => {
        if (!grids.length || !grids.every((grid) => grid.querySelector('.product-card'))) return;
        catalogObserver.disconnect();
        requestAnimationFrame(() => requestAnimationFrame(reveal));
      };
      const catalogObserver = new MutationObserver(afterCatalog);
      grids.forEach((grid) => catalogObserver.observe(grid, { childList: true, subtree: true }));
      afterCatalog();
    }
    const settle = () => window.setTimeout(reveal, 700);
    if (document.readyState === 'complete') settle();
    else window.addEventListener('load', settle, { once: true });
  }
})();
