# Spicy Visualiser uninstaller
$ErrorActionPreference = "Continue"
$HelperRoot = Join-Path $env:LOCALAPPDATA "SpicyVisualiser"
$StartupLink = Join-Path ([Environment]::GetFolderPath("Startup")) "Spicy Visualiser helper.lnk"

Write-Host ""
Write-Host "  Removing Spicy Visualiser" -ForegroundColor Magenta

Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*SpicyVisualiser*helper.js*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 500
Remove-Item $StartupLink -Force -ErrorAction SilentlyContinue
Remove-Item "HKCU:\Software\Classes\spicy-visualiser" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $HelperRoot -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "    Helper removed." -ForegroundColor Green

$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
$spicetify = Get-Command spicetify -ErrorAction SilentlyContinue
if ($spicetify) {
  & spicetify config extensions "spicy-visualiser.js-" 2>&1 | Out-Null
  $userData = $null
  try { $userData = @(& spicetify path userdata 2>&1 | ForEach-Object { "$_".Trim() } | Where-Object { $_ -and (Test-Path $_) })[-1] } catch {}
  if (-not $userData) { $userData = Join-Path $env:APPDATA "spicetify" }
  Remove-Item (Join-Path $userData "Extensions\spicy-visualiser.js") -Force -ErrorAction SilentlyContinue
  & spicetify apply | Out-Host
  Write-Host "    Extension removed." -ForegroundColor Green
}
Write-Host ""
Write-Host "  Done. (Node.js was left installed.)" -ForegroundColor Green
