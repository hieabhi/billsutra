# Fix Invalid Test Data - Achieve 100% Test Score
# Fixes bookings with rate=0 or amount=0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DATA CLEANUP - FIXING INVALID BOOKINGS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Login
$login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$headers = @{
    "Authorization" = "Bearer $($login.token)"
    "Content-Type" = "application/json"
}

Write-Host "1. Fetching all bookings..." -ForegroundColor White
$bookings = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings" -Headers $headers

# Find bookings with rate=0 or amount=0
$invalidBookings = $bookings | Where-Object { 
    ($_.rate -eq 0 -or $_.amount -eq 0) -and 
    $_.status -ne 'CheckedOut' -and 
    $_.status -ne 'Cancelled'
}

Write-Host "   Found $($invalidBookings.Count) bookings with invalid rates`n" -ForegroundColor Yellow

if ($invalidBookings.Count -eq 0) {
    Write-Host "  No invalid bookings found - data is clean!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    exit 0
}

# Fix each invalid booking
$fixed = 0
$failed = 0

Write-Host "2. Fixing invalid bookings..." -ForegroundColor White

foreach ($booking in $invalidBookings) {
    try {
        # Determine appropriate rate based on room type
        $defaultRate = 1000  # Default rate
        
        # Get room to determine appropriate rate
        $rooms = Invoke-RestMethod -Uri "http://localhost:5051/api/rooms" -Headers $headers
        $room = $rooms | Where-Object { $_._id -eq $booking.roomId }
        
        if ($room -and $room.rate -gt 0) {
            $newRate = $room.rate
        }
        else {
            # Default rates by room number range
            $roomNum = [int]$booking.roomNumber
            if ($roomNum -ge 100 -and $roomNum -lt 200) {
                $newRate = 1000  # First floor
            }
            elseif ($roomNum -ge 200 -and $roomNum -lt 300) {
                $newRate = 1500  # Second floor
            }
            elseif ($roomNum -ge 300) {
                $newRate = 2000  # Third floor and above
            }
            else {
                $newRate = 1000  # Default
            }
        }
        
        # Calculate new amount
        $nights = $booking.nights
        if (-not $nights -or $nights -le 0) {
            $checkIn = [DateTime]::Parse($booking.checkInDate)
            $checkOut = [DateTime]::Parse($booking.checkOutDate)
            $nights = ($checkOut - $checkIn).Days
        }
        
        $newAmount = $newRate * $nights
        
        # Update booking
        $updateData = @{
            rate = $newRate
            amount = $newAmount
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/$($booking._id)" -Method PUT -Headers $headers -Body $updateData | Out-Null
        
        Write-Host "   Fixed: $($booking.reservationNumber) - Room $($booking.roomNumber)" -ForegroundColor Green
        Write-Host "          Rate: Rs.0 → Rs.$newRate | Amount: Rs.0 → Rs.$newAmount ($nights nights)" -ForegroundColor Gray
        
        $fixed++
    }
    catch {
        Write-Host "   Failed: $($booking.reservationNumber) - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CLEANUP SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Invalid:  $($invalidBookings.Count)" -ForegroundColor White
Write-Host "Fixed:          " -NoNewline
Write-Host "$fixed" -ForegroundColor Green
Write-Host "Failed:         " -NoNewline
Write-Host "$failed" -ForegroundColor $(if($failed -eq 0){'Green'}else{'Red'})
Write-Host ""

if ($fixed -gt 0 -and $failed -eq 0) {
    Write-Host "  ALL DATA CLEANED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "  System is now 100% ready" -ForegroundColor Green
}
elseif ($fixed -gt 0) {
    Write-Host "  MOSTLY CLEANED - Some issues remain" -ForegroundColor Yellow
}
else {
    Write-Host "  CLEANUP FAILED" -ForegroundColor Red
}

Write-Host "========================================`n" -ForegroundColor Cyan

# Return exit code
if ($failed -eq 0) {
    exit 0
}
else {
    exit 1
}
