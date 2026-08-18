$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$failures = New-Object System.Collections.Generic.List[string]

function Require-File([string]$relativePath) {
  $absolutePath = Join-Path $repoRoot $relativePath
  if (-not (Test-Path -LiteralPath $absolutePath -PathType Leaf)) {
    $failures.Add("Falta $relativePath") | Out-Null
  }
}

$requiredFiles = @(
  "index.html",
  "product.html",
  "catalogo.html",
  "blog.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "scripts/generate-sitemap.cjs",
  "data/products.json",
  "data/blog-posts.json",
  "data/products.js",
  "data/products.min.js",
  "assets/styles.css",
  "assets/styles.min.css",
  "assets/i18n.js",
  "assets/i18n.min.js",
  "assets/audience.js",
  "assets/audience.min.js",
  "assets/audience.css",
  "assets/audience.min.css",
  "assets/interest.js",
  "assets/interest.min.js",
  "assets/bootstrap.js",
  "assets/bootstrap.min.js",
  "assets/home.js",
  "assets/home.min.js",
  "assets/product.js",
  "assets/product.min.js",
  "assets/request-loader.js",
  "assets/request-loader.min.js",
  "assets/request.js",
  "assets/request.min.js",
  "assets/vendor/jspdf.umd.min.js",
  "assets/images/brand/champion-header.png",
  "assets/images/brand/champion-header-display.webp",
  "assets/images/brand/innova-logo.png",
  "assets/images/brand/favicon-32.png",
  "assets/images/brand/favicon-192.png",
  "assets/images/brand/apple-touch-icon.png",
  "assets/fonts/inter-latin-variable.woff2",
  "assets/fonts/barlow-condensed-800-latin.woff2",
  "assets/video/champion-hero.mp4",
  "favicon.ico"
)
$requiredFiles | ForEach-Object { Require-File $_ }

$legacyPages = Get-ChildItem -LiteralPath $repoRoot -File | Where-Object {
  $_.Name -match '^ch\d{2}-c[1-4]\.html$'
}
if ($legacyPages.Count -gt 0) {
  $failures.Add("Hay $($legacyPages.Count) fichas HTML duplicadas; solo debe existir product.html") | Out-Null
}

$catalogPath = Join-Path $repoRoot "data/products.json"
if (Test-Path -LiteralPath $catalogPath -PathType Leaf) {
  try {
    $catalog = [System.IO.File]::ReadAllText($catalogPath, $utf8) | ConvertFrom-Json
    $products = @($catalog.products)
    $optical = @($products | Where-Object family -eq "optical")
    $sun = @($products | Where-Object family -eq "sun")

    if ($products.Count -ne 100) { $failures.Add("Se esperaban 100 productos y se encontraron $($products.Count)") | Out-Null }
    if ($optical.Count -ne 64) { $failures.Add("Se esperaban 64 monturas y se encontraron $($optical.Count)") | Out-Null }
    if ($sun.Count -ne 36) { $failures.Add("Se esperaban 36 solares y se encontraron $($sun.Count)") | Out-Null }

    $duplicateIds = $products | Group-Object id | Where-Object Count -gt 1
    if ($duplicateIds) { $failures.Add("Hay identificadores de producto duplicados") | Out-Null }

    foreach ($product in $products) {
      foreach ($field in @("id", "model", "sku", "family", "collection", "color", "cover")) {
        if ([string]::IsNullOrWhiteSpace([string]$product.$field)) {
          $failures.Add("Producto $($product.id): falta $field") | Out-Null
        }
      }

      $gallery = @($product.images)
      $media = @($product.cover) + $gallery
      if ($gallery.Count -lt 1) { $failures.Add("Producto $($product.id): faltan vistas internas") | Out-Null }
      if (($media | Sort-Object -Unique).Count -ne $media.Count) { $failures.Add("Producto $($product.id): tiene vistas duplicadas") | Out-Null }
      if ($product.family -eq "optical" -and $gallery.Count -ne 4) { $failures.Add("Producto $($product.id): la carpeta Listo no aporta exactamente cuatro vistas internas") | Out-Null }
      if ($product.family -eq "optical" -and $product.cover -in $gallery) { $failures.Add("Producto $($product.id): la portada no puede formar parte de la galería interna") | Out-Null }
      if ($product.family -eq "sun" -and $media.Count -ne 4) { $failures.Add("Producto $($product.id): el solar no tiene exactamente cuatro vistas, incluida la portada front") | Out-Null }
      if ($product.family -eq "sun" -and [string]$product.cover -notmatch '^assets/producto-de-lentes-de-sol/[^/]+/front\.webp$') {
        $failures.Add("Producto $($product.id): la portada solar no corresponde a su imagen front") | Out-Null
      }
      if ($product.family -eq "sun" -and [string]$product.sourceFolder -notmatch '^assets/producto-de-lentes-de-sol/[^/]+$') {
        $failures.Add("Producto $($product.id): la carpeta solar no está incluida dentro del proyecto") | Out-Null
      }
      foreach ($relativeAsset in ($media | Sort-Object -Unique)) {
        $normalizedAsset = [string]$relativeAsset -replace '/', [IO.Path]::DirectorySeparatorChar
        $assetPath = Join-Path $repoRoot $normalizedAsset
        if (-not (Test-Path -LiteralPath $assetPath -PathType Leaf)) {
          $failures.Add("Producto $($product.id): no existe $relativeAsset") | Out-Null
        }
      }
    }
  }
  catch {
    $failures.Add("No se pudo leer data/products.json: $($_.Exception.Message)") | Out-Null
  }
}

