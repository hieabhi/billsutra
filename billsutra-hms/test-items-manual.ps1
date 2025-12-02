Write-Host "Manual Items API Test" -ForegroundColor Cyan
$login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$headers = @{"Authorization"="Bearer $($login.token)"}
$items = Invoke-RestMethod -Uri "http://localhost:5051/api/items" -Headers $headers
Write-Host "`nItems count: $($items.Count)" -ForegroundColor $(if ($items.Count -gt 0) { 'Green' } else { 'Red' })
if ($items.Count -gt 0) {
    Write-Host "`nFirst 3 items:" -ForegroundColor Yellow
    $items | Select-Object -First 3 | Format-Table name, category, price, taxRate -AutoSize
    Write-Host "SUCCESS! Items API working!" -ForegroundColor Green
} else {
    Write-Host "FAILED - Items API returning empty" -ForegroundColor Red
}
