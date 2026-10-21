const path = require('node:path');
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
}).then(() => console.log('client-portal-js-ok'));
