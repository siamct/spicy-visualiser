# Spicy Visualiser installer
# Puts the Spicy Visualiser extension into Spicetify and sets up the helper that
# lets it react to the music. Run it by double-clicking "Install Spicy Visualiser.bat".
# -HelperOnly: just the helper (for the Marketplace version; Spotify isn't restarted).
param([switch]$HelperOnly)

$ErrorActionPreference = "Stop"
trap {
  Write-Host ""
  Write-Host "  Something went wrong: $_" -ForegroundColor Red
  Write-Host "  Nothing else was changed after this point." -ForegroundColor Red
  exit 1
}
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$HelperDir = Join-Path $env:LOCALAPPDATA "SpicyVisualiser\helper"
$StartupLink = Join-Path ([Environment]::GetFolderPath("Startup")) "Spicy Visualiser helper.lnk"

function Step($text) { Write-Host ""; Write-Host "==> $text" -ForegroundColor Cyan }
function Ok($text)   { Write-Host "    $text" -ForegroundColor Green }
function Info($text) { Write-Host "    $text" }
function Warn($text) { Write-Host "    $text" -ForegroundColor Yellow }
function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}

Write-Host ""
Write-Host "  Spicy Visualiser installer" -ForegroundColor Magenta
Write-Host "  A music visualiser add-on for Spicy Lyrics (needs Spicy Lyrics installed)"
Write-Host ""

# --- 1. Spicetify -----------------------------------------------------------
Step "Checking Spicetify"
Refresh-Path
$spicetify = Get-Command spicetify -ErrorAction SilentlyContinue
if (-not $spicetify) {
  $guess = Join-Path $env:LOCALAPPDATA "spicetify\spicetify.exe"
  if (Test-Path $guess) { $spicetify = Get-Item $guess }
}
if (-not $spicetify) {
  Warn "Spicetify isn't installed (it's what lets Spotify run mods)."
  $answer = Read-Host "    Install Spicetify now? (Y/N)"
  if ($answer -notmatch "^[Yy]") { throw "Spicetify is needed. Install it from https://spicetify.app and run this again." }
  Invoke-WebRequest -UseBasicParsing https://raw.githubusercontent.com/spicetify/cli/main/install.ps1 | Invoke-Expression
  Refresh-Path
  $spicetify = Get-Command spicetify -ErrorAction SilentlyContinue
  if (-not $spicetify) { throw "Spicetify still can't be found. Close this window, open a new one and run the installer again." }
}
$spicetifyExe = if ($spicetify.Source) { $spicetify.Source } else { $spicetify.FullName }
Ok "Found Spicetify."

# Run spicetify without stopping on its normal messages (it prints some to stderr).
function Spice {
  $old = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try { & $spicetifyExe @args 2>&1 | ForEach-Object { "$_" } } finally { $ErrorActionPreference = $old }
}

# Where Spicetify keeps extensions.
$userData = $null
try {
  $out = Spice path userdata | ForEach-Object { $_.Trim() } | Where-Object { $_ -and (Test-Path $_ -ErrorAction SilentlyContinue) }
  if ($out) { $userData = @($out)[-1] }
} catch {}
if (-not $userData) { $userData = Join-Path $env:APPDATA "spicetify" }
$extDir = Join-Path $userData "Extensions"
New-Item -ItemType Directory -Force -Path $extDir | Out-Null

# --- 2. Extension -------------------------------------------------------------
if (-not $HelperOnly) {
  Step "Installing the Spicy Visualiser extension"
  Copy-Item (Join-Path $Here "spicy-visualiser.js") $extDir -Force
  Unblock-File (Join-Path $extDir "spicy-visualiser.js") -ErrorAction SilentlyContinue
  Spice config extensions spicy-visualiser.js | Out-Null
  Ok "Copied to $extDir"
}

