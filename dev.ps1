# Shyara Invite - Local Dev Launcher
# Run from the root: .\dev.ps1
# Optional flags:
#   -SkipInstall   Skip npm install even if node_modules is missing
#   -SkipMigrate   Skip Prisma migrate dev
#   -DbOnly        Start only the database (Docker)
#   -Reset         Drop and re-seed the database before starting

param(
    [switch]$SkipInstall,
    [switch]$SkipMigrate,
    [switch]$DbOnly,
    [switch]$Reset
)

$Root     = $PSScriptRoot
$Backend  = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend\shareable-moments"

function Write-Step { param($msg) Write-Host "" ; Write-Host ">> $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "   [OK]   $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "   [WARN] $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "   [ERR]  $msg" -ForegroundColor Red }

function Require-Command {
    param([string]$Name, [string]$Hint)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Err "$Name not found. $Hint"
        exit 1
    }
}

# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "  +----------------------------------+" -ForegroundColor Magenta
Write-Host "  |    Shyara Invite  --  Dev        |" -ForegroundColor Magenta
Write-Host "  +----------------------------------+" -ForegroundColor Magenta
Write-Host ""

# -- Prerequisites -----------------------------------------------------------
Write-Step "Checking prerequisites"
Require-Command "node"   "Install Node.js from https://nodejs.org"
Require-Command "npm"    "Install Node.js from https://nodejs.org"
Require-Command "docker" "Install Docker Desktop from https://www.docker.com"

$nodeVer   = node --version
$npmVer    = npm --version
$dockerVer = (docker --version) -replace "Docker version ([0-9.]+).*", '$1'
Write-Ok "node $nodeVer  |  npm $npmVer  |  docker $dockerVer"

# -- .env check --------------------------------------------------------------
Write-Step "Checking backend .env"
$EnvFile    = Join-Path $Backend ".env"
$EnvExample = Join-Path $Backend ".env.example"

if (-not (Test-Path $EnvFile)) {
    if (Test-Path $EnvExample) {
        Copy-Item $EnvExample $EnvFile
        Write-Warn ".env not found - copied from .env.example"
    } else {
        Write-Err ".env not found. Create $EnvFile before running."
        exit 1
    }
}

# Auto-patch placeholder values so local dev works out of the box
$envContent = Get-Content $EnvFile -Raw
$patched = $false

if ($envContent -match "postgresql://user:password@") {
    $envContent = $envContent -replace "postgresql://user:password@localhost:5432/shyara_invite", "postgresql://shyara:shyara_dev@localhost:5432/shyara_invite"
    $patched = $true
    Write-Warn "Auto-patched DATABASE_URL to match Docker defaults"
}
if ($envContent -match "FRONTEND_URL=http://localhost:8080") {
    $envContent = $envContent -replace "FRONTEND_URL=http://localhost:8080", "FRONTEND_URL=http://localhost:5173"
    $envContent = $envContent -replace "ADMIN_PORTAL_URL=http://localhost:8080", "ADMIN_PORTAL_URL=http://localhost:5173"
    $patched = $true
}
if ($envContent -match "your-jwt-secret-min-32-chars") {
    $envContent = $envContent -replace "your-jwt-secret-min-32-chars", "dev-jwt-secret-shyara-invite-local-32x"
    $envContent = $envContent -replace "your-refresh-secret-min-32-chars", "dev-refresh-secret-shyara-invite-32x"
    $envContent = $envContent -replace "your-admin-jwt-secret-min-32-chars", "dev-admin-jwt-secret-shyara-invite-32"
    $patched = $true
    Write-Warn "Auto-patched JWT secrets with dev-only values (change for production)"
}
if ($patched) {
    Set-Content $EnvFile $envContent -NoNewline
}

Write-Ok ".env ready"

# -- Docker: start only the db service ---------------------------------------
Write-Step "Starting PostgreSQL via Docker Compose"
Push-Location $Backend
try {
    if ($Reset) {
        Write-Warn "-Reset: removing existing db container + volume"
        docker compose down -v 2>&1 | Out-Null
    }

    $dockerOut = docker compose up -d db 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "docker compose up failed:"
        Write-Host $dockerOut
        Pop-Location
        exit 1
    }
    Write-Ok "PostgreSQL started on localhost:5432"

    # Poll pg_isready up to 30 seconds
    Write-Host "   Waiting for Postgres" -NoNewline
    $ready = $false
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 2
        docker compose exec -T db pg_isready -U shyara 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Write-Host "." -NoNewline
    }
    Write-Host ""
    if ($ready) {
        Write-Ok "Postgres is ready"
    } else {
        Write-Warn "Postgres may not be ready yet - continuing anyway"
    }
} finally {
    Pop-Location
}