foreach ($htmlName in @("index.html", "product.html")) {
  $htmlPath = Join-Path $repoRoot $htmlName
  if (-not (Test-Path -LiteralPath $htmlPath -PathType Leaf)) { continue }
  $html = [System.IO.File]::ReadAllText($htmlPath, $utf8)
  $usesBootstrap = $html -match 'assets/bootstrap(?:\.min)?\.js'
  if ($html -notmatch '(?i)<!doctype html>') { $failures.Add("${htmlName}: falta <!doctype html>") | Out-Null }
  if ($html -notmatch 'data/products(?:\.min)?\.js' -and -not $usesBootstrap) { $failures.Add("${htmlName}: no carga el catálogo estructurado") | Out-Null }
  if ($html -notmatch 'assets/request(?:-loader)?(?:\.min)?\.js' -and -not $usesBootstrap) { $failures.Add("${htmlName}: no carga la solicitud B2B") | Out-Null }
  if (($html -notmatch 'assets/i18n(?:\.min)?\.js' -and -not $usesBootstrap) -or $html -notmatch 'data-language-toggle') { $failures.Add("${htmlName}: falta la traducción ES/EN") | Out-Null }
  if ($html -match 'jspdf\.umd\.min\.js') { $failures.Add("${htmlName}: el generador PDF no debe bloquear la carga inicial") | Out-Null }
  if ($html -notmatch 'champion-header-display\.webp') { $failures.Add("${htmlName}: no usa el logotipo optimizado de cabecera") | Out-Null }
  if ($html -notmatch 'assets/audience(?:\.min)?\.js' -or $html -notmatch 'assets/audience(?:\.min)?\.css') { $failures.Add("${htmlName}: falta la compuerta B2C/B2B") | Out-Null }
  if ($html -notmatch 'favicon\.ico' -or $html -notmatch 'apple-touch-icon\.png') { $failures.Add("${htmlName}: falta el icono del navegador") | Out-Null }
}

$indexPath = Join-Path $repoRoot "index.html"
if (Test-Path -LiteralPath $indexPath -PathType Leaf) {
  $indexHtml = [System.IO.File]::ReadAllText($indexPath, $utf8)
  if ($indexHtml -notmatch '<link\s+rel="canonical"\s+href="https://champion-innova\.com/">') {
    $failures.Add("index.html: falta el canonical absoluto de la portada") | Out-Null
  }
  if ($indexHtml -notmatch 'href="\./catalogo\.html"') {
    $failures.Add("index.html: falta el enlace estático al índice completo") | Out-Null
  }
  if (([regex]::Matches($indexHtml, 'href="\./blog\.html"')).Count -lt 3) {
    $failures.Add("index.html: el blog debe estar visible en la navegación de escritorio, la navegación móvil y el pie") | Out-Null
  }
}

$blogPosts = @()
$blogDataPath = Join-Path $repoRoot "data/blog-posts.json"
if (Test-Path -LiteralPath $blogDataPath -PathType Leaf) {
  try {
    $blogData = [System.IO.File]::ReadAllText($blogDataPath, $utf8) | ConvertFrom-Json
    $blogPosts = @($blogData.posts)
    if ($blogPosts.Count -ne 3) { $failures.Add("data/blog-posts.json: se esperaban exactamente tres publicaciones") | Out-Null }
    if (($blogPosts.slug | Sort-Object -Unique).Count -ne $blogPosts.Count) { $failures.Add("data/blog-posts.json: contiene slugs duplicados") | Out-Null }
  }
  catch {
    $failures.Add("No se pudo leer data/blog-posts.json: $($_.Exception.Message)") | Out-Null
  }
}

$blogPath = Join-Path $repoRoot "blog.html"
if (Test-Path -LiteralPath $blogPath -PathType Leaf) {
  $blogHtml = [System.IO.File]::ReadAllText($blogPath, $utf8)
  if ($blogHtml -notmatch '(?i)<!doctype html>') { $failures.Add("blog.html: falta <!doctype html>") | Out-Null }
  if ($blogHtml -notmatch '<link\s+rel="canonical"\s+href="https://champion-innova\.com/blog\.html">') {
    $failures.Add("blog.html: falta el canonical absoluto") | Out-Null
  }
  if ($blogHtml -match '<meta\s+name="robots"\s+content="noindex') {
    $failures.Add("blog.html: no puede usar noindex si forma parte del sitemap") | Out-Null
  }
  if ($blogHtml -notmatch 'data-menu-toggle' -or $blogHtml -notmatch 'id="mobileNav"') {
    $failures.Add("blog.html: falta la navegación móvil accesible") | Out-Null
  }
  if (([regex]::Matches($blogHtml, 'href="\./blog\.html"')).Count -lt 3) {
    $failures.Add("blog.html: el blog debe permanecer visible en su navegación y pie") | Out-Null
  }
}

$catalogMedia = @()
if ($null -ne $products) {
  $catalogMedia = @($products | ForEach-Object { @($_.cover) + @($_.images) } | Sort-Object -Unique)
}

