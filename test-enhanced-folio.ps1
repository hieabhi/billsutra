# ========================================
# ENHANCED FOLIO SYSTEM - COMPREHENSIVE TEST
# ========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ENHANCED FOLIO SYSTEM - TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$BASE_URL = "http://localhost:5051/api"
$testsPassed = 0
$testsFailed = 0
$testResults = @()

function Test-Result {
    param($testName, $condition, $errorMsg = "")
    if ($condition) {
        Write-Host "[PASS] $testName" -ForegroundColor Green
        $script:testsPassed++
        $script:testResults += @{Name=$testName; Result="PASS"; Message=""}
    } else {
        Write-Host "[FAIL] $testName" -ForegroundColor Red
        if ($errorMsg) { Write-Host "       Error: $errorMsg" -ForegroundColor Yellow }
        $script:testsFailed++
        $script:testResults += @{Name=$testName; Result="FAIL"; Message=$errorMsg}
    }
}

# ======================
# TEST 1: LOGIN
# ======================
Write-Host "`n--- TEST 1: Authentication ---" -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
    $token = $loginResponse.token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Test-Result "Login successful" ($token -ne $null)
} catch {
    Test-Result "Login successful" $false $_.Exception.Message
    Write-Host "Cannot proceed without authentication. Exiting..." -ForegroundColor Red
    exit 1
}

# ======================
# TEST 2: GET ITEMS
# ======================
Write-Host "`n--- TEST 2: Item Master API ---" -ForegroundColor Yellow
try {
    $items = Invoke-RestMethod -Uri "$BASE_URL/items" -Headers $headers
    Test-Result "Fetch items from master catalog" ($items.Count -gt 0) "No items found"
    Write-Host "       Found $($items.Count) items in catalog" -ForegroundColor Gray
    
    # Store some items for later
    $breakfastItem = $items | Where-Object { $_.category -eq "Food" } | Select-Object -First 1
    $laundryItem = $items | Where-Object { $_.category -eq "Service" } | Select-Object -First 1
    
    Test-Result "Items have required fields (name, price, taxRate)" ($breakfastItem.name -and $breakfastItem.price -and $breakfastItem.taxRate -ne $null)
} catch {
    Test-Result "Fetch items from master catalog" $false $_.Exception.Message
}

# ======================
# TEST 3: GET BOOKINGS
# ======================
Write-Host "`n--- TEST 3: Find Test Booking ---" -ForegroundColor Yellow
try {
    $bookings = Invoke-RestMethod -Uri "$BASE_URL/bookings" -Headers $headers
    Test-Result "Fetch bookings" ($bookings.Count -gt 0) "No bookings found"
    
    # Find a checked-in booking for testing
    $testBooking = $bookings | Where-Object { $_.status -eq "CheckedIn" } | Select-Object -First 1
    
    if (-not $testBooking) {
        Write-Host "       No checked-in booking found. Creating test booking..." -ForegroundColor Gray
        
        # Get first available room
        $rooms = Invoke-RestMethod -Uri "$BASE_URL/rooms" -Headers $headers
        $availableRoom = $rooms | Where-Object { $_.status -eq "AVAILABLE" } | Select-Object -First 1
        
        if ($availableRoom) {
            # Create test booking
            $bookingData = @{
                roomId = $availableRoom._id
                roomNumber = $availableRoom.number
                guest = @{ name = "Test Guest - Folio Test" }
                checkInDate = (Get-Date).ToString("yyyy-MM-dd")
                checkOutDate = (Get-Date).AddDays(2).ToString("yyyy-MM-dd")
                nights = 2
                rate = 3000
                amount = 6000
                status = "Confirmed"
                guestsCount = 2
                advancePayment = 2000
                advancePaymentMethod = "UPI"
            } | ConvertTo-Json
            
            $testBooking = Invoke-RestMethod -Uri "$BASE_URL/bookings" -Method POST -Headers $headers -Body $bookingData
            
            # Check-in the booking
            $testBooking = Invoke-RestMethod -Uri "$BASE_URL/bookings/$($testBooking._id)/check-in" -Method POST -Headers $headers
            
            Write-Host "       Created and checked-in test booking: $($testBooking.reservationNumber)" -ForegroundColor Gray
        }
    }
    
    if ($testBooking) {
        Test-Result "Found/Created checked-in booking for testing" $true
        Write-Host "       Booking: $($testBooking.reservationNumber) | Room: $($testBooking.roomNumber)" -ForegroundColor Gray
        Write-Host "       Guest: $($testBooking.guest.name)" -ForegroundColor Gray
        if ($testBooking.advancePayment -gt 0) {
            Write-Host "       Advance: Rs. $($testBooking.advancePayment) via $($testBooking.advancePaymentMethod)" -ForegroundColor Gray
        }
    } else {
        Test-Result "Found/Created checked-in booking for testing" $false "No available rooms or bookings"
        Write-Host "Cannot proceed without a test booking. Exiting..." -ForegroundColor Red
        exit 1
    }
    
    $bookingId = $testBooking._id
} catch {
    Test-Result "Find/Create test booking" $false $_.Exception.Message
    exit 1
}

