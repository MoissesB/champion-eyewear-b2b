const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const origin = 'https://champion-innova.com';
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8')).products;
const templates = {
  b2b: fs.readFileSync(path.join(root, 'product.html'), 'utf8'),
  b2c: fs.readFileSync(path.join(root, 'product-consumer.html'), 'utf8'),
};
const translationSource = fs.readFileSync(path.join(root, 'assets/i18n.js'), 'utf8');
function valueMap(name) {
  const match = translationSource.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n  \\});`));
  if (!match) throw new Error(`Missing ${name} in assets/i18n.js`);
  return vm.runInNewContext(`(${match[1]})`, Object.create(null));
}
const valueMaps = { es: valueMap('esValueMap'), en: valueMap('enValueMap') };
const localized = (value, language) => valueMaps[language][value] || value;

const htmlEscape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const jsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const urlFor = (language, profile, id) => `${origin}/${language}/${profile}/modelos/${encodeURIComponent(id)}/`;

function details(product, language, profile) {
  const en = language === 'en';
  const consumer = profile === 'b2c';
  const color = localized(product.color, language);
  const material = localized(product.material, language);
  const kind = en
    ? (product.family === 'sun' ? 'sunglasses' : 'optical frames')
    : (product.family === 'sun' ? 'gafas de sol' : 'montura óptica');
  const name = `${product.displayModel} · ${color}`;
  const title = en
    ? `${name} | Champion ${consumer ? kind : 'professional catalog'}`
    : `${name} | ${consumer ? kind : 'catálogo para ópticas'} Champion`;
  const features = [product.collection, material, product.measurements].filter(Boolean).join(' · ');
  const description = en
    ? `${product.displayModel} Champion ${kind}, color ${color}. ${features}. ${consumer ? 'View the model and ask an optical store about availability.' : 'View technical details and prepare an order for Innova review.'}`
    : `${product.displayModel}, ${kind} Champion en color ${color}. ${features}. ${consumer ? 'Explora el modelo y consulta su disponibilidad en una óptica.' : 'Consulta la ficha técnica y prepara un pedido para revisión de Innova.'}`;
  const image = product.family === 'optical' ? (product.images?.[0] || product.cover) : product.cover;
  const url = urlFor(language, profile, product.id);
  const home = `${origin}/${language}/${profile}/`;
  const categorySlug = product.family === 'sun' ? (en ? 'sunglasses' : 'lentes-sol') : (en ? 'frames' : 'monturas');
  const categoryUrl = `${home}${categorySlug}/`;
  const categoryLabel = product.family === 'sun' ? (en ? 'Sunglasses' : 'Gafas de sol') : (en ? 'Optical frames' : 'Monturas ópticas');
  const heading = en ? 'Model details' : 'Detalles del modelo';
  const labels = en
    ? ['Model', 'Reference', 'Collection', 'Color', 'Material', 'Measurements']
    : ['Modelo', 'Referencia', 'Colección', 'Color', 'Material', 'Medidas'];
  const values = [product.displayModel, product.sku, product.collection, color, material, product.measurements];
  const rows = values.map((value, index) => value
    ? `<div><dt>${labels[index]}</dt><dd>${htmlEscape(value)}</dd></div>` : '').join('');
  const note = consumer
    ? (en ? 'Ask an optical store in your country whether this Champion model and color are available.'
      : 'Consulta en una óptica de tu país si tienen disponible este modelo y color Champion.')
    : (en ? 'Optical stores and distributors can select this reference for an order reviewed by Innova Eyewear.'
      : 'Las ópticas y distribuidoras pueden seleccionar esta referencia para un pedido que revisará Innova Eyewear.');
  const action = consumer
    ? `<a class="button button-primary" href="#findOptics">${en ? 'Find nearby optical stores' : 'Buscar ópticas cercanas'}</a>`
    : `<a class="button button-primary" href="./${language}/b2b/#monturas">${en ? 'View professional catalog' : 'Ver catálogo profesional'}</a>`;
  const otherProfile = consumer ? 'b2b' : 'b2c';
  const switchLink = `<a href="./${language}/${otherProfile}/modelos/${product.id}/">${consumer
    ? (en ? 'For optical stores and distributors' : 'Para ópticas y distribuidoras')
    : (en ? 'View the personal catalog' : 'Ver el catálogo personal')}</a>`;
  const variants = products.filter((candidate) => candidate.series === product.series && candidate.id !== product.id);
  const variantLinks = variants.map((candidate) => `<a href="./${language}/${profile}/modelos/${candidate.id}/">${htmlEscape(candidate.displayModel)}</a>`).join(' · ');
  const variantsSection = variantLinks ? `<section><h2>${en ? 'Other color variants of this model' : 'Otras variantes de color de este modelo'}</h2><p>${variantLinks}</p></section>` : '';
  const staticBody = `<div class="product-media-column"><figure class="product-gallery"><img src="./${htmlEscape(image)}" alt="${htmlEscape(product.displayModel)} Champion, ${htmlEscape(color)}" fetchpriority="high" width="1200" height="900"></figure></div><div class="product-details"><nav class="breadcrumbs" aria-label="${en ? 'Breadcrumbs' : 'Migas de pan'}"><a href="./${language}/${profile}/">${en ? 'Catalog' : 'Catálogo'}</a><span>/</span><a href="./${language}/${profile}/${categorySlug}/">${categoryLabel}</a><span>/</span><strong>${htmlEscape(product.displayModel)}</strong></nav><span class="eyebrow">Champion ${htmlEscape(product.collection)}</span><h1>${htmlEscape(product.displayModel)}</h1><p class="product-subline">${htmlEscape(kind)} · ${htmlEscape(color)}</p><p>${htmlEscape(description)}</p><h2>${heading}</h2><dl class="spec-list">${rows}</dl><p>${htmlEscape(note)}</p>${action}<p>${switchLink}</p>${variantsSection}</div>`;
  const structured = [
    {
      '@context': 'https://schema.org', '@type': 'Product', '@id': `${url}#product`,
      name: product.displayModel, sku: product.sku, model: product.series,
      brand: { '@type': 'Brand', name: 'Champion' },
      description, image: [image, ...(product.images || [])].filter(Boolean)
        .filter((entry, index, array) => array.indexOf(entry) === index)
        .map((entry) => `${origin}/${entry}`),
      color, category: kind,
      ...(material ? { material } : {}),
      ...(product.measurements ? { size: product.measurements } : {}),
      url,
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: en ? 'Catalog' : 'Catálogo', item: home },
        { '@type': 'ListItem', position: 2, name: categoryLabel, item: categoryUrl },
        { '@type': 'ListItem', position: 3, name: product.displayModel, item: url },
      ],
    },
    {
      '@context': 'https://schema.org', '@type': 'WebPage', '@id': `${url}#page`, url,
      name: title, description, inLanguage: en ? 'en' : 'es-419',
      primaryImageOfPage: `${origin}/${image}`, mainEntity: { '@id': `${url}#product` },
      isPartOf: { '@type': 'WebSite', name: 'Champion Eyewear', url: origin },
    },
  ];
  return { title, description, image, color, url, staticBody, structured };
}

