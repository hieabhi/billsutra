# =====================================================
# BillSutra Server Shutdown Script
# =====================================================
# Run this script to stop all servers cleanly
# Usage: .\stop-dev.ps1
# =====================================================

Write-Host "🛑 Stopping BillSutra Development Environment..." -ForegroundColor Yellow
Write-Host ""

# Stop all Node processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping $($nodeProcesses.Count) Node.js process(es)..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ All Node.js processes stopped" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No Node.js processes running" -ForegroundColor Gray
}

Write-Host ""

# Clean up ports
Write-Host "🧹 Cleaning up ports 5051 and 5173..." -ForegroundColor Yellow

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

Write-Host "✅ Ports cleaned up" -ForegroundColor Green
Write-Host ""
Write-Host "✨ All servers stopped successfully!" -ForegroundColor Green
Write-Host ""
