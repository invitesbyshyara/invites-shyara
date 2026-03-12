# Shyara Invite - Full Local Runner
# Usage:
#   .\run-website.ps1
#   .\run-website.ps1 -InstallOnly
#   .\run-website.ps1 -SkipInstall -SkipMigrate

param(
    [switch]$SkipInstall,
    [switch]$SkipMigrate,
    [switch]$InstallOnly
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$Root = $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$BackendEnv = Join-Path $Backend ".env"
$BackendEnvExample = Join-Path $Backend ".env.example"
$FrontendEnvLocal = Join-Path $Frontend ".env.local"
$FrontendUrl = "http://localhost:8080"

function Write-Step { param([string]$Message) Write-Host ""; Write-Host ">> $Message" -ForegroundColor Cyan }
function Write-Ok { param([string]$Message) Write-Host "   [OK]   $Message" -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host "   [WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param([string]$Message) Write-Host "   [ERR]  $Message" -ForegroundColor Red }

function Require-Command {
    param([string]$Name, [string]$Hint)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Err "$Name not found. $Hint"
        exit 1
    }
}

function Upsert-EnvLine {
    param(
        [string]$Path,
        [string]$Key,
        [string]$Value,
        [switch]$Overwrite
    )

    $lines = @()
    if (Test-Path $Path) {
        $lines = Get-Content $Path
    }

    $updated = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*$([Regex]::Escape($Key))=") {
            $current = ($lines[$i] -split "=", 2)[1]
            if ($Overwrite -or [string]::IsNullOrWhiteSpace($current)) {
                $lines[$i] = "$Key=$Value"
                $updated = $true
            }
            Set-Content $Path $lines
            return
        }
    }

    $lines += "$Key=$Value"
    $updated = $true
    if ($updated) {
        Set-Content $Path $lines
    }
}

function Get-EnvValue {
    param([string]$Path, [string]$Key)
    if (-not (Test-Path $Path)) {
        return $null
    }

    $line = Get-Content $Path | Where-Object { $_ -match "^\s*$([Regex]::Escape($Key))=" } | Select-Object -First 1
    if (-not $line) {
        return $null
    }
    return ($line -split "=", 2)[1]
}

function Clear-ViteCaches {
    param([string]$FrontendPath)

    Write-Step "Clearing stale Vite cache folders"
    $cacheDirs = @(
        (Join-Path $FrontendPath ".vite-cache"),
        (Join-Path $FrontendPath "node_modules\\.vite"),
        (Join-Path $FrontendPath "node_modules\\.vite2")
    )

    $cacheRoot = $env:LOCALAPPDATA
    if (-not $cacheRoot) {
        $cacheRoot = $env:TEMP
    }
    if ($cacheRoot) {
        $cacheDirs += (Join-Path $cacheRoot "shyara-vite-cache")
    }

    foreach ($dir in $cacheDirs) {
        if (-not (Test-Path $dir)) {
            continue
        }

        try {
            Remove-Item -Path $dir -Recurse -Force -ErrorAction Stop
            Write-Ok "Removed $dir"
        }
        catch {
            Write-Warn "Could not remove $dir (likely locked). Continuing."
        }
    }
}

function Stop-StaleDevProcesses {
    param(
        [string]$BackendPath,
        [string]$FrontendPath
    )

    Write-Step "Stopping stale Shyara dev node processes"
    $stoppedAny = $false
    $escapedBackend = [Regex]::Escape($BackendPath)
    $escapedFrontend = [Regex]::Escape($FrontendPath)

    $candidates = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
        Where-Object {
            $_.CommandLine -and (
                ($_.CommandLine -match $escapedBackend -and $_.CommandLine -match "tsx(\.cmd)?\s+watch") -or
                ($_.CommandLine -match $escapedFrontend -and $_.CommandLine -match "vite")
            )
        }

    foreach ($proc in $candidates) {
        try {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
            Write-Ok "Stopped PID $($proc.ProcessId)"
            $stoppedAny = $true
        }
        catch {
            Write-Warn "Could not stop PID $($proc.ProcessId)"
        }
    }

    if (-not $stoppedAny) {
        Write-Ok "No stale Shyara dev node processes found"
    }
}

function Ensure-DockerReady {
    Write-Step "Checking Docker daemon"
    docker info *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Docker daemon is running"
        return
    }

    $desktopExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path $desktopExe)) {
        Write-Err "Docker daemon is not running and Docker Desktop was not found at $desktopExe"
        exit 1
    }

    Write-Warn "Docker daemon is not running - starting Docker Desktop"
    Start-Process $desktopExe | Out-Null

    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 2
        docker info *> $null
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        Write-Err "Docker daemon did not become ready in time"
        exit 1
    }
    Write-Ok "Docker daemon is running"
}

Write-Host ""
Write-Host "  +-------------------------------------+" -ForegroundColor Magenta
Write-Host "  |   Shyara Invite Local Boot Script   |" -ForegroundColor Magenta
Write-Host "  +-------------------------------------+" -ForegroundColor Magenta
Write-Host ""

Write-Step "Checking required tools"
Require-Command "node" "Install Node.js from https://nodejs.org"
Require-Command "npm" "Install Node.js from https://nodejs.org"
Require-Command "docker" "Install Docker Desktop from https://www.docker.com"
Write-Ok "node $(node --version), npm $(npm --version)"