# --- 3. Node.js (runs the helper) ------------------------------------------------
Step "Checking Node.js (needed for the music helper)"
Refresh-Path
$node = Get-Command node -ErrorAction SilentlyContinue
$needNode = $true
if ($node) {
  $ver = (& node --version) -replace "^v", ""
  if ([int]($ver.Split(".")[0]) -ge 18) { $needNode = $false; Ok "Found Node.js $ver." }
  else { Warn "Node.js $ver is too old, updating." }
}
if ($needNode) {
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Info "Installing Node.js LTS with winget (this can take a minute)..."
    winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements | Out-Host
    Refresh-Path
    $node = Get-Command node -ErrorAction SilentlyContinue
  }
  if (-not $node) {
    Warn "Couldn't install Node.js automatically."
    Warn "Install the LTS version from https://nodejs.org, then run this installer again."
    Start-Process "https://nodejs.org/en/download"
    throw "Node.js is missing."
  }
  Ok "Node.js installed."
}
$nodeExe = (Get-Command node).Source

# --- 4. Helper --------------------------------------------------------------------
Step "Installing the music helper"
# Stop a helper that's already running so its files can be replaced.
Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*SpicyVisualiser*helper.js*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 500

New-Item -ItemType Directory -Force -Path $HelperDir | Out-Null
Copy-Item (Join-Path $Here "helper\*") $HelperDir -Recurse -Force
Get-ChildItem $HelperDir -Recurse -File | Unblock-File -ErrorAction SilentlyContinue
Ok "Copied to $HelperDir"
# A copy straight from GitHub has no node_modules: download them once.
if (-not (Test-Path (Join-Path $HelperDir "node_modules\ws"))) {
  Info "Downloading the helper's parts (first install only)..."
  Push-Location $HelperDir
  $old = $ErrorActionPreference; $ErrorActionPreference = "Continue"
  & npm install --omit=dev --no-audit --no-fund 2>&1 | Out-Host
  $ErrorActionPreference = $old
  Pop-Location
  if (-not (Test-Path (Join-Path $HelperDir "node_modules\ws"))) { throw "Couldn't download the helper's parts (npm install failed). Check your internet connection and run this again." }
}

# Like the original installer: the helper starts with Windows in the
# background and only listens while the visualiser is on screen.
$conhost = Join-Path $env:WINDIR "System32\conhost.exe"
$helperJs = Join-Path $HelperDir "helper.js"
$launchArgs = "--headless `"$nodeExe`" `"$helperJs`" --log-file --stay"
$lnk = (New-Object -ComObject WScript.Shell).CreateShortcut($StartupLink)
$lnk.TargetPath = $conhost
$lnk.Arguments = $launchArgs
$lnk.WorkingDirectory = $HelperDir
$lnk.WindowStyle = 7
$lnk.Description = "Spicy Visualiser helper (lets the visualiser hear the music)"
$lnk.Save()
Remove-Item "HKCU:\Software\Classes\spicy-visualiser" -Recurse -Force -ErrorAction SilentlyContinue
Ok "Starts with Windows in the background; only listens while the visualiser is on screen."

Start-Process -FilePath $conhost -ArgumentList $launchArgs -WorkingDirectory $HelperDir -WindowStyle Hidden
Start-Sleep -Seconds 2
$running = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*SpicyVisualiser*helper.js*" }
if ($running) { Ok "Helper is running." }
else { Warn "The helper didn't start. Check $HelperDir\helper.log" }

# --- 5. Apply -----------------------------------------------------------------------
if (-not $HelperOnly) {
  Step "Applying to Spotify (Spotify will restart)"
  Spice apply | Out-Host
  if ($LASTEXITCODE -ne 0) {
    Warn "'spicetify apply' reported a problem. If Spotify recently updated, try:"
    Warn "    spicetify backup apply"
  }
}

Write-Host ""
Write-Host "  Done!" -ForegroundColor Green
if ($HelperOnly) {
  Write-Host "  Back in Spotify, the visualiser says Live within a few seconds."
} else {
  Write-Host "  Open Spicy Lyrics in Spotify and click the new bars icon next to"
  Write-Host "  its buttons (top right) to open the Spicy Visualiser settings."
}
Write-Host ""