for (const language of ['es', 'en']) {
  for (const profile of ['b2b', 'b2c']) {
    for (const product of products) {
      const info = details(product, language, profile);
      const imageUrl = `${origin}/${info.image}`;
      const head = `  <base href="../../../../">\n  <meta name="robots" content="index, follow, max-image-preview:large">\n  <link rel="canonical" href="${info.url}">\n  <link rel="alternate" hreflang="es" href="${urlFor('es', profile, product.id)}">\n  <link rel="alternate" hreflang="en" href="${urlFor('en', profile, product.id)}">\n  <meta property="og:type" content="product">\n  <meta property="og:site_name" content="Champion Eyewear">\n  <meta property="og:url" content="${info.url}">\n  <meta property="og:title" content="${htmlEscape(info.title)}">\n  <meta property="og:description" content="${htmlEscape(info.description)}">\n  <meta property="og:image" content="${imageUrl}">\n  <meta property="og:image:alt" content="${htmlEscape(product.displayModel)} Champion, ${htmlEscape(info.color)}">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="${htmlEscape(info.title)}">\n  <meta name="twitter:description" content="${htmlEscape(info.description)}">\n  <meta name="twitter:image" content="${imageUrl}">\n  <link rel="preload" as="image" href="./${htmlEscape(info.image)}">\n  <script type="application/ld+json">${jsonLd(info.structured)}</script>\n`;
      let html = templates[profile]
        .replace('<html lang="es-419"', `<html lang="${language === 'en' ? 'en' : 'es-419'}"`)
        .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${htmlEscape(info.description)}">`)
        .replace(/<meta name="robots" content="noindex, follow" data-product-seo>/, '')
        .replace(/<title>[^<]*<\/title>/, `<title>${htmlEscape(info.title)}</title>`)
        .replace(/<script data-product-preload>[\s\S]*?<\/script>/, '')
        .replace('<head>', `<head>\n${head}`)
        .replace(/<body data-page="product"[^>]*>/, `<body data-page="product" data-audience="${profile}" data-product-id="${htmlEscape(product.id)}">`)
        .replace(/<section class="product-layout" id="productRoot" aria-live="polite">[\s\S]*?<\/section>/,
          `<section class="product-layout" id="productRoot" aria-live="polite">${info.staticBody}</section>`)
        .replace(/href="\.\/index\.html/g, `href="./${language}/${profile}/`)
        .replace(/href="#([a-zA-Z][a-zA-Z0-9-]*)"/g, `href="./${language}/${profile}/modelos/${product.id}/#$1"`);
      html = html.split(/\r?\n/).map((line) => line.trimEnd()).join('\n');
      if (!html.includes(`data-product-id="${product.id}"`) || !html.includes(`href="${info.url}"`)) {
        throw new Error(`Invalid generated product page: ${language}/${profile}/${product.id}`);
      }
      const folder = path.join(root, language, profile, 'modelos', product.id);
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'index.html'), html, 'utf8');
    }
  }
}
console.log(`product-seo-ok (${products.length * 4} static product pages)`);