foreach ($post in $blogPosts) {
  $slug = [string]$post.slug
  $title = [string]$post.title
  $description = [string]$post.description
  $image = [string]$post.image
  $model = [string]$post.model
  $detailImages = @($post.detailImages)
  $detailImageType = [string]$post.detailImageType
  $postRelativePath = "blog/$slug.html"
  $postPath = Join-Path $repoRoot ($postRelativePath -replace '/', [IO.Path]::DirectorySeparatorChar)
  Require-File $postRelativePath

  if ($slug -notmatch '^[a-z0-9]+(?:-[a-z0-9]+)*$') { $failures.Add("${postRelativePath}: slug invalido") | Out-Null }
  if ($description.Length -lt 110 -or $description.Length -gt 160) { $failures.Add("${postRelativePath}: la meta descripcion debe tener entre 110 y 160 caracteres") | Out-Null }
  if ($image -notin $catalogMedia) { $failures.Add("${postRelativePath}: la imagen no pertenece a un modelo real del catalogo") | Out-Null }
  $imagePath = Join-Path $repoRoot ($image -replace '/', [IO.Path]::DirectorySeparatorChar)
  if (-not (Test-Path -LiteralPath $imagePath -PathType Leaf)) { $failures.Add("${postRelativePath}: no existe la imagen $image") | Out-Null }
  $matchedProduct = @($products | Where-Object { $_.displayModel -eq $model -and $image -in (@($_.cover) + @($_.images)) })
  if ($matchedProduct.Count -ne 1 -or $matchedProduct[0].family -ne 'sun') { $failures.Add("${postRelativePath}: imagen y modelo no corresponden a un solar real unico") | Out-Null }

  if ($detailImages.Count -lt 2 -or ($detailImages | Sort-Object -Unique).Count -ne $detailImages.Count) { $failures.Add("${postRelativePath}: requiere al menos dos imagenes internas unicas") | Out-Null }
  if ($detailImageType -ne 'catalog-detail') { $failures.Add("${postRelativePath}: debe documentar las imagenes internas como detalles de catalogo") | Out-Null }
  foreach ($detailImage in $detailImages) {
    $detailImage = [string]$detailImage
    $detailImagePath = Join-Path $repoRoot ($detailImage -replace '/', [IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path -LiteralPath $detailImagePath -PathType Leaf)) { $failures.Add("${postRelativePath}: no existe la imagen interna $detailImage") | Out-Null }
    if ($detailImage -notin $catalogMedia -or $detailImage -eq $image) { $failures.Add("${postRelativePath}: la imagen interna no es un detalle real distinto de la portada") | Out-Null }
    if ($matchedProduct.Count -eq 1 -and $detailImage -notin @($matchedProduct[0].images)) { $failures.Add("${postRelativePath}: la imagen interna no pertenece al mismo modelo $model") | Out-Null }
  }

  if ($null -ne $blogHtml) {
    if (-not $blogHtml.Contains('href="./blog/' + $slug + '.html"') -or -not $blogHtml.Contains('data-post-slug="' + $slug + '"')) { $failures.Add("blog.html: falta la tarjeta enlazada de $slug") | Out-Null }
    if (-not $blogHtml.Contains($title) -or -not $blogHtml.Contains($description) -or -not $blogHtml.Contains('./' + $image)) { $failures.Add("blog.html: la tarjeta $slug no conserva tÃ­tulo, meta descripciÃ³n e imagen") | Out-Null }
  }

  if (-not (Test-Path -LiteralPath $postPath -PathType Leaf)) { continue }
  $postHtml = [System.IO.File]::ReadAllText($postPath, $utf8)
  $canonical = "https://champion-innova.com/blog/$slug.html"
  $absoluteImage = "https://champion-innova.com/$image"
  if ($postHtml -notmatch '(?i)<!doctype html>') { $failures.Add("${postRelativePath}: falta <!doctype html>") | Out-Null }
  if (-not $postHtml.Contains('<meta name="description" content="' + $description + '">')) { $failures.Add("${postRelativePath}: la meta descripcion no coincide con el listado") | Out-Null }
  if (-not $postHtml.Contains('<link rel="canonical" href="' + $canonical + '">')) { $failures.Add("${postRelativePath}: falta el canonical absoluto") | Out-Null }
  if (-not $postHtml.Contains('<meta property="og:description" content="' + $description + '">') -or -not $postHtml.Contains('<meta property="og:image" content="' + $absoluteImage + '">')) { $failures.Add("${postRelativePath}: Open Graph no coincide con la publicacion") | Out-Null }
  if ($postHtml -match '<meta\s+name="robots"\s+content="noindex') { $failures.Add("${postRelativePath}: no puede usar noindex") | Out-Null }
  if (([regex]::Matches($postHtml, '<h1(?:\s[^>]*)?>')).Count -ne 1) { $failures.Add("${postRelativePath}: debe tener exactamente un H1") | Out-Null }
  if ($postHtml -notmatch 'data-menu-toggle' -or $postHtml -notmatch 'id="mobileNav"') { $failures.Add("${postRelativePath}: falta la navegacion movil accesible") | Out-Null }
  if ($matchedProduct.Count -eq 1 -and $postHtml -notmatch ('product\.html\?id=' + [regex]::Escape([string]$matchedProduct[0].id))) { $failures.Add("${postRelativePath}: falta el enlace a la ficha del modelo real") | Out-Null }

  if (([regex]::Matches($postHtml, 'data-model="' + [regex]::Escape($model) + '"')).Count -lt 2) { $failures.Add("${postRelativePath}: faltan dos bloques visuales identificados con el mismo modelo") | Out-Null }
  if (([regex]::Matches($postHtml, 'data-media-type="catalog-detail"')).Count -lt 2) { $failures.Add("${postRelativePath}: falta documentar los detalles de catalogo dentro del articulo") | Out-Null }
  foreach ($detailImage in $detailImages) {
    if (-not $postHtml.Contains('src="../' + [string]$detailImage + '"')) { $failures.Add("${postRelativePath}: falta insertar la imagen interna $detailImage") | Out-Null }
  }

  $postDirectory = Split-Path -Parent $postPath
  foreach ($resource in [regex]::Matches($postHtml, '(?:href|src)="([^"]+)"')) {
    $target = $resource.Groups[1].Value
    if ($target -match '^(?:https?:|mailto:|tel:|#)') { continue }
    $localTarget = ($target -split '[?#]')[0]
    if ([string]::IsNullOrWhiteSpace($localTarget)) { continue }
    $resolvedTarget = [IO.Path]::GetFullPath((Join-Path $postDirectory ($localTarget -replace '/', [IO.Path]::DirectorySeparatorChar)))
    if (-not $resolvedTarget.StartsWith($repoRoot, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $resolvedTarget)) { $failures.Add("${postRelativePath}: enlace o recurso local roto: $target") | Out-Null }
  }
}

