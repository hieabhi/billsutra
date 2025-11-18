# Direct API test
Write-Host "=== Direct Folio API Test ===" -ForegroundColor Cyan

# Login
$loginBody = '{"username":"admin","password":"admin123"}'
$login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
Write-Host "✓ Logged in" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $($login.token)"
    "Content-Type" = "application/json"
}

# Use a known checked-in booking
$bookingId = "56a3185e-1659-4514-95de-f40ffcb54ed2"
Write-Host "✓ Using booking ID: $bookingId" -ForegroundColor Green

# Post a charge
$chargeBody = '{"category":"FOOD_BEVERAGE","description":"Test Breakfast","quantity":2,"rate":500,"taxRate":18,"remarks":"API Test"}'

Write-Host "`nPosting charge..." -ForegroundColor Yellow
$result = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/$bookingId/folio/lines" -Method POST -Headers $headers -Body $chargeBody

Write-Host "`nAPI Response:" -ForegroundColor Yellow
$result.line | ConvertTo-Json -Depth 3

Write-Host "`n=== Verification ===" -ForegroundColor Cyan
Write-Host "Expected amount: 1000 (2 x 500)"
Write-Host "Actual amount: $($result.line.amount)"
Write-Host ""
Write-Host "Expected CGST: 90 (1000 x 18% / 2)"
Write-Host "Actual CGST: $($result.line.cgst)"
Write-Host ""
Write-Host "Expected SGST: 90 (1000 x 18% / 2)"
Write-Host "Actual SGST: $($result.line.sgst)"
Write-Host ""
Write-Host "Expected total: 1180 (1000 + 90 + 90)"
Write-Host "Actual total: $($result.line.totalAmount)"

if ($result.line.amount -eq 1000 -and $result.line.cgst -eq 90 -and $result.line.sgst -eq 90 -and $result.line.totalAmount -eq 1180) {
    Write-Host "`nALL CALCULATIONS CORRECT!" -ForegroundColor Green
} else {
    Write-Host "`nCALCULATIONS FAILED!" -ForegroundColor Red
}
