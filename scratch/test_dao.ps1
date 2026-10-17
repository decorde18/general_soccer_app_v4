# Check DAO
Write-Host "--- Testing DAO.DBEngine.120 ---"
try {
    $dao = New-Object -ComObject DAO.DBEngine.120
    Write-Host "DAO.DBEngine.120 created successfully!"
    $db = $dao.OpenDatabase("D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb")
    Write-Host "Opened DB with DAO! Version: $($db.Version)"
    Write-Host "TableDefs count: $($db.TableDefs.Count)"
    Write-Host "QueryDefs count: $($db.QueryDefs.Count)"
    Write-Host "Containers count: $($db.Containers.Count)"
    for ($i = 0; $i -lt $db.Containers.Count; $i++) {
        $c = $db.Containers.Item($i)
        Write-Host "Container: $($c.Name) (Documents: $($c.Documents.Count))"
        for ($j = 0; $j -lt [Math]::Min(15, $c.Documents.Count); $j++) {
            Write-Host "   Doc: $($c.Documents.Item($j).Name)"
        }
    }
    $db.Close()
} catch {
    Write-Host "DAO error: $($_.Exception.Message)"
}

Write-Host "`n--- Testing Python pyodbc ---"
try {
    $res = & python -c "import pyodbc; print('pyodbc is available!')" 2>&1
    Write-Host "Python output: $res"
} catch {
    Write-Host "Python check error: $($_.Exception.Message)"
}
