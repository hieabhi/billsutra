# Simple debug test for folio API
Write-Host "=== Folio API Debug Test ===" -ForegroundColor Cyan

try {
    # Login
    $loginBody = '{"username":"admin","password":"admin123"}'
    $login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $headers = @{
        "Authorization" = "Bearer $($login.token)"
        "Content-Type" = "application/json"
    }
    Write-Host "✓ Logged in" -ForegroundColor Green
    
    # Get a checked-in booking
    $bookings = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings" -Headers $headers
    $booking = $bookings | Where-Object { $_.status -eq 'CheckedIn' } | Select-Object -First 1
    
    if (!$booking) {
        Write-Host "✗ No checked-in booking found" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Found booking: $($booking.reservationNumber)" -ForegroundColor Green
    
    # Post a charge
    $chargeBody = '{"category":"FOOD_BEVERAGE","description":"Debug Test - Breakfast","quantity":2,"rate":500,"taxRate":18,"remarks":"Debug test charge"}'
    
    Write-Host "`nPosting charge..." -ForegroundColor Yellow
    Write-Host $chargeBody -ForegroundColor Gray
    
    $result = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/$($booking._id)/folio/lines" -Method POST -Headers $headers -Body $chargeBody
    
    Write-Host "`nAPI Response (line object):" -ForegroundColor Yellow
    $result.line | ConvertTo-Json -Depth 3
    
    Write-Host "`n=== Field Analysis ===" -ForegroundColor Cyan
    Write-Host "quantity: $($result.line.quantity)"
    Write-Host "rate: $($result.line.rate)"
    Write-Host "amount: $($result.line.amount) (Expected: 1000)"
    Write-Host "taxRate: $($result.line.taxRate)"
    Write-Host "cgst: $($result.line.cgst) (Expected: 90)"
    Write-Host "sgst: $($result.line.sgst) (Expected: 90)"
    Write-Host "totalAmount: $($result.line.totalAmount) (Expected: 1180)"
    
} catch {
    Write-Host "`n✗ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.Exception.Response -ForegroundColor Red
}
