$dbPath = "D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb"
$dao = New-Object -ComObject DAO.DBEngine.120
$db = $dao.OpenDatabase($dbPath)

Write-Host "--- Testing TableDefs Access ---"
for ($i = 0; $i -lt $db.TableDefs.Count; $i++) {
    $t = $db.TableDefs.Item($i)
    if ($t.Name -like "MSys*" -or $t.Name -like "*Sys*") {
        Write-Host "System Table: $($t.Name) (Fields: $($t.Fields.Count), RecordCount: $($t.RecordCount))"
        try {
            $rs = $db.OpenRecordset("SELECT TOP 5 * FROM [$($t.Name)]")
            Write-Host "   -> Can read $($t.Name)!"
            $rs.Close()
        } catch {
            Write-Host "   -> Cannot read: $($_.Exception.Message)"
        }
    }
}

$db.Close()