$productTemplatePath = Join-Path $repoRoot "product.html"
if (Test-Path -LiteralPath $productTemplatePath -PathType Leaf) {
  $productTemplate = [System.IO.File]::ReadAllText($productTemplatePath, $utf8)
  if ($productTemplate -notmatch 'champion-innova\.com/product\.html\?id=' -or $productTemplate -notmatch 'noindex,\s*follow' -or $productTemplate -notmatch 'referencia-no-encontrada') {
    $failures.Add("product.html: faltan canonical dinámico, noindex o desvío a 404 para IDs inválidos") | Out-Null
  }
  if ($productTemplate -match '<link\s+rel="canonical"\s+href="https://champion-innova\.com/product\.html">') {
    $failures.Add("product.html: la plantilla no puede usar un canonical genérico sin ID") | Out-Null
  }
}

$catalogIndexPath = Join-Path $repoRoot "catalogo.html"
if (Test-Path -LiteralPath $catalogIndexPath -PathType Leaf) {
  $catalogIndex = [System.IO.File]::ReadAllText($catalogIndexPath, $utf8)
  $staticProductLinks = ([regex]::Matches($catalogIndex, 'href="\./product\.html\?id=[^"]+"')).Count
  if ($staticProductLinks -ne 100) {
    $failures.Add("catalogo.html: se esperaban 100 enlaces estáticos y se encontraron $staticProductLinks") | Out-Null
  }
  if ($catalogIndex -notmatch '<link\s+rel="canonical"\s+href="https://champion-innova\.com/catalogo\.html">') {
    $failures.Add("catalogo.html: falta el canonical absoluto") | Out-Null
  }
}

$sitemapPath = Join-Path $repoRoot "sitemap.xml"
if (Test-Path -LiteralPath $sitemapPath -PathType Leaf) {
  $sitemapText = [System.IO.File]::ReadAllText($sitemapPath, $utf8)
  $sitemapUrls = @([regex]::Matches($sitemapText, '<loc>([^<]+)</loc>') | ForEach-Object { $_.Groups[1].Value })
  $expectedSitemapUrls = 103 + $blogPosts.Count
  if ($sitemapUrls.Count -ne $expectedSitemapUrls) { $failures.Add("sitemap.xml: se esperaban $expectedSitemapUrls URLs y se encontraron $($sitemapUrls.Count)") | Out-Null }
  if (($sitemapUrls | Sort-Object -Unique).Count -ne $sitemapUrls.Count) { $failures.Add("sitemap.xml: contiene URLs duplicadas") | Out-Null }
  if ($sitemapText -match '<lastmod>') { $failures.Add("sitemap.xml: no debe incluir lastmod artificial") | Out-Null }
  if (@($sitemapUrls | Where-Object { $_ -notmatch '^https://champion-innova\.com/' }).Count -gt 0) {
    $failures.Add("sitemap.xml: todas las URLs deben usar el dominio canónico HTTPS") | Out-Null
  }
}

$robotsPath = Join-Path $repoRoot "robots.txt"
if (Test-Path -LiteralPath $robotsPath -PathType Leaf) {
  $robotsText = [System.IO.File]::ReadAllText($robotsPath, $utf8)
  if ($robotsText -notmatch 'User-agent:\s*\*' -or $robotsText -notmatch 'Allow:\s*/' -or $robotsText -notmatch 'Sitemap:\s*https://champion-innova\.com/sitemap\.xml') {
    $failures.Add("robots.txt: faltan permiso general o referencia al sitemap canónico") | Out-Null
  }
}

$notFoundPath = Join-Path $repoRoot "404.html"
if (Test-Path -LiteralPath $notFoundPath -PathType Leaf) {
  $notFoundHtml = [System.IO.File]::ReadAllText($notFoundPath, $utf8)
  if ($notFoundHtml -notmatch '<meta\s+name="robots"\s+content="noindex, follow">') {
    $failures.Add("404.html: falta noindex, follow") | Out-Null
  }
}

$workerPath = Join-Path $repoRoot "hosting/worker.js"
if (Test-Path -LiteralPath $workerPath -PathType Leaf) {
  $workerText = [System.IO.File]::ReadAllText($workerPath, $utf8)
  foreach ($requiredPattern in @("url\.protocol === 'http:'", 'PRODUCT_IDS\.has\(id\)', "headers\.set\('X-Robots-Tag', 'noindex, follow'\)", "url\.pathname === '/index\.html'")) {
    if ($workerText -notmatch $requiredPattern) { $failures.Add("hosting/worker.js: falta control SEO $requiredPattern") | Out-Null }
  }
}

$requestLoaderPath = Join-Path $repoRoot "assets/request-loader.js"
if (Test-Path -LiteralPath $requestLoaderPath -PathType Leaf) {
  $requestLoaderText = [System.IO.File]::ReadAllText($requestLoaderPath, $utf8)
  if ($requestLoaderText -notmatch 'request\.min\.js' -or $requestLoaderText -notmatch 'loadRequest') {
    $failures.Add("assets/request-loader.js: falta la carga diferida del pedido") | Out-Null
  }
}

