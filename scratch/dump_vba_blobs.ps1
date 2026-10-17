$dbPath = "D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb"
$dao = New-Object -ComObject DAO.DBEngine.120
$db = $dao.OpenDatabase($dbPath)

$outDir = "D:\Development\general_soccer_app_v4\scratch\vba_blobs"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$rs = $db.OpenRecordset("SELECT Id, ParentId, Name, Type, Lv FROM MSysAccessStorage WHERE ParentId IN (8, 17, 18)")
$meta = @()

while (-not $rs.EOF) {
    $id = $rs.Fields.Item("Id").Value
    $parentId = $rs.Fields.Item("ParentId").Value
    $name = $rs.Fields.Item("Name").Value
    $type = $rs.Fields.Item("Type").Value
    $bytes = $rs.Fields.Item("Lv").Value
    
    $len = 0
    if ($bytes -ne $null) {
        $len = $bytes.Length
        $filePath = Join-Path $outDir "$id`_$name.bin"
        [System.IO.File]::WriteAllBytes($filePath, $bytes)
    }
    
    $meta += [PSCustomObject]@{
        Id = $id
        ParentId = $parentId
        Name = $name
        Type = $type
        Length = $len
    }
    $rs.MoveNext()
}
$rs.Close()
$db.Close()

$meta | ConvertTo-Json -Depth 2 | Out-File -FilePath "D:\Development\general_soccer_app_v4\scratch\vba_blobs_meta.json" -Encoding UTF8
Write-Host "Dumped $($meta.Count) VBA streams to scratch/vba_blobs!"
