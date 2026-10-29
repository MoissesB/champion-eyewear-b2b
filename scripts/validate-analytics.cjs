const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets/analytics.js'), 'utf8');
function preview(pathname, audience, product) {
  const listeners = new Map();
  const document = {
    readyState: 'complete', title: 'Champion test page', referrer: 'https://example.com/',
    body: { dataset: { audience, productId: product?.id } },
    documentElement: { lang: pathname.startsWith('/en/') ? 'en' : 'es-419', dataset: {} },
    addEventListener(name, callback) { listeners.set(name, callback); },
    querySelector() { return null; },
  };
  const location = { hostname: '127.0.0.1', protocol: 'http:', pathname,
    href: `http://127.0.0.1:8765${pathname}` };
  const window = { location, CHAMPION_CATALOG: { products: product ? [product] : [] } };
  vm.runInNewContext(source, { window, document, location, Date, JSON, Array });
  return { window, document, listeners, events: () => Array.from(window.dataLayer).filter((entry) => entry[0] === 'event') };
}

const catalog = preview('/es/b2c/', 'b2c', {
  id: 'ch17-c1', displayModel: 'CH-17 C1', family: 'optical', series: 'CH17', variant: 'C1',
});
assert.equal(catalog.window.dataLayer.find((entry) => entry[0] === 'config')[2].send_page_view, false);
assert.equal(catalog.events().filter((entry) => entry[1] === 'page_view').length, 1);
assert.equal(catalog.events()[0][2].audience, 'b2c');
assert.equal(catalog.events()[0][2].page_type, 'catalog');
const link = { getAttribute: () => '/es/b2c/modelos/ch17-c1/', closest: () => null, matches: () => false };
catalog.listeners.get('click')({ target: { closest: () => link } });
const selection = catalog.events().find((entry) => entry[1] === 'select_item');
assert.equal(selection[2].items[0].item_id, 'ch17-c1');
assert.equal(selection[2].item_list_name, 'catalog');

const category = preview('/en/b2b/frames/', 'b2b');
assert.equal(category.events()[0][2].page_type, 'category');
assert.equal(category.events()[0][2].product_family, 'optical');

const detail = preview('/es/b2b/modelos/ch17-c1/', 'b2b');
assert.equal(detail.events().filter((entry) => entry[1] === 'page_view').length, 0);
assert.equal(detail.window.dataLayer.find((entry) => entry[0] === 'config')[2].send_page_view, false);
assert.match(fs.readFileSync(path.join(__dirname, '..', 'assets/product.js'), 'utf8'), /ChampionAnalytics\.track\('view_item'/);
console.log('analytics-ok (one catalog/category view; product view delegated; select_item by ID; local transport disabled)');
