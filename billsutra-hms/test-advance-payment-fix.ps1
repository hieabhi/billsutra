# Test: Advance Payment Double-Counting Bug Fix
# Bug: When creating booking with Rs. 780 advance, folio showed Rs. 1560 total payments
# Cause: Advance was added to both booking.advancePayment AND folio.payments array
# Fix: Advance payment stored only in booking.advancePayment, not duplicated in folio.payments

$BASE_URL = "http://localhost:5051/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ADVANCE PAYMENT BUG FIX TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Login
$loginBody = @{ username = "admin"; password = "admin123" } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$headers = @{
    "Authorization" = "Bearer $($auth.token)"
    "Content-Type" = "application/json"
}

Write-Host "BUG DESCRIPTION:" -ForegroundColor Yellow
Write-Host "  User reported: Created booking for Rs. 890/night with Rs. 780 advance" -ForegroundColor White
Write-Host "  Expected in folio: Rs. 780 total payments" -ForegroundColor White
Write-Host "  Bug showed: Rs. 1560 (advance counted TWICE)" -ForegroundColor Red
Write-Host ""

# Find available room
$rooms = Invoke-RestMethod -Uri "$BASE_URL/rooms" -Headers $headers
$availableRoom = $rooms | Where-Object { $_.status -eq 'AVAILABLE' } | Select-Object -First 1

if (!$availableRoom) {
    Write-Host "ERROR: No available rooms for testing" -ForegroundColor Red
    exit 1
}

Write-Host "CREATING TEST BOOKING..." -ForegroundColor Yellow
Write-Host "  Room: $($availableRoom.number)" -ForegroundColor Gray
Write-Host "  Rate: Rs. 890/night" -ForegroundColor Gray
Write-Host "  Advance: Rs. 780 (Cash)" -ForegroundColor Gray
Write-Host ""

# Create booking with advance payment
$bookingData = @{
    guest = @{
        name = "Trisha Krishnan"
        phone = "+91-9876543210"
        email = "trisha@example.com"
    }
    roomId = $availableRoom._id
    roomNumber = $availableRoom.number
    checkInDate = (Get-Date).ToString("yyyy-MM-dd")
    checkOutDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    rate = 890
    advancePayment = 780
    advancePaymentMethod = "Cash"
    paymentMethod = "Cash"
} | ConvertTo-Json

$booking = Invoke-RestMethod -Uri "$BASE_URL/bookings" -Method Post -Headers $headers -Body $bookingData
Write-Host "Booking created: $($booking.reservationNumber)" -ForegroundColor Green

# Check-in
$checkedIn = Invoke-RestMethod -Uri "$BASE_URL/bookings/$($booking._id)/check-in" -Method Post -Headers $headers
Write-Host "Guest checked in to Room $($checkedIn.roomNumber)" -ForegroundColor Green
Write-Host ""

# Analyze folio
Write-Host "FOLIO ANALYSIS:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`nBooking Details:" -ForegroundColor White
Write-Host "  Total Amount: Rs. $($checkedIn.amount)" -ForegroundColor Cyan
Write-Host "  Advance Paid: Rs. $($checkedIn.advancePayment)" -ForegroundColor Cyan
Write-Host "  Method: $($checkedIn.advancePaymentMethod)" -ForegroundColor Cyan

Write-Host "`nFolio Payments Array:" -ForegroundColor White
$totalInFolioPayments = 0
if ($checkedIn.folio.payments.Count -gt 0) {
    $totalInFolioPayments = ($checkedIn.folio.payments | Measure-Object -Property amount -Sum).Sum
    Write-Host "  Count: $($checkedIn.folio.payments.Count) payment(s)" -ForegroundColor Cyan
    foreach ($payment in $checkedIn.folio.payments) {
        Write-Host "    • Rs. $($payment.amount) - $($payment.method)" -ForegroundColor Gray
        if ($payment.description) {
            Write-Host "      ($($payment.description))" -ForegroundColor DarkGray
        }
    }
    Write-Host "  Total in payments array: Rs. $totalInFolioPayments" -ForegroundColor Yellow
} else {
    Write-Host "  Count: 0 (Empty - Correct!)" -ForegroundColor Green
    Write-Host "  Total in payments array: Rs. 0" -ForegroundColor Green
}

Write-Host "`nBalance Calculation:" -ForegroundColor White
Write-Host "  Folio Total: Rs. $($checkedIn.folio.total)" -ForegroundColor Gray
Write-Host "  - Payments in folio: Rs. $totalInFolioPayments" -ForegroundColor Gray
Write-Host "  - Advance payment: Rs. $($checkedIn.advancePayment)" -ForegroundColor Gray
Write-Host "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$expectedBalance = $checkedIn.folio.total - $totalInFolioPayments - $checkedIn.advancePayment
Write-Host "  Expected Balance: Rs. $expectedBalance" -ForegroundColor Cyan
Write-Host "  Actual Balance: Rs. $($checkedIn.folio.balance)" -ForegroundColor Cyan

# Verification
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allTestsPassed = $true

# Test 1: Advance payment stored correctly
if ($checkedIn.advancePayment -eq 780) {
    Write-Host "✓ Advance payment stored: Rs. 780" -ForegroundColor Green
} else {
    Write-Host "✗ Advance payment incorrect: Rs. $($checkedIn.advancePayment)" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 2: Advance NOT duplicated in folio.payments
if ($checkedIn.folio.payments.Count -eq 0) {
    Write-Host "✓ Folio payments array is empty (advance not duplicated)" -ForegroundColor Green
} else {
    $hasAdvanceInPayments = $checkedIn.folio.payments | Where-Object { $_.type -eq 'advance' -or $_.description -like '*advance*' }
    if ($hasAdvanceInPayments) {
        Write-Host "✗ Advance payment duplicated in folio.payments array" -ForegroundColor Red
        $allTestsPassed = $false
    } else {
        Write-Host "✓ Folio payments array clean (no advance duplication)" -ForegroundColor Green
    }
}

# Test 3: Balance calculation correct
if ($checkedIn.folio.balance -eq $expectedBalance) {
    Write-Host "✓ Balance calculated correctly: Rs. $($checkedIn.folio.balance)" -ForegroundColor Green
} else {
    Write-Host "✗ Balance mismatch - Expected: Rs. $expectedBalance, Got: Rs. $($checkedIn.folio.balance)" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 4: Total payments not doubled
$expectedTotalPaid = $checkedIn.advancePayment + $totalInFolioPayments
if ($expectedTotalPaid -eq 780) {
    Write-Host "✓ Total payments correct: Rs. 780 (not doubled)" -ForegroundColor Green
} else {
    Write-Host "✗ Total payments incorrect: Rs. $expectedTotalPaid (should be 780)" -ForegroundColor Red
    $allTestsPassed = $false
}

Write-Host ""
if ($allTestsPassed) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "  ✓ ALL TESTS PASSED - BUG FIXED!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "`nAdvance payment is now handled correctly:" -ForegroundColor White
    Write-Host "  • Stored in booking.advancePayment field" -ForegroundColor Gray
    Write-Host "  • NOT duplicated in folio.payments array" -ForegroundColor Gray
    Write-Host "  • Balance = Total - Advance - Payments" -ForegroundColor Gray
    Write-Host "  • Follows industry standard (Opera PMS, Mews)" -ForegroundColor Gray
} else {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "  ✗ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
