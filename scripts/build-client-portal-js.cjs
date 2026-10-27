const path = require('node:path');
const fs = require('node:fs');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
module.exports = esbuild.build({
  entryPoints: [path.join(root, 'assets', 'client-portal.js')],
  outfile: path.join(root, 'clientes', 'portal.js'),
  bundle: true,
  minify: true,
  platform: 'browser',
  target: ['es2020'],
  sourcemap: false,
}).then(() => {
  const file = path.join(root, 'clientes', 'portal.js');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split(/\r?\n/).map(line => line.trimEnd()).join('\n'));
  console.log('client-portal-js-ok');
});
