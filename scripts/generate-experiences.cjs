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
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${personal ? (english ? 'Explore Champion frames and sunglasses, save your favorites and request personal guidance.' : 'Explora monturas y gafas de sol Champion, guarda tus favoritas y solicita orientación personal.') : (english ? 'Champion professional eyewear catalog for optical stores and distributors. Prepare an order for review.' : 'Catálogo profesional Champion para ópticas y distribuidores. Prepare una selección para revisión.')}">`)
      .replace(/<title>[^<]*<\/title>/, `<title>Champion Eyewear | ${personal ? (english ? 'Personal experience' : 'Experiencia personal') : (english ? 'Professional catalog' : 'Catálogo profesional')}</title>`);

    html = html.replace(/(<div class="hero-actions">[\s\S]*?)(\n        <\/div>)/, `$1\n          <button class="button button-outline-light" type="button" data-lead-form-open>${english ? (personal ? 'Request guidance' : 'Professional contact') : (personal ? 'Solicitar orientación' : 'Contacto profesional')}</button>$2`);

    if (personal) {
      const heroKicker = english ? 'Champion Eyewear · For you' : 'Champion Eyewear · Para ti';
      const heroTitle = english ? 'Find your next<br>Champion frames' : 'Encuentra tus próximas<br>monturas Champion';
      const heroText = english
        ? 'Explore optical frames and sunglasses, save the models you like and request guidance. This is not a direct purchase or reservation.'
        : 'Explora monturas y gafas de sol, guarda los modelos que te gustan y solicita orientación. No es una compra ni una reserva directa.';
      html = html
        .replace(/<a href="#beneficios"[^>]*>[\s\S]*?<\/a>/g, '')
        .replace(/<a href="#faq"[^>]*>[\s\S]*?<\/a>/g, '')
        .replace(/data-request-open/g, 'data-interest-open')
        .replace(/data-request-count/g, 'data-interest-count')
        .replace(/data-i18n="(?:requestOpen|requestShort|requestMobile|heroRequest|footerRequest|footerService)"/g, '')
        .replace(/Preparar pedido|Mi pedido|Ver mi pedido|Preparar mi pedido|Pedidos para ópticas/g, english ? 'My models' : 'Mis modelos')
        .replace(/<span data-i18n="sunAvailable">[\s\S]*?<\/span>/, `<span>${english ? 'models to explore' : 'modelos para explorar'}</span>`)
        .replace(/<p data-i18n="footerText">[\s\S]*?<\/p>/, `<p>${english ? 'Explore Champion Eyewear with Innova.' : 'Descubre Champion Eyewear con Innova.'}</p>`)
        .replace(/<span class="eyebrow eyebrow-light" data-i18n="heroKicker">[\s\S]*?<\/span>/, `<span class="eyebrow eyebrow-light">${heroKicker}</span>`)
        .replace(/<h1 id="heroTitle" data-i18n="heroTitle" data-i18n-html="true">[\s\S]*?<\/h1>/, `<h1 id="heroTitle">${heroTitle}</h1>`)
        .replace(/<p data-i18n="heroText">[\s\S]*?<\/p>/, `<p>${heroText}</p>`)
        .replace(/<section class="commercial-cta" id="contacto-comercial">[\s\S]*?<\/section>/, `<section class="commercial-cta" id="contacto-comercial"><div class="container commercial-inner"><div><span class="eyebrow eyebrow-light">${english ? 'Personal guidance' : 'Orientación personal'}</span><h2>${english ? 'Like a Champion model?' : '¿Te gustó un modelo Champion?'}</h2><p>${english ? 'Save your favorites and tell us how to contact you. There is no direct checkout.' : 'Guarda tus favoritos y cuéntanos cómo contactarte. No hay compra directa.'}</p></div><div class="commercial-actions"><button class="button button-white" type="button" data-interest-open>${english ? 'View my models' : 'Ver mis modelos'}</button><button class="button button-outline-light" type="button" data-lead-form-open>${english ? 'Request guidance' : 'Solicitar orientación'}</button></div></div></section>`);
    }

    html = html.replace(/^[ \t]+$/gm, '');
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, 'index.html'), html, 'utf8');
  }
}
console.log('experience-routes-ok (es/en × b2b/b2c)');
