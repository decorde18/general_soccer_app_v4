$dbPath = "D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb"
$dao = New-Object -ComObject DAO.DBEngine.120
$db = $dao.OpenDatabase($dbPath)

Write-Host "=== Containers and Document Members ==="
$modContainer = $db.Containers.Item("Modules")
if ($modContainer.Documents.Count -gt 0) {
    $doc = $modContainer.Documents.Item(0)
    Write-Host "Doc Name: $($doc.Name)"
    $doc | Get-Member | Select-Object Name, MemberType | ForEach-Object { Write-Host "  $($_.MemberType): $($_.Name)" }
    Write-Host "Properties count: $($doc.Properties.Count)"
    for ($p = 0; $p -lt $doc.Properties.Count; $p++) {
        try {
            $prop = $doc.Properties.Item($p)
            Write-Host "  Prop $($prop.Name) = $($prop.Value)"
        } catch {
            Write-Host "  Prop $($doc.Properties.Item($p).Name) (cannot read value)"
        }
    }
}

Write-Host "`n=== All Forms in Container ==="
$formContainer = $db.Containers.Item("Forms")
for ($i = 0; $i -lt $formContainer.Documents.Count; $i++) {
    Write-Host "Form $($i): $($formContainer.Documents.Item($i).Name)"
}

Write-Host "`n=== All Reports in Container ==="
$repContainer = $db.Containers.Item("Reports")
for ($i = 0; $i -lt $repContainer.Documents.Count; $i++) {
    Write-Host "Report $($i): $($repContainer.Documents.Item($i).Name)"
}

Write-Host "`n=== All Modules in Container ==="
for ($i = 0; $i -lt $modContainer.Documents.Count; $i++) {
    Write-Host "Module $($i): $($modContainer.Documents.Item($i).Name)"
}

$db.Close()
