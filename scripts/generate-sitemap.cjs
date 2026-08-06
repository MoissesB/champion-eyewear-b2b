const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const origin = 'https://champion-innova.com';
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data', 'products.json'), 'utf8'));
const products = Array.isArray(catalog.products) ? catalog.products : [];

function productPath(product) {
  return `/product.html?id=${encodeURIComponent(product.id)}`;
}

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const urls = [
  `${origin}/`,
  `${origin}/catalogo.html`,
  ...products.map((product) => `${origin}${productPath(product)}`),
];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`),
  '</urlset>',
  '',
].join('\n');

function productLinks(family) {
  return products
    .filter((product) => product.family === family)
    .map((product) => `        <li><a href=".${escapeHtml(productPath(product))}"><strong>${escapeHtml(product.displayModel)}</strong><span>${escapeHtml(product.collection)} · ${escapeHtml(product.color)}</span></a></li>`)
    .join('\n');
}

const productIndex = `<!doctype html>
<html lang="es-419">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Índice estático de las 100 referencias del catálogo profesional Champion Eyewear para ópticas.">
  <link rel="canonical" href="${origin}/catalogo.html">
  <link rel="icon" href="./favicon.ico">
  <title>Índice de productos | Champion Eyewear</title>
  <style>
    :root{color-scheme:light;--blue:#11183d;--red:#d1122b;--ink:#111827;--muted:#667085}*{box-sizing:border-box}body{margin:0;background:#f7f8fb;color:var(--ink);font-family:Inter,system-ui,sans-serif;line-height:1.5}header,main,footer{width:min(1180px,calc(100% - 32px));margin:auto}header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:28px 0}header a{color:var(--blue);font-weight:800;text-decoration:none}main{padding:42px 0 72px}h1{max-width:850px;margin:0;color:var(--blue);font-size:clamp(2.4rem,6vw,5.5rem);line-height:.98;text-transform:uppercase}main>p{max-width:760px;margin:24px 0 42px;color:var(--muted);font-size:1.05rem}.group{margin-top:42px}.group h2{color:var(--blue);font-size:1.7rem}.product-index{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:0;list-style:none}.product-index a{min-height:88px;display:flex;flex-direction:column;justify-content:center;padding:16px;border:1px solid #e1e4ea;border-radius:14px;background:#fff;color:var(--ink);text-decoration:none}.product-index a:hover,.product-index a:focus-visible{border-color:var(--red);outline:none}.product-index span{margin-top:5px;color:var(--muted);font-size:.86rem}footer{padding:28px 0 40px;border-top:1px solid #d9dde5;color:var(--muted)}
  </style>
</head>
<body>
  <header><a href="./">Champion Eyewear</a><a href="./#monturas">Volver al catálogo</a></header>
  <main id="contenido">
    <h1>Índice completo de productos</h1>
    <p>Enlaces directos a las 100 referencias del catálogo profesional Champion Eyewear. Esta página facilita la navegación y el rastreo sin depender de JavaScript.</p>
    <section class="group" aria-labelledby="opticalTitle">
      <h2 id="opticalTitle">Monturas ópticas</h2>
      <ol class="product-index">
${productLinks('optical')}
      </ol>
    </section>
    <section class="group" aria-labelledby="sunTitle">
      <h2 id="sunTitle">Lentes de sol</h2>
      <ol class="product-index">
${productLinks('sun')}
      </ol>
    </section>
  </main>
  <footer>Catálogo profesional distribuido por Innova Eyewear.</footer>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`, 'utf8');
fs.writeFileSync(path.join(root, 'catalogo.html'), productIndex, 'utf8');
console.log(`seo-ok (${urls.length} URLs; ${products.length} enlaces estáticos; sin lastmod artificial)`);
