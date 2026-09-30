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
      .replace('</head>', `  <link rel="stylesheet" href="../../assets/experience.css">\n  <script>try{localStorage.setItem('champion-language-v1','${language}')}catch(_error){}</script>\n  <script defer src="../../assets/experience-route.js"></script>\n</head>`);
    html = html
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${personal ? (english ? 'Explore Champion frames and sunglasses, save your favorites and ask where to find them at an optical store.' : 'Explora monturas y gafas de sol Champion, guarda tus favoritas y consulta dónde encontrarlas en una óptica.') : (english ? 'Champion professional eyewear catalog for optical stores and distributors. Prepare an order for review.' : 'Catálogo profesional Champion para ópticas y distribuidores. Prepare una selección para revisión.')}">`)
      .replace(/<title>[^<]*<\/title>/, `<title>Champion Eyewear | ${personal ? (english ? 'Personal experience' : 'Experiencia personal') : (english ? 'Professional catalog' : 'Catálogo profesional')}</title>`);

    html = html.replace(/(<div class="hero-actions">[\s\S]*?)(\n        <\/div>)/, `$1\n          <button class="button button-outline-light" type="button" data-lead-form-open>${english ? (personal ? 'Ask where to find Champion' : 'Professional contact') : (personal ? 'Consulta dónde encontrar Champion' : 'Contacto profesional')}</button>$2`);

    if (personal) {
      const heroKicker = english ? 'Champion Eyewear · For you' : 'Champion Eyewear · Para ti';
      const heroTitle = english ? 'Find your next<br>Champion frames' : 'Encuentra tus próximas<br>monturas Champion';
      const heroText = english
        ? 'Explore optical frames and sunglasses, save the models you like and ask where to find Champion at an optical store. Check model and color availability directly with the store.'
        : 'Explora monturas y gafas de sol, guarda los modelos que te gustan y consulta dónde encontrar Champion en una óptica. Confirma la disponibilidad de cada modelo y color directamente con el punto de venta.';
      html = html
        .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${english ? 'Champion Eyewear | Explore frames and sunglasses' : 'Champion Eyewear | Explora monturas y gafas de sol'}">`)
        .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${english ? 'Explore Champion styles, save your favorites and ask where to find them at an optical store.' : 'Explora modelos Champion, guarda tus favoritos y consulta dónde encontrarlos en una óptica.'}">`)
        .replace(/\n    <section class="section (?:benefits-section|reference-section|process-section|faq-section)"[\s\S]*?\n    <\/section>/g, '')
        .replace(/<a href="#beneficios"[^>]*>[\s\S]*?<\/a>/g, '')
        .replace(/<a href="#faq"[^>]*>[\s\S]*?<\/a>/g, '')
        .replace(/<a href="\.\.\/\.\.\/blog\.html">Blog<\/a>/g, '')
        .replace(/<a href="\.\.\/\.\.\/catalogo\.html"[^>]*>[\s\S]*?<\/a>/g, '')
        .replace(/\s*<span><strong>PDF<\/strong> <span data-i18n="heroPdfFact">[^<]*<\/span><\/span>/, '')
        .replace(/data-request-open/g, 'data-interest-open')
        .replace(/data-request-count/g, 'data-interest-count')
        .replace(/data-i18n="(?:requestOpen|requestShort|requestMobile|heroRequest|footerRequest|footerService)"/g, '')
        .replace(/Preparar pedido|Mi pedido|Ver mi pedido|Preparar mi pedido|Pedidos para ópticas/g, english ? 'My models' : 'Mis modelos')
        .replace(/<span data-i18n="sunAvailable">[\s\S]*?<\/span>/, `<span>${english ? 'models to explore' : 'modelos para explorar'}</span>`)
        .replace(/<p data-i18n="opticalIntro">[\s\S]*?<\/p>/, `<p>${english ? 'Explore styles by model, color, material or size. Open a product page to view images and details.' : 'Explora por modelo, color, material o medida. Abre cada ficha para ver imágenes y detalles.'}</p>`)
        .replace(/<h2 data-i18n="sunTitle">[\s\S]*?<\/h2>/, `<h2>${english ? 'Champion sunglasses for your style' : 'Gafas de sol Champion para tu estilo'}</h2>`)
        .replace(/<p data-i18n="sunIntro">[\s\S]*?<\/p>/, `<p>${english ? 'Explore Champion sunglasses, from urban silhouettes to wraparound sports styles.' : 'Explora las gafas de sol Champion, desde siluetas urbanas hasta modelos deportivos envolventes.'}</p>`)
        .replace(/<p data-i18n="footerText">[\s\S]*?<\/p>/, `<p>${english ? 'Explore Champion Eyewear with Innova.' : 'Descubre Champion Eyewear con Innova.'}</p>`)
        .replace(/<a href="mailto:sales@innova-eyewear.com">sales@innova-eyewear.com<\/a>/, `<button type="button" data-lead-form-open>${english ? 'Ask where to find Champion' : 'Consulta dónde encontrar Champion'}</button>`)
        .replace(/<span class="eyebrow eyebrow-light" data-i18n="heroKicker">[\s\S]*?<\/span>/, `<span class="eyebrow eyebrow-light">${heroKicker}</span>`)
        .replace(/<h1 id="heroTitle" data-i18n="heroTitle" data-i18n-html="true">[\s\S]*?<\/h1>/, `<h1 id="heroTitle">${heroTitle}</h1>`)
        .replace(/<p data-i18n="heroText">[\s\S]*?<\/p>/, `<p>${heroText}</p>`)
        .replace(/<section class="commercial-cta" id="contacto-comercial">[\s\S]*?<\/section>/, `<section class="commercial-cta" id="contacto-comercial"><div class="container commercial-inner"><div><span class="eyebrow eyebrow-light">${english ? 'Find Champion' : 'Encuentra Champion'}</span><h2>${english ? 'Found a style you like?' : '¿Encontraste un modelo que te gusta?'}</h2><p>${english ? 'Save your favorites and ask where to find Champion at an optical store. Check model and color availability with the store.' : 'Guarda tus favoritos y consulta dónde encontrar Champion en una óptica. Confirma la disponibilidad del modelo y color con el punto de venta.'}</p></div><div class="commercial-actions"><button class="button button-white" type="button" data-interest-open>${english ? 'View my models' : 'Ver mis modelos'}</button><button class="button button-outline-light" type="button" data-lead-form-open>${english ? 'Ask where to find Champion' : 'Consulta dónde encontrar Champion'}</button></div></div></section>`);
    }

    if (personal) html = html.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');
    html = html.replace(/^[ \t]+$/gm, '');
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, 'index.html'), html, 'utf8');
  }
}
console.log('experience-routes-ok (es/en × b2b/b2c)');
