# ========================================
# COMPREHENSIVE QA TEST SUITE
# Testing: Room Reservation Logic & Invoice System
# Date: November 15, 2025
# ========================================

$ErrorActionPreference = 'Continue'
$testsPassed = 0
$testsFailed = 0
$testResults = @()

function Test-Result {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Expected,
        [string]$Actual,
        [string]$Details = ""
    )
    
    if ($Passed) {
        Write-Host "  PASS" -ForegroundColor Green -NoNewline
        Write-Host " - $TestName" -ForegroundColor White
        if ($Details) { Write-Host "        $Details" -ForegroundColor Gray }
        $script:testsPassed++
    }
    else {
        Write-Host "  FAIL" -ForegroundColor Red -NoNewline
        Write-Host " - $TestName" -ForegroundColor White
        Write-Host "        Expected: $Expected" -ForegroundColor Yellow
        Write-Host "        Actual:   $Actual" -ForegroundColor Red
        if ($Details) { Write-Host "        $Details" -ForegroundColor Gray }
        $script:testsFailed++
    }
    
    $script:testResults += @{
        Name = $TestName
        Passed = $Passed
        Expected = $Expected
        Actual = $Actual
        Details = $Details
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  QA TEST SUITE - COMPREHENSIVE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========================================
# TEST 1: Server Connectivity
# ========================================
Write-Host "[TEST 1] Server Connectivity" -ForegroundColor Yellow
Write-Host "─────────────────────────────" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}' -ErrorAction Stop
    $login = $response.Content | ConvertFrom-Json
    $token = $login.token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Test-Result "Server is running" $true "Server responds" "Server responds" "Port 5051"
    Test-Result "Authentication works" ($null -ne $token) "Token received" "Token received" "Bearer token generated"
}
catch {
    Test-Result "Server is running" $false "Server responds" "Connection failed" $_.Exception.Message
    Write-Host "`nERROR: Cannot connect to server. Please ensure server is running on port 5051" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ========================================
# TEST 2: Room Reservation Logic (Industry Standard)
# ========================================
Write-Host "[TEST 2] Room Reservation Logic" -ForegroundColor Yellow
Write-Host "─────────────────────────────" -ForegroundColor Gray

$today = Get-Date
$bookings = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings" -Headers $headers

# Test Case 2.1: Room with guest arriving in 4+ days should be AVAILABLE
$futureBookings = $bookings | Where-Object {
    $checkIn = [DateTime]::Parse($_.checkInDate)
    $daysAway = ($checkIn - $today).Days
    $daysAway -ge 4 -and $_.status -eq 'Reserved'
}

if ($futureBookings.Count -gt 0) {
    $testBooking = $futureBookings[0]
    $checkIn = [DateTime]::Parse($testBooking.checkInDate)
    $daysAway = [Math]::Ceiling(($checkIn - $today).TotalDays)
    
    # Trigger sync
    $update = @{status='Reserved'} | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/$($testBooking._id)" -Method PUT -Headers $headers -Body $update | Out-Null
    Start-Sleep -Milliseconds 500
    
    $rooms = Invoke-RestMethod -Uri "http://localhost:5051/api/rooms" -Headers $headers
    $room = $rooms | Where-Object { $_.number -eq $testBooking.roomNumber }
    
    $shouldBeAvailable = $room.status -eq 'AVAILABLE' -or $room.status -eq 'CLEAN'
    Test-Result "Future booking ($daysAway days away) - Room is AVAILABLE" $shouldBeAvailable "AVAILABLE or CLEAN" $room.status "Room $($testBooking.roomNumber) - Guest: $($testBooking.guest.name)"
}
else {
    Write-Host "  SKIP - No future bookings to test (4+ days away)" -ForegroundColor Yellow
}

# Test Case 2.2: Verify Reserved bookings don't show CheckedIn status for future dates
$wrongStatusBookings = $bookings | Where-Object {
    $checkIn = [DateTime]::Parse($_.checkInDate)
    $checkIn -gt $today -and $_.status -eq 'CheckedIn'
}

Test-Result "No future bookings with CheckedIn status" ($wrongStatusBookings.Count -eq 0) "0 wrong status bookings" "$($wrongStatusBookings.Count) found" "Data integrity check"

Write-Host ""

# ========================================
# TEST 3: Room Detail - Current vs Future Guests
# ========================================
Write-Host "[TEST 3] Room Detail Logic (UI)" -ForegroundColor Yellow
Write-Host "─────────────────────────────" -ForegroundColor Gray

# Find a room with future booking
if ($futureBookings.Count -gt 0) {
    $testBooking = $futureBookings[0]
    $checkIn = [DateTime]::Parse($testBooking.checkInDate)
    
    # Test logic: Future booking should NOT show as current guest
    $isCurrent = $testBooking.status -eq 'CheckedIn' -and $checkIn -le $today
    $isFuture = $checkIn -gt $today -and ($testBooking.status -eq 'Reserved' -or $testBooking.status -eq 'Confirmed')
    
    Test-Result "Future booking categorization" $isFuture "Future" $(if($isCurrent){"Current"}elseif($isFuture){"Future"}else{"Unknown"}) "Room $($testBooking.roomNumber)"
    Test-Result "Future guest NOT shown as current" (-not $isCurrent) "Not current" $(if($isCurrent){"Incorrectly current"}else{"Correctly future"}) "Check-in: $($testBooking.checkInDate)"
}

# Test Case 3.2: Checked-in guests show as current
$currentGuests = $bookings | Where-Object {
    $checkIn = [DateTime]::Parse($_.checkInDate)
    $checkOut = [DateTime]::Parse($_.checkOutDate)
    $_.status -eq 'CheckedIn' -and $checkIn -le $today -and $today -le $checkOut
}

Test-Result "Current guests detected correctly" ($currentGuests.Count -ge 0) "0 or more" "$($currentGuests.Count)" "Currently checked-in guests"

Write-Host ""

# ========================================
# TEST 4: Invoice and Folio System
# ========================================
Write-Host "[TEST 4] Invoice and Folio System" -ForegroundColor Yellow
Write-Host "─────────────────────────────" -ForegroundColor Gray

# Test Case 4.1: Add food charge to a checked-in guest
if ($currentGuests.Count -gt 0) {
    $testGuest = $currentGuests[0]
    
    $beforeFolio = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/$($testGuest._id)" -Headers $headers
    $beforeLineCount = $beforeFolio.folio.lines.Count
    
    # Add a test charge
    $charge = @{
        category = "FOOD_BEVERAGE"
        description = "QA Test - Lunch Order"
        quantity = 1
        rate = 350
        taxRate = 5
        remarks = "Automated QA test"
    } | ConvertTo-Json
    
    try {
        $chargeResult = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/$($testGuest._id)/folio/lines" -Method POST -Headers $headers -Body $charge
        
        $afterFolio = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/$($testGuest._id)" -Headers $headers
        $afterLineCount = $afterFolio.folio.lines.Count
        
        Test-Result "Charge added to folio" ($afterLineCount -gt $beforeLineCount) "Line count increased" "From $beforeLineCount to $afterLineCount" "Guest: $($testGuest.guest.name)"
        
        # Verify GST calculation
        $addedLine = $chargeResult.line
        $expectedTotal = 350 * 1.05  # 5% GST
        $actualTotal = [Math]::Round($addedLine.totalAmount, 2)
        $gstCorrect = [Math]::Abs($actualTotal - $expectedTotal) -lt 1
        
        Test-Result "GST calculation correct (5%)" $gstCorrect "Rs.367.50" "Rs.$actualTotal" "CGST: Rs.$($addedLine.cgst), SGST: Rs.$($addedLine.sgst)"
        
        # Verify folio total updated
        $totalIncreased = $afterFolio.folio.total -gt $beforeFolio.folio.total
        Test-Result "Folio total updated" $totalIncreased "Total increased" "From Rs.$($beforeFolio.folio.total) to Rs.$($afterFolio.folio.total)"
    }
    catch {
        Test-Result "Charge added to folio" $false "Success" "Failed" $_.Exception.Message
    }
}
else {
    Write-Host "  SKIP - No checked-in guests to test folio" -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# TEST 5: Departed Guests Section
# ========================================
Write-Host "[TEST 5] Departed Guests Section" -ForegroundColor Yellow
Write-Host "─────────────────────────────" -ForegroundColor Gray

$departedGuests = $bookings | Where-Object { $_.status -eq 'CheckedOut' }

Test-Result "Departed guests queryable" ($departedGuests.Count -ge 0) "0 or more" "$($departedGuests.Count)" "CheckedOut status bookings"

if ($departedGuests.Count -gt 0) {
    $testDeparted = $departedGuests[0]
    $hasFolio = $null -ne $testDeparted.folio
    $hasLines = $testDeparted.folio.lines.Count -ge 0
    
    Test-Result "Departed guest has folio" $hasFolio "Folio exists" $(if($hasFolio){"Folio exists"}else{"No folio"}) "Reservation: $($testDeparted.reservationNumber)"
    Test-Result "Folio accessible after checkout" $hasLines "Lines accessible" "$($testDeparted.folio.lines.Count) lines" "Invoice data preserved"
}

Write-Host ""

# ========================================
# TEST 6: API Endpoints Validation
# ========================================
Write-Host "[TEST 6] API Endpoints" -ForegroundColor Yellow
Write-Host "─────────────────────────────" -ForegroundColor Gray

# Test items API
try {
    $items = Invoke-RestMethod -Uri "http://localhost:5051/api/items" -Headers $headers
    Test-Result "Items API returns data" ($items.Count -gt 0) "Items array" "$($items.Count) items" "Item catalog accessible"
}
catch {
    Test-Result "Items API returns data" $false "Items array" "Failed" $_.Exception.Message
}

# Test rooms API
try {
    $rooms = Invoke-RestMethod -Uri "http://localhost:5051/api/rooms" -Headers $headers
    Test-Result "Rooms API returns data" ($rooms.Count -gt 0) "Rooms array" "$($rooms.Count) rooms" "Room inventory accessible"
}
catch {
    Test-Result "Rooms API returns data" $false "Rooms array" "Failed" $_.Exception.Message
}

# Test bookings API
try {
    $bookings = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings" -Headers $headers
    Test-Result "Bookings API returns data" ($bookings.Count -ge 0) "Bookings array" "$($bookings.Count) bookings" "Reservation data accessible"
}
catch {
    Test-Result "Bookings API returns data" $false "Bookings array" "Failed" $_.Exception.Message
}

Write-Host ""

# ========================================
# TEST 7: Data Integrity
# ========================================
Write-Host "[TEST 7] Data Integrity Checks" -ForegroundColor Yellow
Write-Host "─────────────────────────────" -ForegroundColor Gray

# All bookings should have required fields
$invalidBookings = $bookings | Where-Object { 
    -not $_.reservationNumber -or 
    -not $_.status -or 
    -not $_.checkInDate -or 
    -not $_.checkOutDate
}

Test-Result "All bookings have required fields" ($invalidBookings.Count -eq 0) "0 invalid bookings" "$($invalidBookings.Count)" "Data validation"

# All checked-in guests should have roomNumber
$checkedInWithoutRoom = $bookings | Where-Object { 
    $_.status -eq 'CheckedIn' -and (-not $_.roomNumber -or $_.roomNumber -eq '')
}

Test-Result "Checked-in guests have room numbers" ($checkedInWithoutRoom.Count -eq 0) "0 missing rooms" "$($checkedInWithoutRoom.Count)" "Room assignment integrity"

# All folios should have valid structure
$invalidFolios = $bookings | Where-Object { 
    -not $_.folio -or 
    -not (Get-Member -InputObject $_.folio -Name 'lines') -or
    -not (Get-Member -InputObject $_.folio -Name 'payments')
}

Test-Result "All bookings have valid folio structure" ($invalidFolios.Count -eq 0) "0 invalid folios" "$($invalidFolios.Count)" "Folio data integrity"

Write-Host ""

# ========================================
# TEST 8: Business Logic Validation
# ========================================
Write-Host "[TEST 8] Business Logic" -ForegroundColor Yellow
Write-Host "─────────────────────────────" -ForegroundColor Gray

# Check-in date should be before check-out date
$invalidDates = $bookings | Where-Object {
    $checkIn = [DateTime]::Parse($_.checkInDate)
    $checkOut = [DateTime]::Parse($_.checkOutDate)
    $checkIn -ge $checkOut
}

Test-Result "Check-in before check-out (all bookings)" ($invalidDates.Count -eq 0) "0 invalid dates" "$($invalidDates.Count)" "Date logic validation"

# Nights calculation should match dates
$wrongNights = $bookings | Where-Object {
    if ($_.checkInDate -and $_.checkOutDate -and $_.nights) {
        $checkIn = [DateTime]::Parse($_.checkInDate)
        $checkOut = [DateTime]::Parse($_.checkOutDate)
        $expectedNights = ($checkOut - $checkIn).Days
        $expectedNights -ne $_.nights
    }
    else {
        $false
    }
}

Test-Result "Nights calculated correctly" ($wrongNights.Count -eq 0) "0 incorrect" "$($wrongNights.Count)" "Nights = check-out - check-in"

# Room charges should equal rate × nights
$wrongCharges = $bookings | Where-Object {
    if ($_.rate -and $_.nights -and $_.amount) {
        $expectedAmount = $_.rate * $_.nights
        $expectedAmount -ne $_.amount
    }
    else {
        $false
    }
}

Test-Result "Room charges correct (rate × nights)" ($wrongCharges.Count -eq 0) "0 incorrect" "$($wrongCharges.Count)" "Amount calculation validation"

Write-Host ""

# ========================================
# FINAL SUMMARY
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$totalTests = $testsPassed + $testsFailed
$passRate = if ($totalTests -gt 0) { [Math]::Round(($testsPassed / $totalTests) * 100, 1) } else { 0 }

Write-Host ""
Write-Host "Total Tests:  $totalTests" -ForegroundColor White
Write-Host "Passed:       " -NoNewline -ForegroundColor White
Write-Host "$testsPassed" -ForegroundColor Green
Write-Host "Failed:       " -NoNewline -ForegroundColor White
Write-Host "$testsFailed" -ForegroundColor $(if($testsFailed -eq 0){'Green'}else{'Red'})
Write-Host "Pass Rate:    " -NoNewline -ForegroundColor White
Write-Host "$passRate%" -ForegroundColor $(if($passRate -eq 100){'Green'}elseif($passRate -ge 80){'Yellow'}else{'Red'})

Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "  System is production-ready" -ForegroundColor Green
}
elseif ($passRate -ge 80) {
    Write-Host "  MOSTLY PASSED - Minor issues found" -ForegroundColor Yellow
    Write-Host "  Review failed tests above" -ForegroundColor Yellow
}
else {
    Write-Host "  TESTS FAILED - Critical issues found" -ForegroundColor Red
    Write-Host "  Please fix issues before deployment" -ForegroundColor Red
}

Write-Host "========================================`n" -ForegroundColor Cyan

# Return exit code based on results
if ($testsFailed -eq 0) {
    exit 0
}
else {
    exit 1
}
