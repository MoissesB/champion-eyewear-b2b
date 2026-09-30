// Keep fixed editorial counts aligned with data/products.json after CH23–CH25.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));
const replacements = [
  ['116 referencias', `${catalog.counts.total} referencias`],
  ['116 references', `${catalog.counts.total} references`],
  ['80 monturas', `${catalog.counts.optical} monturas`],
  ['80 optical', `${catalog.counts.optical} optical`],
];
for (const relative of ['assets/i18n.js', 'catalog-experience.html']) {
  const file = path.join(root, relative);
  let content = fs.readFileSync(file, 'utf8');
  for (const [before, after] of replacements) content = content.replaceAll(before, after);
  fs.writeFileSync(file, content, 'utf8');
}
console.log(`Fixed editorial counts: ${catalog.counts.optical} optical / ${catalog.counts.total} total`);