Write-Step "Preparing environment files"
if (-not (Test-Path $BackendEnv)) {
    if (Test-Path $BackendEnvExample) {
        Copy-Item $BackendEnvExample $BackendEnv
        Write-Warn "backend/.env created from .env.example"
    } else {
        Write-Err "Missing backend/.env and backend/.env.example"
        exit 1
    }
}

Upsert-EnvLine -Path $BackendEnv -Key "FRONTEND_URL" -Value $FrontendUrl -Overwrite
Upsert-EnvLine -Path $BackendEnv -Key "ADMIN_PORTAL_URL" -Value $FrontendUrl -Overwrite
Upsert-EnvLine -Path $BackendEnv -Key "STRIPE_SECRET_KEY" -Value "sk_test_replace_with_real_key"
Upsert-EnvLine -Path $BackendEnv -Key "STRIPE_PUBLISHABLE_KEY" -Value "pk_test_replace_with_real_key"
Upsert-EnvLine -Path $BackendEnv -Key "STRIPE_WEBHOOK_SECRET" -Value "whsec_replace_with_real_key"

$stripePk = Get-EnvValue -Path $BackendEnv -Key "STRIPE_PUBLISHABLE_KEY"
if (-not $stripePk) {
    $stripePk = "pk_test_replace_with_real_key"
}
Upsert-EnvLine -Path $FrontendEnvLocal -Key "VITE_STRIPE_PUBLISHABLE_KEY" -Value $stripePk
Write-Ok "Stripe env vars ensured in backend/.env and frontend/.env.local"

Ensure-DockerReady

Write-Step "Starting PostgreSQL container"
Push-Location $Backend
try {
    cmd /c "docker compose up -d db"
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to start db container"
        exit 1
    }
    Write-Ok "db container started"

    $pgReady = $false
    for ($i = 0; $i -lt 30; $i++) {
        cmd /c "docker compose exec -T db pg_isready -U shyara >nul 2>nul"
        if ($LASTEXITCODE -eq 0) {
            $pgReady = $true
            break
        }
        Start-Sleep -Seconds 2
    }

    if (-not $pgReady) {
        Write-Err "Postgres did not become ready in time"
        exit 1
    }
    Write-Ok "Postgres is ready"
}
finally {
    Pop-Location
}

if (-not $SkipInstall) {
    Write-Step "Installing backend dependencies"
    Push-Location $Backend
    try {
        $backendInstallFailed = $false
        npm install
        if ($LASTEXITCODE -ne 0) {
            $backendInstallFailed = $true
        }

        if ($backendInstallFailed) {
            if (Test-Path (Join-Path $Backend "node_modules")) {
                Write-Warn "backend npm install failed (likely file lock). Continuing with existing node_modules."
            } else {
                Write-Err "backend npm install failed and node_modules is missing"
                exit 1
            }
        }
    }
    finally {
        Pop-Location
    }
    Write-Ok "backend dependencies ready"

    Write-Step "Installing frontend dependencies"
    Push-Location $Frontend
    try {
        $frontendInstallFailed = $false
        npm install
        if ($LASTEXITCODE -ne 0) {
            $frontendInstallFailed = $true
        }

        if ($frontendInstallFailed) {
            if (Test-Path (Join-Path $Frontend "node_modules")) {
                Write-Warn "frontend npm install failed (likely file lock). Continuing with existing node_modules."
            } else {
                Write-Err "frontend npm install failed and node_modules is missing"
                exit 1
            }
        }
    }
    finally {
        Pop-Location
    }
    Write-Ok "frontend dependencies ready"
}
else {
    Write-Step "Skipping npm install (-SkipInstall)"
}

Write-Step "Running Prisma generate"
Push-Location $Backend
try {
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Err "prisma generate failed"
        exit 1
    }
    Write-Ok "Prisma client generated"

    if (-not $SkipMigrate) {
        Write-Step "Running Prisma migrate reset (local dev DB)"
        npx prisma migrate reset --force
        if ($LASTEXITCODE -ne 0) {
            Write-Err "prisma migrate reset failed"
            exit 1
        }
        Write-Ok "Prisma migrations applied and database seeded"
    } else {
        Write-Step "Skipping Prisma migrate (-SkipMigrate)"
    }
}
finally {
    Pop-Location
}

if ($InstallOnly) {
    Write-Host ""
    Write-Ok "Install-only run completed."
    Write-Host "   Backend:  cd '$Backend'; npm run dev"
    Write-Host "   Frontend: cd '$Frontend'; npm run dev"
    exit 0
}

Stop-StaleDevProcesses -BackendPath $Backend -FrontendPath $Frontend
Clear-ViteCaches -FrontendPath $Frontend

Write-Step "Launching backend and frontend"
$backendCmd = "Set-Location '$Backend'; npm run dev"
$frontendCmd = "Set-Location '$Frontend'; npm run dev -- --force --strictPort --port 8080"

if (Get-Command wt -ErrorAction SilentlyContinue) {
    $wtArgs = "new-tab --title `"Shyara Backend`" powershell -NoExit -Command `"$backendCmd`" ; split-pane --title `"Shyara Frontend`" powershell -NoExit -Command `"$frontendCmd`""
    Start-Process wt -ArgumentList $wtArgs | Out-Null
    Write-Ok "Opened backend + frontend in Windows Terminal"
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd | Out-Null
    Start-Sleep -Milliseconds 500
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd | Out-Null
    Write-Ok "Opened backend + frontend in two PowerShell windows"
}

Write-Host ""
Write-Host "Frontend: $FrontendUrl"
Write-Host "Backend:  http://localhost:3000"
Write-Host "Admin:    $FrontendUrl/admin"
