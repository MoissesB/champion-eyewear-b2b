// Add the twelve CH17-CH19 variants from verified Drive source folders.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const project = path.resolve(root, '..');
const catalogPath = path.join(root, 'data/products.json');
const jsPath = path.join(root, 'data/products.js');
const manifestPath = path.join(root, 'data/asset-manifest.json');
const sourceRoot = path.join(project, 'Catalogo Champion/CH17-CH19 Drive Originales');
const measurements = { 17: '57-16-150', 18: '55-17-150', 19: '56-19-150' };
const colors = {
  17: [['Negro', 'Black'], ['Marrón y naranja', 'Brown and orange'], ['Azul oscuro', 'Dark blue'], ['Transparente y gris', 'Clear and grey']],
  18: [['Negro', 'Black'], ['Azul oscuro', 'Dark blue'], ['Champán', 'Champagne'], ['Negro y transparente', 'Black and clear']],
  19: [['Negro y rojo', 'Black and red'], ['Azul oscuro', 'Dark blue'], ['Verde oliva oscuro', 'Dark olive green'], ['Transparente y azul oscuro', 'Clear and dark blue']],
};
const views = ['01_diagonal_derecha.png', '02_frontal.png', '03_diagonal_izquierda.png', '04_lateral.png'];
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const products = [];
const assets = [];

for (let model = 17; model <= 19; model++) {
  for (let number = 1; number <= 4; number++) {
    const id = `ch${model}-c${number}`;
    const variant = `C${number}`;
    const displayModel = `CH-${model} ${variant}`;
    const [color, colorEn] = colors[model][number - 1];
    const sourceFolder = path.join(sourceRoot, `CH${model}`, variant);
    const targetFolder = `assets/images/optical/${id}`;
    const images = views.map((view, index) => {
      const target = `${targetFolder}/${String(index + 1).padStart(2, '0')}.webp`;
      const source = path.join(sourceFolder, view);
      if (!fs.existsSync(source) || !fs.existsSync(path.join(root, target))) throw new Error(`Missing image ${source} or ${target}`);
      assets.push({ family: 'optical', code: displayModel, role: `gallery-${index + 1}`, source, target, maxWidth: 1500, maxHeight: 1150 });
      return target;
    });
    const cover = `${targetFolder}/cover-v3.webp`;
    if (!fs.existsSync(path.join(root, cover))) throw new Error(`Missing cover ${cover}`);
    assets.push({ family: 'optical', code: displayModel, role: 'cover', source: path.join(sourceFolder, views[0]), target: cover, maxWidth: 1000, maxHeight: 760 });
    products.push({
      id, family: 'optical', collection: 'Optical', series: `CH${model}`, variant,
      model: `CH${model} ${variant}`, displayModel, color,
      measurements: measurements[model], material: 'No especificado', shape: 'Rectangular',
      lens: 'Montura óptica', protection: 'Compatible con lentes graduadas',
      sku: `CH-${model}-${variant}`,
      shortDescription: `${displayModel}: montura óptica rectangular en tonos ${color.toLowerCase()}.`,
      subline: `Montura Champion ${displayModel} · medida ${measurements[model]}.`,
      tags: ['Champion', 'Rectangular', color],
      about: {
        p1: `La ${displayModel} presenta un frente rectangular en tonos ${color.toLowerCase()}.`,
        p2: `Medida ${measurements[model]}. El material no está especificado en las imágenes de origen.`,
        bullets: [`Variante ${variant}`, `Medida ${measurements[model]}`, 'Cuatro vistas del modelo'],
      },
      locale: { en: {
        shortDescription: `${displayModel}: rectangular optical frame in ${colorEn.toLowerCase()} tones.`,
        subline: `Champion ${displayModel} frame · size ${measurements[model]}.`,
        about: {
          p1: `${displayModel} has a rectangular front in ${colorEn.toLowerCase()} tones.`,
          p2: `Size ${measurements[model]}. The source images do not specify the material.`,
          bullets: [`Variant ${variant}`, `Size ${measurements[model]}`, 'Four views of this frame'],
        },
      } },
      cover, images, sourceFolder: path.relative(project, sourceFolder).replace(/\\/g, '/'),
    });
  }
}

const ids = new Set(products.map((product) => product.id));
const already = catalog.products.filter((product) => ids.has(product.id));
if (already.length && already.length !== 12) throw new Error(`Partial prior import: ${already.length} products`);
catalog.products = catalog.products.filter((product) => !ids.has(product.id));
const insertAt = catalog.products.findIndex((product) => product.series === 'CH20');
if (insertAt < 0) throw new Error('CH20 insertion point missing');
catalog.products.splice(insertAt, 0, ...products);
catalog.counts.optical = catalog.products.filter((product) => product.family === 'optical').length;
catalog.counts.sun = catalog.products.filter((product) => product.family === 'sun').length;
catalog.counts.total = catalog.products.length;
catalog.generatedAt = new Date().toISOString();
const targets = new Set(assets.map((asset) => asset.target));
const nextManifest = [...manifest.filter((asset) => !targets.has(asset.target)), ...assets];
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(jsPath, `window.CHAMPION_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`);
fs.writeFileSync(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);
console.log(`Added ${products.length} variants, ${assets.length} web images; catalog ${catalog.counts.total}`);
