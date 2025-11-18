# BillSutra - Start Both Servers
Write-Host "🚀 Starting BillSutra HMS..." -ForegroundColor Cyan

# Kill any existing Node processes
Write-Host "Stopping any running servers..." -ForegroundColor Yellow
taskkill /F /IM node.exe /T 2>$null
Start-Sleep -Seconds 2

# Start Backend Server in new window
Write-Host "Starting Backend Server (Port 5051)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\server'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; node index.js"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend Server in new window
Write-Host "Starting Frontend Server (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\client'; Write-Host 'Frontend Server Starting...' -ForegroundColor Cyan; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 5

# Open browser
Write-Host "`n✅ Servers started!" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:5051" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "`nOpening browser..." -ForegroundColor Cyan

Start-Sleep -Seconds 3
Start-Process "http://127.0.0.1:5173"

Write-Host "`n✨ BillSutra HMS is ready!" -ForegroundColor Green
Write-Host "Press any key to exit this window (servers will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
