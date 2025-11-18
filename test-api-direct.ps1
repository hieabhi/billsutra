Write-Host "=== Direct Folio API Test ===" -ForegroundColor Cyan

# Login
$loginBody = "{`"username`":`"admin`",`"password`":`"admin123`"}"
$login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
Write-Host "Logged in" -ForegroundColor Green

# Prepare headers
$token = $login.token
$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("Authorization", "Bearer $token")
$headers.Add("Content-Type", "application/json")

# Use a known checked-in booking
$bookingId = "56a3185e-1659-4514-95de-f40ffcb54ed2"
Write-Host "Using booking ID: $bookingId" -ForegroundColor Green

# Post a charge
$chargeBody = "{`"category`":`"FOOD_BEVERAGE`",`"description`":`"Test Breakfast`",`"quantity`":2,`"rate`":500,`"taxRate`":18,`"remarks`":`"API Test`"}"

Write-Host "Posting charge..." -ForegroundColor Yellow
Write-Host "URL: http://localhost:5051/api/bookings/$bookingId/folio/lines"

$result = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/$bookingId/folio/lines" -Method POST -Headers $headers -Body $chargeBody

Write-Host "API Response:" -ForegroundColor Yellow
$result.line | ConvertTo-Json -Depth 3

Write-Host "=== Verification ===" -ForegroundColor Cyan
Write-Host "Expected amount: 1000, Actual: $($result.line.amount)"
Write-Host "Expected CGST: 90, Actual: $($result.line.cgst)"
Write-Host "Expected SGST: 90, Actual: $($result.line.sgst)"
Write-Host "Expected total: 1180, Actual: $($result.line.totalAmount)"

if ($result.line.amount -eq 1000) {
    Write-Host "SUCCESS!" -ForegroundColor Green
} else {
    Write-Host "FAILED!" -ForegroundColor Red
}
