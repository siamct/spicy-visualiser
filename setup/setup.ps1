# Spicy Visualiser helper setup
# Run by "Spicy Visualiser Helper Setup.exe". Installs the helper for this
# Windows user only (no admin): its own copy of Node.js, the helper, and a
# spicy-visualiser:// link so Spotify can start it when the visualiser is on
# screen. Nothing starts with Windows: Spotify starts it, and it closes when
# Spotify closes. Shows up in Settings > Apps, where it can be removed.

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
# Older Windows PowerShell defaults to TLS versions nodejs.org no longer accepts.
try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}
$Host.UI.RawUI.WindowTitle = "Spicy Visualiser helper setup"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Join-Path $env:LOCALAPPDATA "SpicyVisualiser"
$HelperDir = Join-Path $Root "helper"
$NodeDir = Join-Path $Root "node"
$NodeExe = Join-Path $NodeDir "node.exe"

function Line($text, $color = "Gray") { Write-Host "  $text" -ForegroundColor $color }
function Done-Box($text, $icon) {
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show($text, "Spicy Visualiser", "OK", $icon) | Out-Null
}

try {
  Write-Host ""
  Line "Spicy Visualiser helper" "Magenta"
  Line "Lets the visualiser hear the music. Runs only while the visualiser is on screen."
  Write-Host ""

  # Stop a running helper so its files can be replaced.
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*SpicyVisualiser*helper.js*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

  # 1. Node.js (a private copy, only used by the helper)
  if (-not (Test-Path $NodeExe)) {
    Line "Downloading Node.js (about 30 MB, first time only)..."
    $ver = $null
    try {
      # Stored first: Windows PowerShell passes a JSON list down a pipe as one item.
      $list = Invoke-RestMethod "https://nodejs.org/dist/index.json"
      $ver = ($list | Where-Object { $_.lts } | Select-Object -First 1).version
    } catch {}
    if (-not ($ver -is [string] -and $ver -match '^v\d+\.\d+\.\d+$')) { $ver = "v24.11.1" }
    $zip = Join-Path $env:TEMP "spicy-visualiser-node.zip"
    Invoke-WebRequest -UseBasicParsing "https://nodejs.org/dist/$ver/node-$ver-win-x64.zip" -OutFile $zip
    $tmp = Join-Path $env:TEMP ("spicy-visualiser-node-" + [guid]::NewGuid().ToString("N"))
    Expand-Archive $zip -DestinationPath $tmp -Force
    New-Item -ItemType Directory -Force -Path $NodeDir | Out-Null
    Copy-Item (Get-ChildItem $tmp -Recurse -Filter node.exe | Select-Object -First 1).FullName $NodeExe -Force
    Remove-Item $zip, $tmp -Recurse -Force -ErrorAction SilentlyContinue
    Line "Node.js $ver ready." "Green"
  }

  # 2. The helper
  Line "Installing the helper..."
  if (Test-Path $HelperDir) { Remove-Item $HelperDir -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $HelperDir | Out-Null
  Expand-Archive (Join-Path $Here "helper.zip") -DestinationPath $HelperDir -Force
  Copy-Item (Join-Path $Here "uninstall-helper.ps1") (Join-Path $Root "uninstall-helper.ps1") -Force
  Get-ChildItem $Root -Recurse -File | Unblock-File -ErrorAction SilentlyContinue

  # 3. Started by Spotify (spicy-visualiser:// link), closes with Spotify.
  #    Nothing starts with Windows (an older version's start-up entry is removed).
  $conhost = Join-Path $env:WINDIR "System32\conhost.exe"
  $helperJs = Join-Path $HelperDir "helper.js"
  $launchArgs = "--headless `"$NodeExe`" `"$helperJs`" --log-file"
  $proto = "HKCU:\Software\Classes\spicy-visualiser"
  New-Item -Path "$proto\shell\open\command" -Force | Out-Null
  Set-ItemProperty -Path $proto -Name "(default)" -Value "URL:Spicy Visualiser helper"
  Set-ItemProperty -Path $proto -Name "URL Protocol" -Value ""
  Set-ItemProperty -Path "$proto\shell\open\command" -Name "(default)" -Value "`"$conhost`" $launchArgs"
  Remove-Item (Join-Path ([Environment]::GetFolderPath("Startup")) "Spicy Visualiser helper.lnk") -Force -ErrorAction SilentlyContinue

  # 4. Listed in Settings > Apps so it can be removed like any app
  $un = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\SpicyVisualiserHelper"
  New-Item -Path $un -Force | Out-Null
  $unCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$(Join-Path $Root 'uninstall-helper.ps1')`""
  Set-ItemProperty $un -Name DisplayName -Value "Spicy Visualiser helper"
  Set-ItemProperty $un -Name Publisher -Value "siamct"
  Set-ItemProperty $un -Name DisplayVersion -Value "0.9.0"
  Set-ItemProperty $un -Name InstallLocation -Value $Root
  Set-ItemProperty $un -Name UninstallString -Value $unCmd
  Set-ItemProperty $un -Name NoModify -Value 1 -Type DWord
  Set-ItemProperty $un -Name NoRepair -Value 1 -Type DWord

  # 5. Start it now so the open visualiser goes Live straight away
  Start-Process -FilePath $conhost -ArgumentList $launchArgs -WorkingDirectory $HelperDir -WindowStyle Hidden
  Line "Done." "Green"
  Done-Box "The helper is installed. The visualiser in Spotify switches to Live in a few seconds.`n`nSpotify starts it when you open the visualiser, and it closes when Spotify closes. Remove it any time in Settings > Apps." "Information"
} catch {
  Line "Something went wrong: $_" "Red"
  Done-Box "Setup didn't finish:`n$_`n`nCheck your internet connection and try again." "Error"
  exit 1
}
