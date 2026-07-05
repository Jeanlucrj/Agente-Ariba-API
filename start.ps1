# =============================================================
# Agente Ariba Enterprise AI — Script de Inicialização Windows
# =============================================================
param(
    [string]$Mode = "prod",   # "prod" ou "dev"
    [switch]$Build,
    [switch]$Down,
    [switch]$Logs
)

$ErrorActionPreference = "Stop"
$BASE = $PSScriptRoot

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Agente Ariba Enterprise AI" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
try {
    docker info | Out-Null
} catch {
    Write-Host "ERRO: Docker nao esta rodando. Inicie o Docker Desktop e tente novamente." -ForegroundColor Red
    exit 1
}

# Criar .env se nao existir
if (-not (Test-Path "$BASE\.env")) {
    Write-Host "[SETUP] Criando .env a partir do .env.example..." -ForegroundColor Yellow
    Copy-Item "$BASE\.env.example" "$BASE\.env"
    Write-Host "[AVISO] Edite o arquivo .env antes de usar em producao!" -ForegroundColor Yellow
    Write-Host "        Especialmente: JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY, OPENAI_API_KEY" -ForegroundColor Yellow
    Write-Host ""
}

$composeFile = if ($Mode -eq "dev") { "docker-compose.dev.yml" } else { "docker-compose.yml" }
$composeCmd  = "docker-compose -f $BASE\$composeFile"

if ($Down) {
    Write-Host "[DOWN] Parando todos os servicos..." -ForegroundColor Yellow
    Invoke-Expression "$composeCmd down -v"
    Write-Host "Servicos parados." -ForegroundColor Green
    exit 0
}

if ($Logs) {
    Invoke-Expression "$composeCmd logs -f"
    exit 0
}

$buildFlag = if ($Build -or $Mode -eq "prod") { "--build" } else { "" }

Write-Host "[START] Modo: $Mode" -ForegroundColor Cyan
Write-Host "[START] Subindo servicos com Docker Compose..." -ForegroundColor Cyan
Write-Host ""

Invoke-Expression "$composeCmd up -d $buildFlag"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Servicos iniciados!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:       http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API:    http://localhost:3001/api/docs" -ForegroundColor White
Write-Host "  RabbitMQ Admin: http://localhost:15672" -ForegroundColor White
Write-Host ""
Write-Host "  Login inicial:" -ForegroundColor Yellow
Write-Host "  Email: admin@aribaenterprise.ai" -ForegroundColor Yellow
Write-Host "  Senha: Admin@123456" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Para ver os logs: .\start.ps1 -Logs" -ForegroundColor Gray
Write-Host "  Para parar:       .\start.ps1 -Down" -ForegroundColor Gray
Write-Host ""
