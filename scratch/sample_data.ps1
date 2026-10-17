$dbPath = "D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb"
$dao = New-Object -ComObject DAO.DBEngine.120
$db = $dao.OpenDatabase($dbPath)

function Dump-Table($tableName, $maxRows=10) {
    Write-Host "`n=== Table: $tableName ==="
    $rs = $db.OpenRecordset("SELECT TOP $maxRows * FROM [$tableName]")
    $fNames = @()
    for ($i = 0; $i -lt $rs.Fields.Count; $i++) { $fNames += $rs.Fields.Item($i).Name }
    Write-Host ($fNames -join " | ")
    Write-Host ("-" * ($fNames -join " | ").Length)
    while (-not $rs.EOF) {
        $row = @()
        for ($i = 0; $i -lt $rs.Fields.Count; $i++) {
            $val = $rs.Fields.Item($i).Value
            if ($val -eq $null) { $val = "NULL" }
            elseif ($val -is [byte[]]) { $val = "[binary $($val.Length)b]" }
            $row += "$val"
        }
        Write-Host ($row -join " | ")
        $rs.MoveNext()
    }
    $rs.Close()
}

Dump-Table "PlayerAwards" 20
Dump-Table "PlayerAwardsEarned" 10
Dump-Table "PlayerSeasonLetters" 10
Dump-Table "BeepInformation" 10
Dump-Table "BeepResults" 10
Dump-Table "PastSeasonStats" 10
Dump-Table "PastStatsGameScores" 10
Dump-Table "ShootoutTable" 10
Dump-Table "DatabaseDefaults" 1

$db.Close()
