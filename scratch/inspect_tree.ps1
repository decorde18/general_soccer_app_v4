$dbPath = "D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb"
$dao = New-Object -ComObject DAO.DBEngine.120
$db = $dao.OpenDatabase($dbPath)

# Let's load all MSysAccessStorage records into memory
$rs = $db.OpenRecordset("SELECT Id, ParentId, Name, Type, DateUpdate FROM MSysAccessStorage ORDER BY ParentId, Id")
$items = @{}
while (-not $rs.EOF) {
    $items[$rs.Fields.Item("Id").Value] = @{
        Id = $rs.Fields.Item("Id").Value
        ParentId = $rs.Fields.Item("ParentId").Value
        Name = $rs.Fields.Item("Name").Value
        Type = $rs.Fields.Item("Type").Value
        DateUpdate = $rs.Fields.Item("DateUpdate").Value
    }
    $rs.MoveNext()
}
$rs.Close()

Write-Host "Total storage records: $($items.Count)"

# Helper function to print tree
function Print-SubTree($parentId, $indent) {
    $children = $items.Values | Where-Object { $_.ParentId -eq $parentId -and $_.Id -ne $parentId }
    foreach ($child in $children) {
        Write-Host "$indent- [$($child.Id)] $($child.Name) (Type: $($child.Type))"
        Print-SubTree $child.Id ($indent + "  ")
    }
}

Write-Host "`n=== Top-level Folders under Root (Id=1) ==="
$rootChildren = $items.Values | Where-Object { $_.ParentId -eq 1 -and $_.Id -ne 1 }
foreach ($rc in $rootChildren) {
    $subCount = ($items.Values | Where-Object { $_.ParentId -eq $rc.Id }).Count
    Write-Host "[$($rc.Id)] $($rc.Name) (Children: $subCount)"
}

Write-Host "`n=== Children under Modules (Id=6) ==="
Print-SubTree 6 "  "

Write-Host "`n=== Children under Forms (Id=4) (First 15) ==="
$formChildren = $items.Values | Where-Object { $_.ParentId -eq 4 } | Select-Object -First 15
foreach ($fc in $formChildren) {
    Write-Host "  - [$($fc.Id)] $($fc.Name)"
    $grandchildren = $items.Values | Where-Object { $_.ParentId -eq $fc.Id }
    foreach ($gc in $grandchildren) {
        Write-Host "      - [$($gc.Id)] $($gc.Name) (Type: $($gc.Type))"
    }
}

Write-Host "`n=== Children under VBA (Id=8) ==="
Print-SubTree 8 "  "

$db.Close()
