# Champion Eyewear — catálogo B2B

Reconstrucción del catálogo de Champion distribuido por Innova Eyewear. El sitio es estático, funciona en cualquier hosting web y evita mantener un HTML completo por producto.

## Arquitectura

- `index.html`: portada, buscadores y catálogos de monturas y lentes de sol.
- `product.html?id=…`: única plantilla para las 93 fichas de producto.
- `data/products.json`: fuente de datos editable (64 monturas + 29 lentes de sol).
- `data/products.js`: versión del catálogo que consume el navegador sin backend.
- `assets/images/`: 474 imágenes WebP optimizadas desde los originales locales.
- `assets/images/brand/champion-social.png`: imagen social de presentación del catálogo.
- `assets/home.js`: filtros, buscadores y tarjetas del catálogo.
- `assets/product.js`: carga la ficha solicitada dentro de la plantilla única.
- `assets/request.js`: selección profesional, cantidades, CSV, WhatsApp, correo y compartir.
- `scripts/generar-catalogo.cjs`: reconstruye los datos y el manifiesto desde las carpetas fuente.
- `scripts/preparar-imagenes.py`: exporta los originales a formatos web optimizados.
- `scripts/validar.ps1`: verifica arquitectura, datos y recursos locales.
- `scripts/build-sites.cjs`: prepara la distribución estática y el adaptador de hosting.

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

## Solicitud profesional B2B

La selección se guarda en el navegador del usuario. Puede:

- definir cantidades por referencia;
- completar los datos profesionales del cliente;
- descargar un CSV compatible con Excel;
- compartir el CSV como archivo cuando el dispositivo lo permite;
- preparar un mensaje profesional para WhatsApp o correo a Innova.

WhatsApp y `mailto:` no pueden adjuntar archivos automáticamente desde un navegador por motivos de seguridad. Por eso el sitio descarga el CSV y abre el mensaje preparado para que el usuario lo adjunte. En móviles compatibles, **Compartir archivo** sí entrega el CSV directamente al selector del sistema.

## Validación

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validar.ps1
```

El validador comprueba que solo haya una plantilla de producto, que estén los 93 productos esperados y que todas las imágenes referenciadas existan dentro del repositorio.

Para preparar una versión publicable:

```powershell
npm run build
```
