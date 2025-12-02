# Test items API
Start-Sleep -Seconds 1

try {
    Write-Host "Step 1: Logging in..." -ForegroundColor Yellow
    $loginBody = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json
    
    $login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "  Login successful, token: $($login.token.Substring(0,20))..." -ForegroundColor Green
    
    $headers = @{
        "Authorization" = "Bearer $($login.token)"
    }
    
    Write-Host "`nStep 2: Fetching items from /api/items..." -ForegroundColor Yellow
    $items = Invoke-RestMethod -Uri "http://localhost:5051/api/items" -Method GET -Headers $headers
    
    Write-Host "  Items found: $($items.Count)" -ForegroundColor $(if ($items.Count -gt 0) { "Green" } else { "Red" })
    
    if ($items.Count -gt 0) {
        Write-Host "`nFirst 5 items:" -ForegroundColor Cyan
        $items | Select-Object -First 5 | Format-Table name, category, price, taxRate -AutoSize
        Write-Host "SUCCESS! Items API working correctly!" -ForegroundColor Green
    } else {
        Write-Host "FAILED! NO ITEMS RETURNED!" -ForegroundColor Red
        Write-Host "Response type: $($items.GetType().Name)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`nERROR occurred:" -ForegroundColor Red
    Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
