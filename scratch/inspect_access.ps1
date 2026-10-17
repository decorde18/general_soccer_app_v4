Write-Host "=== Python and Node Check ==="
Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source

Write-Host "`n=== OLEDB / ODBC Drivers ==="
Get-OdbcDriver | Where-Object { $_.Name -like "*Access*" } | Select-Object Name, Platform

Write-Host "`n=== Checking COM Object Access.Application ==="
try {
    $app = New-Object -ComObject Access.Application
    Write-Host "Access.Application COM available: $($app.Version)"
    $app.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
} catch {
    Write-Host "Access.Application COM NOT available: $($_.Exception.Message)"
}

Write-Host "`n=== Checking OLEDB Providers ==="
try {
    (New-Object System.Data.OleDb.OleDbEnumerator).GetElements() | Where-Object { $_.SOURCES_NAME -like "*ACE*" -or $_.SOURCES_NAME -like "*Jet*" } | Select-Object SOURCES_NAME, SOURCES_DESCRIPTION
} catch {
    Write-Host "OleDbEnumerator error: $($_.Exception.Message)"
}
