const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const championRoot = path.resolve(repoRoot, '..');
const sourceCode = path.join(championRoot, 'Codigos Champion', 'Catalogo');
const sourceImages = path.join(championRoot, 'Catalogo Champion');
const homeSource = path.join(sourceCode, 'Home.html');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.jfif', '.avif']);

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function normalizeCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/^CHS03\b/, 'CHS-03')
    .replace(/^CH010\b/, 'CH10')
    .replace(/[^A-Z0-9]/g, '');
}

function opticalSlug(code) {
  const match = normalizeCode(code).match(/^CH(\d{2})C([1-4])$/);
  if (!match) throw new Error(`Código óptico no válido: ${code}`);
  return `ch${match[1]}-c${match[2]}`;
}

function sunSlug(code) {
  const match = normalizeCode(code).match(/^CHS(\d{2})C([1-4])$/);
  if (!match) throw new Error(`Código solar no válido: ${code}`);
  return `chs-${match[1]}-c${match[2]}`;
}

function listFiles(directory, recursive = false) {
  if (!fs.existsSync(directory)) return [];
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory() && recursive) results.push(...listFiles(fullPath, true));
    if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) results.push(fullPath);
  }
  return results.sort(naturalCompare);
}

function listDirectories(directory, recursive = false) {
  if (!fs.existsSync(directory)) return [];
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(directory, entry.name);
    results.push(fullPath);
    if (recursive) results.push(...listDirectories(fullPath, true));
  }
  return results;
}

function findObjectLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`No se encontró ${marker}`);
  const start = source.indexOf('{', markerIndex + marker.length);
  if (start < 0) throw new Error(`No se encontró el objeto de ${marker}`);

  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Objeto incompleto: ${marker}`);
}

function readProductObject(file) {
  const source = fs.readFileSync(file, 'utf8');
  const literal = findObjectLiteral(source, 'const PRODUCT =');
  return vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1000 });
}

function parseHomeCards() {
  const source = fs.readFileSync(homeSource, 'utf8');
  const pattern = /<div class="model-card" id="([^"]+)">\s*<div class="model-img"><img src="([^"]+)" alt="([^"]+)"><\/div>\s*<div class="model-body">\s*<h4>([^<]+)<\/h4><p>([^<]+?)\s*•\s*([^<]+?)<br>([^<]+)<\/p>\s*<p class="meta-desc">([^<]+)<\/p>/g;
  const cards = new Map();
  let match;
  while ((match = pattern.exec(source))) {
    cards.set(normalizeCode(match[4]), {
      legacyId: match[1],
      remoteCover: match[2],
      displayCode: match[4].trim(),
      color: match[5].trim(),
      measurements: match[6].trim(),
      material: match[7].trim(),
      shortDescription: match[8].trim(),
    });
  }
  if (cards.size !== 64) throw new Error(`Se esperaban 64 tarjetas en Home.html y se encontraron ${cards.size}.`);
  return cards;
}

function seriesDirectory(seriesNumber) {
  const expected = seriesNumber === 10 ? 'CH010' : `CH${String(seriesNumber).padStart(2, '0')}`;
  const match = fs.readdirSync(sourceImages, { withFileTypes: true })
    .find((entry) => entry.isDirectory() && entry.name.toUpperCase() === expected);
  if (!match) throw new Error(`No existe la carpeta de la serie ${expected}.`);
  return path.join(sourceImages, match.name);
}

function findOpticalProductDirectory(seriesDir, code) {
  const target = normalizeCode(code);
  const match = fs.readdirSync(seriesDir, { withFileTypes: true })
    .find((entry) => entry.isDirectory() && normalizeCode(entry.name) === target);
  if (!match) throw new Error(`No existe la carpeta local de ${code} en ${seriesDir}.`);
  return path.join(seriesDir, match.name);
}

function selectNumberedViews(files) {
  const withoutGenerated = files.filter((file) => !/gemini|logo|portada/i.test(path.basename(file)));
  const candidates = withoutGenerated.length ? withoutGenerated : files;
  const byView = new Map();
  for (const file of candidates.sort(naturalCompare)) {
    const stem = path.basename(file, path.extname(file));
    const match = stem.match(/(?:^|[-_\s])(0?[1-9])(?:\D|$)/g);
    const last = match ? Number(match[match.length - 1].match(/\d+/)[0]) : null;
    if (last && last <= 6 && !byView.has(last)) byView.set(last, file);
  }
  const numbered = [...byView.entries()].sort((a, b) => a[0] - b[0]).map((entry) => entry[1]);
  // La portada pertenece exclusivamente a la tarjeta del catálogo. La ficha
  // utiliza las cuatro imágenes numeradas de la carpeta Listo/Final.
  if (numbered.length >= 4) return numbered.slice(0, 4);
  if (candidates.length >= 4) return candidates.slice(0, 4);
  return [];
}

function localOpticalImages(seriesNumber, code, slug, manifest) {
  const seriesDir = seriesDirectory(seriesNumber);
  const productDir = findOpticalProductDirectory(seriesDir, code);
  const descendants = listDirectories(productDir, true);
  const ready = descendants.find((directory) => path.basename(directory).toLowerCase() === 'listo');
  const finalDir = descendants.find((directory) => path.basename(directory).toLowerCase() === 'final');
  const detailSource = ready || finalDir || productDir;
  const views = selectNumberedViews(listFiles(detailSource, false));
  if (views.length !== 4) throw new Error(`${code} necesita exactamente cuatro imágenes en ${detailSource}.`);

  const coverDir = fs.readdirSync(seriesDir, { withFileTypes: true })
    .find((entry) => entry.isDirectory() && entry.name.toLowerCase() === 'portada');
  if (!coverDir) throw new Error(`${code} no tiene carpeta PORTADA.`);
  const coverFiles = listFiles(path.join(seriesDir, coverDir.name), false);
  const cover = coverFiles.find((file) => normalizeCode(path.basename(file, path.extname(file))) === normalizeCode(code));
  if (!cover) throw new Error(`No se encontró la portada local de ${code}.`);

  const coverTarget = `assets/images/optical/${slug}/cover-v3.webp`;
  manifest.push({ family: 'optical', code, role: 'cover', source: cover, target: coverTarget, maxWidth: 1000, maxHeight: 760 });
  const targets = views.map((source, index) => {
    const target = `assets/images/optical/${slug}/${String(index + 1).padStart(2, '0')}.webp`;
    manifest.push({ family: 'optical', code, role: 'gallery', source, target, maxWidth: 1500, maxHeight: 1150 });
    return target;
  });
  return { cover: coverTarget, images: targets, sourceFolder: path.relative(championRoot, detailSource).replace(/\\/g, '/') };
}

const sunColors = {
  'CHS-01 C1': 'Negro / lente azul espejado',
  'CHS-02 C1': 'Negro / lente humo',
  'CHS-02 C2': 'Negro / lente dorado espejado',
  'CHS-02 C3': 'Azul oscuro / lente azul espejado',
  'CHS-02 C4': 'Negro / lente verde espejado',
  'CHS-03 C1': 'Negro / lente dorado espejado',
  'CHS-04 C1': 'Negro / lente humo',
  'CHS-04 C2': 'Gunmetal / lente azul espejado',
  'CHS-04 C3': 'Gunmetal / lente dorado espejado',
  'CHS-04 C4': 'Gunmetal / lente verde espejado',
  'CHS-05 C1': 'Negro / lente azul-violeta espejado',
  'CHS-05 C2': 'Negro / lente humo',
  'CHS-05 C3': 'Negro / lente dorado espejado',
  'CHS-05 C4': 'Negro / lente verde-violeta espejado',
  'CHS-06 C1': 'Negro / lente dorado espejado',
  'CHS-06 C2': 'Negro / lente dorado-verde espejado',
  'CHS-06 C3': 'Cristal / lente azul espejado',
  'CHS-06 C4': 'Negro / lente verde-azul espejado',
  'CHS-07 C1': 'Negro / lente multicolor espejado',
  'CHS-07 C2': 'Negro / lente azul espejado',
  'CHS-07 C3': 'Azul marino / lente multicolor espejado',
  'CHS-08 C2': 'Negro / lente azul-violeta espejado',
  'CHS-08 C3': 'Azul marino / lente azul espejado',
  'CHS-09 C1': 'Negro / lente rojo-violeta espejado',
  'CHS-09 C2': 'Azul marino / lente azul espejado',
  'CHS-09 C3': 'Habana / lente dorado espejado',
  'CHS-10 C1': 'Negro / lente naranja-dorado espejado',
  'CHS-10 C2': 'Negro / lente verde-violeta espejado',
  'CHS-10 C3': 'Blanco / lente azul espejado',
};

function sunStyle(code) {
  const series = Number(code.match(/CHS-(\d{2})/)[1]);
  if ([7, 8, 9, 10].includes(series)) return 'Performance Shield';
  if (series === 4) return 'Sport Metal';
  return 'Sport Urban';
}

function sunShape(code) {
  const series = Number(code.match(/CHS-(\d{2})/)[1]);
  if ([7, 8, 9, 10].includes(series)) return 'Pantalla deportiva envolvente';
  if (series === 4) return 'Rectangular metálica';
  return 'Rectangular deportiva';
}

function productCodeFromSunFile(name) {
  const normalized = name.toUpperCase().replace(/^CHS03\b/, 'CHS-03');
  const match = normalized.match(/CHS-?(\d{2})\s+C([1-4])/);
  return match ? `CHS-${match[1]} C${match[2]}` : null;
}

function hashFile(file) {
  return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
}

function coverRank(file, code) {
  const stem = path.basename(file, path.extname(file)).toUpperCase().replace(/^CHS03\b/, 'CHS-03').trim();
  if (stem === code) return 0;
  if (stem.replace(/\s+/g, ' ') === code) return 1;
  if (!/[()]/.test(stem) && !/\s+[2-9]$/.test(stem)) return 2;
  return 3;
}

const sunCoverOverrides = {
  'CHS-01 C1': 'CHS-01 C1 3.png',
  'CHS-02 C3': 'CHS-02 C3 4.png',
  'CHS-03 C1': 'CHS03 C1 (3).png',
  'CHS-05 C1': 'CHS-05 C1 3.png',
  'CHS-06 C2': 'CHS-06 C2 2.png',
};

function selectSunProductFiles(files, code) {
  if (code === 'CHS-03 C1') {
    return files.filter((file) => path.basename(file).toUpperCase().startsWith('CHS03 C1'));
  }
  if (code === 'CHS-02 C3') {
    return files.filter((file) => path.basename(file).toUpperCase() !== 'CHS-02 C3 .PNG');
  }
  const strictPrefix = code.toUpperCase();
  const strictFiles = files.filter((file) => path.basename(file).toUpperCase().startsWith(strictPrefix));
  return strictFiles.length >= 4 ? strictFiles : files;
}

function selectSunCover(files, code) {
  const override = sunCoverOverrides[code];
  if (override) {
    const selected = files.find((file) => path.basename(file).toLowerCase() === override.toLowerCase());
    if (selected) return selected;
  }
  return [...files].sort((a, b) => coverRank(a, code) - coverRank(b, code) || naturalCompare(a, b))[0];
}

function buildSunProducts(manifest) {
  const skuDir = path.join(sourceImages, 'Lentes de sol', 'SKU');
  const groups = new Map();
  for (const file of listFiles(skuDir, false)) {
    if (/^LOGO/i.test(path.basename(file))) continue;
    const code = productCodeFromSunFile(path.basename(file));
    if (!code) continue;
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(file);
  }

  return [...groups.entries()].sort((a, b) => naturalCompare(a[0], b[0])).map(([code, files]) => {
    const slug = sunSlug(code);
    const productFiles = selectSunProductFiles(files, code);
    const unique = [];
    const seen = new Set();
    for (const file of productFiles.sort(naturalCompare)) {
      const hash = hashFile(file);
      if (seen.has(hash)) continue;
      seen.add(hash);
      unique.push(file);
    }
    const cover = selectSunCover(unique, code);
    const detailViews = unique.filter((file) => file !== cover).slice(0, 3);
    const coverTarget = `assets/images/sun/${slug}/cover-v2.webp`;
    manifest.push({ family: 'sun', code, role: 'cover', source: cover, target: coverTarget, maxWidth: 1100, maxHeight: 800 });
    const imageTargets = detailViews.map((source, index) => {
      const target = `assets/images/sun/${slug}/${String(index + 1).padStart(2, '0')}-v2.webp`;
      manifest.push({ family: 'sun', code, role: 'gallery', source, target, maxWidth: 1500, maxHeight: 1100 });
      return target;
    });
    const style = sunStyle(code);
    const color = sunColors[code] || `Variante ${code.split(' ')[1]}`;
    const series = code.split(' ')[0];
    const variant = code.split(' ')[1];
    return {
      id: slug,
      family: 'sun',
      collection: style,
      series,
      variant,
      model: code,
      displayModel: code,
      color,
      measurements: 'Por confirmar con Innova',
      material: 'Material técnico de alta resistencia',
      shape: sunShape(code),
      lens: color.includes('humo') ? 'Lente solar humo' : 'Lente solar espejado',
      protection: 'Categoría UV por confirmar con Innova',
      sku: `${series}-${variant}`,
      shortDescription: `${sunShape(code)} con identidad Champion y acabado ${color.toLowerCase()}.`,
      subline: `${code} de la colección solar Champion, desarrollada para vitrinas deportivas y urbanas de alta rotación.`,
      tags: ['Champion Sun', style, 'Colección solar', variant],
      about: {
        p1: `El ${code} combina una silueta ${sunShape(code).toLowerCase()} con ${color.toLowerCase()}, aportando presencia inmediata en exhibición.`,
        p2: 'Referencia preparada para consulta mayorista. Precio, disponibilidad, protección UV y condiciones comerciales se confirman directamente con Innova Eyewear.',
        bullets: [color, sunShape(code), 'Presentación B2B para ópticas', 'Disponibilidad sujeta a confirmación'],
      },
      cover: coverTarget,
      images: imageTargets,
      sourceFolder: 'Catalogo Champion/Lentes de sol/SKU',
    };
  });
}

function buildOpticalProducts(manifest) {
  const homeCards = parseHomeCards();
  const products = [];
  for (let seriesNumber = 1; seriesNumber <= 16; seriesNumber += 1) {
    const series = `CH${String(seriesNumber).padStart(2, '0')}`;
    const sourceFile = path.join(sourceCode, `${series} - C1.html`);
    const object = readProductObject(sourceFile);
    for (const [key, sourceProduct] of Object.entries(object)) {
      const card = homeCards.get(normalizeCode(key));
      if (!card) throw new Error(`Faltan datos de portada para ${key}.`);
      const slug = opticalSlug(key);
      const local = localOpticalImages(seriesNumber, sourceProduct.title, slug, manifest);
      const collection = card.material.toLowerCase().includes('stainless')
        ? 'Steel'
        : card.material.toLowerCase().includes('acetate')
          ? 'Bold'
          : 'Flex';
      products.push({
        id: slug,
        family: 'optical',
        collection,
        series,
        variant: sourceProduct.title.split(' ')[1],
        model: sourceProduct.title,
        displayModel: card.displayCode,
        color: card.color,
        measurements: card.measurements,
        material: card.material,
        shape: sourceProduct.tags.find((tag) => !/champion|premium|clásico|moderno|minimal|elegante|uso diario|exclusivo/i.test(tag)) || 'Oftálmica',
        lens: 'Montura óptica',
        protection: 'Compatible con lentes graduadas',
        sku: sourceProduct.specs.sku,
        shortDescription: card.shortDescription,
        subline: sourceProduct.subline,
        tags: sourceProduct.tags,
        about: sourceProduct.about,
        cover: local.cover,
        images: local.images,
        sourceFolder: local.sourceFolder,
      });
    }
  }
  return products.sort((a, b) => naturalCompare(a.model, b.model));
}

const manifest = [];
const optical = buildOpticalProducts(manifest);
const sun = buildSunProducts(manifest);

const logoSource = path.join(championRoot, 'Logo', 'logo champion.png');
const logoTarget = 'assets/images/brand/champion-logo.webp';
manifest.push({ family: 'brand', code: 'Champion', role: 'logo', source: logoSource, target: logoTarget, maxWidth: 700, maxHeight: 260 });

const catalog = {
  generatedAt: new Date().toISOString(),
  contact: {
    company: 'Innova Eyewear',
    whatsapp: '17542360600',
    email: 'sales@innova-eyewear.com',
  },
  counts: { optical: optical.length, sun: sun.length, total: optical.length + sun.length },
  products: [...optical, ...sun],
};

fs.mkdirSync(path.join(repoRoot, 'data'), { recursive: true });
fs.writeFileSync(path.join(repoRoot, 'data', 'products.json'), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(repoRoot, 'data', 'products.js'), `window.CHAMPION_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`, 'utf8');
fs.writeFileSync(path.join(repoRoot, 'data', 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Catálogo generado: ${optical.length} monturas + ${sun.length} lentes de sol = ${catalog.counts.total} productos.`);
console.log(`Recursos locales preparados para procesar: ${manifest.length}.`);
