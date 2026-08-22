const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const origin = 'https://champion-innova.com';
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data', 'products.json'), 'utf8'));
const products = Array.isArray(catalog.products) ? catalog.products : [];
const newModelIds = new Set([
  'ch03-c5', 'ch04-c5', 'ch05-c5', 'ch07-c5',
  'ch20-c1', 'ch20-c2', 'ch20-c3', 'ch20-c4',
  'ch21-c1', 'ch21-c2', 'ch21-c3', 'ch21-c4',
  'ch22-c1', 'ch22-c2', 'ch22-c3', 'ch22-c4',
]);
const blogCatalog = JSON.parse(fs.readFileSync(path.join(root, 'data', 'blog-posts.json'), 'utf8'));
const blogPosts = Array.isArray(blogCatalog.posts) ? blogCatalog.posts : [];

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
  `${origin}/blog.html`,
  ...blogPosts.map((post) => `${origin}/blog/${encodeURIComponent(post.slug)}.html`),
  ...products.map((product) => `${origin}${productPath(product)}`),
];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`),
  '</urlset>',
  '',
].join('\n');

function productGroups(family) {
  const groups = new Map();
  products.filter((product) => product.family === family).forEach((product) => {
    if (!groups.has(product.series)) groups.set(product.series, []);
    groups.get(product.series).push(product);
  });
  return [...groups.entries()].map(([series, variants]) => {
    variants.sort((a, b) => a.variant.localeCompare(b.variant, 'es', { numeric: true, sensitivity: 'base' }));
    const label = variants[0].displayModel.replace(/\s+C\d+$/i, '');
    const links = variants.map((product) => `          <li><a href=".${escapeHtml(productPath(product))}">${newModelIds.has(product.id) ? '<small>Modelo nuevo</small>' : ''}<strong>${escapeHtml(product.displayModel)}</strong><span>${escapeHtml(product.collection)} · ${escapeHtml(product.color)}</span></a></li>`).join('\n');
    return `        <section class="model-group" aria-labelledby="index-${escapeHtml(series.toLowerCase())}"><div class="model-heading"><h3 id="index-${escapeHtml(series.toLowerCase())}">${escapeHtml(label)}</h3><span>${variants.length} ${variants.length === 1 ? 'variante' : 'variantes'}</span></div><ol class="variant-list variant-columns-${Math.min(5, variants.length)}">\n${links}\n        </ol></section>`;
  }).join('\n');
}

const productIndex = `<!doctype html>
<html lang="es-419">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Índice estático de las ${products.length} referencias del catálogo profesional Champion Eyewear para ópticas.">
  <link rel="canonical" href="${origin}/catalogo.html">
  <link rel="icon" href="./favicon.ico">
  <link rel="stylesheet" href="./assets/audience.min.css?v=audience-20260818-12">
  <script src="./assets/audience.min.js?v=audience-20260818-12"></script>
  <title>Índice de productos | Champion Eyewear</title>
  <style>
    :root{color-scheme:light;--blue:#11183d;--red:#d1122b;--ink:#111827;--muted:#667085}*{box-sizing:border-box}body{margin:0;background:#f7f8fb;color:var(--ink);font-family:Inter,system-ui,sans-serif;line-height:1.5}header,main,footer{width:min(1180px,calc(100% - 32px));margin:auto}header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:28px 0}header a{color:var(--blue);font-weight:800;text-decoration:none}main{padding:42px 0 72px}h1{max-width:850px;margin:0;color:var(--blue);font-size:clamp(2.4rem,6vw,5.5rem);line-height:.98;text-transform:uppercase}main>p{max-width:760px;margin:24px 0 42px;color:var(--muted);font-size:1.05rem}.group{margin-top:42px}.group h2{color:var(--blue);font-size:1.7rem}.model-group{margin-top:30px}.model-group+.model-group{padding-top:24px;border-top:1px solid #e1e4ea}.model-heading{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin:0 4px 12px}.model-heading h3{margin:0;color:var(--blue);font-size:1.25rem}.model-heading>span{color:var(--muted);font-size:.75rem;font-weight:800;text-transform:uppercase}.variant-list{--variant-columns:5;display:grid;grid-template-columns:repeat(var(--variant-columns),minmax(0,1fr));gap:12px;padding:0;list-style:none}.variant-list.variant-columns-4{--variant-columns:4}.variant-list.variant-columns-3{--variant-columns:3}.variant-list a{min-height:100px;display:flex;flex-direction:column;justify-content:center;padding:16px;border:1px solid #e1e4ea;border-radius:14px;background:#fff;color:var(--ink);text-decoration:none}.variant-list a:hover,.variant-list a:focus-visible{border-color:var(--red);outline:none}.variant-list span{margin-top:5px;color:var(--muted);font-size:.86rem}.variant-list small{width:fit-content;margin-bottom:8px;padding:4px 8px;border-radius:999px;background:var(--red);color:#fff;font-size:.62rem;font-weight:900;letter-spacing:.05em;text-transform:uppercase}@media(max-width:900px){.variant-list{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.variant-list{grid-template-columns:1fr}.model-heading{align-items:flex-start;flex-direction:column;gap:2px}}footer{padding:28px 0 40px;border-top:1px solid #d9dde5;color:var(--muted)}
  </style>
</head>
<body>
  <header><a href="./">Champion Eyewear</a><a href="./#monturas">Volver al catálogo</a></header>
  <main id="contenido">
    <h1>Índice completo de productos</h1>
    <p>Enlaces directos a las ${products.length} referencias del catálogo profesional Champion Eyewear. Esta página facilita la navegación y el rastreo sin depender de JavaScript.</p>
    <section class="group" aria-labelledby="opticalTitle">
      <h2 id="opticalTitle">Monturas ópticas</h2>
      <div class="product-index">
${productGroups('optical')}
      </div>
    </section>
    <section class="group" aria-labelledby="sunTitle">
      <h2 id="sunTitle">Lentes de sol</h2>
      <div class="product-index">
${productGroups('sun')}
      </div>
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
