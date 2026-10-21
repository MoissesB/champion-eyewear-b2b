import JSZip from 'jszip';

const csv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function collectPublicFiles(selected, catalog, marketing, publicMedia, language) {
  const files = [];
  const addImage = (product, image, folder) => files.push({
    url: publicMedia.catalogImages[image.id],
    path: `${folder}/${product.sku}/${image.web.name}`,
    type: 'imagen', id: image.id, model: product.model, sku: product.sku,
    description: image.description[language], color: product.color,
    material: product.material, measurements: product.measurements,
    width: image.web.width, height: image.web.height, source: 'GoHighLevel',
  });
  for (const key of selected) {
    const [type, id] = key.split(':');
    if (type === 'model') {
      const product = catalog.products.find((item) => item.id === id);
      if (!product) throw new Error(`Modelo desconocido: ${id}`);
      product.images.forEach((image) => addImage(product, image, 'Modelos'));
    } else if (type === 'image') {
      if (id.endsWith('-original')) throw new Error('El original privado todavía no está disponible.');
      const imageId = id.replace(/-web$/, '');
      const product = catalog.products.find((item) => item.images.some((image) => image.id === imageId));
      const image = product?.images.find((item) => item.id === imageId);
      if (!image) throw new Error(`Imagen desconocida: ${id}`);
      addImage(product, image, 'Fotos');
    } else if (type === 'video') {
      const video = catalog.videos.find((item) => item.id === id);
      if (!video) throw new Error(`Video desconocido: ${id}`);
      files.push({url: publicMedia.videos[id], path: `Videos/${id}.mp4`, type: 'video',
        id, description: video.description[language], source: 'GoHighLevel'});
    } else if (type === 'instagram') {
      const media = publicMedia.instagram.find((item) => item.id === id);
      if (!media) throw new Error(`Archivo desconocido: ${id}`);
      files.push({url: media.url, path: `Instagram/${media.name}`, type: media.type,
        id, description: `Archivo publicado por Champion en Instagram · ${id}`, source: 'GoHighLevel'});
    } else if (type === 'marketing') {
      const media = marketing.items.find((item) => item.id === id);
      if (!media) throw new Error(`Campaña desconocida: ${id}`);
      files.push({url: media.preview, path: `Campanas/${id}.jpg`, type: 'campana',
        id, description: media.description[language], width: media.width,
        height: media.height, source: 'Champion'});
    } else throw new Error(`Recurso desconocido: ${key}`);
  }
  if (files.some((file) => !file.url)) throw new Error('Falta un archivo de GoHighLevel.');
  return [...new Map(files.map((file) => [file.path, file])).values()];
}

export async function createPublicBundle(files, onProgress = () => {}) {
  const zip = new JSZip();
  const folder = zip.folder(`Champion_Recursos_${new Date().toISOString().slice(0, 10)}`);
  const headers = ['carpeta', 'tipo', 'id', 'modelo', 'SKU', 'descripcion', 'color',
    'material', 'medidas', 'ancho_px', 'alto_px', 'fuente', 'url_fuente', 'bytes'];
  const rows = [headers];
  const inventory = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    onProgress(index + 1, files.length);
    const response = await fetch(file.url);
    if (!response.ok) throw new Error(`No se pudo obtener ${file.id} de GoHighLevel.`);
    const blob = await response.blob();
    folder.file(file.path, blob, {binary: true});
    inventory.push({...file, bytes: blob.size});
    rows.push([file.path, file.type, file.id, file.model, file.sku,
      file.description, file.color, file.material, file.measurements,
      file.width, file.height, file.source, file.url, blob.size]);
  }
  folder.file('inventario.csv', `\uFEFF${rows.map((row) => row.map(csv).join(';')).join('\r\n')}`);
  folder.file('inventario.json', JSON.stringify(inventory, null, 2));
  folder.file('LEEME.txt', 'Champion Eyewear | Recursos digitales para ópticas\r\n'
    + 'Los inventarios CSV y JSON detallan cada archivo. Este ZIP no incluye originales de alta resolución.\r\n');
  return zip.generateAsync({type: 'blob', compression: 'STORE', streamFiles: true});
}
