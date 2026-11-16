# Removes the Spicy Visualiser helper (run from Settings > Apps).
$Root = Join-Path $env:LOCALAPPDATA "SpicyVisualiser"
Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*SpicyVisualiser*helper.js*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 500
Remove-Item (Join-Path ([Environment]::GetFolderPath("Startup")) "Spicy Visualiser helper.lnk") -Force -ErrorAction SilentlyContinue
Remove-Item "HKCU:\Software\Classes\spicy-visualiser" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\SpicyVisualiserHelper" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $Root "helper") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $Root "node") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $Root "uninstall-helper.ps1") -Force -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show("The Spicy Visualiser helper has been removed.", "Spicy Visualiser", "OK", "Information") | Out-Null
