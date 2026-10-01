const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

for (const language of ['es', 'en']) {
  for (const audience of ['b2b', 'b2c']) {
    const html = read(`${language}/${audience}/index.html`);
    const blog = `../../blog.html?audience=${audience}&amp;lang=${language}`;
    assert.equal(html.split(`href="${blog}"`).length - 1, 3, `${language}/${audience}: desktop, mobile and footer Blog links`);
    assert.match(html, /class="button button-primary" href="#monturas"/);
    assert.match(html, /class="button button-outline-light" href="#lentes-sol"/);
    assert.match(html, /class="site-brand" href="#inicio"/);
    assert.match(html, /data-language-toggle/);
    if (audience === 'b2c') assert.doesNotMatch(html, /data-request-open/);
    else assert.match(html, /data-request-open/);
  }
}

for (const file of ['blog.html', ...fs.readdirSync(path.join(root, 'blog')).filter((name) => name.endsWith('.html')).map((name) => `blog/${name}`)]) {
  assert.match(read(file), /blog-route\.js\?v=audience-links-20261001-1/, `${file}: shared navigation script`);
}

const blogScript = read('assets/blog-route.js');
for (const audience of ['b2b', 'b2c']) {
  for (const language of ['es', 'en']) {
    const page = `https://champion-innova.com/blog.html?audience=${audience}&lang=${language}`;
    const input = ['./index.html#lentes-sol', './blog/seleccion-lentes-sol-para-opticas.html', './blog.html', './product.html?id=chs-02-c3', './catalogo.html'];
    const links = input.map((href) => ({ getAttribute: () => href, href: new URL(href, page).href }));
    let removed = 0;
    const document = { querySelectorAll: (selector) => selector === 'a[href]' ? links : [{ remove: () => { removed += 1; } }] };
    vm.runInNewContext(blogScript, { URL, URLSearchParams, location: new URL(page), document });
    assert.equal(new URL(links[0].href).pathname, `/${language}/${audience}/`);
    assert.equal(new URL(links[0].href).hash, '#lentes-sol');
    for (const link of links.slice(1, 4)) {
      const url = new URL(link.href);
      assert.equal(url.searchParams.get('audience'), audience);
      assert.equal(url.searchParams.get('lang'), language);
    }
    if (audience === 'b2c') {
      assert.equal(new URL(links[4].href).pathname, `/${language}/${audience}/`);
      assert.equal(new URL(links[4].href).hash, '#monturas');
    } else {
      assert.equal(new URL(links[4].href).pathname, '/catalogo.html'); // Existing professional index remains unchanged.
    }
    assert.equal(removed, audience === 'b2c' ? 1 : 0);
  }
}

const product = read('product.html');
const productPrimer = product.match(/<script>\s*(\(\(\) => \{[\s\S]*?const section = [\s\S]*?\}\)\(\);)\s*<\/script>/)?.[1];
assert.ok(productPrimer, 'product links are primed before catalog JS loads');
for (const [id, audience, language, section] of [
  ['chs-02-c3', 'b2c', 'en', 'lentes-sol'],
  ['ch23-c1', 'b2b', 'es', 'monturas'],
]) {
  const url = new URL(`https://champion-innova.com/product.html?id=${id}&audience=${audience}&lang=${language}`);
  const back = { href: '' };
  const brand = { href: '' };
  const nav = [{ href: '', hash: '' }, { href: '', hash: '#monturas' }];
  const document = {
    querySelector: (selector) => selector === '.back-control' ? back : brand,
    querySelectorAll: () => nav,
  };
  vm.runInNewContext(productPrimer, { URLSearchParams, location: url, document });
  assert.equal(back.href, `./${language}/${audience}/#${section}`);
  assert.equal(brand.href, `./${language}/${audience}/`);
  assert.equal(nav[1].href, `./${language}/${audience}/#monturas`);
}
assert.match(read('assets/product.js'), /document\.querySelector\('\.back-control'\)\?\.setAttribute\('href', `\$\{experienceBase\}#\$\{backAnchor\}`\)/);
console.log('experience-navigation-ok (4 routes, Blog, articles, product return)');
