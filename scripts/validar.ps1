$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$failures = New-Object System.Collections.Generic.List[string]

$homePage = Join-Path $repoRoot "index.html"
if (-not (Test-Path -LiteralPath $homePage -PathType Leaf)) {
  $failures.Add("Falta index.html") | Out-Null
}

$products = Get-ChildItem -LiteralPath $repoRoot -File -Filter "ch??-c?.html" |
  Where-Object { $_.Name -match '^ch\d{2}-c[1-4]\.html$' } |
  Sort-Object Name

if ($products.Count -ne 64) {
  $failures.Add("Se esperaban 64 fichas y se encontraron $($products.Count)") | Out-Null
}

$pages = @()
if (Test-Path -LiteralPath $homePage -PathType Leaf) {
  $pages += Get-Item -LiteralPath $homePage
}
$pages += $products

foreach ($page in $pages) {
  $text = [System.IO.File]::ReadAllText($page.FullName, $utf8)

  if ($text -notmatch '(?i)<!doctype html>') {
    $failures.Add("$($page.Name): falta <!doctype html>") | Out-Null
  }
  if ($text -match 'https://distribuciones\.champion-innova\.com/(catalogo|ch\d{2}-c[1-4])') {
    $failures.Add("$($page.Name): conserva un enlace interno al sitio anterior") | Out-Null
  }

  $localLinks = [regex]::Matches($text, '\./(?<file>(?:index|ch\d{2}-c[1-4])\.html)', 'IgnoreCase')
  foreach ($match in $localLinks) {
    $target = Join-Path $repoRoot $match.Groups['file'].Value
    if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
      $failures.Add("$($page.Name): enlace local inexistente $($match.Value)") | Out-Null
    }
  }
}

foreach ($page in $products) {
  $text = [System.IO.File]::ReadAllText($page.FullName, $utf8)
  if ($page.BaseName -notmatch '^ch(?<series>\d{2})-c(?<variant>[1-4])$') {
    continue
  }
  $model = "CH$($Matches['series'])C$($Matches['variant'])"
  if ($text -notmatch ('let\s+currentModel\s*=\s*"' + [regex]::Escape($model) + '"')) {
    $failures.Add("$($page.Name): currentModel no coincide con $model") | Out-Null
  }
  if ($text -notmatch ('setModel\("' + [regex]::Escape($model) + '"\)')) {
    $failures.Add("$($page.Name): la inicialización no selecciona $model") | Out-Null
  }
  if ([regex]::Matches($text, 'data-language-toggle').Count -lt 2) {
    $failures.Add("$($page.Name): falta el selector bilingüe de la plantilla actual") | Out-Null
  }
  if ($text -notmatch 'id="productWhatsappBtn"' -or $text -notmatch 'id="productCallBtn"') {
    $failures.Add("$($page.Name): faltan las acciones de contacto B2B") | Out-Null
  }
  if ($text -notmatch 'const\s+PRODUCT_I18N\s*=') {
    $failures.Add("$($page.Name): falta la traducción de producto") | Out-Null
  }
}

if (Test-Path -LiteralPath $homePage -PathType Leaf) {
  $homeText = [System.IO.File]::ReadAllText($homePage, $utf8)
  $homeProductLinks = [regex]::Matches($homeText, 'href="\./ch\d{2}-c[1-4]\.html"', 'IgnoreCase').Count
  if ($homeProductLinks -ne 64) {
    $failures.Add("index.html: se esperaban 64 enlaces de producto y se encontraron $homeProductLinks") | Out-Null
  }
  if ($homeText -notmatch '<video\s+class="hero-video"' -or $homeText -notmatch '<video\s+id="explainVideo"') {
    $failures.Add("index.html: faltan uno o más vídeos de la portada") | Out-Null
  }
}

if ($failures.Count -gt 0) {
  $failures | ForEach-Object { Write-Host $_ }
  throw "La validación terminó con $($failures.Count) error(es)."
}

$externalMedia = foreach ($page in $pages) {
  $text = [System.IO.File]::ReadAllText($page.FullName, $utf8)
  [regex]::Matches($text, 'https?://[^\s"''<>`)]+\.(?:png|jpe?g|webp|mp4)') |
    ForEach-Object Value
}
$externalMedia = $externalMedia | Sort-Object -Unique

Write-Host "validación-ok ($($pages.Count) páginas; $($externalMedia.Count) medios externos únicos)"
