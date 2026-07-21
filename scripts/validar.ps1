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
  "data/products.json",
  "data/products.js",
  "assets/styles.css",
  "assets/i18n.js",
  "assets/home.js",
  "assets/product.js",
  "assets/request.js",
  "assets/vendor/jspdf.umd.min.js",
  "assets/images/brand/champion-header.png",
  "assets/images/brand/innova-logo.png"
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

    if ($products.Count -ne 93) { $failures.Add("Se esperaban 93 productos y se encontraron $($products.Count)") | Out-Null }
    if ($optical.Count -ne 64) { $failures.Add("Se esperaban 64 monturas y se encontraron $($optical.Count)") | Out-Null }
    if ($sun.Count -ne 29) { $failures.Add("Se esperaban 29 solares y se encontraron $($sun.Count)") | Out-Null }

    $duplicateIds = $products | Group-Object id | Where-Object Count -gt 1
    if ($duplicateIds) { $failures.Add("Hay identificadores de producto duplicados") | Out-Null }

    foreach ($product in $products) {
      foreach ($field in @("id", "model", "sku", "family", "collection", "color", "cover")) {
        if ([string]::IsNullOrWhiteSpace([string]$product.$field)) {
          $failures.Add("Producto $($product.id): falta $field") | Out-Null
        }
      }

      $media = @($product.cover) + @($product.images)
      if ($media.Count -lt 2) { $failures.Add("Producto $($product.id): faltan vistas") | Out-Null }
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
  if ($html -notmatch '(?i)<!doctype html>') { $failures.Add("${htmlName}: falta <!doctype html>") | Out-Null }
  if ($html -notmatch 'data/products\.js') { $failures.Add("${htmlName}: no carga el catálogo estructurado") | Out-Null }
  if ($html -notmatch 'assets/request\.js') { $failures.Add("${htmlName}: no carga la solicitud B2B") | Out-Null }
  if ($html -notmatch 'assets/i18n\.js' -or $html -notmatch 'data-language-toggle') { $failures.Add("${htmlName}: falta la traducción ES/EN") | Out-Null }
  if ($html -notmatch 'jspdf\.umd\.min\.js') { $failures.Add("${htmlName}: falta el generador PDF") | Out-Null }
  if ($html -notmatch 'champion-header\.png') { $failures.Add("${htmlName}: no usa el logotipo de cabecera solicitado") | Out-Null }
}

if (Test-Path -LiteralPath (Join-Path $repoRoot "index.html")) {
  $homeText = [System.IO.File]::ReadAllText((Join-Path $repoRoot "index.html"), $utf8)
  if ($homeText -notmatch 'id="opticalGrid"' -or $homeText -notmatch 'id="sunGrid"') {
    $failures.Add("index.html: faltan uno o ambos catálogos dinámicos") | Out-Null
  }
  if ($homeText -notmatch '<video\s+class="hero-video"' -or $homeText -notmatch '<video\s+id="explainVideo"') {
    $failures.Add("index.html: faltan uno o ambos vídeos") | Out-Null
  }
  if ($homeText -notmatch 'id="faqRoot"') { $failures.Add("index.html: falta la sección de preguntas frecuentes") | Out-Null }
  if ($homeText -notmatch 'id="opticalCollectionInfo"' -or $homeText -notmatch 'id="sunCollectionInfo"') { $failures.Add("index.html: faltan las explicaciones de colecciones") | Out-Null }
}

$requestPath = Join-Path $repoRoot "assets/request.js"
if (Test-Path -LiteralPath $requestPath -PathType Leaf) {
  $requestText = [System.IO.File]::ReadAllText($requestPath, $utf8)
  foreach ($requiredPattern in @('MINIMUM_UNITS\s*=\s*18', 'REFERENCE_UNIT_USD\s*=\s*60', 'data-request-pdf', 'data-request-whatsapp', 'data-request-email', 'orderNumber', 'innova-logo\.png')) {
    if ($requestText -notmatch $requiredPattern) { $failures.Add("assets/request.js: falta requisito $requiredPattern") | Out-Null }
  }
}

$i18nPath = Join-Path $repoRoot "assets/i18n.js"
if (Test-Path -LiteralPath $i18nPath -PathType Leaf) {
  $i18nText = [System.IO.File]::ReadAllText($i18nPath, $utf8)
  foreach ($collection in @('Steel', 'Bold', 'Flex', 'Sport Urban', 'Sport Metal', 'Performance Shield')) {
    if ($i18nText -notmatch [regex]::Escape($collection)) { $failures.Add("assets/i18n.js: falta explicación para $collection") | Out-Null }
  }
}

if (Test-Path -LiteralPath (Join-Path $repoRoot "product.html")) {
  $template = [System.IO.File]::ReadAllText((Join-Path $repoRoot "product.html"), $utf8)
  if ($template -notmatch 'id="productRoot"' -or $template -notmatch 'assets/product\.js') {
    $failures.Add("product.html: la plantilla dinámica está incompleta") | Out-Null
  }
}

if ($failures.Count -gt 0) {
  $failures | Sort-Object -Unique | ForEach-Object { Write-Host $_ }
  throw "La validación terminó con $($failures.Count) error(es)."
}

$imageCount = (Get-ChildItem -LiteralPath (Join-Path $repoRoot "assets/images") -Recurse -File -Filter "*.webp").Count
Write-Host "validación-ok (93 productos; 2 HTML; $imageCount imágenes WebP; 1 plantilla de producto)"
