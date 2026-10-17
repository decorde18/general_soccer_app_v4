$accdbPath = "D:\Development\general_soccer_app_v4\IHS Girls Soccer - Most Recent.accdb"
$bytes = [System.IO.File]::ReadAllBytes($accdbPath)
Write-Host "Read $($bytes.Length) bytes."

# Try decoding as ASCII / UTF-8 / Unicode and look for module keywords or form text
$textAscii = [System.Text.Encoding]::ASCII.GetString($bytes)

# Search for "PublicStrings" or "PublicSubs" or "Option Compare Database"
$matches = [regex]::Matches($textAscii, '(?s)Attribute VB_Name = "([^"]+)".*?End (Sub|Function|Class|Property)')
Write-Host "Found $($matches.Count) regex matches for VB_Name in ASCII!"

# Also check for "Option Compare Database"
$optMatches = [regex]::Matches($textAscii, 'Option Compare Database')
Write-Host "Found $($optMatches.Count) matches for 'Option Compare Database' in ASCII!"

# Let's see if Unicode (UTF-16LE) has them:
$textUnicode = [System.Text.Encoding]::Unicode.GetString($bytes)
$optMatchesUni = [regex]::Matches($textUnicode, 'Option Compare Database')
Write-Host "Found $($optMatchesUni.Count) matches for 'Option Compare Database' in Unicode!"
