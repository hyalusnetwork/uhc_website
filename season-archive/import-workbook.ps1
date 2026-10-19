Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead((Join-Path $PSScriptRoot '..\UHC_Data.xlsx'))
function Read-WorkbookXml($name) {
    $reader = [IO.StreamReader]::new($archive.GetEntry($name).Open())
    try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}
try {
    $shared = Read-WorkbookXml 'xl/sharedStrings.xml'
    $strings = @($shared.sst.si | ForEach-Object { $_.InnerText })
    $result = @()
    foreach ($i in 1..5) {
        if (-not $archive.GetEntry("xl/worksheets/sheet$i.xml")) { continue }
        $sheet = Read-WorkbookXml "xl/worksheets/sheet$i.xml"
        $rows = @()
        foreach ($row in $sheet.worksheet.sheetData.row) {
            $cells = @()
            foreach ($cell in $row.c) {
                $value = $cell.v
                if ($cell.t -eq 's') { $value = $strings[[int]$value] }
                if ($cell.t -eq 'inlineStr') { $value = $cell.is.InnerText }
                $cells += @{cell=$cell.r;value=$value;style=$cell.s}
            }
            $rows += ,@{row=$row.r;cells=$cells}
        }
        $result += @{sheet=$i;rows=$rows;merges=@($sheet.worksheet.mergeCells.mergeCell.ref)}
    }
    $result | ConvertTo-Json -Depth 9 | Set-Content -LiteralPath (Join-Path $PSScriptRoot '..\workbook-extracted.json') -Encoding utf8
} finally { $archive.Dispose() }
if (Test-Path -LiteralPath (Join-Path $PSScriptRoot '..\Hyalus UHC Player Bios.xlsx')) { & (Join-Path $PSScriptRoot 'import-bios.ps1') }