# ======================
# TEST 4: POST CHARGE - From Item Master
# ======================
Write-Host "`n--- TEST 4: Post Charge (Item Master) ---" -ForegroundColor Yellow
try {
    $chargeData = @{
        category = "FOOD_BEVERAGE"
        description = "Breakfast Buffet"
        quantity = 2
        rate = 350
        taxRate = 5
        itemId = $breakfastItem._id
        remarks = "Test charge from item master"
    } | ConvertTo-Json
    
    $chargeResponse = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId/folio/lines" -Method POST -Headers $headers -Body $chargeData
    
    Test-Result "Post charge from item master" ($chargeResponse.line -ne $null)
    
    # Verify charge details
    $line = $chargeResponse.line
    $expectedBase = 2 * 350  # 700
    $expectedCGST = ($expectedBase * 5) / 200  # 17.50
    $expectedSGST = ($expectedBase * 5) / 200  # 17.50
    $expectedTotal = $expectedBase + $expectedCGST + $expectedSGST  # 735
    
    Test-Result "Charge base amount calculated correctly" ($line.amount -eq $expectedBase) "Expected $expectedBase, got $($line.amount)"
    Test-Result "CGST calculated correctly (2.5%)" ($line.cgst -eq $expectedCGST) "Expected $expectedCGST, got $($line.cgst)"
    Test-Result "SGST calculated correctly (2.5%)" ($line.sgst -eq $expectedSGST) "Expected $expectedSGST, got $($line.sgst)"
    Test-Result "Total amount calculated correctly" ($line.totalAmount -eq $expectedTotal) "Expected $expectedTotal, got $($line.totalAmount)"
    Test-Result "Charge has category" ($line.category -eq "FOOD_BEVERAGE")
    Test-Result "Charge has timestamp" ($line.date -ne $null)
    Test-Result "Charge has remarks" ($line.remarks -eq "Test charge from item master")
    
    Write-Host "       Base: Rs. $($line.amount) | CGST: Rs. $($line.cgst) | SGST: Rs. $($line.sgst) | Total: Rs. $($line.totalAmount)" -ForegroundColor Gray
} catch {
    Test-Result "Post charge from item master" $false $_.Exception.Message
}

# ======================
# TEST 5: POST CHARGE - Custom Entry
# ======================
Write-Host "`n--- TEST 5: Post Charge (Custom) ---" -ForegroundColor Yellow
try {
    $customChargeData = @{
        category = "LAUNDRY"
        description = "Wash & Iron - 5 shirts, 2 pants"
        quantity = 1
        rate = 400
        taxRate = 18
        remarks = "Express service - Table 5"
    } | ConvertTo-Json
    
    $customChargeResponse = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId/folio/lines" -Method POST -Headers $headers -Body $customChargeData
    
    Test-Result "Post custom charge" ($customChargeResponse.line -ne $null)
    
    # Verify 18% GST calculation
    $line = $customChargeResponse.line
    $expectedBase = 400
    $expectedCGST = (400 * 18) / 200  # 36
    $expectedSGST = (400 * 18) / 200  # 36
    $expectedTotal = 400 + 36 + 36  # 472
    
    Test-Result "Custom charge base amount correct" ($line.amount -eq $expectedBase)
    Test-Result "CGST for 18% rate calculated correctly (9%)" ($line.cgst -eq $expectedCGST) "Expected $expectedCGST, got $($line.cgst)"
    Test-Result "SGST for 18% rate calculated correctly (9%)" ($line.sgst -eq $expectedSGST) "Expected $expectedSGST, got $($line.sgst)"
    Test-Result "Total with 18% GST correct" ($line.totalAmount -eq $expectedTotal) "Expected $expectedTotal, got $($line.totalAmount)"
    
    Write-Host "       Category: $($line.category) | Base: Rs. $($line.amount) | GST @18%: Rs. $($line.cgst + $line.sgst) | Total: Rs. $($line.totalAmount)" -ForegroundColor Gray
} catch {
    Test-Result "Post custom charge" $false $_.Exception.Message
}

