# Fix Future CheckedIn Bookings - Final Fix for 100%

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FIXING FUTURE CHECKEDIN BOOKINGS" -ForegroundColor Cyan
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

# Find future bookings with CheckedIn status
$today = Get-Date -Hour 0 -Minute 0 -Second 0 -Millisecond 0
$futureCheckedIn = $bookings | Where-Object { 
    $checkIn = [DateTime]::Parse($_.checkInDate)
    $checkIn.Date -gt $today -and $_.status -eq 'CheckedIn'
}

Write-Host "   Found $($futureCheckedIn.Count) future bookings with wrong status`n" -ForegroundColor Yellow

if ($futureCheckedIn.Count -eq 0) {
    Write-Host "  No issues found - all data is correct!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    exit 0
}

# Display what we found
Write-Host "Bookings to fix:" -ForegroundColor White
foreach ($b in $futureCheckedIn) {
    Write-Host "  - $($b.reservationNumber): $($b.guest.name) - Room $($b.roomNumber)" -ForegroundColor Yellow
    Write-Host "    Check-in: $($b.checkInDate) (Future)" -ForegroundColor Gray
    Write-Host "    Current status: CheckedIn → Should be: Reserved" -ForegroundColor Gray
}

Write-Host "`n2. Fixing booking statuses..." -ForegroundColor White

# Fix each booking
$fixed = 0
$failed = 0

foreach ($booking in $futureCheckedIn) {
    try {
        $updateData = @{
            status = "Reserved"
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/$($booking._id)" -Method PUT -Headers $headers -Body $updateData | Out-Null
        
        Write-Host "   ✓ Fixed: $($booking.reservationNumber) → Status: Reserved" -ForegroundColor Green
        $fixed++
    }
    catch {
        Write-Host "   ✗ Failed: $($booking.reservationNumber) - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FIX SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Issues:   $($futureCheckedIn.Count)" -ForegroundColor White
Write-Host "Fixed:          " -NoNewline
Write-Host "$fixed" -ForegroundColor Green
Write-Host "Failed:         " -NoNewline
if ($failed -eq 0) {
    Write-Host "$failed" -ForegroundColor Green
} else {
    Write-Host "$failed" -ForegroundColor Red
}
Write-Host ""

if ($fixed -gt 0 -and $failed -eq 0) {
    Write-Host "  ALL ISSUES FIXED!" -ForegroundColor Green
    Write-Host "  Ready for 100% test score" -ForegroundColor Green
}

Write-Host "========================================`n" -ForegroundColor Cyan