$bootstrapPath = Join-Path $repoRoot "assets/bootstrap.js"
if (Test-Path -LiteralPath $bootstrapPath -PathType Leaf) {
  $bootstrapText = [System.IO.File]::ReadAllText($bootstrapPath, $utf8)
  foreach ($requiredPattern in @('data/products\.min\.js', 'assets/i18n\.min\.js', 'assets/request\.min\.js', 'assets/home\.min\.js', 'loadApplication')) {
    if ($bootstrapText -notmatch $requiredPattern) { $failures.Add("assets/bootstrap.js: falta la carga diferida de $requiredPattern") | Out-Null }
  }
}

$productHtmlPath = Join-Path $repoRoot "product.html"
if (Test-Path -LiteralPath $productHtmlPath -PathType Leaf) {
  $productHtml = [System.IO.File]::ReadAllText($productHtmlPath, $utf8)
  if ($productHtml -notmatch 'product-preload:start' -or $productHtml -notmatch 'fetchPriority') {
    $failures.Add("product.html: falta la precarga de la imagen principal") | Out-Null
  }
  if ($productHtml -match 'footerShipping' -or $productHtml -notmatch 'data-i18n="footerMinimum"' -or $productHtml -notmatch 'data-i18n="footerMix"') {
    $failures.Add("product.html: el pie debe resumir solo el mínimo y la combinación de cantidades") | Out-Null
  }
}

if (Test-Path -LiteralPath (Join-Path $repoRoot "index.html")) {
  $homeText = [System.IO.File]::ReadAllText((Join-Path $repoRoot "index.html"), $utf8)
  if ($homeText -notmatch 'id="opticalGrid"' -or $homeText -notmatch 'id="sunGrid"') {
    $failures.Add("index.html: faltan uno o ambos catálogos dinámicos") | Out-Null
  }
  if ($homeText -notmatch '<video[^>]+class="hero-video"' -or $homeText -notmatch '<video\s+id="explainVideo"') {
    $failures.Add("index.html: faltan uno o ambos vídeos") | Out-Null
  }
  if ($homeText -notmatch 'data-video-es="https://assets\.cdn\.filesafe\.space/itkQlAHHVlUS0uDAETp3/media/69e45ad38696a78b8d076627\.mp4"' -or $homeText -notmatch 'data-video-en="https://assets\.cdn\.filesafe\.space/itkQlAHHVlUS0uDAETp3/media/69f65b406b07ab33031dd1ae\.mp4"') {
    $failures.Add("index.html: faltan las versiones española o inglesa del vídeo comercial") | Out-Null
  }
  if ($homeText -notmatch 'id="faqRoot"') { $failures.Add("index.html: falta la sección de preguntas frecuentes") | Out-Null }
  if ($homeText -notmatch 'id="opticalCollectionInfo"' -or $homeText -notmatch 'id="sunCollectionInfo"') { $failures.Add("index.html: faltan las explicaciones de colecciones") | Out-Null }
  if ($homeText -notmatch 'data-filter-toggle="optical"' -or $homeText -notmatch 'data-filter-toggle="sun"' -or $homeText -notmatch 'id="opticalFacetGrid"' -or $homeText -notmatch 'id="sunFacetGrid"') { $failures.Add("index.html: faltan los filtros desplegables completos") | Out-Null }
}

$homeScriptPath = Join-Path $repoRoot "assets/home.js"
if (Test-Path -LiteralPath $homeScriptPath -PathType Leaf) {
  $homeScript = [System.IO.File]::ReadAllText($homeScriptPath, $utf8)
  foreach ($requiredPattern in @('facetConfig', 'matchesFacets', 'data-facet-key', 'data-filter-clear', 'filterCollection', 'filterModel', 'filterColor', 'filterMaterial', 'facet-choice-color')) {
    if ($homeScript -notmatch $requiredPattern) { $failures.Add("assets/home.js: falta requisito de filtros $requiredPattern") | Out-Null }
  }
  if ($homeScript -match "key:\s*'(measurements|shape|lens)'") { $failures.Add("assets/home.js: los filtros deben limitarse a coleccion, modelo, material y color") | Out-Null }
  if ($homeScript -notmatch 'dataset\.videoEn' -or $homeScript -notmatch 'dataset\.videoEs' -or $homeScript -notmatch 'updateLanguageVideo\(language\)') { $failures.Add("assets/home.js: el vídeo comercial no cambia con el idioma") | Out-Null }
  if ($homeScript -notmatch 'bindHeroVideo' -or $homeScript -notmatch 'dataset\.videoSrc') { $failures.Add("assets/home.js: falta la carga diferida del vídeo principal") | Out-Null }
}

$requestPath = Join-Path $repoRoot "assets/request.js"
if (Test-Path -LiteralPath $requestPath -PathType Leaf) {
  $requestText = [System.IO.File]::ReadAllText($requestPath, $utf8)
  foreach ($requiredPattern in @('MINIMUM_UNITS\s*=\s*24', 'data-request-pdf', 'data-request-whatsapp', 'data-request-email', 'orderNumber', 'innova-logo\.png', 'addContainedImage', 'trimmedCanvas', 'adjunte manualmente', 'pdfFileName\(\)', 'csvFileName\(\)', 'phoneCountryCode', 'renderPhoneField', 'renderCountryCombobox', 'normalizeCountryCode', 'validPhoneWithPrefix', 'fullClientPhone')) {
    if ($requestText -notmatch $requiredPattern) { $failures.Add("assets/request.js: falta requisito $requiredPattern") | Out-Null }
  }
  if ($requestText -notmatch 'ensurePdfLibrary' -or $requestText -notmatch 'jspdf\.umd\.min\.js') { $failures.Add("assets/request.js: falta la carga diferida del generador PDF") | Out-Null }
}

