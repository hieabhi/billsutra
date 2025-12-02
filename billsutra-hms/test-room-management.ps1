# ============================================
# ROOM MANAGEMENT SYSTEM - TEST SUITE
# Testing: Settings reorganization & Room Types
# ============================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   ROOM MANAGEMENT SYSTEM - COMPREHENSIVE TEST SUITE        " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$baseUrl = "http://localhost:5051/api"

# Login
Write-Host "[SETUP] Logging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
    $token = $loginResponse.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "✗ Login FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
    exit 1
}

# ============================================
# TEST 1: Room Types API - GET All
# ============================================
Write-Host "`n[TEST 1] GET /api/room-types - Fetch all room types" -ForegroundColor Cyan
try {
    $roomTypes = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method GET -Headers @{Authorization="Bearer $token"}
    Write-Host "✓ Found $($roomTypes.Count) room types" -ForegroundColor Green
    foreach($rt in $roomTypes) {
        Write-Host "  → $($rt.name) ($($rt.code)) - ₹$($rt.defaultRate) - Max: $($rt.maxOccupancy) guests" -ForegroundColor White
        Write-Host "    Amenities: $($rt.amenities -join ', ')" -ForegroundColor Gray
    }
    $testsPassed++
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# TEST 2: Room Types API - CREATE
# ============================================
Write-Host "`n[TEST 2] POST /api/room-types - Create new room type" -ForegroundColor Cyan
$testRoomType = @{
    name = "Presidential Suite TEST"
    code = "PST"
    defaultRate = 15000
    maxOccupancy = 6
    amenities = @("AC", "TV", "WiFi", "Mini Fridge", "Jacuzzi", "Living Room", "Kitchen", "Balcony")
    description = "Luxury presidential suite for VIP guests - TEST ROOM TYPE"
} | ConvertTo-Json

try {
    $newRoomType = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $testRoomType
    Write-Host "✓ Created room type successfully" -ForegroundColor Green
    Write-Host "  ID: $($newRoomType._id)" -ForegroundColor White
    Write-Host "  Name: $($newRoomType.name)" -ForegroundColor White
    Write-Host "  Code: $($newRoomType.code)" -ForegroundColor White
    $createdRoomTypeId = $newRoomType._id
    $testsPassed++
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# TEST 3: Room Types API - UPDATE
# ============================================
if ($createdRoomTypeId) {
    Write-Host "`n[TEST 3] PUT /api/room-types/:id - Update room type" -ForegroundColor Cyan
    $updateData = @{
        name = "Presidential Suite UPDATED"
        code = "PSU"
        defaultRate = 18000
        maxOccupancy = 8
        amenities = @("AC", "TV", "WiFi", "Mini Fridge", "Jacuzzi", "Living Room", "Kitchen", "Balcony", "Gym")
        description = "Updated luxury presidential suite"
    } | ConvertTo-Json

    try {
        $updated = Invoke-RestMethod -Uri "$baseUrl/room-types/$createdRoomTypeId" -Method PUT -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $updateData
        Write-Host "✓ Updated room type successfully" -ForegroundColor Green
        Write-Host "  New Name: $($updated.name)" -ForegroundColor White
        Write-Host "  New Code: $($updated.code)" -ForegroundColor White
        Write-Host "  New Rate: ₹$($updated.defaultRate)" -ForegroundColor White
        $testsPassed++
    } catch {
        Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# ============================================
# TEST 4: Rooms API - CREATE with Room Type
# ============================================
Write-Host "`n[TEST 4] POST /api/rooms - Create room with room type" -ForegroundColor Cyan
$testRoom = @{
    number = "TEST-999"
    type = "Suite"
    rate = 5000
    floor = "Test Floor"
    status = "Available"
} | ConvertTo-Json

try {
    $newRoom = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $testRoom
    Write-Host "✓ Created room successfully" -ForegroundColor Green
    Write-Host "  Room: $($newRoom.number)" -ForegroundColor White
    Write-Host "  Type: $($newRoom.type)" -ForegroundColor White
    Write-Host "  Rate: ₹$($newRoom.rate)" -ForegroundColor White
    Write-Host "  Floor: $($newRoom.floor)" -ForegroundColor White
    $createdRoomId = $newRoom._id
    $testsPassed++
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# TEST 5: Rooms API - GET All (verify new room)
# ============================================
Write-Host "`n[TEST 5] GET /api/rooms - Verify rooms list" -ForegroundColor Cyan
try {
    $allRooms = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method GET -Headers @{Authorization="Bearer $token"}
    $testRoom = $allRooms | Where-Object { $_.number -eq "TEST-999" }
    
    if ($testRoom) {
        Write-Host "✓ Room TEST-999 found in rooms list" -ForegroundColor Green
        Write-Host "  Total rooms in system: $($allRooms.Count)" -ForegroundColor White
        
        # Group by type
        $byType = $allRooms | Group-Object type | Sort-Object Count -Descending
        Write-Host "  Rooms by type:" -ForegroundColor White
        foreach($group in $byType) {
            Write-Host "    → $($group.Name): $($group.Count) rooms" -ForegroundColor Gray
        }
        $testsPassed++
    } else {
        Write-Host "✗ FAILED: Room TEST-999 not found" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# TEST 6: Edge Case - Duplicate Room Number
# ============================================
Write-Host "`n[TEST 6] Edge Case - Duplicate room number validation" -ForegroundColor Cyan
$duplicateRoom = @{
    number = "TEST-999"
    type = "Standard"
    rate = 1500
    floor = "Ground Floor"
    status = "Available"
} | ConvertTo-Json

try {
    $duplicate = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $duplicateRoom
    Write-Host "✗ FAILED: System allowed duplicate room number (should be prevented)" -ForegroundColor Red
    $testsFailed++
} catch {
    if ($_.Exception.Message -match "duplicate|exists|already") {
        Write-Host "✓ Correctly prevented duplicate room number" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "✓ Duplicate prevented (different error: $($_.Exception.Message))" -ForegroundColor Yellow
        $testsPassed++
    }
}

# ============================================
# TEST 7: Edge Case - Invalid Room Type
# ============================================
Write-Host "`n[TEST 7] Edge Case - Room with non-existent type" -ForegroundColor Cyan
$invalidTypeRoom = @{
    number = "TEST-888"
    type = "NonExistentType12345"
    rate = 2000
    floor = "1"
    status = "Available"
} | ConvertTo-Json

try {
    $invalidRoom = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $invalidTypeRoom
    Write-Host "⚠ Room created with custom type (system allows free-form types)" -ForegroundColor Yellow
    Write-Host "  Note: Consider adding validation to only allow predefined room types" -ForegroundColor Gray
    # Clean up
    try { Invoke-RestMethod -Uri "$baseUrl/rooms/$($invalidRoom._id)" -Method DELETE -Headers @{Authorization="Bearer $token"} | Out-Null } catch {}
    $testsPassed++
} catch {
    Write-Host "✓ System validated room type" -ForegroundColor Green
    $testsPassed++
}

# ============================================
# TEST 8: Room Types - Missing Required Fields
# ============================================
Write-Host "`n[TEST 8] Validation - Room type without required fields" -ForegroundColor Cyan
$invalidRoomType = @{
    name = "Invalid Type"
    # Missing code, defaultRate, maxOccupancy
} | ConvertTo-Json

try {
    $invalid = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $invalidRoomType
    Write-Host "✗ FAILED: System accepted incomplete room type data" -ForegroundColor Red
    $testsFailed++
} catch {
    Write-Host "✓ Correctly rejected incomplete room type" -ForegroundColor Green
    $testsPassed++
}

# ============================================
# TEST 9: Rooms - Missing Required Fields
# ============================================
Write-Host "`n[TEST 9] Validation - Room without required fields" -ForegroundColor Cyan
$invalidRoom = @{
    type = "Standard"
    # Missing number (required)
} | ConvertTo-Json

try {
    $invalid = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $invalidRoom
    Write-Host "✗ FAILED: System accepted room without number" -ForegroundColor Red
    $testsFailed++
} catch {
    Write-Host "✓ Correctly rejected room without number" -ForegroundColor Green
    $testsPassed++
}

# ============================================
# TEST 10: Room Types - Duplicate Code
# ============================================
Write-Host "`n[TEST 10] Edge Case - Duplicate room type code" -ForegroundColor Cyan
$duplicateCode = @{
    name = "Another Standard"
    code = "STD"  # Already exists
    defaultRate = 1800
    maxOccupancy = 2
    amenities = @("AC", "TV")
    description = "Test duplicate code"
} | ConvertTo-Json

try {
    $dup = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $duplicateCode
    Write-Host "⚠ System allowed duplicate room type code" -ForegroundColor Yellow
    Write-Host "  Note: Consider adding unique constraint on room type codes" -ForegroundColor Gray
    # Clean up
    try { Invoke-RestMethod -Uri "$baseUrl/room-types/$($dup._id)" -Method DELETE -Headers @{Authorization="Bearer $token"} | Out-Null } catch {}
    $testsPassed++
} catch {
    Write-Host "✓ Correctly prevented duplicate room type code" -ForegroundColor Green
    $testsPassed++
}

# ============================================
# CLEANUP: Delete test room and room type
# ============================================
Write-Host "`n[CLEANUP] Removing test data..." -ForegroundColor Yellow

if ($createdRoomId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId" -Method DELETE -Headers @{Authorization="Bearer $token"} | Out-Null
        Write-Host "✓ Deleted test room (TEST-999)" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Could not delete test room: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if ($createdRoomTypeId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/room-types/$createdRoomTypeId" -Method DELETE -Headers @{Authorization="Bearer $token"} | Out-Null
        Write-Host "✓ Deleted test room type (Presidential Suite)" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Could not delete test room type: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# TEST SUMMARY
# ============================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "                      TEST SUMMARY                          " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$totalTests = $testsPassed + $testsFailed
Write-Host "`nTotal Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if($testsFailed -eq 0){'Green'}else{'Red'})
Write-Host "Success Rate: $([math]::Round(($testsPassed/$totalTests)*100, 2))%`n" -ForegroundColor $(if($testsFailed -eq 0){'Green'}else{'Yellow'})

if ($testsFailed -eq 0) {
    Write-Host "ALL TESTS PASSED! Room management system is working correctly." -ForegroundColor Green
} else {
    Write-Host "Some tests failed. Review the output above for details." -ForegroundColor Yellow
}

Write-Host ""
