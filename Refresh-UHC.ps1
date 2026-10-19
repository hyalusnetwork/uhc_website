$previousDirectory = Get-Location
try {
    Set-Location -LiteralPath (Join-Path $PSScriptRoot 'season-archive')
    & '.\import-workbook.ps1'
    node prepare-data.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Data refresh failed' }
    node make-html.cjs
    if ($LASTEXITCODE -ne 0) { throw 'HTML refresh failed' }
    Write-Host 'UHC.html is refreshed. Reload it in your browser.'
} finally { Set-Location -LiteralPath $previousDirectory.Path }
