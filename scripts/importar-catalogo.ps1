$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$championRoot = Split-Path -Parent $repoRoot
$sourceRoot = Join-Path $championRoot "Codigos Champion\Catalogo"
$utf8 = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path -LiteralPath $sourceRoot -PathType Container)) {
  throw "No se encontró la fuente del catálogo en: $sourceRoot"
}

$productFiles = Get-ChildItem -LiteralPath $sourceRoot -File -Filter "*.html" |
  Where-Object { $_.Name -match '^CH\d{2} - C[1-4]\.html$' } |
  Sort-Object Name

if ($productFiles.Count -ne 64) {
  throw "Se esperaban 64 fichas de producto y se encontraron $($productFiles.Count)."
}

function Convert-ToLocalSite([string]$html) {
  $html = $html.Replace(
    "https://distribuciones.champion-innova.com/catalogo#opciones",
    "./index.html#opciones"
  )
  $html = $html.Replace(
    "https://distribuciones.champion-innova.com/catalogo",
    "./index.html"
  )
  $html = [regex]::Replace(
    $html,
    'https://distribuciones\.champion-innova\.com/(ch\d{2}-c[1-4])',
    './$1.html',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )
  return $html
}

$homeSource = Join-Path $sourceRoot "Home.html"
$homeTarget = Join-Path $repoRoot "index.html"
$homeHtml = [System.IO.File]::ReadAllText($homeSource, $utf8)
[System.IO.File]::WriteAllText($homeTarget, (Convert-ToLocalSite $homeHtml), $utf8)

foreach ($file in $productFiles) {
  $slug = ($file.BaseName -replace '\s+-\s+', '-').ToLowerInvariant()
  $target = Join-Path $repoRoot ($slug + ".html")
  $templateFile = $file

  # La fuente histórica de CH11 C4 conserva una plantilla anterior. Sus datos
  # ya están incluidos en las otras páginas CH11, por lo que usamos la versión
  # actualizada de la misma serie y seleccionamos C4 más abajo.
  if ($slug -eq "ch11-c4") {
    $templateFile = Get-Item -LiteralPath (Join-Path $sourceRoot "CH11 - C3.html")
  }

  $html = [System.IO.File]::ReadAllText($templateFile.FullName, $utf8)
  $html = Convert-ToLocalSite $html

  if ($slug -match '^ch(?<series>\d{2})-c(?<variant>[1-4])$') {
    $model = "CH$($Matches['series'])C$($Matches['variant'])"
    $displayModel = "CH$($Matches['series']) C$($Matches['variant'])"
    $html = [regex]::Replace(
      $html,
      '<title>Innova Eyewear B2B \| CH\d{2} C[1-4]</title>',
      "<title>Innova Eyewear B2B | $displayModel</title>",
      1
    )
    $html = [regex]::Replace(
      $html,
      'let\s+currentModel\s*=\s*"CH\d{2}C[1-4]";',
      "let currentModel = `"$model`";",
      1
    )
    $html = [regex]::Replace(
      $html,
      'setModel\("CH\d{2}C[1-4]"\);(?=\s*resetZoom\(\);)',
      "setModel(`"$model`");",
      1
    )
  }

  [System.IO.File]::WriteAllText($target, $html, $utf8)
}

Write-Host "Importación terminada: index.html y $($productFiles.Count) fichas de producto."
