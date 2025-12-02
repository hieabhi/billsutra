# Test Room 203 Fix
# Verify that future bookings don't show as current guests

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ROOM 203 FIX VERIFICATION TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Login
Write-Host "1. Authenticating..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$headers = @{
    "Authorization" = "Bearer $($login.token)"
    "Content-Type" = "application/json"
}
Write-Host "   ✓ Logged in successfully`n" -ForegroundColor Green

# Check Room 203
Write-Host "2. Checking Room 203 status..." -ForegroundColor Yellow
$rooms = Invoke-RestMethod -Uri "http://localhost:5051/api/rooms" -Headers $headers
$room203 = $rooms | Where-Object { $_.number -eq '203' }

Write-Host "   Current Status:" -ForegroundColor White
Write-Host "   - Occupancy: $($room203.status)" -ForegroundColor White
Write-Host "   - Housekeeping: $($room203.housekeepingStatus)`n" -ForegroundColor White

# Check bookings
Write-Host "3. Checking bookings for Room 203..." -ForegroundColor Yellow
$bookings = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings" -Headers $headers
$room203Bookings = $bookings | Where-Object { $_.roomNumber -eq '203' }

$today = Get-Date

foreach ($booking in $room203Bookings) {
    $checkIn = [DateTime]::Parse($booking.checkInDate)
    $checkOut = [DateTime]::Parse($booking.checkOutDate)
    $isCurrent = $booking.status -eq 'CheckedIn' -and $checkIn -le $today -and $today -le $checkOut
    $isFuture = $checkIn -gt $today
    
    Write-Host "`n   Booking: $($booking.reservationNumber)" -ForegroundColor Cyan
    Write-Host "   Guest: $($booking.guest.name)" -ForegroundColor White
    Write-Host "   Status: $($booking.status)" -ForegroundColor White
    Write-Host "   Check-in: $($booking.checkInDate)" -ForegroundColor White
    Write-Host "   Check-out: $($booking.checkOutDate)" -ForegroundColor White
    
    if ($isCurrent) {
        Write-Host "   Category: CURRENT GUEST" -ForegroundColor Green
    }
    elseif ($isFuture) {
        Write-Host "   Category: FUTURE BOOKING (should NOT show as current)" -ForegroundColor Yellow
    }
    else {
        Write-Host "   Category: PAST" -ForegroundColor Gray
    }
}

# Validation
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VALIDATION RESULTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$currentGuests = $room203Bookings | Where-Object {
    $checkIn = [DateTime]::Parse($_.checkInDate)
    $checkOut = [DateTime]::Parse($_.checkOutDate)
    $_.status -eq 'CheckedIn' -and $checkIn -le $today -and $today -le $checkOut
}

$futureBookings = $room203Bookings | Where-Object {
    $checkIn = [DateTime]::Parse($_.checkInDate)
    $checkIn -gt $today -and $_.status -eq 'Reserved'
}

$wrongStatusBookings = $room203Bookings | Where-Object {
    $checkIn = [DateTime]::Parse($_.checkInDate)
    $checkIn -gt $today -and $_.status -eq 'CheckedIn'
}

Write-Host "Current Guests (should be in room): $($currentGuests.Count)" -ForegroundColor $(if($currentGuests.Count -eq 0){'Green'}else{'Yellow'})
Write-Host "Future Bookings (Reserved status): $($futureBookings.Count)" -ForegroundColor White
Write-Host "Wrong Status (Future CheckedIn): $($wrongStatusBookings.Count)" -ForegroundColor $(if($wrongStatusBookings.Count -eq 0){'Green'}else{'Red'})

Write-Host "`nExpected Room Status: " -NoNewline
if ($currentGuests.Count -gt 0) {
    Write-Host "OCCUPIED" -ForegroundColor Yellow
} elseif ($futureBookings.Count -gt 0) {
    Write-Host "RESERVED or AVAILABLE (not OCCUPIED)" -ForegroundColor Green
} else {
    Write-Host "AVAILABLE" -ForegroundColor Green
}

Write-Host "Actual Room Status: " -NoNewline
if ($room203.status -eq 'OCCUPIED' -and $currentGuests.Count -eq 0) {
    Write-Host "$($room203.status) - WRONG" -ForegroundColor Red
}
elseif ($room203.status -eq 'OCCUPIED' -and $currentGuests.Count -gt 0) {
    Write-Host "$($room203.status) - CORRECT" -ForegroundColor Green
}
elseif ($room203.status -ne 'OCCUPIED' -and $currentGuests.Count -eq 0) {
    Write-Host "$($room203.status) - CORRECT" -ForegroundColor Green
}
else {
    Write-Host "$($room203.status)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan

$testsPassed = $true
if ($wrongStatusBookings.Count -eq 0 -and (($room203.status -ne 'OCCUPIED') -or ($currentGuests.Count -gt 0))) {
    Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "  Room 203 logic is working correctly!" -ForegroundColor Green
}
else {
    $testsPassed = $false
    Write-Host "  ISSUES FOUND" -ForegroundColor Red
    if ($wrongStatusBookings.Count -gt 0) {
        Write-Host "  - Future bookings have CheckedIn status" -ForegroundColor Red
    }
    if ($room203.status -eq 'OCCUPIED' -and $currentGuests.Count -eq 0) {
        Write-Host "  - Room shows OCCUPIED but no current guest" -ForegroundColor Red
    }
}

Write-Host "========================================`n" -ForegroundColor Cyan