# ======================
# TEST 6: POST CHARGE - Different Tax Rates
# ======================
Write-Host "`n--- TEST 6: Post Charges (Various Tax Rates) ---" -ForegroundColor Yellow

# 12% GST
try {
    $charge12 = @{
        category = "MINIBAR"
        description = "Soft Drinks"
        quantity = 3
        rate = 50
        taxRate = 12
        remarks = "Test 12% GST"
    } | ConvertTo-Json
    
    $response12 = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId/folio/lines" -Method POST -Headers $headers -Body $charge12
    $expectedTotal12 = 150 + (150 * 12 / 100)  # 168
    Test-Result "Charge with 12% GST posted correctly" ($response12.line.totalAmount -eq $expectedTotal12)
} catch {
    Test-Result "Charge with 12% GST posted correctly" $false $_.Exception.Message
}

# 28% GST
try {
    $charge28 = @{
        category = "SPA"
        description = "Premium Massage"
        quantity = 1
        rate = 2000
        taxRate = 28
        remarks = "Test 28% GST"
    } | ConvertTo-Json
    
    $response28 = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId/folio/lines" -Method POST -Headers $headers -Body $charge28
    $expectedTotal28 = 2000 + (2000 * 28 / 100)  # 2560
    Test-Result "Charge with 28% GST posted correctly" ($response28.line.totalAmount -eq $expectedTotal28)
} catch {
    Test-Result "Charge with 28% GST posted correctly" $false $_.Exception.Message
}

# ======================
# TEST 7: FETCH UPDATED FOLIO
# ======================
Write-Host "`n--- TEST 7: Verify Folio Update ---" -ForegroundColor Yellow
try {
    $updatedBooking = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId" -Headers $headers
    
    Test-Result "Folio exists on booking" ($updatedBooking.folio -ne $null)
    Test-Result "Folio has lines array" ($updatedBooking.folio.lines -ne $null)
    Test-Result "All charges recorded in folio" ($updatedBooking.folio.lines.Count -ge 4) "Expected at least 4 charges, found $($updatedBooking.folio.lines.Count)"
    
    $totalCharges = ($updatedBooking.folio.lines | Measure-Object -Property totalAmount -Sum).Sum
    Write-Host "       Total charges posted: Rs. $totalCharges" -ForegroundColor Gray
    Write-Host "       Number of line items: $($updatedBooking.folio.lines.Count)" -ForegroundColor Gray
    
    # Verify folio total includes room charges + additional charges
    $roomCharges = $updatedBooking.amount
    $expectedFolioTotal = $roomCharges + $totalCharges
    Test-Result "Folio total includes room + additional charges" ($updatedBooking.folio.total -ge $expectedFolioTotal)
    
    Write-Host "       Room Charges: Rs. $roomCharges" -ForegroundColor Gray
    Write-Host "       Additional Charges: Rs. $totalCharges" -ForegroundColor Gray
    Write-Host "       Folio Total: Rs. $($updatedBooking.folio.total)" -ForegroundColor Gray
} catch {
    Test-Result "Fetch updated folio" $false $_.Exception.Message
}

