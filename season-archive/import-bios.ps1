Add-Type -AssemblyName System.IO.Compression.FileSystem
$bioPath = Join-Path $PSScriptRoot '..\Hyalus UHC Player Bios.xlsx'
if (-not (Test-Path -LiteralPath $bioPath)) { throw 'Player bios workbook is missing' }
$bioArchive = [IO.Compression.ZipFile]::OpenRead($bioPath)
function Read-BioXml($name) {
    $reader = [IO.StreamReader]::new($bioArchive.GetEntry($name).Open())
    try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}
try {
    $shared = Read-BioXml 'xl/sharedStrings.xml'
    $strings = @($shared.sst.si | ForEach-Object { $_.InnerText })
    $workbook = Read-BioXml 'xl/workbook.xml'
    $relationships = Read-BioXml 'xl/_rels/workbook.xml.rels'
    $bios = @()
    foreach ($sheet in $workbook.workbook.sheets.sheet) {
        $relationshipId = $sheet.GetAttribute('id','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
        $target = ($relationships.Relationships.Relationship | Where-Object { $_.Id -eq $relationshipId }).Target
        $sheetXml = Read-BioXml ('xl/' + $target.TrimStart('/'))
        $cells = @()
        foreach ($cell in $sheetXml.worksheet.sheetData.row.c) {
            $value = $cell.v
            if ($cell.t -eq 's') { $value = $strings[[int]$value] }
            if ($cell.t -eq 'inlineStr') { $value = $cell.is.InnerText }
            if ($null -ne $value -and $value -ne '') { $cells += @{cell=$cell.r;value=$value} }
        }
        $bios += @{name=$sheet.name;cells=$cells}
    }
    $bios | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $PSScriptRoot '..\bios-extracted.json') -Encoding utf8
} finally { $bioArchive.Dispose() }