$audiencePath = Join-Path $repoRoot "assets/audience.js"
if (Test-Path -LiteralPath $audiencePath -PathType Leaf) {
  $audienceText = [System.IO.File]::ReadAllText($audiencePath, $utf8)
  foreach ($requiredPattern in @('champion-audience-profile-v1', 'champion-b2c-profile-v1', 'champion-b2b-profile-v1', 'data-audience-select="b2c"', 'data-audience-select="b2b"', 'data-country-search', 'data-country-toggle', 'data-phone-search', 'data-phone-toggle', 'role="combobox"', 'aria-autocomplete="list"', 'aria-expanded', 'countryOrigin', 'phoneCountryCode', 'validPhoneWithPrefix', 'formattedPhone', 'productInterest', 'contactPreference', 'initialPurchase', 'usualPrice', 'frameStyle', 'postalAddress', 'consentContact', 'consentMarketing', 'pedido m.nimo vigente es de 24 piezas', 'sessionStorage', 'data-request-open', 'data-request-add', 'product\.html\?id=')) {
    if ($audienceText -notmatch $requiredPattern) { $failures.Add("assets/audience.js: falta requisito $requiredPattern") | Out-Null }
  }
  foreach ($requiredQuestion in @('producto o modelo Champion te interesa', 'continuar la atenci.n', 'Precio que vende mejor', 'estilo de marcos tiene mayor salida en su .ptica')) {
    if ($audienceText -notmatch $requiredQuestion) { $failures.Add("assets/audience.js: falta la pregunta controlada $requiredQuestion") | Out-Null }
  }
  if ($audienceText -notmatch "renderPhoneField\('b2c'.*'phone'.*'N.mero telef.nico'" -or $audienceText -notmatch "renderPhoneField\('b2b'.*'phone'.*'N.mero telef.nico'") {
    $failures.Add("assets/audience.js: B2C y B2B deben usar el campo Número telefónico") | Out-Null
  }
  if ($audienceText -match "renderPhoneField\('b2c'.*'whatsapp'" -or $audienceText -match 'name="whatsapp"') {
    $failures.Add("assets/audience.js: WhatsApp no debe existir como campo de contacto") | Out-Null
  }
  if ($audienceText -notmatch 'audience-phone-control' -or $audienceText -match 'audience-phone-row|request-phone-row') {
    $failures.Add('assets/audience.js: el teléfono debe ser un solo control visual integrado') | Out-Null
  }
  if ($audienceText -notmatch "CONTACT_OPTIONS\s*=\s*\['WhatsApp'") {
    $failures.Add("assets/audience.js: WhatsApp debe conservarse como preferencia de atención B2C") | Out-Null
  }
  foreach ($forbiddenB2CPreference in @('gustar.a comprar tus pr.ximos lentes', 'prefieres en tus lentes', 'rango orientativo tienes pensado')) {
    if ($audienceText -match $forbiddenB2CPreference) { $failures.Add("assets/audience.js: conserva una preferencia B2C no aprobada ($forbiddenB2CPreference)") | Out-Null }
  }
  foreach ($country in @('islas_britanicas', 'jamaica', 'surinam', 'guyana', 'trinidad_y_tobago', 'costa_rica', 'honduras', 'el_salvador', 'republica_dominicana', 'colombia', 'nicaragua')) {
    if ($audienceText -notmatch [regex]::Escape($country)) { $failures.Add("assets/audience.js: falta el país controlado $country") | Out-Null }
  }
  $dialDataMatch = [regex]::Match($audienceText, "REGION_DIALS\s*=\s*'([^']+)'\.split")
  if (-not $dialDataMatch.Success) {
    $failures.Add('assets/audience.js: falta la fuente global controlada de prefijos') | Out-Null
  } else {
    $dialEntries = $dialDataMatch.Groups[1].Value.Split(',', [System.StringSplitOptions]::RemoveEmptyEntries)
    if ($dialEntries.Count -lt 240) { $failures.Add("assets/audience.js: la lista telefónica global tiene solo $($dialEntries.Count) regiones") | Out-Null }
    foreach ($phoneCode in @('GB', 'JM', 'SR', 'GY', 'TT', 'CR', 'HN', 'SV', 'DO', 'CO', 'NI', 'US', 'ES', 'MX', 'JP', 'ZA', 'AU')) {
      if ($dialEntries -notcontains ($dialEntries | Where-Object { $_ -like "$phoneCode`:*" } | Select-Object -First 1)) { $failures.Add("assets/audience.js: falta el prefijo global controlado $phoneCode") | Out-Null }
    }
  }
  if ($audienceText -notmatch "COUNTRY_CODES\s*=.*'AQ'.*'BV'.*'GS'.*'HM'.*'UM'" -or $audienceText -notmatch 'renderCountryCombobox') {
    $failures.Add('assets/audience.js: País o región no conserva cobertura global controlada') | Out-Null
  }
  if ($audienceText -match 'name="(?:state|province)"') { $failures.Add("assets/audience.js: Estado/provincia no debe existir en B2C ni B2B") | Out-Null }
  if ($audienceText -match '\bfetch\s*\(' -or $audienceText -match 'webhook') { $failures.Add("assets/audience.js: no debe enviar datos ni declarar webhooks") | Out-Null }
}