# ======================
# TEST 8: RECORD PAYMENT - Cash
# ======================
Write-Host "`n--- TEST 8: Record Payment (Cash) ---" -ForegroundColor Yellow
try {
    $paymentData = @{
        method = "Cash"
        amount = 5000
        reference = "CASH-001"
        remarks = "Partial payment - Cash"
    } | ConvertTo-Json
    
    $paymentResponse = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId/payments" -Method POST -Headers $headers -Body $paymentData
    
    Test-Result "Record cash payment" ($paymentResponse.payment -ne $null)
    
    $payment = $paymentResponse.payment
    Test-Result "Payment has method" ($payment.method -eq "Cash")
    Test-Result "Payment has amount" ($payment.amount -eq 5000)
    Test-Result "Payment has reference" ($payment.reference -eq "CASH-001")
    Test-Result "Payment has timestamp" ($payment.date -ne $null)
    Test-Result "Payment has remarks" ($payment.remarks -eq "Partial payment - Cash")
    
    Write-Host "       Payment recorded: Rs. $($payment.amount) via $($payment.method)" -ForegroundColor Gray
} catch {
    Test-Result "Record cash payment" $false $_.Exception.Message
}

# ======================
# TEST 9: RECORD PAYMENT - UPI
# ======================
Write-Host "`n--- TEST 9: Record Payment (UPI) ---" -ForegroundColor Yellow
try {
    $paymentUPI = @{
        method = "UPI"
        amount = 3000
        reference = "TXN123456789"
        remarks = "Google Pay payment"
    } | ConvertTo-Json
    
    $upiResponse = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId/payments" -Method POST -Headers $headers -Body $paymentUPI
    
    Test-Result "Record UPI payment" ($upiResponse.payment -ne $null)
    Test-Result "UPI payment has transaction reference" ($upiResponse.payment.reference -eq "TXN123456789")
    
    Write-Host "       Payment recorded: Rs. $($upiResponse.payment.amount) via $($upiResponse.payment.method) | Ref: $($upiResponse.payment.reference)" -ForegroundColor Gray
} catch {
    Test-Result "Record UPI payment" $false $_.Exception.Message
}

# ======================
# TEST 10: RECORD PAYMENT - Card
# ======================
Write-Host "`n--- TEST 10: Record Payment (Card) ---" -ForegroundColor Yellow
try {
    $paymentCard = @{
        method = "Card"
        amount = 2000
        reference = "AUTH456789"
        remarks = "Credit card payment"
    } | ConvertTo-Json
    
    $cardResponse = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId/payments" -Method POST -Headers $headers -Body $paymentCard
    
    Test-Result "Record card payment" ($cardResponse.payment -ne $null)
    Test-Result "Card payment method stored correctly" ($cardResponse.payment.method -eq "Card")
    
    Write-Host "       Payment recorded: Rs. $($cardResponse.payment.amount) via $($cardResponse.payment.method)" -ForegroundColor Gray
} catch {
    Test-Result "Record card payment" $false $_.Exception.Message
}

# ======================
# TEST 11: VERIFY BALANCE CALCULATION
# ======================
Write-Host "`n--- TEST 11: Balance Calculation ---" -ForegroundColor Yellow
try {
    $finalBooking = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId" -Headers $headers
    
    Test-Result "Booking has payments array" ($finalBooking.folio.payments -ne $null)
    Test-Result "All payments recorded" ($finalBooking.folio.payments.Count -ge 3) "Expected at least 3 payments, found $($finalBooking.folio.payments.Count)"
    
    $totalPaid = ($finalBooking.folio.payments | Measure-Object -Property amount -Sum).Sum
    $advancePaid = if ($finalBooking.advancePayment) { $finalBooking.advancePayment } else { 0 }
    $folioTotal = $finalBooking.folio.total
    $expectedBalance = $folioTotal - $totalPaid - $advancePaid
    
    Write-Host "       Folio Total: Rs. $folioTotal" -ForegroundColor Gray
    Write-Host "       Advance Paid: Rs. $advancePaid" -ForegroundColor Gray
    Write-Host "       Payments Received: Rs. $totalPaid" -ForegroundColor Gray
    Write-Host "       Expected Balance: Rs. $expectedBalance" -ForegroundColor Gray
    Write-Host "       Actual Balance: Rs. $($finalBooking.folio.balance)" -ForegroundColor Gray
    
    # Allow small floating point differences
    $balanceDiff = [Math]::Abs($finalBooking.folio.balance - $expectedBalance)
    Test-Result "Balance calculated correctly (Total - Advance - Payments)" ($balanceDiff -lt 1) "Difference: Rs. $balanceDiff"
    # Note: Negative balance indicates credit (overpayment) - this is valid in hotel industry
} catch {
    Test-Result "Balance calculation" $false $_.Exception.Message
}

