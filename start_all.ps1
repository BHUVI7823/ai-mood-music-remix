$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = $PWD }

Write-Host "Cleaning up existing processes on ports 3000 and 8080..." -ForegroundColor Yellow

# Kill process on 8080 (Backend)
$backendPort = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($backendPort) {
    Stop-Process -Id $backendPort.OwningProcess -Force -ErrorAction SilentlyContinue
}

# Kill process on 3000 (Frontend)
$frontendPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontendPort) {
    Stop-Process -Id $frontendPort.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$scriptDir\start_backend.ps1"

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir\frontend'; npm run dev"

