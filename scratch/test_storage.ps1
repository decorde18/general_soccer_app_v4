$dbPath = "D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb"
$dao = New-Object -ComObject DAO.DBEngine.120
$db = $dao.OpenDatabase($dbPath)

Write-Host "--- Checking QueryDefs ---"
$sampleQueries = 0
for ($i = 0; $i -lt [Math]::Min(10, $db.QueryDefs.Count); $i++) {
    $q = $db.QueryDefs.Item($i)
    Write-Host "Query: $($q.Name)"
    Write-Host "SQL: $($q.SQL.Substring(0, [Math]::Min(100, $q.SQL.Length)).Replace("`r`n", " "))"
}

Write-Host "`n--- Checking MSysAccessStorage ---"
$rs = $db.OpenRecordset("SELECT TOP 20 * FROM MSysAccessStorage")
for ($f = 0; $f -lt $rs.Fields.Count; $f++) {
    Write-Host "Field $($f): $($rs.Fields.Item($f).Name) (Type: $($rs.Fields.Item($f).Type))"
}
while (-not $rs.EOF) {
    $vals = @()
    for ($f = 0; $f -lt $rs.Fields.Count; $f++) {
        $val = $rs.Fields.Item($f).Value
        if ($val -is [byte[]]) {
            $vals += "$($rs.Fields.Item($f).Name)=[binary $($val.Length) bytes]"
        } else {
            $vals += "$($rs.Fields.Item($f).Name)=$val"
        }
    }
    Write-Host ($vals -join " | ")
    $rs.MoveNext()
}
$rs.Close()

$db.Close()
