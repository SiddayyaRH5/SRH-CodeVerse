$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Starting Student backend (8080)..."
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root\backend'; .\mvnw.cmd spring-boot:run"
Write-Host "Starting Enterprise backend (8081)..."
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root\backend-enterprise'; .\mvnw.cmd spring-boot:run"
Write-Host "Starting frontend (Vite)..."
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root\frontend'; npm run dev"
Write-Host "Services launched in separate terminals. Verify database/environment configuration before use."