$interestPath = Join-Path $repoRoot "assets/interest.js"
if (Test-Path -LiteralPath $interestPath -PathType Leaf) {
  $interestText = [System.IO.File]::ReadAllText($interestPath, $utf8)
  foreach ($requiredPattern in @('champion-b2c-interest-v1', 'data-interest-add', 'data-interest-open', 'countryOrigin', 'phoneCountryCode', 'phoneDialCode', 'phoneInternational', 'city', 'buildLocalPayload', 'disabled')) {
    if ($interestText -notmatch $requiredPattern) { $failures.Add("assets/interest.js: falta requisito $requiredPattern") | Out-Null }
  }
  if ($interestText -match 'champion-professional-request-v3' -or $interestText -match '\bfetch\s*\(') { $failures.Add("assets/interest.js: mezcla el estado B2B o intenta enviar datos") | Out-Null }
  if ($interestText -match '\bwhatsapp\s*:' -or $interestText -match 'whatsappInternational') { $failures.Add("assets/interest.js: conserva WhatsApp como campo de contacto B2C") | Out-Null }
}

$publicCommercialFiles = @(
  'index.html', 'product.html', 'catalogo.html', '404.html',
  'assets/i18n.js', 'assets/i18n.min.js', 'assets/request.js', 'assets/request.min.js',
  'assets/home.js', 'assets/home.min.js', 'assets/product.js', 'assets/product.min.js',
  'assets/styles.css', 'assets/styles.min.css',
  'data/products.json', 'data/products.js', 'data/products.min.js'
)
$forbiddenCommercialPatterns = @(
  'US\$', '(?<!\{)\$\s*\d',
  '\b(USD|EUR)\b|[\u20AC\u00A3\u00A5]',
  '\b(precio|precios|price|prices|pricing|costo|costos|cost|costs)\b',
  '\b(amount|amounts|importe|importes|monto|montos|tarifa|tarifas|fee|fees|rate|rates)\b',
  '\b(valor de referencia|reference value|referencia general|general reference)\b',
  '\b1,?080\b',
  '\b18\s*(piezas|pieces)\b', '\b18-piece\b',
  '\bREFERENCE_UNIT_USD\b'
)
foreach ($relativePath in $publicCommercialFiles) {
  $publicPath = Join-Path $repoRoot $relativePath
  if (-not (Test-Path -LiteralPath $publicPath -PathType Leaf)) { continue }
  $publicText = [System.IO.File]::ReadAllText($publicPath, $utf8)
  foreach ($forbiddenPattern in $forbiddenCommercialPatterns) {
    if ($publicText -match $forbiddenPattern) {
      $failures.Add("${relativePath}: conserva contenido comercial prohibido ($forbiddenPattern)") | Out-Null
    }
  }
}

$i18nPath = Join-Path $repoRoot "assets/i18n.js"
if (Test-Path -LiteralPath $i18nPath -PathType Leaf) {
  $i18nText = [System.IO.File]::ReadAllText($i18nPath, $utf8)
  foreach ($collection in @('Steel', 'Bold', 'Flex', 'Sport Urban', 'Sport Metal', 'Performance Shield')) {
    if ($i18nText -notmatch [regex]::Escape($collection)) { $failures.Add("assets/i18n.js: falta explicación para $collection") | Out-Null }
  }
  if ($i18nText -notmatch "footerMix:\s*'Combine modelos, colores y cantidades'" -or $i18nText -notmatch "footerMix:\s*'Combine models, colors and quantities'") {
    $failures.Add("assets/i18n.js: falta el resumen bilingüe de cantidades en el pie") | Out-Null
  }
  if ($i18nText -match "term3:\s*'[^']*(envío gratuito|free shipping|shipping is)") {
    $failures.Add("assets/i18n.js: las condiciones del producto todavía mencionan el envío") | Out-Null
  }
}

if (Test-Path -LiteralPath (Join-Path $repoRoot "product.html")) {
  $template = [System.IO.File]::ReadAllText((Join-Path $repoRoot "product.html"), $utf8)
  if ($template -notmatch 'id="productRoot"' -or $template -notmatch 'assets/product(?:\.min)?\.js') {
    $failures.Add("product.html: la plantilla dinámica está incompleta") | Out-Null
  }
  if ($template -notmatch 'id="productFaqRoot"') { $failures.Add("product.html: falta la sección visible de preguntas") | Out-Null }
}

$productScriptPath = Join-Path $repoRoot "assets/product.js"
if (Test-Path -LiteralPath $productScriptPath -PathType Leaf) {
  $productScript = [System.IO.File]::ReadAllText($productScriptPath, $utf8)
  if ($productScript -notmatch 'data-gallery-zoom') { $failures.Add("assets/product.js: faltan controles de zoom") | Out-Null }
  if ($productScript -notmatch 'pointermove' -or $productScript -notmatch '--zoom-x' -or $productScript -notmatch '--zoom-y') { $failures.Add("assets/product.js: falta el seguimiento panorámico del cursor") | Out-Null }
  if ($productScript -notmatch 'orderWhatsapp' -or $productScript -notmatch 'orderEmail') { $failures.Add("assets/product.js: faltan botones de pedido por WhatsApp y correo") | Out-Null }
  if (($productScript | Select-String -Pattern 'order-action-icon' -AllMatches).Matches.Count -lt 2) { $failures.Add("assets/product.js: faltan los iconos en las acciones de pedido") | Out-Null }
  if ($productScript -notmatch '--variant-swatch' -or $productScript -notmatch 'currentColorVariant') { $failures.Add("assets/product.js: faltan las muestras de color para las variantes") | Out-Null }
  if ($productScript -notmatch 'mobile-product-order-bar' -or $productScript -notmatch 'mobileProductQuantity') { $failures.Add("assets/product.js: falta la barra móvil anclada para añadir productos") | Out-Null }
  if ($productScript -notmatch 'data-gallery-zoom-menu' -or $productScript -notmatch 'maximum = mobileZoom\(\) \? 7 : 3' -or $productScript -notmatch 'pinchStartDist' -or $productScript -notmatch 'panX' -or $productScript -notmatch 'setPointerCapture') { $failures.Add("assets/product.js: falta el zoom móvil basado en la ficha original") | Out-Null }
  if ($productScript -notmatch '(?s)gallery-zoom-menu.*?<svg') { $failures.Add("assets/product.js: falta la lupa visible del zoom móvil") | Out-Null }
  if ($productScript -notmatch "product\.family === 'optical'" -or $productScript -notmatch 'Set\(product\.images') { $failures.Add("assets/product.js: la ficha óptica no separa la portada de las cuatro imágenes internas") | Out-Null }
  if ($null -ne $products) {
    foreach ($color in @($products.color | Sort-Object -Unique)) {
      if ($productScript -notmatch [regex]::Escape("'$color':")) { $failures.Add("assets/product.js: falta la muestra para el color $color") | Out-Null }
    }
  }
}

