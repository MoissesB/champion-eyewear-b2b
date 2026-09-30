// Reconcile the 12 CH23–CH25 variants from their 36 Dropbox originals.
// Printed temple codes/sizes and photographed colours are the only sources.
// Material is deliberately not inferred from appearance.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const project = path.resolve(root, '..');
const catalogPath = path.join(root, 'data/products.json');
const jsPath = path.join(root, 'data/products.js');
const manifestPath = path.join(root, 'data/asset-manifest.json');
const sourceRoot = path.join(project, 'Catalogo Champion/CH23-CH25 Dropbox Originales');
const measurements = { 23: '59-16-145', 24: '57-17-145', 25: '60-15-145' };
const variants = {
  23: [
    ['Negro', 'Black'], ['Champán y plateado', 'Champagne and silver'],
    ['Gris metalizado', 'Gunmetal'], ['Cobrizo y marrón', 'Copper and brown'],
  ],
  24: [
    ['Negro', 'Black'], ['Champán y plateado', 'Champagne and silver'],
    ['Gris metalizado', 'Gunmetal'], ['Marrón y verde', 'Brown and green'],
  ],
  25: [
    ['Negro', 'Black'], ['Champán y plateado', 'Champagne and silver'],
    ['Marrón y verde', 'Brown and green'], ['Azul', 'Blue'],
  ],
};
const views = [
  ['DIAGONAL_DERECHA', '01.webp'],
  ['DIAGONAL_IZQUIERDA', '02.webp'],
  ['FRONTAL', '03.webp'],
];

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const expectedIds = new Set();
const newProducts = [];
const newAssets = [];

for (let model = 23; model <= 25; model += 1) {
  for (let colorNumber = 1; colorNumber <= 4; colorNumber += 1) {
    const variant = `C${colorNumber}`;
    const id = `ch${model}-c${colorNumber}`;
    const displayModel = `CH-${model} ${variant}`;
    const [color, colorEn] = variants[model][colorNumber - 1];
    const sourceFolder = path.join(sourceRoot, `CH${model}`);
    const images = [];
    for (const [view, filename] of views) {
      const source = path.join(sourceFolder, `CH${model}_${variant}_${view}.png`);
      const target = `assets/images/optical/${id}/${filename}`;
      if (!fs.existsSync(source)) throw new Error(`Missing source ${source}`);
      if (!fs.existsSync(path.join(root, target))) throw new Error(`Missing web image ${target}`);
      images.push(target);
      newAssets.push({ family: 'optical', code: displayModel, role: view, source, target, maxWidth: 1500, maxHeight: 1150 });
    }
    expectedIds.add(id);
    newProducts.push({
      id, family: 'optical', collection: 'Optical', series: `CH${model}`,
      variant, model: `CH${model} ${variant}`, displayModel,
      color, measurements: measurements[model], material: 'No especificado',
      shape: 'Rectangular', lens: 'Montura óptica', protection: 'No especificado',
      // The inner temple shows exactly this sequence; it is not an invented SKU suffix.
      sku: `CH-${model} ${measurements[model].replace('-', '□')} ${variant}`,
      sourceInscription: `CH-${model} ${measurements[model].replace('-', '□')} ${variant}`,
      shortDescription: `${displayModel}: montura óptica rectangular en tonos ${color.toLowerCase()}.`,
      subline: `Montura Champion ${displayModel} con plaquetas ajustables y emblema C en la patilla.`,
      tags: ['Champion', 'Rectangular', color],
      about: {
        p1: `La ${displayModel} presenta un frente rectangular en tonos ${color.toLowerCase()}, plaquetas ajustables y el emblema C visible en la patilla.`,
        p2: `La inscripción interior indica CH-${model}, medida ${measurements[model]} y variante ${variant}. El material no está especificado en las imágenes de origen.`,
        bullets: [`Acabado ${color.toLowerCase()}`, 'Frente rectangular', 'Plaquetas ajustables', `Medida ${measurements[model]} inscrita en la patilla`],
      },
      locale: { en: {
        shortDescription: `${displayModel}: rectangular optical frame in ${colorEn.toLowerCase()} tones.`,
        subline: `Champion ${displayModel} frame with adjustable nose pads and a C emblem on the temple.`,
        about: {
          p1: `${displayModel} has a rectangular front in ${colorEn.toLowerCase()} tones, adjustable nose pads and a visible C emblem on the temple.`,
          p2: `The inner-temple marking reads CH-${model}, size ${measurements[model]} and variant ${variant}. The source images do not specify the material.`,
          bullets: [`${colorEn} finish`, 'Rectangular front', 'Adjustable nose pads', `Size ${measurements[model]} printed on the temple`],
        },
      } },
      cover: images[0], images,
      sourceFolder: path.relative(project, sourceFolder).replace(/\\/g, '/'),
    });
  }
}

if (newProducts.length !== 12 || newAssets.length !== 36) throw new Error('Incorrect CH23–CH25 counts');
const existingNew = catalog.products.filter((product) => expectedIds.has(product.id));
if (existingNew.length !== 0 && existingNew.length !== 12) {
  throw new Error(`Partial prior import: ${existingNew.length} of 12 variants; inspect before rerunning`);
}
catalog.products = catalog.products.filter((product) => !expectedIds.has(product.id));
const insertAt = catalog.products.findIndex((product) => product.family === 'sun');
if (insertAt < 0 || catalog.products[insertAt - 1]?.series !== 'CH22') {
  throw new Error('Expected CH22 immediately before the solar catalog');
}
catalog.products.splice(insertAt, 0, ...newProducts);
catalog.counts.optical = catalog.products.filter((product) => product.family === 'optical').length;
catalog.counts.sun = catalog.products.filter((product) => product.family === 'sun').length;
catalog.counts.total = catalog.products.length;
catalog.generatedAt = new Date().toISOString();
const newTargets = new Set(newAssets.map((asset) => asset.target));
const preservedAssets = manifest.filter((asset) => !newTargets.has(asset.target));
const targetSet = new Set(preservedAssets.map((asset) => asset.target));
for (const asset of newAssets) {
  if (targetSet.has(asset.target)) throw new Error(`Manifest target already exists: ${asset.target}`);
  preservedAssets.push(asset);
}

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
fs.writeFileSync(jsPath, `window.CHAMPION_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`, 'utf8');
fs.writeFileSync(manifestPath, `${JSON.stringify(preservedAssets, null, 2)}\n`, 'utf8');
console.log(`Added ${newProducts.length} variants and ${newAssets.length} verified images`);
