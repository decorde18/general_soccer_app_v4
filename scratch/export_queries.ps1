$dbPath = "D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb"
$dao = New-Object -ComObject DAO.DBEngine.120
$db = $dao.OpenDatabase($dbPath)

$queries = @()
for ($i = 0; $i -lt $db.QueryDefs.Count; $i++) {
    $q = $db.QueryDefs.Item($i)
    # Skip temporary queries starting with ~ if desired, or keep all
    $queries += [PSCustomObject]@{
        Name = $q.Name
        IsFormSubquery = $q.Name.StartsWith("~")
        SQL = $q.SQL
    }
}

$queries | ConvertTo-Json -Depth 3 | Out-File -FilePath "D:\Development\general_soccer_app_v4\scratch\accdb_queries.json" -Encoding UTF8
Write-Host "Exported $($queries.Count) queries to scratch/accdb_queries.json!"

# Also create a categorized markdown file of user queries (not form embedded ones ~)
$md = @()
$md += "# Legacy MS Access Database Queries Audit"
$md += "Total queries: $($queries.Count)`n"

$userQueries = $queries | Where-Object { -not $_.IsFormSubquery }
$formQueries = $queries | Where-Object { $_.IsFormSubquery }

$md += "## Standard / Stored Queries ($($userQueries.Count) queries)`n"
foreach ($uq in ($userQueries | Sort-Object Name)) {
    $md += "### Query: $($uq.Name)"
    $md += "````sql"
    $md += $uq.SQL.Trim()
    $md += "````"
    $md += ""
}

$md += "`n## Form RowSource & Subform Queries ($($formQueries.Count) queries)`n"
foreach ($fq in ($formQueries | Sort-Object Name)) {
    $md += "### Query: $($fq.Name)"
    $md += "````sql"
    $md += $fq.SQL.Trim()
    $md += "````"
    $md += ""
}

$md | Out-File -FilePath "D:\Development\general_soccer_app_v4\scratch\accdb_queries.md" -Encoding UTF8
Write-Host "Written markdown to scratch/accdb_queries.md!"

$db.Close()
