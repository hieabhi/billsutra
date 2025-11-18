# Quick Checkout Test - Uses PowerShell HTTP calls only
$baseUrl = "http://localhost:5051/api"

Write-Host "`n🔍 CHECKOUT DEBUG TEST`n" -ForegroundColor Cyan

# 1. Login
Write-Host "1️⃣  Logging in..." -ForegroundColor Yellow
$body = @{username='admin';password='admin123'} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $body -ContentType 'application/json'
$token = $response.token
$headers = @{Authorization="Bearer $token"; 'Content-Type'='application/json'}
Write-Host "✅ Logged in`n" -ForegroundColor Green

# 2. Get available room
Write-Host "2️⃣  Finding available room..." -ForegroundColor Yellow
$rooms = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method GET -Headers $headers
$availableRoom = $rooms | Where-Object { $_.status -eq 'AVAILABLE' } | Select-Object -First 1
Write-Host "✅ Found Room $($availableRoom.number)`n" -ForegroundColor Green

# 3. Create customer
Write-Host "3️⃣  Creating customer..." -ForegroundColor Yellow
$customerData = @{
    name='PS Test Guest'
    phone='+91-7777777777'
    email='pstest@test.com'
} | ConvertTo-Json
$customer = Invoke-RestMethod -Uri "$baseUrl/customers" -Method POST -Body $customerData -Headers $headers
Write-Host "✅ Customer created: $($customer.name)`n" -ForegroundColor Green

# 4. Create booking
Write-Host "4️⃣  Creating booking..." -ForegroundColor Yellow
$bookingData = @{
    customerId=$customer._id
    guest=@{
        name='PS Test Guest'
        phone='+91-7777777777'
        email='pstest@test.com'
    }
    roomTypeId=$availableRoom.roomTypeId
    roomId=$availableRoom._id
    roomNumber=$availableRoom.number
    checkInDate=(Get-Date).ToString('yyyy-MM-dd')
    checkOutDate=(Get-Date).AddDays(1).ToString('yyyy-MM-dd')
    numberOfGuests=2
    guestCounts=@{adults=2;children=0;infants=0}
    rate=1500
    paymentStatus='Paid'
} | ConvertTo-Json -Depth 5
$booking = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method POST -Body $bookingData -Headers $headers
Write-Host "✅ Booking created: $($booking.reservationNumber)`n" -ForegroundColor Green

# 5. Check-in
Write-Host "5️⃣  Checking in..." -ForegroundColor Yellow
$checkedIn = Invoke-RestMethod -Uri "$baseUrl/bookings/$($booking._id)/checkin" -Method POST -Headers $headers
Write-Host "✅ Checked in to Room $($checkedIn.roomNumber)`n" -ForegroundColor Green

# Verify room occupied
$roomAfterCheckIn = Invoke-RestMethod -Uri "$baseUrl/rooms/$($availableRoom._id)" -Method GET -Headers $headers
Write-Host "   Room status: $($roomAfterCheckIn.status) + $($roomAfterCheckIn.housekeepingStatus)`n" -ForegroundColor Cyan

# 6. CHECKOUT
Write-Host "6️⃣  CHECKING OUT..." -ForegroundColor Yellow
Write-Host "   Watch server terminal for CHECKOUT DEBUG logs" -ForegroundColor Gray
Start-Sleep -Seconds 1

$checkedOut = Invoke-RestMethod -Uri "$baseUrl/bookings/$($booking._id)/checkout" -Method POST -Headers $headers
Write-Host "✅ Checkout completed`n" -ForegroundColor Green

# Wait for sync
Start-Sleep -Seconds 2

# 7. Verify room status
Write-Host "7️⃣  Verifying room status..." -ForegroundColor Yellow
$roomAfterCheckOut = Invoke-RestMethod -Uri "$baseUrl/rooms/$($availableRoom._id)" -Method GET -Headers $headers
Write-Host "   Room $($roomAfterCheckOut.number):" -ForegroundColor White
Write-Host "   - Status: $($roomAfterCheckOut.status)" -ForegroundColor White
Write-Host "   - Housekeeping: $($roomAfterCheckOut.housekeepingStatus)`n" -ForegroundColor White

if ($roomAfterCheckOut.status -eq 'AVAILABLE' -and $roomAfterCheckOut.housekeepingStatus -eq 'DIRTY') {
    Write-Host "SUCCESS: Room status synced correctly!" -ForegroundColor Green
} elseif ($roomAfterCheckOut.status -eq 'OCCUPIED') {
    Write-Host "FAILED: Room still OCCUPIED - sync did not execute" -ForegroundColor Red
    Write-Host "   Expected: AVAILABLE + DIRTY" -ForegroundColor Red
    Write-Host ("   Actual: " + $roomAfterCheckOut.status + " + " + $roomAfterCheckOut.housekeepingStatus) -ForegroundColor Red
} else {
    Write-Host "UNEXPECTED: Room in unexpected state" -ForegroundColor Yellow
}

Write-Host "`n📋 Check server terminal for [CHECKOUT DEBUG] and [SYNC] logs`n" -ForegroundColor Cyan
