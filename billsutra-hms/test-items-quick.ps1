$login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$headers = @{"Authorization"="Bearer $($login.token)"}
Write-Host "Testing items API..." -ForegroundColor Cyan
$debug = Invoke-RestMethod -Uri "http://localhost:5051/api/items/debug" -Headers $headers
Write-Host "Debug endpoint: $($debug.count) items" -ForegroundColor Yellow
$normal = Invoke-RestMethod -Uri "http://localhost:5051/api/items" -Headers $headers  
Write-Host "Normal endpoint: $($normal.Count) items" -ForegroundColor Yellow
if ($normal.Count -gt 0) { Write-Host "SUCCESS!" -ForegroundColor Green } else { Write-Host "FAILED!" -ForegroundColor Red }
