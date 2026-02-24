# =============================================================================
# deploy.ps1 — LiveKit Cloud deployment script (Windows PowerShell)
# =============================================================================
# Usage (run from project root or this folder):
#   .\deployment_lk_cloud\deploy.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir    = Split-Path -Parent $ScriptDir
$EnvFile    = Join-Path $ScriptDir ".env.production"
$EnvExample = Join-Path $ScriptDir ".env.example"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Voice Agent — LiveKit Cloud Deploy     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check .env.production ─────────────────────────────────────────────────
if (-not (Test-Path $EnvFile)) {
    Write-Host "❌  .env.production not found." -ForegroundColor Red
    Write-Host "    Copy the example and fill in your credentials:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    Copy-Item '$EnvExample' '$EnvFile'" -ForegroundColor Gray
    Write-Host "    notepad '$EnvFile'" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# ── 2. Parse and validate env vars ───────────────────────────────────────────
$envVars = @{}
Get-Content $EnvFile | Where-Object { $_ -match "^\s*[^#].*=.*" } | ForEach-Object {
    $parts = $_ -split "=", 2
    if ($parts.Count -eq 2) { $envVars[$parts[0].Trim()] = $parts[1].Trim() }
}

$required = @("LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "GOOGLE_API_KEY")
$missing  = $required | Where-Object { -not $envVars.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($envVars[$_]) }

if ($missing.Count -gt 0) {
    Write-Host "❌  Missing required variables in .env.production:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "      • $_" -ForegroundColor Yellow }
    Write-Host ""
    exit 1
}

Write-Host "✅  Credentials validated" -ForegroundColor Green
Write-Host "    LiveKit URL : $($envVars['LIVEKIT_URL'])" -ForegroundColor Gray
Write-Host "    API Key     : $($envVars['LIVEKIT_API_KEY'].Substring(0, [Math]::Min(8, $envVars['LIVEKIT_API_KEY'].Length)))..." -ForegroundColor Gray
Write-Host ""

# ── 3. Check Docker ───────────────────────────────────────────────────────────
try {
    $dockerVer = docker --version
    Write-Host "✅  $dockerVer" -ForegroundColor Green
} catch {
    Write-Host "❌  Docker not found. Install from: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Red
    exit 1
}

# ── 4. Stop existing containers ───────────────────────────────────────────────
Write-Host ""
Write-Host "⏹   Stopping existing containers..." -ForegroundColor Yellow
Set-Location $ScriptDir
docker compose down --remove-orphans 2>$null

# ── 5. Build images ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨  Building images..." -ForegroundColor Cyan
docker compose build --pull
if ($LASTEXITCODE -ne 0) { Write-Host "❌  Build failed." -ForegroundColor Red; exit 1 }

# ── 6. Start services ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🚀  Starting services..." -ForegroundColor Cyan
docker compose --env-file $EnvFile up -d
if ($LASTEXITCODE -ne 0) { Write-Host "❌  Failed to start services." -ForegroundColor Red; exit 1 }

# ── 7. Health check ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "⏳  Waiting for services to start (5s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "📋  Container status:" -ForegroundColor Cyan
docker compose ps

Write-Host ""
Write-Host "📜  Agent logs (last 20 lines):" -ForegroundColor Cyan
docker compose logs --tail=20 agent

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅  Deployment complete!                ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor White
Write-Host "  Agent    : connected to $($envVars['LIVEKIT_URL'])" -ForegroundColor White
Write-Host ""
Write-Host "  Useful commands:" -ForegroundColor Gray
Write-Host "    docker compose logs -f agent      # Stream agent logs" -ForegroundColor Gray
Write-Host "    docker compose logs -f frontend   # Stream frontend logs" -ForegroundColor Gray
Write-Host "    docker compose down               # Stop everything" -ForegroundColor Gray
Write-Host ""
