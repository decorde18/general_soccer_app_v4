$dbPath = "D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb"
$connStr = "Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=$dbPath;"

Write-Host "Connecting to $dbPath..."
$conn = New-Object System.Data.Odbc.OdbcConnection($connStr)
try {
    $conn.Open()
    Write-Host "Connected successfully via ODBC!"
    
    # 1. Get Tables
    Write-Host "`n--- Tables from GetSchema ---"
    $schemaTables = $conn.GetSchema("Tables")
    $userTables = $schemaTables | Where-Object { $_.TABLE_TYPE -eq "TABLE" } | Select-Object -ExpandProperty TABLE_NAME
    Write-Host "Found $($userTables.Count) user tables:"
    $userTables | Sort-Object | ForEach-Object { Write-Host "  - $_" }

    Write-Host "`n--- Views/Queries from GetSchema ---"
    $views = $schemaTables | Where-Object { $_.TABLE_TYPE -eq "VIEW" } | Select-Object -ExpandProperty TABLE_NAME
    Write-Host "Found $($views.Count) views/queries:"
    $views | Sort-Object | ForEach-Object { Write-Host "  - $_" }

    # 2. Try MSysObjects
    Write-Host "`n--- Testing MSysObjects query ---"
    try {
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT Name, Type FROM MSysObjects ORDER BY Type, Name"
        $reader = $cmd.ExecuteReader()
        $objCount = 0
        $byType = @{}
        while ($reader.Read()) {
            $objCount++
            $name = $reader["Name"].ToString()
            $type = $reader["Type"].ToString()
            if (-not $byType.ContainsKey($type)) { $byType[$type] = @() }
            $byType[$type] += $name
        }
        $reader.Close()
        Write-Host "MSysObjects returned $objCount objects!"
        foreach ($t in $byType.Keys) {
            Write-Host "Type $t ($($byType[$t].Count) items):"
            $sample = $byType[$t] | Select-Object -First 10
            Write-Host "   Sample: $($sample -join ', ')"
        }
    } catch {
        Write-Host "MSysObjects query failed: $($_.Exception.Message)"
    }

} catch {
    Write-Host "Connection error: $($_.Exception.Message)"
} finally {
    if ($conn.State -eq 'Open') { $conn.Close() }
}
