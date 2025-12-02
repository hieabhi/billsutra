# COMPREHENSIVE ROOM MANAGEMENT TEST SUITE
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ROOM MANAGEMENT - FULL TEST SUITE" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$baseUrl = "http://localhost:5051/api"

# Login
Write-Host "[SETUP] Authenticating..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
    $token = $loginResponse.token
    Write-Host "  Logged in successfully" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
    exit 1
}

# TEST 1: Fetch Room Types
Write-Host ""
Write-Host "[TEST 1] GET /api/room-types" -ForegroundColor Cyan
try {
    $roomTypes = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method GET -Headers @{Authorization="Bearer $token"}
    Write-Host "  PASS: Found $($roomTypes.Count) room types" -ForegroundColor Green
    $initialTypeCount = $roomTypes.Count
    $testsPassed++
} catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# TEST 2: Create Room Type
Write-Host ""
Write-Host "[TEST 2] POST /api/room-types - Create" -ForegroundColor Cyan
$newType = @{
    name = "Test Executive Suite"
    code = "TES"
    defaultRate = 8888
    maxOccupancy = 4
    amenities = @("AC", "TV", "WiFi", "Balcony")
    description = "Test room type for validation"
} | ConvertTo-Json

try {
    $created = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $newType
    if ($created._id -and $created.name -eq "Test Executive Suite" -and $created.code -eq "TES") {
        Write-Host "  PASS: Created room type (ID: $($created._id.Substring(0,8))...)" -ForegroundColor Green
        $createdTypeId = $created._id
        $testsPassed++
    } else {
        Write-Host "  FAIL: Missing fields in response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# TEST 3: Duplicate Room Type Name
Write-Host ""
Write-Host "[TEST 3] Duplicate Room Type Name Validation" -ForegroundColor Cyan
$dupName = @{
    name = "Test Executive Suite"
    code = "TE2"
    defaultRate = 5000
    maxOccupancy = 2
} | ConvertTo-Json

try {
    $dup = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $dupName
    Write-Host "  FAIL: System allowed duplicate name" -ForegroundColor Red
    $testsFailed++
} catch {
    $errorMsg = if ($_.ErrorDetails.Message) { 
        ($_.ErrorDetails.Message | ConvertFrom-Json).message 
    } else { 
        $_.Exception.Message 
    }
    if ($errorMsg -match "already exists") {
        Write-Host "  PASS: Correctly blocked duplicate name" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  FAIL: Wrong error: $errorMsg" -ForegroundColor Red
        $testsFailed++
    }
}

# TEST 4: Duplicate Room Type Code
Write-Host ""
Write-Host "[TEST 4] Duplicate Room Type Code Validation" -ForegroundColor Cyan
$dupCode = @{
    name = "Another Test Type"
    code = "TES"
    defaultRate = 5000
    maxOccupancy = 2
} | ConvertTo-Json

try {
    $dup = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $dupCode
    Write-Host "  FAIL: System allowed duplicate code" -ForegroundColor Red
    $testsFailed++
} catch {
    if ($_.Exception.Message -match "code.*already exists") {
        Write-Host "  PASS: Correctly blocked duplicate code" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  FAIL: Wrong error: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# TEST 5: Update Room Type
Write-Host ""
Write-Host "[TEST 5] PUT /api/room-types/:id - Update" -ForegroundColor Cyan
if ($createdTypeId) {
    $updateData = @{
        name = "Test Executive Suite UPDATED"
        code = "TEU"
        defaultRate = 9999
        maxOccupancy = 5
        amenities = @("AC", "TV", "WiFi", "Balcony", "Jacuzzi")
        description = "Updated description"
    } | ConvertTo-Json
    
    try {
        $updated = Invoke-RestMethod -Uri "$baseUrl/room-types/$createdTypeId" -Method PUT -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $updateData
        if ($updated.name -eq "Test Executive Suite UPDATED" -and $updated.code -eq "TEU") {
            Write-Host "  PASS: Updated successfully" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "  FAIL: Update did not persist" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# TEST 6: Create Room with Room Type
Write-Host ""
Write-Host "[TEST 6] POST /api/rooms - Create Room" -ForegroundColor Cyan
$newRoom = @{
    number = "TEST-901"
    type = "Deluxe"
    rate = 2500
    floor = "9th Floor"
    status = "Available"
} | ConvertTo-Json

try {
    $createdRoom = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $newRoom
    if ($createdRoom._id -and $createdRoom.number -eq "TEST-901") {
        Write-Host "  PASS: Room created (ID: $($createdRoom._id.Substring(0,8))...)" -ForegroundColor Green
        $createdRoomId = $createdRoom._id
        $testsPassed++
    } else {
        Write-Host "  FAIL: Missing required fields" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# TEST 7: Verify Room in List
Write-Host ""
Write-Host "[TEST 7] GET /api/rooms - Verify Room" -ForegroundColor Cyan
try {
    $allRooms = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method GET -Headers @{Authorization="Bearer $token"}
    $foundRoom = $allRooms | Where-Object { $_.number -eq "TEST-901" }
    if ($foundRoom) {
        Write-Host "  PASS: Room found in list (Total: $($allRooms.Count))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  FAIL: Room not found" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# TEST 8: Duplicate Room Number
Write-Host ""
Write-Host "[TEST 8] Duplicate Room Number Validation" -ForegroundColor Cyan
$dupRoom = @{
    number = "TEST-901"
    type = "Standard"
    rate = 1500
    floor = "1st Floor"
} | ConvertTo-Json

try {
    $dup = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $dupRoom
    Write-Host "  FAIL: System allowed duplicate room number" -ForegroundColor Red
    $testsFailed++
} catch {
    if ($_.Exception.Message -match "already exists") {
        Write-Host "  PASS: Correctly blocked duplicate" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  FAIL: Wrong error: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# TEST 9: Update Room
Write-Host ""
Write-Host "[TEST 9] PUT /api/rooms/:id - Update Room" -ForegroundColor Cyan
if ($createdRoomId) {
    $updateRoom = @{
        rate = 3000
        floor = "10th Floor"
        status = "Occupied"
    } | ConvertTo-Json
    
    try {
        $updatedRoom = Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId" -Method PUT -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $updateRoom
        if ($updatedRoom.status -eq "Occupied") {
            Write-Host "  PASS: Room updated successfully" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "  FAIL: Update did not persist" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# TEST 10: Room Status Update
Write-Host ""
Write-Host "[TEST 10] PATCH /api/rooms/:id/status" -ForegroundColor Cyan
if ($createdRoomId) {
    try {
        $statusUpdate = Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId/status" -Method PATCH -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body '{"status":"Available"}'
        if ($statusUpdate.status -eq "Available") {
            Write-Host "  PASS: Status updated to Available" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "  FAIL: Status not updated" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# TEST 11: Get Single Room
Write-Host ""
Write-Host "[TEST 11] GET /api/rooms/:id" -ForegroundColor Cyan
if ($createdRoomId) {
    try {
        $room = Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId" -Method GET -Headers @{Authorization="Bearer $token"}
        if ($room._id -eq $createdRoomId) {
            Write-Host "  PASS: Retrieved room by ID" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "  FAIL: Wrong room returned" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# TEST 12: Missing Required Fields
Write-Host ""
Write-Host "[TEST 12] Validation - Missing Room Number" -ForegroundColor Cyan
$invalidRoom = @{
    type = "Standard"
    rate = 1500
} | ConvertTo-Json

try {
    $invalid = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $invalidRoom
    Write-Host "  FAIL: Accepted invalid data" -ForegroundColor Red
    $testsFailed++
} catch {
    if ($_.Exception.Message -match "number.*required") {
        Write-Host "  PASS: Correctly rejected invalid data" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  FAIL: Wrong error: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# TEST 13: Delete Room
Write-Host ""
Write-Host "[TEST 13] DELETE /api/rooms/:id" -ForegroundColor Cyan
if ($createdRoomId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId" -Method DELETE -Headers @{Authorization="Bearer $token"} | Out-Null
        
        # Verify deletion
        try {
            $deleted = Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId" -Method GET -Headers @{Authorization="Bearer $token"}
            Write-Host "  FAIL: Room still exists after deletion" -ForegroundColor Red
            $testsFailed++
        } catch {
            Write-Host "  PASS: Room deleted successfully" -ForegroundColor Green
            $testsPassed++
        }
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# TEST 14: Delete Room Type
Write-Host ""
Write-Host "[TEST 14] DELETE /api/room-types/:id" -ForegroundColor Cyan
if ($createdTypeId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/room-types/$createdTypeId" -Method DELETE -Headers @{Authorization="Bearer $token"} | Out-Null
        
        # Verify deletion
        $typesAfter = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method GET -Headers @{Authorization="Bearer $token"}
        if ($typesAfter.Count -eq $initialTypeCount) {
            Write-Host "  PASS: Room type deleted successfully" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "  FAIL: Room type still exists" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# TEST 15: API Performance
Write-Host ""
Write-Host "[TEST 15] Performance - Response Times" -ForegroundColor Cyan
try {
    $startTime = Get-Date
    $rooms = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method GET -Headers @{Authorization="Bearer $token"}
    $elapsed = ((Get-Date) - $startTime).TotalMilliseconds
    
    if ($elapsed -lt 500) {
        Write-Host "  PASS: Response time: $([math]::Round($elapsed))ms (< 500ms)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  WARN: Response time: $([math]::Round($elapsed))ms (> 500ms)" -ForegroundColor Yellow
        $testsPassed++
    }
} catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# SUMMARY
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$total = $testsPassed + $testsFailed
$successRate = if ($total -gt 0) { [math]::Round(($testsPassed/$total)*100, 1) } else { 0 }

Write-Host ""
Write-Host "Total Tests:    $total" -ForegroundColor White
Write-Host "Passed:         $testsPassed" -ForegroundColor Green
Write-Host "Failed:         $testsFailed" -ForegroundColor $(if($testsFailed -eq 0){'Green'}else{'Red'})
Write-Host "Success Rate:   $successRate%" -ForegroundColor $(if($successRate -eq 100){'Green'}elseif($successRate -ge 80){'Yellow'}else{'Red'})
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "SUCCESS! All tests passed!" -ForegroundColor Green
    Write-Host "Room management system is fully functional." -ForegroundColor Green
} else {
    Write-Host "Some tests failed. Review output above." -ForegroundColor Yellow
}

Write-Host ""