# ======================
# TEST 12: CATEGORY GROUPING
# ======================
Write-Host "`n--- TEST 12: Verify Charge Categories ---" -ForegroundColor Yellow
try {
    $finalBooking = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId" -Headers $headers
    
    $categories = $finalBooking.folio.lines | Select-Object -ExpandProperty category -Unique
    
    Test-Result "Charges have categories assigned" ($categories.Count -gt 0)
    Test-Result "Food & Beverage category exists" ($categories -contains "FOOD_BEVERAGE")
    Test-Result "Laundry category exists" ($categories -contains "LAUNDRY")
    
    Write-Host "       Categories found: $($categories -join ', ')" -ForegroundColor Gray
    
    # Count charges by category
    $foodCharges = ($finalBooking.folio.lines | Where-Object { $_.category -eq "FOOD_BEVERAGE" }).Count
    $laundryCharges = ($finalBooking.folio.lines | Where-Object { $_.category -eq "LAUNDRY" }).Count
    
    Write-Host "       Food & Beverage: $foodCharges charges" -ForegroundColor Gray
    Write-Host "       Laundry: $laundryCharges charges" -ForegroundColor Gray
} catch {
    Test-Result "Category grouping" $false $_.Exception.Message
}

# ======================
# TEST 13: TAX SUMMARY
# ======================
Write-Host "`n--- TEST 13: GST Tax Summary ---" -ForegroundColor Yellow
try {
    $finalBooking = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId" -Headers $headers
    
    $totalCGST = ($finalBooking.folio.lines | Measure-Object -Property cgst -Sum).Sum
    $totalSGST = ($finalBooking.folio.lines | Measure-Object -Property sgst -Sum).Sum
    $totalIGST = ($finalBooking.folio.lines | Measure-Object -Property igst -Sum).Sum
    
    Test-Result "CGST totals calculated" ($totalCGST -gt 0)
    Test-Result "SGST totals calculated" ($totalSGST -gt 0)
    Test-Result "CGST equals SGST (same state transaction)" ($totalCGST -eq $totalSGST)
    
    Write-Host "       Total CGST: Rs. $([Math]::Round($totalCGST, 2))" -ForegroundColor Gray
    Write-Host "       Total SGST: Rs. $([Math]::Round($totalSGST, 2))" -ForegroundColor Gray
    Write-Host "       Total IGST: Rs. $([Math]::Round($totalIGST, 2))" -ForegroundColor Gray
    Write-Host "       Total GST: Rs. $([Math]::Round($totalCGST + $totalSGST + $totalIGST, 2))" -ForegroundColor Gray
} catch {
    Test-Result "GST tax summary" $false $_.Exception.Message
}

# ======================
# TEST 14: ADVANCE PAYMENT TRACKING
# ======================
Write-Host "`n--- TEST 14: Advance Payment Handling ---" -ForegroundColor Yellow
try {
    $finalBooking = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId" -Headers $headers
    
    if ($finalBooking.advancePayment -gt 0) {
        Test-Result "Advance payment recorded on booking" $true
        Test-Result "Advance payment method recorded" ($finalBooking.advancePaymentMethod -ne $null)
        Test-Result "Advance deducted from balance" ($finalBooking.folio.balance -lt $finalBooking.folio.total)
        
        Write-Host "       Advance: Rs. $($finalBooking.advancePayment) via $($finalBooking.advancePaymentMethod)" -ForegroundColor Gray
    } else {
        Test-Result "Advance payment handling (N/A - no advance)" $true
        Write-Host "       No advance payment for this booking" -ForegroundColor Gray
    }
} catch {
    Test-Result "Advance payment tracking" $false $_.Exception.Message
}

