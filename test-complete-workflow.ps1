#!/usr/bin/env pwsh
# Complete End-to-End Workflow Test with Real Data
# Tests all major features of BillSutra Hotel Management System

$baseUrl = "http://localhost:5051/api"
$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  COMPLETE WORKFLOW TEST - REAL DATA" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Helper function for API calls
function Invoke-API {
    param($Method, $Endpoint, $Body, $Token)
    $headers = @{"Content-Type" = "application/json"}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    try {
        if ($Body) {
            return Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json -Depth 10)
        } else {
            return Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method -Headers $headers
        }
    } catch {
        Write-Host "  [ERROR] API call failed: $Endpoint" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test counter
$script:testsPassed = 0
$script:testsFailed = 0

function Test-Result {
    param(
        [string]$TestName,
        [bool]$Condition,
        [string]$Details = ""
    )
    
    if ($Condition) {
        Write-Host "  [PASS] $TestName" -ForegroundColor Green
        if ($Details) { Write-Host "         $Details" -ForegroundColor Gray }
        $script:testsPassed++
    } else {
        Write-Host "  [FAIL] $TestName" -ForegroundColor Red
        if ($Details) { Write-Host "         $Details" -ForegroundColor Yellow }
        $script:testsFailed++
    }
}

# ========================================
# STEP 1: Authentication
# ========================================
Write-Host "--- STEP 1: Authentication ---" -ForegroundColor Yellow
$loginData = @{username = "admin"; password = "admin123"}
$loginResponse = Invoke-API -Method POST -Endpoint "/auth/login" -Body $loginData
$token = $loginResponse.token

Test-Result "Login successful" ($token -ne $null) "Token received"

if (-not $token) {
    Write-Host "`nâŒ Cannot proceed without authentication`n" -ForegroundColor Red
    exit 1
}

# ========================================
# STEP 2: Verify Items Master Catalog
# ========================================
Write-Host "`n--- STEP 2: Item Master Catalog ---" -ForegroundColor Yellow
$items = Invoke-API -Method GET -Endpoint "/items" -Token $token

Test-Result "Items catalog loaded" ($items.Count -gt 0) "Found $($items.Count) items"

$breakfast = $items | Where-Object { $_.name -like "*Breakfast*" } | Select-Object -First 1
Test-Result "Breakfast item available" ($breakfast -ne $null) "â‚¹$($breakfast.price), Tax: $($breakfast.taxRate)%"

$laundry = $items | Where-Object { $_.category -eq "Service" -and $_.name -like "*Laundry*" } | Select-Object -First 1
Test-Result "Laundry service available" ($laundry -ne $null) "â‚¹$($laundry.price), Tax: $($laundry.taxRate)%"

# ========================================
# STEP 3: Find Available Room
# ========================================
Write-Host "`n--- STEP 3: Room Availability ---" -ForegroundColor Yellow
$rooms = Invoke-API -Method GET -Endpoint "/rooms" -Token $token
$availableRoom = $rooms | Where-Object { $_.status -eq "Available" } | Select-Object -First 1

Test-Result "Available room found" ($availableRoom -ne $null) "Room: $($availableRoom.number)"

if (-not $availableRoom) {
    Write-Host "`nâš ï¸  No available rooms for testing. Using any room.`n" -ForegroundColor Yellow
    $availableRoom = $rooms | Select-Object -First 1
}

# ========================================
# STEP 4: Create New Booking
# ========================================
Write-Host "`n--- STEP 4: Create Booking ---" -ForegroundColor Yellow

$checkInDate = (Get-Date).ToString("yyyy-MM-dd")
$checkOutDate = (Get-Date).AddDays(2).ToString("yyyy-MM-dd")

$bookingData = @{
    guestName = "Test Guest $(Get-Random -Maximum 9999)"
    email = "testguest$(Get-Random -Maximum 9999)@example.com"
    phone = "98765$(Get-Random -Minimum 10000 -Maximum 99999)"
    checkIn = $checkInDate
    checkOut = $checkOutDate
    adults = 2
    children = 0
    roomId = $availableRoom._id
    roomNumber = $availableRoom.number
    ratePlanId = "plan-001"
    advancePayment = @{
        amount = 2500
        method = "Cash"
        reference = "Advance Cash Payment"
    }
}

$newBooking = Invoke-API -Method POST -Endpoint "/bookings" -Body $bookingData -Token $token

Test-Result "Booking created" ($newBooking._id -ne $null) "Reservation: $($newBooking.reservationNumber)"
Test-Result "Advance payment recorded" ($newBooking.advancePayment.amount -eq 2500) "â‚¹2500 via Cash"
Test-Result "Initial status is Confirmed" ($newBooking.status -eq "Confirmed")

$bookingId = $newBooking._id

# ========================================
# STEP 5: Check-In Guest
# ========================================
Write-Host "`n--- STEP 5: Check-In Process ---" -ForegroundColor Yellow

$checkinData = @{action = "checkIn"}
$checkedInBooking = Invoke-API -Method PATCH -Endpoint "/bookings/$bookingId" -Body $checkinData -Token $token

Test-Result "Check-in successful" ($checkedInBooking.status -eq "CheckedIn") "Status: CheckedIn"

# Verify room status changed
$updatedRooms = Invoke-API -Method GET -Endpoint "/rooms" -Token $token
$occupiedRoom = $updatedRooms | Where-Object { $_.number -eq $availableRoom.number }
Test-Result "Room marked as Occupied" ($occupiedRoom.status -eq "Occupied") "Room $($occupiedRoom.number)"

# ========================================
# STEP 6: Post Charges to Folio
# ========================================
Write-Host "`n--- STEP 6: Post Charges to Folio ---" -ForegroundColor Yellow

# Charge 1: Breakfast from item master
$charge1 = @{
    itemId = $breakfast._id
    category = "FOOD_BEVERAGE"
    description = "Breakfast Buffet"
    quantity = 2
    rate = $breakfast.price
    taxRate = $breakfast.taxRate
    remarks = "Breakfast for 2 guests - Day 1"
}

$charge1Result = Invoke-API -Method POST -Endpoint "/bookings/$bookingId/folio/lines" -Body $charge1 -Token $token

if ($charge1Result.line) {
    $line1 = $charge1Result.line
    $expectedTotal = [math]::Round(700 * 1.05, 2)  # 350*2 with 5% GST
    Test-Result "Breakfast charge posted" ($line1.total -eq $expectedTotal) "Base: â‚¹700, Total: â‚¹$($line1.total)"
    Test-Result "GST calculated correctly" ($line1.cgst -eq 17.5 -and $line1.sgst -eq 17.5) "CGST: â‚¹17.5, SGST: â‚¹17.5"
} else {
    Test-Result "Breakfast charge posted" $false "API returned: $($charge1Result | ConvertTo-Json)"
}

# Charge 2: Laundry service (18% GST)
$charge2 = @{
    category = "LAUNDRY"
    description = "Express Laundry - 5 shirts"
    quantity = 5
    rate = 150
    taxRate = 18
    remarks = "Same day service"
}

$charge2Result = Invoke-API -Method POST -Endpoint "/bookings/$bookingId/folio/lines" -Body $charge2 -Token $token

if ($charge2Result.line) {
    $line2 = $charge2Result.line
    $expectedBase = 750
    $expectedGST = [math]::Round(750 * 0.18, 2)
    Test-Result "Laundry charge posted" ($line2.baseAmount -eq $expectedBase) "Base: â‚¹750, Tax @18%"
    Test-Result "18% GST split correctly" ($line2.cgst -eq 67.5 -and $line2.sgst -eq 67.5) "CGST: â‚¹67.5, SGST: â‚¹67.5"
} else {
    Test-Result "Laundry charge posted" $false
}

# Charge 3: Mini Bar (12% GST)
$charge3 = @{
    category = "MINIBAR"
    description = "Mini Bar - Soft Drinks"
    quantity = 3
    rate = 80
    taxRate = 12
    remarks = "2 Cola, 1 Sprite"
}

$charge3Result = Invoke-API -Method POST -Endpoint "/bookings/$bookingId/folio/lines" -Body $charge3 -Token $token

if ($charge3Result.line) {
    Test-Result "Mini bar charge posted" ($charge3Result.line.baseAmount -eq 240) "â‚¹240 @12% GST"
}

# Charge 4: Room Service
$charge4 = @{
    category = "ROOM_SERVICE"
    description = "Room Service - Dinner"
    quantity = 1
    rate = 850
    taxRate = 5
    remarks = "Veg Thali + Beverages"
}

$charge4Result = Invoke-API -Method POST -Endpoint "/bookings/$bookingId/folio/lines" -Body $charge4 -Token $token

if ($charge4Result.line) {
    Test-Result "Room service charge posted" ($charge4Result.line.baseAmount -eq 850) "â‚¹850 @5% GST"
}

# Charge 5: Airport Pickup
$charge5 = @{
    category = "TRANSPORT"
    description = "Airport Pickup"
    quantity = 1
    rate = 1500
    taxRate = 5
    remarks = "Sedan - Terminal 2"
}

$charge5Result = Invoke-API -Method POST -Endpoint "/bookings/$bookingId/folio/lines" -Body $charge5 -Token $token

if ($charge5Result.line) {
    Test-Result "Transport charge posted" ($charge5Result.line.baseAmount -eq 1500) "â‚¹1500 @5% GST"
}

# ========================================
# STEP 7: Record Payments
# ========================================
Write-Host "`n--- STEP 7: Record Payments ---" -ForegroundColor Yellow

# Payment 1: Cash
$payment1 = @{
    method = "Cash"
    amount = 1500
    reference = "Cash payment - Front desk"
    remarks = "Partial payment"
}

$payment1Result = Invoke-API -Method POST -Endpoint "/bookings/$bookingId/folio/payments" -Body $payment1 -Token $token
Test-Result "Cash payment recorded" ($payment1Result.payment.amount -eq 1500) "â‚¹1500 via Cash"

# Payment 2: UPI
$payment2 = @{
    method = "UPI"
    amount = 2000
    reference = "GPay-TXN123456789"
    remarks = "Google Pay transfer"
}

$payment2Result = Invoke-API -Method POST -Endpoint "/bookings/$bookingId/folio/payments" -Body $payment2 -Token $token
Test-Result "UPI payment recorded" ($payment2Result.payment.method -eq "UPI") "â‚¹2000 via UPI"

# Payment 3: Card
$payment3 = @{
    method = "Card"
    amount = 2500
    reference = "VISA-****4532"
    remarks = "Credit card payment"
}

$payment3Result = Invoke-API -Method POST -Endpoint "/bookings/$bookingId/folio/payments" -Body $payment3 -Token $token
Test-Result "Card payment recorded" ($payment3Result.payment.method -eq "Card") "â‚¹2500 via Card"

# ========================================
# STEP 8: Verify Folio Summary
# ========================================
Write-Host "`n--- STEP 8: Folio Summary Verification ---" -ForegroundColor Yellow

$finalBooking = Invoke-API -Method GET -Endpoint "/bookings/$bookingId" -Token $token

if ($finalBooking.folio) {
    $folio = $finalBooking.folio
    
    Test-Result "Folio exists" ($folio -ne $null)
    Test-Result "Charges recorded" ($folio.lines.Count -ge 5) "$($folio.lines.Count) line items"
    Test-Result "Payments recorded" ($folio.payments.Count -eq 3) "3 payments"
    
    # Calculate expected totals
    $totalCharges = ($folio.lines | Measure-Object -Property total -Sum).Sum
    $totalPaid = ($folio.payments | Measure-Object -Property amount -Sum).Sum
    $advancePaid = $finalBooking.advancePayment.amount
    $expectedBalance = $folio.total - $totalPaid - $advancePaid
    
    Write-Host "`n  ðŸ“Š Folio Summary:" -ForegroundColor Cyan
    Write-Host "     Room Charges: â‚¹$($folio.roomCharges)" -ForegroundColor White
    Write-Host "     Additional Charges: â‚¹$([math]::Round($totalCharges, 2))" -ForegroundColor White
    Write-Host "     Grand Total: â‚¹$($folio.total)" -ForegroundColor White
    Write-Host "     Advance Paid: â‚¹$advancePaid" -ForegroundColor Yellow
    Write-Host "     Payments: â‚¹$totalPaid" -ForegroundColor Yellow
    Write-Host "     Balance: â‚¹$([math]::Round($folio.balance, 2))" -ForegroundColor $(if ($folio.balance -lt 0) { "Green" } else { "Magenta" })
    
    Test-Result "Balance calculated correctly" ([math]::Abs($folio.balance - $expectedBalance) -lt 1) "Expected: â‚¹$([math]::Round($expectedBalance, 2))"
    
    # Verify GST calculations
    $totalCGST = ($folio.lines | Measure-Object -Property cgst -Sum).Sum
    $totalSGST = ($folio.lines | Measure-Object -Property sgst -Sum).Sum
    
    Test-Result "CGST = SGST" ([math]::Abs($totalCGST - $totalSGST) -lt 0.01) "CGST: â‚¹$([math]::Round($totalCGST, 2)), SGST: â‚¹$([math]::Round($totalSGST, 2))"
}

# ========================================
# STEP 9: Test Negative Balance (Overpayment)
# ========================================
Write-Host "`n--- STEP 9: Negative Balance Test ---" -ForegroundColor Yellow

$overpayment = @{
    method = "Cash"
    amount = 15000
    reference = "Overpayment test"
    remarks = "Testing credit balance"
}

$overpaymentResult = Invoke-API -Method POST -Endpoint "/bookings/$bookingId/folio/payments" -Body $overpayment -Token $token

if ($overpaymentResult.payment) {
    $updatedBooking = Invoke-API -Method GET -Endpoint "/bookings/$bookingId" -Token $token
    $newBalance = $updatedBooking.folio.balance
    
    Test-Result "Overpayment recorded" ($overpaymentResult.payment.amount -eq 15000) "â‚¹15000 added"
    Test-Result "Negative balance allowed" ($newBalance -lt 0) "Balance: â‚¹$([math]::Round($newBalance, 2)) (Credit to guest)"
}

# ========================================
# STEP 10: Test Validation (Error Handling)
# ========================================
Write-Host "`n--- STEP 10: Validation & Error Handling ---" -ForegroundColor Yellow

# Try posting charge without required fields
$invalidCharge = @{
    category = "FOOD_BEVERAGE"
    # Missing: description, quantity, rate
}

$errorResult = Invoke-API -Method POST -Endpoint "/bookings/$bookingId/folio/lines" -Body $invalidCharge -Token $token

Test-Result "Validation rejects invalid charge" ($errorResult -eq $null -or $errorResult.error -ne $null) "Missing fields rejected"

# ========================================
# STEP 11: Housekeeping Integration
# ========================================
Write-Host "`n--- STEP 11: Housekeeping Integration ---" -ForegroundColor Yellow

# Create housekeeping task for the occupied room
$taskData = @{
    roomNumber = $availableRoom.number
    type = "CLEANING"
    priority = "MEDIUM"
    description = "Post-checkout cleaning test"
}

$newTask = Invoke-API -Method POST -Endpoint "/housekeeping" -Body $taskData -Token $token

if ($newTask._id) {
    Test-Result "Housekeeping task created" ($newTask.roomNumber -eq $availableRoom.number) "Task: $($newTask.type)"
    
    # Verify room status synced
    Start-Sleep -Seconds 1
    $syncedRooms = Invoke-API -Method GET -Endpoint "/rooms" -Token $token
    $syncedRoom = $syncedRooms | Where-Object { $_.number -eq $availableRoom.number }
    
    Test-Result "Room status synced" ($syncedRoom.housekeepingStatus -eq "DIRTY") "Status: $($syncedRoom.housekeepingStatus)"
}

# ========================================
# STEP 12: Check-Out Process
# ========================================
Write-Host "`n--- STEP 12: Check-Out Process ---" -ForegroundColor Yellow

$checkoutData = @{action = "checkOut"}
$checkedOutBooking = Invoke-API -Method PATCH -Endpoint "/bookings/$bookingId" -Body $checkoutData -Token $token

Test-Result "Check-out successful" ($checkedOutBooking.status -eq "CheckedOut") "Status: CheckedOut"
Test-Result "Checkout timestamp recorded" ($checkedOutBooking.actualCheckOut -ne $null)

# Verify room released
Start-Sleep -Seconds 1
$releasedRooms = Invoke-API -Method GET -Endpoint "/rooms" -Token $token
$releasedRoom = $releasedRooms | Where-Object { $_.number -eq $availableRoom.number }

Test-Result "Room released after checkout" ($releasedRoom.status -eq "Available") "Room: $($releasedRoom.number)"

# ========================================
# FINAL RESULTS
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "         WORKFLOW TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nTest Booking:" -ForegroundColor White
Write-Host "  Reservation: $($newBooking.reservationNumber)" -ForegroundColor Yellow
Write-Host "  Guest: $($newBooking.guestName)" -ForegroundColor Yellow
Write-Host "  Room: $($availableRoom.number)" -ForegroundColor Yellow
Write-Host "  Status: $($checkedOutBooking.status)" -ForegroundColor Yellow

Write-Host "`nTests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "Total Tests: $($testsPassed + $testsFailed)" -ForegroundColor White

$successRate = [math]::Round(($testsPassed / ($testsPassed + $testsFailed)) * 100, 1)
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })

if ($testsFailed -eq 0) {
    Write-Host "`nâœ… ALL WORKFLOW TESTS PASSED!" -ForegroundColor Green
    Write-Host "   System is fully functional with real data!" -ForegroundColor Green
} else {
    Write-Host "`nâš ï¸  Some tests failed. Review above for details." -ForegroundColor Yellow
}

Write-Host "`nBooking ID: $bookingId" -ForegroundColor Gray
Write-Host "You can view this in the UI at: http://localhost:5173`n" -ForegroundColor Gray
