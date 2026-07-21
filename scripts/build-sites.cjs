const { cp, mkdir, rm } = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, 'dist');
const client = path.join(dist, 'client');
const server = path.join(dist, 'server');

if (!dist.startsWith(`${root}${path.sep}`)) {
  throw new Error('La carpeta de salida debe permanecer dentro del proyecto.');
}

async function build() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(client, { recursive: true });
  await mkdir(server, { recursive: true });

  for (const file of ['index.html', 'product.html', '.nojekyll']) {
    await cp(path.join(root, file), path.join(client, file));
  }

  for (const directory of ['assets', 'data']) {
    await cp(path.join(root, directory), path.join(client, directory), { recursive: true });
  }

  await cp(path.join(root, 'hosting', 'worker.js'), path.join(server, 'index.js'));
  console.log('build-ok (dist/server/index.js + dist/client)');
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