$stylesPath = Join-Path $repoRoot "assets/styles.css"
if (Test-Path -LiteralPath $stylesPath -PathType Leaf) {
  $stylesText = [System.IO.File]::ReadAllText($stylesPath, $utf8)
  if ($stylesText -notmatch '(?s)\.product-request-box\s*>\s*\.product-order-actions\s*\{.*?grid-template-columns:\s*1fr\s*;') { $failures.Add("assets/styles.css: las acciones de pedido no están apiladas") | Out-Null }
  if ($stylesText -notmatch '(?s)\.variant-picker\s+a\s*\{.*?border-radius:\s*50%\s*;') { $failures.Add("assets/styles.css: las variantes no se muestran como burbujas de color") | Out-Null }
  if ($stylesText -notmatch 'aspect-ratio:\s*16\s*/\s*9' -or $stylesText -notmatch '\.filter-panel' -or $stylesText -notmatch '\.facet-grid' -or $stylesText -notmatch '\.facet-choice-color') { $failures.Add("assets/styles.css: faltan el video panorámico o el panel compacto de filtros") | Out-Null }
  if ($stylesText -notmatch '(?s)\.sound-toggle\s*\{[^}]*position:\s*static' -or $stylesText -match '(?s)\.sound-toggle\s*\{[^}]*position:\s*absolute') { $failures.Add("assets/styles.css: el botón de sonido vuelve a superponerse al video") | Out-Null }
  if ($stylesText -notmatch '(?s)\.footer-grid img\s*\{[^}]*background:\s*#fff[^}]*filter:\s*none') { $failures.Add("assets/styles.css: el logo del pie vuelve a perder su detalle rojo") | Out-Null }
  foreach ($selector in @('\.product-card-image', '\.product-image-link', '\.product-gallery-stage', '\.gallery-main', '\.request-item img')) {
    if ($stylesText -notmatch "(?s)$selector\s*\{[^}]*background:\s*#fff") { $failures.Add("assets/styles.css: $selector no tiene fondo blanco sólido") | Out-Null }
  }
  if ($stylesText -notmatch '(?s)@media \(max-width: 680px\).*?\.mobile-product-order-bar\s*\{.*?position:\s*fixed') { $failures.Add("assets/styles.css: falta la barra móvil fija de producto") | Out-Null }
  if ($stylesText -notmatch '(?s)@media \(max-width: 680px\).*?\.header-request\s*\{.*?display:\s*inline-flex' -or $stylesText -notmatch '(?s)@media \(max-width: 680px\).*?\.product-header nav \[data-request-open\]\s*\{\s*display:\s*inline-flex' -or $stylesText -notmatch '(?s)@media \(max-width: 680px\).*?\.mobile-nav \[data-request-open\]\s*\{\s*display:\s*none') { $failures.Add("assets/styles.css: Mi pedido no está visible junto al traductor en las cabeceras móviles") | Out-Null }
  if ($stylesText -notmatch '(?s)\.gallery-zoom-controls \.gallery-zoom-menu\s*\{.*?background:\s*var\(--champion-blue-deep\)' -or $stylesText -notmatch '(?s)\.gallery-zoom-controls \.gallery-zoom-menu::after\s*\{.*?content:\s*"ZOOM"') { $failures.Add("assets/styles.css: la lupa de zoom móvil no tiene contraste o identificación visible") | Out-Null }
  if ($stylesText -notmatch '(?s)@media \(max-width: 680px\).*?\.request-drawer\s*\{.*?overflow-y:\s*auto' -or $stylesText -notmatch '(?s)@media \(max-width: 680px\).*?\.request-drawer-body\s*\{.*?overflow:\s*visible' -or $stylesText -notmatch '(?s)@media \(max-width: 680px\).*?\.request-actions\s*\{.*?position:\s*static') { $failures.Add("assets/styles.css: el panel móvil del pedido no tiene desplazamiento completo") | Out-Null }
  if ($stylesText -notmatch 'translate\(var\(--gallery-pan-x' -or $stylesText -notmatch '\.product-gallery-stage\.is-dragging') { $failures.Add("assets/styles.css: falta el desplazamiento del zoom móvil") | Out-Null }
}

if ($failures.Count -gt 0) {
  $failures | Sort-Object -Unique | ForEach-Object { Write-Host $_ }
  throw "La validación terminó con $($failures.Count) error(es)."
}

$imageCount = (Get-ChildItem -LiteralPath (Join-Path $repoRoot "assets") -Recurse -File -Filter "*.webp").Count
Write-Host "validación-ok (100 productos; 2 HTML de catálogo; blog con $($blogPosts.Count) publicaciones individuales; $imageCount imágenes WebP; 1 plantilla de producto)"
