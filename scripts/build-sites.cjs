const { cp, mkdir, readFile, rm, writeFile } = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, 'dist');
const client = path.join(dist, 'client');
const server = path.join(dist, 'server');

if (!dist.startsWith(`${root}${path.sep}`)) {
  throw new Error('La carpeta de salida debe permanecer dentro del proyecto.');
}

async function build() {
  require('./generate-sitemap.cjs');
  await rm(dist, { recursive: true, force: true });
  await mkdir(client, { recursive: true });
  await mkdir(server, { recursive: true });

  for (const file of ['index.html', 'product.html', 'catalogo.html', '404.html', '.nojekyll', 'favicon.ico', 'sitemap.xml', 'robots.txt']) {
    await cp(path.join(root, file), path.join(client, file));
  }

  for (const directory of ['assets', 'data']) {
    await cp(path.join(root, directory), path.join(client, directory), { recursive: true });
  }

  const catalog = JSON.parse(await readFile(path.join(root, 'data', 'products.json'), 'utf8'));
  const productIds = Array.isArray(catalog.products) ? catalog.products.map((product) => product.id) : [];
  const workerTemplate = await readFile(path.join(root, 'hosting', 'worker.js'), 'utf8');
  const idsMarker = '/* product-ids:start */[]/* product-ids:end */';
  if (!workerTemplate.includes(idsMarker)) {
    throw new Error('No se encontró el marcador de identificadores en hosting/worker.js.');
  }
  const workerCode = workerTemplate.replace(
    idsMarker,
    `/* product-ids:start */${JSON.stringify(productIds)}/* product-ids:end */`,
  );
  await writeFile(path.join(server, 'index.js'), workerCode, 'utf8');
  console.log(`build-ok (dist/server/index.js + dist/client; ${productIds.length} IDs en el worker)`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
