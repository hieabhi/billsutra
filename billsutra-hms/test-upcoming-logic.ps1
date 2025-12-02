# Test Upcoming Guest Logic - Room 302

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TESTING UPCOMING GUEST LOGIC" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Login
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$headers = @{
    "Authorization" = "Bearer $($login.token)"
    "Content-Type" = "application/json"
}

Write-Host "1. Fetching all bookings..." -ForegroundColor White
$bookings = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings" -Headers $headers

# Find Abhijit Vibhute's booking in room 302
$room302Bookings = $bookings | Where-Object { $_.roomNumber -eq '302' }

Write-Host "`n2. Room 302 Bookings:" -ForegroundColor Yellow
Write-Host "   Total bookings: $($room302Bookings.Count)`n"

$today = Get-Date -Hour 0 -Minute 0 -Second 0 -Millisecond 0

foreach ($booking in $room302Bookings) {
    $checkIn = [DateTime]::Parse($booking.checkInDate)
    $checkIn = $checkIn.Date
    $checkOut = [DateTime]::Parse($booking.checkOutDate)
    $checkOut = $checkOut.Date
    
    Write-Host "   Booking: $($booking.reservationNumber)" -ForegroundColor Cyan
    Write-Host "   Guest: $($booking.guest.name)"
    Write-Host "   Status: $($booking.status)"
    Write-Host "   Check-in: $($booking.checkInDate)"
    Write-Host "   Check-out: $($booking.checkOutDate)"
    
    # Determine category based on logic
    if ($booking.status -eq 'CheckedOut' -or $booking.status -eq 'Cancelled' -or $booking.status -eq 'NoShow' -or $checkOut -lt $today) {
        Write-Host "   Category: PAST (Checkout History)" -ForegroundColor Gray
    }
    elseif ($booking.status -eq 'CheckedIn' -and $checkIn -le $today -and $today -le $checkOut) {
        Write-Host "   Category: CURRENT STAY" -ForegroundColor Green
    }
    elseif (($booking.status -eq 'Reserved' -or $booking.status -eq 'Confirmed') -and $checkIn -ge $today) {
        Write-Host "   Category: UPCOMING" -ForegroundColor Yellow
        Write-Host "   Days until check-in: $(($checkIn - $today).Days)" -ForegroundColor Yellow
    }
    else {
        Write-Host "   Category: UNKNOWN (Data Issue)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Abhijit Vibhute is in the list
$abhijitBooking = $room302Bookings | Where-Object { $_.guest.name -like "*Abhijit*Vibhute*" }

if ($abhijitBooking) {
    Write-Host "Found Abhijit Vibhute's booking!" -ForegroundColor Green
    Write-Host "  Reservation: $($abhijitBooking.reservationNumber)"
    Write-Host "  Status: $($abhijitBooking.status)"
    
    $checkIn = [DateTime]::Parse($abhijitBooking.checkInDate).Date
    
    if ($abhijitBooking.status -eq 'Reserved' -or $abhijitBooking.status -eq 'Confirmed') {
        if ($checkIn -ge $today) {
            Write-Host "`n  CORRECT: Should appear in UPCOMING section" -ForegroundColor Green
        } else {
            Write-Host "`n  ERROR: Check-in date is in the past but status is Reserved" -ForegroundColor Red
        }
    }
    elseif ($abhijitBooking.status -eq 'CheckedIn') {
        Write-Host "`n  CORRECT: Should appear in CURRENT STAY section" -ForegroundColor Green
    }
    elseif ($abhijitBooking.status -eq 'CheckedOut') {
        Write-Host "`n  CORRECT: Should appear in PAST section" -ForegroundColor Green
    }
} else {
    Write-Host "Abhijit Vibhute NOT FOUND in room 302!" -ForegroundColor Red
    Write-Host "  Please add the reservation first" -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
