param([Parameter(Mandatory = $true)][string]$DatasetRoot)
$ErrorActionPreference = 'Stop'
$appRoot = Split-Path $PSScriptRoot -Parent
$rows = @(Import-Csv (Join-Path $DatasetRoot 'valid.csv'))
$labels = @($rows[0].PSObject.Properties.Name | Select-Object -Skip 5)
$imageDir = Join-Path $appRoot 'public/images/chexpert'
$dataDir = Join-Path $appRoot 'src/lib/xray-library'
$validRoot = (Resolve-Path (Join-Path $DatasetRoot 'valid')).Path
$files = @(Get-ChildItem -LiteralPath $validRoot -Recurse -File | Where-Object { $_.Extension -in '.jpg', '.jpeg' })
$byPath = @{}
foreach ($row in $rows) { $byPath[($row.Path -replace '^[^/]+/', '')] = $row }
$sourceFiles = @{}
foreach ($file in $files) {
  $relative = 'valid/' + [System.IO.Path]::GetRelativePath($validRoot, $file.FullName).Replace('\', '/')
  if (-not $byPath.ContainsKey($relative)) { throw "No CSV metadata for $relative" }
  $sourceFiles[$relative] = $file.FullName
}
# Preserve the row order from valid.csv. This is the dataset's canonical
# presentation order and keeps gallery case numbers aligned with CSV rows.
$orderedPaths = [System.Collections.Generic.List[string]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new()
foreach ($row in $rows) {
  $relative = $row.Path -replace '^[^/]+/', ''
  if (-not $sourceFiles.ContainsKey($relative)) { throw "CSV image missing: $relative" }
  if ($seen.Add($relative)) { $orderedPaths.Add($relative) }
}
New-Item -ItemType Directory -Force $imageDir, $dataDir | Out-Null
$index = 0
$entries = @(foreach ($relative in $orderedPaths) {
  $index++
  $row = $byPath[$relative]
  $id = 'cxp-{0:d3}' -f $index
  $source = $sourceFiles[$relative]
  Copy-Item -LiteralPath $source -Destination (Join-Path $imageDir "$id.jpg")
  $values = [ordered]@{}
  foreach ($label in $labels) {
    $values[$label] = if ($row.$label -eq '') { $null } else { [int][double]$row.$label }
  }
  [pscustomobject]@{
    id = $id
    title = 'Case {0:d2}' -f $index
    view = $row.'Frontal/Lateral'
    projection = $row.'AP/PA'
    imageUrl = "/images/chexpert/$id.jpg"
    sourcePath = $row.Path
    sha256 = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
    labels = $values
  }
})
ConvertTo-Json -InputObject $entries -Depth 5 | Set-Content -Encoding utf8 (Join-Path $dataDir 'cases.json')
Write-Output "Imported all $($entries.Count) JPEG images from valid with CSV metadata."
