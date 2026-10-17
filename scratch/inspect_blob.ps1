$dbPath = "D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb"
$dao = New-Object -ComObject DAO.DBEngine.120
$db = $dao.OpenDatabase($dbPath)

# Check one Form Blob: let's inspect Form 26 Blob (Id 57838)
$rs = $db.OpenRecordset("SELECT Id, Name, Lv FROM MSysAccessStorage WHERE Id = 57838")
if (-not $rs.EOF) {
    $bytes = $rs.Fields.Item("Lv").Value
    Write-Host "Blob 57838 length: $($bytes.Length)"
    Write-Host "First 32 bytes hex: $([BitConverter]::ToString($bytes, 0, [Math]::Min(32, $bytes.Length)))"
    
    # Try ASCII and Unicode
    $strAscii = [System.Text.Encoding]::ASCII.GetString($bytes)
    Write-Host "First 300 chars ASCII:`n$($strAscii.Substring(0, [Math]::Min(300, $strAscii.Length)))"
}
$rs.Close()

# Check VBA PROJECT stream (Id 62573)
$rs = $db.OpenRecordset("SELECT Id, Name, Lv FROM MSysAccessStorage WHERE Id = 62573")
if (-not $rs.EOF) {
    $bytes = $rs.Fields.Item("Lv").Value
    Write-Host "`nPROJECT stream length: $($bytes.Length)"
    $strAscii = [System.Text.Encoding]::ASCII.GetString($bytes)
    Write-Host "PROJECT stream text:`n$strAscii"
}
$rs.Close()

$db.Close()
