const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const titles = new Set();
const failures = [];
const expected = (140 * 4) + 4 + 1 + 1 + 3;
if (urls.length !== expected) failures.push(`sitemap: ${urls.length} URLs, expected ${expected}`);
if (new Set(urls).size !== urls.length) failures.push('sitemap contains duplicate URLs');

for (const url of urls) {
  const parsed = new URL(url);
  const relative = parsed.pathname.endsWith('/') ? `${parsed.pathname}index.html` : parsed.pathname;
  const file = path.join(root, relative.replace(/^\//, ''));
  if (!fs.existsSync(file)) { failures.push(`${url}: missing HTML`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const get = (pattern) => html.match(pattern)?.[1] || '';
  const title = get(/<title>([^<]+)<\/title>/);
  const description = get(/<meta name="description" content="([^"]+)"/);
  const canonical = get(/<link rel="canonical" href="([^"]+)"/);
  const image = get(/<meta property="og:image" content="([^"]+)"/);
  if (!title || titles.has(title)) failures.push(`${url}: missing or duplicate title`);
  titles.add(title);
  if (description.length < 50) failures.push(`${url}: missing or short description`);
  if (canonical !== url) failures.push(`${url}: canonical mismatch (${canonical})`);
  if (/<meta name="robots" content="noindex/i.test(html)) failures.push(`${url}: noindex in sitemap`);
  if (!/<h1\b[^>]*>/.test(html) || !/<h2\b[^>]*>/.test(html)) failures.push(`${url}: missing H1 or H2`);
  if (!/<img\b[^>]*alt="[^"]+"/.test(html)) failures.push(`${url}: missing described image`);
  if (!html.includes(`og:url" content="${url}"`)) failures.push(`${url}: missing Open Graph URL`);
  if (!html.includes('og:title') || !html.includes('twitter:card')) failures.push(`${url}: missing social metadata`);
  if (!image.startsWith('https://champion-innova.com/')) failures.push(`${url}: missing absolute social image`);
  else if (!fs.existsSync(path.join(root, new URL(image).pathname.slice(1)))) failures.push(`${url}: social image missing locally`);
  const jsonText = get(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  try { if (!jsonText) throw new Error('missing'); JSON.parse(jsonText); }
  catch { failures.push(`${url}: missing or invalid JSON-LD`); }
  if (/\/(?:b2b|b2c)\/modelos\//.test(parsed.pathname)) {
    const id = parsed.pathname.match(/\/modelos\/([^/]+)\//)?.[1];
    if (!html.includes(`data-product-id="${id}"`)) failures.push(`${url}: missing static product ID`);
    if (!html.includes('"@type":"Product"')) failures.push(`${url}: missing Product entity`);
    if (!html.includes('hreflang="es"') || !html.includes('hreflang="en"')) failures.push(`${url}: missing language alternates`);
    if (/href="#[a-z]/i.test(html)) failures.push(`${url}: broken fragment under base URL`);
    if (parsed.pathname.includes('/b2c/') && /request-loader\.min\.js|id="productContact"/.test(html)) failures.push(`${url}: consumer order/contact controls leaked`);
  } else if (/^\/(?:es|en)\/(?:b2b|b2c)\/$/.test(parsed.pathname)) {
    const links = [...html.matchAll(/<a href="\.\.\/\.\.\/(?:es|en)\/(?:b2b|b2c)\/modelos\/[a-z0-9-]+\/">/g)];
    if (links.length !== 140) failures.push(`${url}: expected 140 crawlable model links, found ${links.length}`);
    if (!html.includes('hreflang="es"') || !html.includes('hreflang="en"')) failures.push(`${url}: missing language alternates`);
  }
}

const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
if (!/User-agent: OAI-SearchBot\s+Allow: \//.test(robots)) failures.push('OAI-SearchBot not explicitly allowed');
for (const name of ['index.html', 'en/index.html', 'product.html', 'product-consumer.html', 'clientes/index.html', '404.html']) {
  if (!/noindex/i.test(fs.readFileSync(path.join(root, name), 'utf8'))) failures.push(`${name}: duplicate, private, or error page lacks noindex`);
}
if (failures.length) {
  console.error(failures.slice(0, 35).join('\n'));
  if (failures.length > 35) console.error(`...and ${failures.length - 35} more`);
  process.exitCode = 1;
} else {
  console.log(`seo-pages-ok (${urls.length} canonical pages, metadata, images and structured data)`);
}
