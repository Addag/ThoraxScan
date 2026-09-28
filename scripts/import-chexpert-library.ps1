param([Parameter(Mandatory = $true)][string]$DatasetRoot)
$ErrorActionPreference = 'Stop'
$appRoot = Split-Path $PSScriptRoot -Parent
$rows = @(Import-Csv (Join-Path $DatasetRoot 'valid.csv'))
$labels = @($rows[0].PSObject.Properties.Name | Select-Object -Skip 5)
$frontal = @($rows | Where-Object { $_.'Frontal/Lateral' -eq 'Frontal' })
$selected = [System.Collections.Generic.List[object]]::new()
$patients = [System.Collections.Generic.HashSet[string]]::new()
# Two distinct patients per available label, prioritizing fewer co-occurring labels.
# This is metadata curation, not clinical review or a representative evaluation set.
foreach ($label in $labels) {
  $candidates = @($frontal | Where-Object { $_.$label -eq '1.0' } | Sort-Object @{ Expression = { $row = $_; @($labels | Where-Object { $row.$_ -eq '1.0' }).Count } }, Path)
  $count = 0
  foreach ($row in $candidates) {
    $patient = ($row.Path -split '/')[2]
    if (-not $patients.Add($patient)) { continue }
    $selected.Add([pscustomobject]@{ Row = $row; Focus = $label })
    $count++
    if ($count -eq 2) { break }
  }
}
$imageDir = Join-Path $appRoot 'public/images/chexpert'
$dataDir = Join-Path $appRoot 'src/lib/xray-library'
New-Item -ItemType Directory -Force $imageDir, $dataDir | Out-Null
$index = 0
$entries = @(foreach ($selection in $selected) {
  $index++
  $row = $selection.Row
  $id = 'cxp-{0:d3}' -f $index
  $relative = $row.Path -replace '^[^/]+/', ''
  $source = Join-Path $DatasetRoot $relative
  Copy-Item -LiteralPath $source -Destination (Join-Path $imageDir "$id.jpg")
  $values = [ordered]@{}
  foreach ($label in $labels) {
    $values[$label] = if ($row.$label -eq '') { $null } else { [int][double]$row.$label }
  }
  [pscustomobject]@{
    id = $id
    title = 'Case {0:d2}' -f $index
    focus = $selection.Focus
    projection = $row.'AP/PA'
    imageUrl = "/images/chexpert/$id.jpg"
    sourcePath = $row.Path
    sha256 = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
    labels = $values
  }
})
ConvertTo-Json -InputObject $entries -Depth 5 | Set-Content -Encoding utf8 (Join-Path $dataDir 'cases.json')
Write-Output "Imported $($entries.Count) frontal images from valid.csv."
