const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const origin = 'https://champion-innova.com';
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8')).products;
const escape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const slug = (language, family) => family === 'optical' ? (language === 'en' ? 'frames' : 'monturas')
  : (language === 'en' ? 'sunglasses' : 'lentes-sol');
const url = (language, audience, family) => `${origin}/${language}/${audience}/${slug(language, family)}/`;
const productUrl = (language, audience, id) => `${origin}/${language}/${audience}/modelos/${id}/`;
const jsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const translations = fs.readFileSync(path.join(root, 'assets/i18n.js'), 'utf8');
const colorMap = Object.fromEntries(['es', 'en'].map((language) => {
  const name = `${language}ValueMap`;
  const match = translations.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n  \\});`));
  if (!match) throw new Error(`Missing ${name} in assets/i18n.js`);
  return [language, vm.runInNewContext(`(${match[1]})`, Object.create(null))];
}));

for (const language of ['es', 'en']) for (const audience of ['b2c', 'b2b']) for (const family of ['optical', 'sun']) {
  const en = language === 'en';
  const personal = audience === 'b2c';
  const selection = products.filter((product) => product.family === family);
  const category = family === 'optical' ? (en ? 'optical frames' : 'monturas ópticas') : (en ? 'sunglasses' : 'gafas de sol');
  const title = en
    ? `Champion ${category} | ${personal ? 'Explore models' : 'Catalog for optical stores'}`
    : `${category[0].toUpperCase()}${category.slice(1)} Champion | ${personal ? 'Ver modelos' : 'Catálogo para ópticas'}`;
  const description = en
    ? `Explore ${selection.length} Champion ${category} and open each model and color. ${personal ? 'Ask a nearby optical store to confirm availability.' : 'Review references and prepare a professional order for Innova Eyewear.'}`
    : `Explora ${selection.length} referencias de ${category} Champion por modelo y color. ${personal ? 'Consulta su disponibilidad en una óptica cercana.' : 'Selecciona referencias y prepara un pedido para revisión de Innova Eyewear.'}`;
  const heading = en ? `Champion ${category}` : `${category[0].toUpperCase()}${category.slice(1)} Champion`;
  const sectionTitle = en ? `Explore ${selection.length} model and color references` : `Explora ${selection.length} referencias de modelo y color`;
  const note = personal
    ? (en ? 'This is an informational catalog. Confirm model and color availability with the optical store.' : 'Este catálogo es informativo. Confirma con la óptica la disponibilidad de cada modelo y color.')
    : (en ? 'Professional selections are reviewed by Innova Eyewear before confirmation.' : 'Innova Eyewear revisa la selección profesional antes de confirmarla.');
  const image = `${origin}/${selection[0].cover}`;
  const canonical = url(language, audience, family);
  const otherFamily = family === 'optical' ? 'sun' : 'optical';
  const cards = selection.map((product) => {
    const productLink = `/${language}/${audience}/modelos/${product.id}/`;
    const color = colorMap[language][product.color] || product.color;
    const specs = [product.collection, color, product.measurements].filter(Boolean).join(' · ');
    return `<article class="category-card"><a href="${productLink}" aria-label="${escape(product.displayModel)}"><img src="/${escape(product.cover)}" alt="${escape(product.displayModel)} Champion, ${escape(color)}" loading="lazy" decoding="async" width="420" height="315"><h3>${escape(product.displayModel)}</h3></a><p>${escape(specs)}</p><a href="${productLink}">${en ? 'View model details' : 'Ver ficha del modelo'}</a></article>`;
  }).join('\n');
  const schema = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${canonical}#page`, url: canonical,
      name: title, description, inLanguage: en ? 'en' : 'es-419', image,
      isPartOf: { '@type': 'WebSite', name: 'Champion Eyewear', url: origin } },
    { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: selection.map((product, index) => ({
      '@type': 'ListItem', position: index + 1, name: product.displayModel, url: productUrl(language, audience, product.id),
    })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: en ? 'Catalog' : 'Catálogo', item: `${origin}/${language}/${audience}/` },
      { '@type': 'ListItem', position: 2, name: heading, item: canonical },
    ] },
  ];
  const html = `<!doctype html>
<html lang="${en ? 'en' : 'es-419'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escape(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="es" href="${url('es', audience, family)}">
  <link rel="alternate" hreflang="en" href="${url('en', audience, family)}">
  <link rel="alternate" hreflang="x-default" href="${url('es', audience, family)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Champion Eyewear">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:alt" content="${escape(heading)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${image}">
  <title>${escape(title)}</title>
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="stylesheet" href="/assets/category.css?v=category-20261029-1">
  <script type="application/ld+json">${jsonLd(schema)}</script>
  <script defer src="/assets/analytics.min.js?v=analytics-20261029-1"></script>
  <script defer src="/assets/meta-pixel.min.js?v=meta-pixel-20261027"></script>
</head>
<body data-page="category" data-audience="${audience}">
  <a class="skip-link" href="#modelos">${en ? 'Skip to models' : 'Ir a los modelos'}</a>
  <header class="category-header"><a class="category-brand" href="/${language}/${audience}/"><img src="/assets/images/brand/champion-header-display.webp" alt="Champion Eyewear" width="190" height="46"></a><nav aria-label="${en ? 'Catalog navigation' : 'Navegación del catálogo'}"><a href="/${language}/${audience}/">${en ? 'Catalog home' : 'Inicio del catálogo'}</a><a href="/${language}/${audience}/${slug(language, otherFamily)}/">${family === 'optical' ? (en ? 'Sunglasses' : 'Gafas de sol') : (en ? 'Optical frames' : 'Monturas ópticas')}</a><a href="/${language === 'en' ? 'es' : 'en'}/${audience}/${slug(language === 'en' ? 'es' : 'en', family)}/" hreflang="${language === 'en' ? 'es' : 'en'}">${language === 'en' ? 'Español' : 'English'}</a></nav></header>
  <main id="modelos"><div class="category-intro"><nav class="category-crumb" aria-label="${en ? 'Breadcrumbs' : 'Migas de pan'}"><a href="/${language}/${audience}/">${en ? 'Catalog' : 'Catálogo'}</a><span>/</span>${escape(heading)}</nav><span class="category-kicker">Champion Eyewear · ${personal ? (en ? 'For you' : 'Para ti') : (en ? 'For optical stores' : 'Para ópticas')}</span><h1>${escape(heading)}</h1><p>${escape(description)}</p><p>${escape(note)}</p><a class="category-audience" href="/${language}/${personal ? 'b2b' : 'b2c'}/${slug(language, family)}/">${personal ? (en ? 'I run an optical store or distribute eyewear' : 'Tengo una óptica o distribuidora') : (en ? 'Explore models for myself' : 'Ver modelos para mí')}</a></div><section class="category-list" aria-labelledby="categoryListTitle"><h2 id="categoryListTitle">${escape(sectionTitle)}</h2><div class="category-grid">${cards}</div></section></main>
  <footer><a href="/${language}/${audience}/">Champion Eyewear · ${en ? 'Catalog' : 'Catálogo'}</a></footer>
</body>
</html>
`;
  const folder = path.join(root, language, audience, slug(language, family));
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'index.html'), html, 'utf8');
}
console.log('category-seo-ok (8 static category pages)');
