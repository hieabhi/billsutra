# =====================================================
# BillSutra Development Server Startup Script
# =====================================================
# Run this script to start both frontend and backend
# Usage: .\start-dev.ps1
# =====================================================

Write-Host "🚀 Starting BillSutra Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Stop any existing Node processes
Write-Host "🛑 Stopping existing Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Clean up any lingering port locks
Write-Host "🧹 Cleaning up ports..." -ForegroundColor Yellow
netstat -ano | findstr ":5051" | ForEach-Object {
    $processId = $_.Split()[-1]
    if ($processId -and $processId -ne "0") {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}
netstat -ano | findstr ":5173" | ForEach-Object {
    $processId = $_.Split()[-1]
    if ($processId -and $processId -ne "0") {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "✅ Environment cleaned" -ForegroundColor Green
Write-Host ""

# Start Backend Server
Write-Host "🔧 Starting Backend Server (Port 5051)..." -ForegroundColor Cyan
$backendPath = "$PSScriptRoot\server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; node index.js" -WindowStyle Normal

# Wait for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verify backend is running
$backendRunning = $false
for ($i = 0; $i -lt 10; $i++) {
    $connection = Get-NetTCPConnection -LocalPort 5051 -ErrorAction SilentlyContinue
    if ($connection) {
        $backendRunning = $true
        break
    }
    Start-Sleep -Seconds 1
}

if ($backendRunning) {
    Write-Host "✅ Backend server started on http://localhost:5051" -ForegroundColor Green
} else {
    Write-Host "❌ Backend failed to start!" -ForegroundColor Red
    Write-Host "Please check the backend terminal window for errors" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Start Frontend Server
Write-Host "🎨 Starting Frontend Server (Port 5173)..." -ForegroundColor Cyan
$frontendPath = "$PSScriptRoot\client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verify frontend is running
$frontendRunning = $false
for ($i = 0; $i -lt 15; $i++) {
    $connection = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
    if ($connection) {
        $frontendRunning = $true
        break
    }
    Start-Sleep -Seconds 1
}

if ($frontendRunning) {
    Write-Host "✅ Frontend server started on http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend failed to start!" -ForegroundColor Red
    Write-Host "Please check the frontend terminal window for errors" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 BillSutra is ready!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "🔧 Backend:   http://localhost:5051" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Open browser
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "   • Both servers are running in separate windows" -ForegroundColor Gray
Write-Host "   • Press Ctrl+C in each window to stop servers" -ForegroundColor Gray
Write-Host "   • Run this script again to restart everything" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Happy coding!" -ForegroundColor Green
Write-Host ""
