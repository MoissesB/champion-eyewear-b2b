const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'catalog-experience.html'), 'utf8');
const origin = 'https://champion-innova.com';
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8')).products;
const escapeHtml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
      .replace('</head>', `  <link rel="stylesheet" href="../../assets/experience.css?v=seo-20261027-1">\n  <script>try{localStorage.setItem('champion-language-v1','${language}')}catch(_error){}</script>\n  <script defer src="../../assets/experience-route.js?v=home-route-20261027-2"></script>\n</head>`);
    html = html
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${personal ? (english ? 'Explore Champion frames and sunglasses. Ask at a nearby optical store in your country and check model and color availability there.' : 'Explora monturas y gafas de sol Champion. Consulta en una óptica cercana en tu país y confirma allí la disponibilidad de cada modelo y color.') : (english ? 'Champion professional eyewear catalog for optical stores and distributors. Prepare an order for review.' : 'Catálogo profesional Champion para ópticas y distribuidores. Prepare una selección para revisión.')}">`)
      .replace(/<title>[^<]*<\/title>/, `<title>Champion Eyewear | ${personal ? (english ? 'Personal experience' : 'Experiencia personal') : (english ? 'Professional catalog' : 'Catálogo profesional')}</title>`);

    const title = personal
      ? (english ? 'Champion Eyewear frames and sunglasses | Explore models' : 'Monturas y gafas de sol Champion | Explora modelos')
      : (english ? 'Champion professional eyewear catalog | Optical stores' : 'Catálogo Champion para ópticas y distribuidores');
    const description = personal
      ? (english ? 'Explore 140 Champion eyewear models, see their images and specifications, and search for optical stores near you. Confirm availability with each store.'
        : 'Explora 140 modelos Champion, sus imágenes y medidas. Busca ópticas cercanas y confirma con cada tienda la disponibilidad del modelo y color.')
      : (english ? 'Browse 140 Champion optical frames and sunglasses for optical stores and distributors. Select references and prepare an order for Innova Eyewear review.'
        : 'Explora 140 monturas y gafas de sol Champion para ópticas y distribuidoras. Selecciona referencias y prepara un pedido para revisión de Innova Eyewear.');
    const socialImage = `${origin}/${personal ? 'assets/images/optical/ch17-c1/01.webp' : 'assets/images/brand/champion-social.png'}`;
    const schema = {
      '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${origin}${route}#page`,
      url: `${origin}${route}`, name: title, description,
      inLanguage: english ? 'en' : 'es-419', image: socialImage,
      isPartOf: { '@type': 'WebSite', name: 'Champion Eyewear', url: origin },
      about: { '@type': 'Brand', name: 'Champion Eyewear' },
    };
    const seoHead = `  <meta name="robots" content="index, follow, max-image-preview:large">\n  <link rel="alternate" hreflang="es" href="${origin}/es/${profile}/">\n  <link rel="alternate" hreflang="en" href="${origin}/en/${profile}/">\n  <link rel="alternate" hreflang="x-default" href="${origin}/es/${profile}/">\n  <meta property="og:site_name" content="Champion Eyewear">\n  <meta property="og:url" content="${origin}${route}">\n  <meta property="og:image:alt" content="${english ? 'Champion eyewear collection' : 'Colección de monturas Champion'}">\n  <meta name="twitter:title" content="${title}">\n  <meta name="twitter:description" content="${description}">\n  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>\n`;
    html = html
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`)
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`)
      .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${socialImage}">`)
      .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${socialImage}">`)
      .replace('</head>', `${seoHead}</head>`);

    if (personal) {
      const heroKicker = english ? 'Champion Eyewear · For you' : 'Champion Eyewear · Para ti';
      const heroTitle = english ? 'Find your next<br>Champion frames' : 'Encuentra tus próximas<br>monturas Champion';
      const videoTitle = english ? 'Discover Champion in motion' : 'Descubre Champion en movimiento';
      const videoIntro = english
        ? 'Explore the collection, then open each model to see its colors and details.'
        : 'Explora la colección y abre cada modelo para ver sus colores y detalles.';
      const personalVideo = `\n    <section class="section consumer-video-section" id="video" aria-labelledby="consumerVideoTitle">
      <div class="container">
        <div class="section-heading centered"><span class="eyebrow">Champion Eyewear</span><h2 id="consumerVideoTitle">${videoTitle}</h2><p>${videoIntro}</p></div>
        <div class="video-panel-shell"><div class="video-panel"><video id="explainVideo" controls muted loop playsinline preload="none" poster="../../assets/images/brand/champion-video-poster.webp" aria-label="${english ? 'Champion presentation in English' : 'Presentación Champion en español'}" data-video-es="https://assets.cdn.filesafe.space/itkQlAHHVlUS0uDAETp3/media/69e45ad38696a78b8d076627.mp4" data-video-en="https://assets.cdn.filesafe.space/itkQlAHHVlUS0uDAETp3/media/69f65b406b07ab33031dd1ae.mp4"></video></div><button class="video-restart-sound" type="button" data-video-restart-sound>${english ? 'Play from the beginning with sound' : 'Reproducir desde el inicio con sonido'}</button></div>
      </div>
    </section>`;
      const heroText = english
        ? 'Explore optical frames and sunglasses, then ask at a nearby optical store in your country about Champion. Confirm model and color availability directly with the store.'
        : 'Explora monturas y gafas de sol Champion. Luego consulta en una óptica cercana en tu país y confirma directamente allí la disponibilidad del modelo y color.';
      html = html
        .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${english ? 'Champion Eyewear | Explore frames and sunglasses' : 'Champion Eyewear | Explora monturas y gafas de sol'}">`)
        .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${english ? 'Explore Champion styles and ask at a nearby optical store in your country. Check availability there.' : 'Explora modelos Champion y consulta en una óptica cercana en tu país. Confirma allí la disponibilidad.'}">`)
        .replace(/\n    <section class="section benefits-section"[\s\S]*?\n    <\/section>/, personalVideo)
        .replace(/\n    <section class="section (?:reference-section|process-section|faq-section)"[\s\S]*?\n    <\/section>/g, '')
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
        .replace(/<a class="button button-primary" href="#monturas" data-i18n="heroOptical">[^<]*<\/a>/, `<a class="button button-primary" href="#monturas">${english ? 'View models' : 'Ver modelos'}</a>`)
        .replace(/(<a class="button button-outline-light" href="#lentes-sol"[^>]*>[^<]*<\/a>)/, `$1\n          <a class="button button-outline-light" href="../b2b/#monturas">${english ? 'I run an optical store or distribute eyewear' : 'Tengo una óptica o distribuidora'}</a>`)
        .replace(/<section class="commercial-cta" id="contacto-comercial">[\s\S]*?<\/section>/, `<section class="optics-locator-section" id="findOptics" aria-labelledby="opticsLocatorTitle"><div class="container optics-locator-inner"><div><span class="eyebrow" data-optics-kicker>${english ? 'For you' : 'Para ti'}</span><h2 id="opticsLocatorTitle" data-optics-title>${english ? 'Find optical stores near you' : 'Busca una óptica cerca de ti'}</h2><p data-optics-intro>${english ? 'Choose your country and city to search for optical stores on Google Maps.' : 'Elige tu país y ciudad para buscar ópticas en Google Maps.'}</p></div><div class="optics-locator-controls"><label for="opticsCountry" data-optics-country-label>${english ? 'Country or territory' : 'País o territorio'}</label><select id="opticsCountry" autocomplete="country-name"><option value="">${english ? 'Choose your country' : 'Selecciona tu país'}</option></select><label for="opticsCity" data-optics-city-label>${english ? 'City or area' : 'Ciudad o zona'}</label><input id="opticsCity" type="text" autocomplete="address-level2" placeholder="${english ? 'Enter your city' : 'Escribe tu ciudad'}"><a class="button button-primary" id="opticsMapLink" href="#findOptics" target="_blank" rel="noopener noreferrer">${english ? 'Search optical stores on Google Maps' : 'Buscar ópticas en Google Maps'}</a><p class="optics-search-status" id="opticsSearchStatus" role="status" aria-live="polite"></p><p class="optics-locator-note" data-optics-note>${english ? 'This search shows general optical stores. It does not confirm Champion stock or availability of a specific model.' : 'La búsqueda muestra ópticas generales. No confirma que vendan Champion ni disponibilidad de un modelo concreto.'}</p></div></div></section>`);
    }

    if (!personal) {
      const browse = english ? 'View models' : 'Ver modelos';
      const order = english ? 'Prepare order' : 'Preparar pedido';
      html = html.replace(/(<\/div>)\s*(<div class="hero-facts")/, `$1\n        <p class="hero-audience-link">${english ? 'Browsing for yourself?' : '¿Buscas monturas para ti?'} <a href="../b2c/#monturas">${english ? 'Open the personal catalog' : 'Abrir el catálogo personal'}</a></p>\n        $2`);
      html = html.replace('</main>', `</main>\n\n  <div class="b2b-sticky-actions" role="group" aria-label="${english ? 'Professional catalog actions' : 'Acciones del catálogo profesional'}" aria-hidden="true" inert><a href="#monturas">${browse}</a><button type="button" data-request-open>${order}</button></div>`);
    }

    const indexHeading = english ? 'All Champion models' : 'Todos los modelos Champion';
    const indexIntro = english
      ? 'Open the complete model and color index. Each reference has its own product page.'
      : 'Abre el índice completo de modelos y colores. Cada referencia tiene su propia ficha.';
    const modelLinks = products.map((product) => `<a href="../../${language}/${profile}/modelos/${product.id}/">${escapeHtml(product.displayModel)}</a>`).join('');
    html = html.replace('</main>', `<section class="section catalog-index-section" aria-labelledby="catalogIndexTitle"><div class="container"><h2 id="catalogIndexTitle">${indexHeading}</h2><p>${indexIntro}</p><details><summary>${english ? 'Browse the 140 references' : 'Explorar las 140 referencias'}</summary><div class="catalog-index-links">${modelLinks}</div></details></div></section>\n</main>`);

    html = html.replace(/href="\.\.\/\.\.\/blog\.html"/g, `href="../../blog.html?audience=${profile}&amp;lang=${language}"`);
    if (personal) html = html.replace(/\s*<a href="\.\.\/\.\.\/clientes\/" data-portal-nav>[^<]*<\/a>/g, '');
    else if (english) html = html.replace(/(<a href="\.\.\/\.\.\/clientes\/" data-portal-nav>)[^<]*/g, '$1Resources for optical stores');
    if (personal) html = html.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');
    html = html.replace(/^[ \t]+$/gm, '');
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, 'index.html'), html, 'utf8');
  }
}
console.log('experience-routes-ok (es/en × b2b/b2c)');