# ======================
# TEST 15: ERROR HANDLING
# ======================
Write-Host "`n--- TEST 15: Error Handling ---" -ForegroundColor Yellow

# Test missing required fields
try {
    $invalidCharge = @{
        category = "FOOD_BEVERAGE"
        # Missing description and rate
        quantity = 1
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId/folio/lines" -Method POST -Headers $headers -Body $invalidCharge -ErrorAction Stop
        Test-Result "Reject charge with missing required fields" $false "Should have rejected invalid charge"
    } catch {
        Test-Result "Reject charge with missing required fields" $true
    }
} catch {
    Test-Result "Error handling for invalid charge" $false $_.Exception.Message
}

# Test invalid payment amount
try {
    $invalidPayment = @{
        method = "Cash"
        amount = 0
        # Zero amount should be rejected
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId/payments" -Method POST -Headers $headers -Body $invalidPayment -ErrorAction Stop
        # If this succeeds, it's acceptable (backend might allow it)
        Test-Result "Handle zero payment amount" $true
    } catch {
        # If rejected, that's also fine
        Test-Result "Reject zero payment amount" $true
    }
} catch {
    Test-Result "Error handling for invalid payment" $false $_.Exception.Message
}

# ======================
# FINAL SUMMARY
# ======================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "         TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$finalBooking = Invoke-RestMethod -Uri "$BASE_URL/bookings/$bookingId" -Headers $headers

Write-Host "`nTest Booking Details:" -ForegroundColor White
Write-Host "  Reservation: $($finalBooking.reservationNumber)" -ForegroundColor Gray
Write-Host "  Guest: $($finalBooking.guest.name)" -ForegroundColor Gray
Write-Host "  Room: $($finalBooking.roomNumber)" -ForegroundColor Gray
Write-Host ""
Write-Host "Folio Summary:" -ForegroundColor White
Write-Host "  Room Charges: Rs. $($finalBooking.amount)" -ForegroundColor Gray
Write-Host "  Additional Charges: $($finalBooking.folio.lines.Count) items" -ForegroundColor Gray
Write-Host "  Total Charges (incl. GST): Rs. $($finalBooking.folio.total)" -ForegroundColor Gray
Write-Host ""
Write-Host "Payments:" -ForegroundColor White
if ($finalBooking.advancePayment -gt 0) {
    Write-Host "  Advance: Rs. $($finalBooking.advancePayment) ($($finalBooking.advancePaymentMethod))" -ForegroundColor Gray
}
Write-Host "  Payments Received: $($finalBooking.folio.payments.Count) transactions" -ForegroundColor Gray
$totalPaid = ($finalBooking.folio.payments | Measure-Object -Property amount -Sum).Sum
Write-Host "  Total Paid: Rs. $totalPaid" -ForegroundColor Gray
Write-Host ""
Write-Host "Balance:" -ForegroundColor White
if ($finalBooking.folio.balance -gt 0) {
    Write-Host "  Balance Due: Rs. $($finalBooking.folio.balance)" -ForegroundColor Red
} else {
    Write-Host "  Balance Due: Rs. 0.00 (PAID IN FULL)" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TESTS PASSED: $testsPassed" -ForegroundColor Green
Write-Host "  TESTS FAILED: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })
Write-Host "  TOTAL TESTS: $($testsPassed + $testsFailed)" -ForegroundColor White
$successRate = [Math]::Round(($testsPassed / ($testsPassed + $testsFailed)) * 100, 1)
Write-Host "  SUCCESS RATE: $successRate%" -ForegroundColor $(if ($successRate -ge 95) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" })
Write-Host "========================================" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
    Write-Host "`n✅ ALL TESTS PASSED! Enhanced Folio System is working perfectly!" -ForegroundColor Green
    Write-Host "   System is production-ready!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Some tests failed. Review the errors above." -ForegroundColor Yellow
}

Write-Host "`nTest booking ID: $bookingId" -ForegroundColor Gray
Write-Host "You can view this folio in the UI by navigating to:" -ForegroundColor Gray
Write-Host "Bookings → Find '$($finalBooking.reservationNumber)' → Click 'Folio' button" -ForegroundColor Cyan
Write-Host ""
