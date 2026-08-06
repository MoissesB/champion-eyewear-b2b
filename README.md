# Champion Eyewear — catálogo profesional

Reconstrucción del catálogo de Champion distribuido por Innova Eyewear. El sitio es estático, funciona en cualquier hosting web y evita mantener un HTML completo por producto.

## Arquitectura

- `index.html`: portada, buscadores y catálogos de monturas y lentes de sol.
- `product.html?id=…`: única plantilla para las 100 fichas de producto.
- `data/products.json`: fuente de datos editable (64 monturas + 36 lentes de sol).
- `data/products.js`: versión del catálogo que consume el navegador sin backend.
- `assets/producto-de-lentes-de-sol/`: carpeta incorporada al proyecto con 36 referencias solares; cada modelo conserva `front.webp` como portada y tres vistas adicionales.
- `assets/images/`: recursos de marca y monturas WebP optimizados desde los originales locales.
- `assets/images/brand/champion-social.png`: imagen social de presentación del catálogo.
- `assets/i18n.js`: traducción ES/EN, preguntas frecuentes y explicación de cada colección.
- `assets/home.js`: filtros, buscadores, explicaciones contextuales y tarjetas del catálogo.
- `assets/product.js`: carga y traduce la ficha solicitada dentro de la plantilla única.
- `assets/request.js`: selección profesional, mínimo de 24 piezas, PDF, CSV, WhatsApp y correo.
- `assets/images/brand/champion-header.png`: logotipo oficial de cabecera.
- `assets/images/brand/innova-logo.png`: logotipo de Innova incluido en los PDF.
- `scripts/generar-catalogo.cjs`: reconstruye los datos y el manifiesto desde las carpetas fuente.
- `scripts/preparar-imagenes.py`: exporta los originales a formatos web optimizados.
- `scripts/generate-sitemap.cjs`: genera `robots.txt`, `sitemap.xml` y `catalogo.html` desde los 100 IDs válidos, sin fechas `lastmod` artificiales.
- `scripts/validar.ps1`: verifica arquitectura, datos y recursos locales.
- `scripts/build-sites.cjs`: prepara la distribución estática y el adaptador de hosting.
- `404.html`: respuesta visible y no indexable para rutas o referencias inexistentes.

## Vista local

Desde esta carpeta:

```powershell
python -m http.server 8080
```

Después visite `http://localhost:8080/`. Para abrir una referencia directamente, use por ejemplo:

```text
http://localhost:8080/product.html?id=chs-07-c2
```

## Actualizar un producto

Edite el objeto correspondiente en `data/products.json` y mantenga sincronizado `data/products.js`. Los datos incluyen modelo, SKU, colección, color, material, medidas, descripción, imágenes y carpeta fuente.

Cuando los cambios procedan de las carpetas maestras, es preferible ejecutar el generador y el optimizador incluidos. Estos scripts no modifican los originales de `Catalogo Champion`.

## Pedido profesional para ópticas

La selección se guarda en el navegador del usuario. Puede:

- definir cantidades por referencia;
- comprobar el mínimo inicial de 24 piezas;
- completar nombre, empresa, óptica, correo, teléfono, ciudad y país;
- generar un PDF con número de pedido, logotipos, imágenes y detalles de productos;
- preparar un CSV operativo y un correo profesional para Innova;
- abrir un mensaje de WhatsApp con todos los datos y la selección en texto.

El sitio publica únicamente el requisito de pedido inicial mínimo de 24 piezas; las condiciones finales dependen de la validación comercial de Innova.

WhatsApp y `mailto:` no pueden adjuntar archivos automáticamente desde un navegador por motivos de seguridad. Por eso WhatsApp descarga el PDF y abre el texto preparado; correo descarga el PDF y el CSV y abre el mensaje para que el usuario adjunte ambos archivos.

## Validación

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validar.ps1
```

El validador comprueba que solo haya una plantilla de producto, que estén los 100 productos esperados, que todas las imágenes referenciadas existan y que las señales de rastreo, canonicalización y 404 sean coherentes.

Para preparar una versión publicable:

```powershell
npm run build
```

El build regenera el sitemap, `robots.txt`, el índice HTML estático y el worker con la lista de IDs válidos. En GitHub Pages, la redirección HTTP→HTTPS depende además de activar `Enforce HTTPS` en la configuración externa del repositorio.