if ($DbOnly) {
    Write-Ok "DB-only mode - done."
    exit 0
}

# -- Backend: npm install ----------------------------------------------------
Write-Step "Backend dependencies"
Push-Location $Backend
try {
    if ($SkipInstall -and (Test-Path "node_modules")) {
        Write-Ok "Skipped (node_modules exists)"
    } else {
        if (Test-Path "node_modules") {
            Write-Host "   Refreshing backend packages..." -ForegroundColor Gray
        } else {
            Write-Host "   Installing backend packages..." -ForegroundColor Gray
        }
        npm install --silent
        if ($LASTEXITCODE -ne 0) {
            Write-Err "npm install failed in backend"
            Pop-Location
            exit 1
        }
        Write-Ok "Backend packages ready"
    }
} finally {
    Pop-Location
}

# -- Prisma: generate + migrate ----------------------------------------------
Write-Step "Prisma"
Push-Location $Backend
try {
    Write-Host "   Generating Prisma client..." -ForegroundColor Gray
    npx prisma generate 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Err "prisma generate failed"
        Pop-Location
        exit 1
    }
    Write-Ok "Prisma client generated"

    if (-not $SkipMigrate) {
        if ($Reset) {
            Write-Warn "-Reset: running prisma migrate reset (drops all data)"
            $env:ADMIN_SEED_PASSWORD   = "admin123"
            $env:SUPPORT_SEED_PASSWORD = "support123"
            npx prisma migrate reset --force
        } else {
            Write-Host "   Running prisma migrate dev (may take 20-30s)..." -ForegroundColor Gray
            npx prisma migrate dev --skip-seed --name auto
            if ($LASTEXITCODE -ne 0) {
                Write-Err "prisma migrate failed (see output above)"
                Pop-Location
                exit 1
            }
        }
        Write-Ok "Migrations applied"
    } else {
        Write-Ok "Migration skipped (-SkipMigrate)"
    }
} finally {
    Pop-Location
}

# -- Frontend: npm install ---------------------------------------------------
Write-Step "Frontend dependencies"
Push-Location $Frontend
try {
    if ($SkipInstall -and (Test-Path "node_modules")) {
        Write-Ok "Skipped (node_modules exists)"
    } else {
        if (-not (Test-Path "node_modules")) {
            Write-Host "   Installing frontend packages (first run takes a moment)..." -ForegroundColor Gray
        } else {
            Write-Host "   Refreshing frontend packages..." -ForegroundColor Gray
        }
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Err "npm install failed in frontend"
            Pop-Location
            exit 1
        }
        Write-Ok "Frontend packages ready"
    }
} finally {
    Pop-Location
}

# -- Launch dev servers ------------------------------------------------------
Write-Step "Launching dev servers"

$backendCmd  = "Set-Location '$Backend'; Write-Host 'Shyara Backend' -ForegroundColor Cyan; npm run dev"
$frontendCmd = "Set-Location '$Frontend'; Write-Host 'Shyara Frontend' -ForegroundColor Magenta; npm run dev"

$useWT = [bool](Get-Command "wt" -ErrorAction SilentlyContinue)

if ($useWT) {
    $wtArgs = "new-tab --title `"Shyara Backend`" powershell -NoExit -Command `"$backendCmd`" ; split-pane --title `"Shyara Frontend`" powershell -NoExit -Command `"$frontendCmd`""
    Start-Process "wt" -ArgumentList $wtArgs
    Write-Ok "Opened in Windows Terminal (split panes)"
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    Start-Sleep -Milliseconds 600
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    Write-Ok "Opened two PowerShell windows"
}

# -- Summary -----------------------------------------------------------------
Write-Host ""
Write-Host "  +-------------------------------------------+" -ForegroundColor DarkGray
Write-Host "  |  Frontend  ->  http://localhost:5173       |" -ForegroundColor DarkGray
Write-Host "  |  Backend   ->  http://localhost:3000       |" -ForegroundColor DarkGray
Write-Host "  |  DB        ->  localhost:5432              |" -ForegroundColor DarkGray
Write-Host "  |  Admin     ->  http://localhost:5173/admin |" -ForegroundColor DarkGray
Write-Host "  +-------------------------------------------+" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Stop DB:      docker compose -f '$Backend\docker-compose.yml' down" -ForegroundColor DarkGray
Write-Host "  DB studio:    cd '$Backend'; npx prisma studio" -ForegroundColor DarkGray
Write-Host ""