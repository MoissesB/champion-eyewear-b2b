# Sitio web Champion

Reconstrucción estática del catálogo publicado en `distribuciones.champion-innova.com`.

## Contenido

- `index.html`: página principal y catálogo completo.
- `ch01-c1.html` … `ch16-c4.html`: 64 fichas independientes.
- `scripts/importar-catalogo.ps1`: vuelve a importar las fuentes originales desde `Codigos Champion/Catalogo` y normaliza la navegación local.
- `scripts/validar.ps1`: comprueba páginas, modelos, enlaces internos y vídeos.

## Vista local

Abra esta carpeta con Live Server o ejecute un servidor HTTP desde la raíz del repositorio. Por ejemplo:

```powershell
python -m http.server 8080
```

Después visite `http://localhost:8080/`.

No abra las fichas únicamente con doble clic: un servidor local reproduce mejor el comportamiento que tendrá el sitio publicado.

## Actualizar una ficha

1. Abra el HTML del producto, por ejemplo `ch08-c3.html`.
2. Modifique el bloque `PRODUCT` correspondiente. Ahí están título, descripción B2B, etiquetas, ficha técnica, SKU e imágenes.
3. Compruebe que `currentModel` y la llamada inicial a `setModel(...)` coinciden con el nombre del archivo.
4. Ejecute `powershell -ExecutionPolicy Bypass -File .\scripts\validar.ps1`.
5. Revise visualmente la portada y la ficha modificada antes de publicar.

## Añadir productos

Las fichas comparten la misma estructura visual. Para una nueva colección, duplique la ficha más cercana, sustituya los datos e imágenes del bloque `PRODUCT`, ajuste los productos similares y añada la tarjeta correspondiente a `index.html`.

La futura colección de lentes de sol está fuera de esta primera reconstrucción. Sus originales permanecen en `Catalogo Champion/Lentes de sol` para incorporarlos en una actualización separada.

## Medios

Esta versión conserva las URLs de imágenes y vídeos que usa el sitio publicado. Es la forma más fiel de reproducirlo y evita añadir al repositorio los originales de `Catalogo Champion`, que ocupan aproximadamente 1,86 GB e incluyen un ZIP de 139 MB que supera el límite normal por archivo de GitHub.

Los originales maestros no se modifican. Si más adelante se desea alojar los medios dentro del repositorio, deben exportarse en formatos web optimizados y guardarse en una carpeta `assets/`.

