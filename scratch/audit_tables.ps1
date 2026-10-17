$dbPath = "D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb"
$dao = New-Object -ComObject DAO.DBEngine.120
$db = $dao.OpenDatabase($dbPath)

# Type mapping for DAO DataTypeEnum
$typeMap = @{
    1 = "Boolean"
    2 = "Byte"
    3 = "Integer"
    4 = "Long"
    5 = "Currency"
    6 = "Single"
    7 = "Double"
    8 = "Date/Time"
    10 = "Text"
    11 = "LongBinary/OLE"
    12 = "Memo/LongText"
    15 = "GUID"
    16 = "BigInt"
    18 = "Char"
    19 = "Numeric"
    20 = "Decimal"
}

$output = @()
$output += "# Legacy MS Access Database Schema Audit"
$output += "Database: IHS Girls Soccer - Most Recent.accdb`n"

for ($i = 0; $i -lt $db.TableDefs.Count; $i++) {
    $t = $db.TableDefs.Item($i)
    if ($t.Name -like "MSys*" -or $t.Name -like "~*") { continue }
    
    $recCount = $t.RecordCount
    # Sometimes RecordCount is not updated until recordset is opened:
    try {
        $rs = $db.OpenRecordset("SELECT COUNT(*) AS Cnt FROM [$($t.Name)]")
        $recCount = $rs.Fields.Item("Cnt").Value
        $rs.Close()
    } catch {}

    $output += "## Table: $($t.Name) ($recCount records)"
    $output += "| Field Name | Type | Size | Required | Notes |"
    $output += "| :--- | :--- | :--- | :--- | :--- |"
    
    for ($f = 0; $f -lt $t.Fields.Count; $f++) {
        $field = $t.Fields.Item($f)
        $tName = if ($typeMap.ContainsKey($field.Type)) { $typeMap[$field.Type] } else { "Type_$($field.Type)" }
        $req = $field.Required
        $notes = ""
        # Check if autoincrement / attributes
        if (($field.Attributes -band 16) -ne 0) { $notes = "AutoIncrement" }
        $output += "| $($field.Name) | $tName | $($field.Size) | $req | $notes |"
    }

    # Indexes
    if ($t.Indexes.Count -gt 0) {
        $output += "`n**Indexes:**"
        for ($idx = 0; $idx -lt $t.Indexes.Count; $idx++) {
            $index = $t.Indexes.Item($idx)
            $flds = @()
            for ($k = 0; $k -lt $index.Fields.Count; $k++) { $flds += $index.Fields.Item($k).Name }
            $output += "- $($index.Name): ($($flds -join ', ')) [Primary: $($index.Primary), Unique: $($index.Unique)]"
        }
    }
    $output += "`n---`n"
}

$output | Out-File -FilePath "D:\Development\general_soccer_app_v4\scratch\accdb_tables_audit.md" -Encoding UTF8
Write-Host "Table audit written to scratch/accdb_tables_audit.md!"
$db.Close()
