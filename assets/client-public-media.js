import JSZip from 'jszip';

const safeSegment = (value) => String(value || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-]+/g, '_').replace(/^_+|_+$/g, '');

export async function catalogImagePng(blob) {
  if (blob.type === 'image/png') return blob;
  if (!blob.type.startsWith('image/')) throw new Error('El archivo del modelo no es una imagen.');
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!png || png.type !== 'image/png') throw new Error('No se pudo convertir la imagen a PNG.');
    return png;
  } finally {
    bitmap.close();
  }
}

export function collectPublicFiles(selected, catalog, marketing, publicMedia, language) {
  const files = [];
  const addImage = (product, image, folder) => files.push({
    url: publicMedia.catalogImages[image.id],
    path: `${folder}/${safeSegment(product.sku)}__${safeSegment(product.color)}/${image.web.name.replace(/\.[^.]+$/, `__${safeSegment(image.label[language])}.png`)}`,
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
        id, description: publicMedia.videoDetails?.[id]?.description?.[language] || video.description[language], source: 'GoHighLevel'});
    } else if (type === 'drivevideo') {
      const video = publicMedia.driveVideos.find((item) => item.id === id);
      if (!video) throw new Error(`Video desconocido: ${id}`);
      files.push({url: video.url, path: `Videos_de_campana/${safeSegment(video.title[language])}_${id}.mp4`,
        type: 'video', id, description: video.description[language], source: 'Champion'});
    } else if (type === 'instagram') {
      const media = publicMedia.instagram.find((item) => item.id === id);
      if (!media) throw new Error(`Archivo desconocido: ${id}`);
      files.push({url: media.url, path: `${media.type === 'video' ? 'Videos' : 'Imagenes_para_redes'}/${media.name}`, type: media.type,
        id, description: media.type === 'video' ? (publicMedia.videoDetails?.[id]?.description?.[language] || 'Video Champion') : 'Imagen Champion para redes', source: 'Champion'});
    } else if (type === 'carousel') {
      const carousel = publicMedia.carousels.find((item) => item.id === id);
      if (!carousel) throw new Error(`Carrusel desconocido: ${id}`);
      carousel.slides.forEach((slide,index) => files.push({url: slide.url,
        path: `Carruseles/${safeSegment(carousel.title[language])}/${String(index+1).padStart(2,'0')}_${safeSegment(carousel.title[language])}.png`,
        type: 'imagen_social', id: slide.id, description: slide.description[language], source: 'Champion'}));
    } else if (type === 'logo') {
      const logo = publicMedia.logos.find((item) => item.id === id);
      if (!logo) throw new Error(`Logo desconocido: ${id}`);
      files.push({url: logo.url, path: `Logos/${logo.name}`, type: 'logo',
        id, description: logo.title[language], source: 'Champion'});
    } else if (type === 'marketing') {
      const media = marketing.items.find((item) => item.id === id);
      if (!media) throw new Error(`Campaña desconocida: ${id}`);
      files.push({url: media.url, path: `Artes_de_campana/${safeSegment(media.title[language])}_${id}.png`, type: 'campana',
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
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    onProgress(index + 1, files.length);
    const response = await fetch(file.url);
    if (!response.ok) throw new Error(`No se pudo obtener ${file.id} de GoHighLevel.`);
    const source = await response.blob();
    const blob = file.type === 'imagen' ? await catalogImagePng(source) : source;
    folder.file(file.path, blob, {binary: true});
  }
  return zip.generateAsync({type: 'blob', compression: 'STORE', streamFiles: true});
}
