# Evidencia local: publicaciones individuales del blog Champion

Fecha: 8 de agosto de 2026  
Estado: implementado y validado únicamente en local  
Publicación/despliegue: no realizado

## Alcance implementado

- `blog.html` funciona como listado de publicaciones con portada real, título, meta descripción y enlace individual.
- Se crearon tres URLs propias bajo `blog/` con contenido B2B para ópticas centrado exclusivamente en lentes de sol.
- Cada artículo conserva como portada la imagen `front.webp` del modelo real.
- Cada artículo incluye dos vistas adicionales del mismo registro de producto para dividir la lectura.
- No se usaron imágenes genéricas, recursos de IA ni imágenes de modelos distintos.

## Trazabilidad de imágenes

| Artículo | Modelo | Portada | Detalles internos |
|---|---|---|---|
| Selección de lentes de sol | CHS-02 C3 | `assets/producto-de-lentes-de-sol/chs-02-c3/front.webp` | `02.webp`, `04.webp` de la misma carpeta/modelo |
| Siluetas deportivas | CHS-07 C1 | `assets/producto-de-lentes-de-sol/chs-07-c1/front.webp` | `02.webp`, `04.webp` de la misma carpeta/modelo |
| Exhibición en ópticas | CHS-10 C3 | `assets/producto-de-lentes-de-sol/chs-10-c3/front.webp` | `02.webp`, `04.webp` de la misma carpeta/modelo |

La búsqueda local por nombre exacto de modelo encontró archivos de catálogo/SKU y fuentes RAW para estas referencias, pero no piezas identificables y verificables como imágenes de marketing del mismo modelo. Por esa razón, las seis imágenes internas se clasificaron explícitamente como `catalog-detail`. Todas pertenecen a la galería del mismo producto declarada en `data/products.json`.

`data/blog-posts.json` registra por publicación la portada, las dos imágenes internas, el modelo y el tipo de recurso. La validación falla si una imagen interna no pertenece a la galería del mismo modelo, repite la portada, falta físicamente o no aparece dentro del artículo.

## Rutas locales verificadas

- `http://127.0.0.1:4176/blog.html`
- `http://127.0.0.1:4176/blog/seleccion-lentes-sol-para-opticas.html`
- `http://127.0.0.1:4176/blog/lentes-sol-deportivos-vitrina-optica.html`
- `http://127.0.0.1:4176/blog/exhibir-lentes-sol-champion-optica.html`

Las cuatro rutas respondieron HTTP 200.

## Validaciones ejecutadas

- Build local: `optimize-ok`, `seo-ok (106 URLs; 100 enlaces estáticos; sin lastmod artificial)` y `build-ok`.
- Validación automatizada: `validación-ok (100 productos; 2 HTML de catálogo; blog con 3 publicaciones individuales; 1050 imágenes WebP; 1 plantilla de producto)`.
- Navegador local: dos imágenes internas por artículo, modelo y tipo de recurso coherentes, carga diferida correcta al avanzar en la lectura y cero errores/advertencias de consola observados.
- Revisión responsive: una columna en móvil, imágenes contenidas y sin desbordamiento horizontal.
- Metadatos: meta descripción, canonical, Open Graph e imagen social validados en cada URL individual.

## Próximo gate

Aplicar el ajuste visual/editorial final cuando Moisses aporte la publicación de referencia. Mantener el trabajo local hasta nueva aprobación explícita para publicar o desplegar.
