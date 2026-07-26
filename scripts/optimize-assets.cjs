const esbuild = require('esbuild');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const targets = [
  ['assets/styles.css', 'assets/styles.min.css', 'css'],
  ['data/products.js', 'data/products.min.js', 'js'],
  ['assets/i18n.js', 'assets/i18n.min.js', 'js'],
  ['assets/bootstrap.js', 'assets/bootstrap.min.js', 'js'],
  ['assets/request.js', 'assets/request.min.js', 'js'],
  ['assets/home.js', 'assets/home.min.js', 'js'],
  ['assets/product.js', 'assets/product.min.js', 'js'],
];

async function optimize() {
  await Promise.all(targets.map(([input, output, loader]) => esbuild.build({
    entryPoints: [path.join(root, input)],
    outfile: path.join(root, output),
    bundle: false,
    minify: true,
    charset: 'utf8',
    legalComments: 'none',
    target: ['es2020'],
    loader: { [`.${loader}`]: loader },
    logLevel: 'silent',
  })));

  const criticalSource = await readFile(path.join(root, 'assets/critical-home.css'), 'utf8');
  const criticalResult = await esbuild.transform(criticalSource, {
    loader: 'css',
    minify: true,
    charset: 'utf8',
    legalComments: 'none',
  });
  const indexPath = path.join(root, 'index.html');
  const indexHtml = await readFile(indexPath, 'utf8');
  const start = '/* critical-home:start */';
  const end = '/* critical-home:end */';
  const startIndex = indexHtml.indexOf(start);
  const endIndex = indexHtml.indexOf(end);
  if (startIndex < 0 || endIndex < startIndex) {
    throw new Error('No se encontraron los marcadores de CSS crítico en index.html');
  }
  const nextIndexHtml = `${indexHtml.slice(0, startIndex + start.length)}${criticalResult.code.trim()}${indexHtml.slice(endIndex)}`;
  await writeFile(indexPath, nextIndexHtml, 'utf8');
  console.log('optimize-ok (CSS y JavaScript minificados)');
}

optimize().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
