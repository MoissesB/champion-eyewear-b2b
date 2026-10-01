const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'catalog-experience.html'), 'utf8');
const origin = 'https://champion-innova.com';

for (const language of ['es', 'en']) {
  for (const profile of ['b2b', 'b2c']) {
    const route = `/${language}/${profile}/`;
    const folder = path.join(root, language, profile);
    const english = language === 'en';
    const personal = profile === 'b2c';
    let html = template
      .replace('<html lang="es-419">', `<html lang="${english ? 'en' : 'es-419'}" data-champion-route-profile="${profile}">`)
      .replace('<body data-page="home">', `<body data-page="home" data-audience="${profile}">`)
      .replace('<link rel="canonical" href="https://champion-innova.com/">', `<link rel="canonical" href="${origin}${route}">`)
      .replace(/="\.\//g, '="../../')
      .replace('</head>', `  <link rel="stylesheet" href="../../assets/experience.css?v=home-gate-20261001-1">\n  <script>try{localStorage.setItem('champion-language-v1','${language}')}catch(_error){}</script>\n  <script defer src="../../assets/experience-route.js?v=home-gate-20261001-1"></script>\n</head>`);
    html = html
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${personal ? (english ? 'Explore Champion frames and sunglasses. Ask at a nearby optical store in your country and check model and color availability there.' : 'Explora monturas y gafas de sol Champion. Consulta en una óptica cercana en tu país y confirma allí la disponibilidad de cada modelo y color.') : (english ? 'Champion professional eyewear catalog for optical stores and distributors. Prepare an order for review.' : 'Catálogo profesional Champion para ópticas y distribuidores. Prepare una selección para revisión.')}">`)
      .replace(/<title>[^<]*<\/title>/, `<title>Champion Eyewear | ${personal ? (english ? 'Personal experience' : 'Experiencia personal') : (english ? 'Professional catalog' : 'Catálogo profesional')}</title>`);

    if (personal) {
      const heroKicker = english ? 'Champion Eyewear · For you' : 'Champion Eyewear · Para ti';
      const heroTitle = english ? 'Find your next<br>Champion frames' : 'Encuentra tus próximas<br>monturas Champion';
      const heroText = english
        ? 'Explore optical frames and sunglasses, then ask at a nearby optical store in your country about Champion. Confirm model and color availability directly with the store.'
        : 'Explora monturas y gafas de sol Champion. Luego consulta en una óptica cercana en tu país y confirma directamente allí la disponibilidad del modelo y color.';
      html = html
        .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${english ? 'Champion Eyewear | Explore frames and sunglasses' : 'Champion Eyewear | Explora monturas y gafas de sol'}">`)
        .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${english ? 'Explore Champion styles and ask at a nearby optical store in your country. Check availability there.' : 'Explora modelos Champion y consulta en una óptica cercana en tu país. Confirma allí la disponibilidad.'}">`)
        .replace(/\n    <section class="section (?:benefits-section|reference-section|process-section|faq-section)"[\s\S]*?\n    <\/section>/g, '')
        .replace(/<a href="#beneficios"[^>]*>[\s\S]*?<\/a>/g, '')
        .replace(/<a href="#faq"[^>]*>[\s\S]*?<\/a>/g, '')
        .replace(/<a href="\.\.\/\.\.\/catalogo\.html"[^>]*>[\s\S]*?<\/a>/g, '')
        .replace(/\s*<span><strong>PDF<\/strong> <span data-i18n="heroPdfFact">[^<]*<\/span><\/span>/, '')
        .replace(/<button\b(?=[^>]*data-request-open)[^>]*>[\s\S]*?<\/button>/g, '')
        .replace(/<strong data-i18n="footerService">Pedidos para ópticas<\/strong>/, `<strong>${english ? 'Where to find Champion' : 'Dónde encontrar Champion'}</strong>`)
        .replace(/<span data-i18n="sunAvailable">[\s\S]*?<\/span>/, `<span>${english ? 'models to explore' : 'modelos para explorar'}</span>`)
        .replace(/<p data-i18n="opticalIntro">[\s\S]*?<\/p>/, `<p>${english ? 'Explore styles by model, color, material or size. Open a product page to view images and details.' : 'Explora por modelo, color, material o medida. Abre cada ficha para ver imágenes y detalles.'}</p>`)
        .replace(/<h2 data-i18n="sunTitle">[\s\S]*?<\/h2>/, `<h2>${english ? 'Champion sunglasses for your style' : 'Gafas de sol Champion para tu estilo'}</h2>`)
        .replace(/<p data-i18n="sunIntro">[\s\S]*?<\/p>/, `<p>${english ? 'Explore Champion sunglasses, from urban silhouettes to wraparound sports styles.' : 'Explora las gafas de sol Champion, desde siluetas urbanas hasta modelos deportivos envolventes.'}</p>`)
        .replace(/<p data-i18n="footerText">[\s\S]*?<\/p>/, `<p>${english ? 'Explore Champion Eyewear with Innova.' : 'Descubre Champion Eyewear con Innova.'}</p>`)
        .replace(/<a href="mailto:sales@innova-eyewear.com">sales@innova-eyewear.com<\/a>/, `<span>${english ? 'Ask a nearby optical store about Champion.' : 'Consulta en una óptica cercana por Champion.'}</span>`)
        .replace(/<span class="eyebrow eyebrow-light" data-i18n="heroKicker">[\s\S]*?<\/span>/, `<span class="eyebrow eyebrow-light">${heroKicker}</span>`)
        .replace(/<h1 id="heroTitle" data-i18n="heroTitle" data-i18n-html="true">[\s\S]*?<\/h1>/, `<h1 id="heroTitle">${heroTitle}</h1>`)
        .replace(/<p data-i18n="heroText">[\s\S]*?<\/p>/, `<p>${heroText}</p>`)
        .replace(/<section class="commercial-cta" id="contacto-comercial">[\s\S]*?<\/section>/, `<section class="commercial-cta" id="contacto-comercial"><div class="container commercial-inner"><div><span class="eyebrow eyebrow-light">${english ? 'Find Champion' : 'Encuentra Champion'}</span><h2>${english ? 'Found a style you like?' : '¿Encontraste un modelo que te gusta?'}</h2><p>${english ? 'Ask at a nearby optical store in your country about Champion and check the availability of the model and color with that store. No direct online purchase.' : 'Consulta en una óptica cercana en tu país por Champion y confirma allí la disponibilidad del modelo y color. No hay compra directa en línea.'}</p></div></div></section>`);
    }

    html = html.replace(/href="\.\.\/\.\.\/blog\.html"/g, `href="../../blog.html?audience=${profile}&amp;lang=${language}"`);
    if (personal) html = html.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');
    html = html.replace(/^[ \t]+$/gm, '');
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, 'index.html'), html, 'utf8');
  }
}
console.log('experience-routes-ok (es/en × b2b/b2c)');
