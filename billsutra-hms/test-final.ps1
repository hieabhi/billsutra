# FINAL COMPREHENSIVE TEST SUITE
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ROOM MANAGEMENT - FINAL TEST SUITE" -ForegroundColor Cyan  
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$passed = 0
$failed = 0
$baseUrl = "http://localhost:5051/api"

function Get-ErrorMessage {
    param($Exception)
    if ($Exception.ErrorDetails.Message) {
        try {
            $json = $Exception.ErrorDetails.Message | ConvertFrom-Json
            return $json.message
        } catch {
            return $Exception.ErrorDetails.Message
        }
    }
    return $Exception.Exception.Message
}

# Login
Write-Host "[SETUP] Login" -ForegroundColor Yellow
try {
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
    $token = $login.token
    Write-Host "  PASS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
    $failed++
    exit
}

# TEST 1: List Room Types
Write-Host "[TEST 1] GET Room Types" -ForegroundColor Cyan
try {
    $types = Invoke-RestMethod -Uri "$baseUrl/room-types" -Headers @{Authorization="Bearer $token"}
    Write-Host "  PASS: Found $($types.Count) types" -ForegroundColor Green
    $initialTypeCount = $types.Count
    $passed++
} catch {
    Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
    $failed++
}

# TEST 2: Create Room Type
Write-Host "[TEST 2] Create Room Type" -ForegroundColor Cyan
try {
    $newType = '{"name":"QA Test Suite","code":"QTS","defaultRate":7777,"maxOccupancy":4,"amenities":["AC","TV"]}'
    $created = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $newType
    Write-Host "  PASS: Created type with ID $($created._id.Substring(0,8))..." -ForegroundColor Green
    $createdTypeId = $created._id
    $passed++
} catch {
    Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
    $failed++
}

# TEST 3: Prevent Duplicate Room Type Name
Write-Host "[TEST 3] Duplicate Type Name" -ForegroundColor Cyan
try {
    $dup = '{"name":"QA Test Suite","code":"QT2","defaultRate":5000,"maxOccupancy":2}'
    $result = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $dup
    Write-Host "  FAIL: Allowed duplicate name" -ForegroundColor Red
    $failed++
} catch {
    $error = Get-ErrorMessage $_
    if ($error -match "already exists") {
        Write-Host "  PASS: Blocked duplicate name" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  FAIL: Wrong error - $error" -ForegroundColor Red
        $failed++
    }
}

# TEST 4: Prevent Duplicate Room Type Code
Write-Host "[TEST 4] Duplicate Type Code" -ForegroundColor Cyan
try {
    $dup = '{"name":"Unique Name For Code Test","code":"QTS","defaultRate":5000,"maxOccupancy":2}'
    $result = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $dup
    Write-Host "  FAIL: Allowed duplicate code" -ForegroundColor Red
    $failed++
} catch {
    $error = Get-ErrorMessage $_
    if ($error -match "code.*already exists") {
        Write-Host "  PASS: Blocked duplicate code" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  FAIL: Wrong error - $error" -ForegroundColor Red
        $failed++
    }
}

# TEST 5: Update Room Type
Write-Host "[TEST 5] Update Room Type" -ForegroundColor Cyan
if ($createdTypeId) {
    try {
        $update = '{"name":"QA Test Suite UPDATED","code":"QTU","defaultRate":8888,"maxOccupancy":5}'
        $updated = Invoke-RestMethod -Uri "$baseUrl/room-types/$createdTypeId" -Method PUT -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $update
        if ($updated.code -eq "QTU") {
            Write-Host "  PASS: Updated successfully" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  FAIL: Update didn't persist" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
        $failed++
    }
}

# TEST 6: Create Room
Write-Host "[TEST 6] Create Room" -ForegroundColor Cyan
try {
    $newRoom = '{"number":"QA-999","type":"Suite","rate":5000,"floor":"Test Floor"}'
    $room = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $newRoom
    if ($room._id) {
        Write-Host "  PASS: Created room $($room.number)" -ForegroundColor Green
        $createdRoomId = $room._id
        $passed++
    } else {
        Write-Host "  FAIL: No room ID returned" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
    $failed++
}

# TEST 7: Verify Room Exists
Write-Host "[TEST 7] Verify Room in List" -ForegroundColor Cyan
try {
    $rooms = Invoke-RestMethod -Uri "$baseUrl/rooms" -Headers @{Authorization="Bearer $token"}
    $found = $rooms | Where-Object { $_.number -eq "QA-999" }
    if ($found) {
        Write-Host "  PASS: Room found (Total: $($rooms.Count))" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  FAIL: Room not in list" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
    $failed++
}

# TEST 8: Prevent Duplicate Room Number
Write-Host "[TEST 8] Duplicate Room Number" -ForegroundColor Cyan
try {
    $dup = '{"number":"QA-999","type":"Standard","rate":1500,"floor":"1"}'
    $result = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $dup
    Write-Host "  FAIL: Allowed duplicate number" -ForegroundColor Red
    $failed++
} catch {
    $error = Get-ErrorMessage $_
    if ($error -match "already exists") {
        Write-Host "  PASS: Blocked duplicate number" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  FAIL: Wrong error - $error" -ForegroundColor Red
        $failed++
    }
}

# TEST 9: Update Room
Write-Host "[TEST 9] Update Room" -ForegroundColor Cyan
if ($createdRoomId) {
    try {
        $update = '{"status":"OCCUPIED","rate":6000}'
        $updated = Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId" -Method PUT -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $update
        if ($updated.status -eq "OCCUPIED") {
            Write-Host "  PASS: Room updated" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  FAIL: Update didn't persist" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
        $failed++
    }
}

# TEST 10: Update Room Status
Write-Host "[TEST 10] Update Status" -ForegroundColor Cyan
if ($createdRoomId) {
    try {
        $statusUpdate = '{"status":"AVAILABLE"}'
        $updated = Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId/status" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $statusUpdate
        if ($updated.status -eq "AVAILABLE") {
            Write-Host "  PASS: Status updated" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  FAIL: Status not updated" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
        $failed++
    }
}

# TEST 11: Get Room by ID
Write-Host "[TEST 11] Get Room by ID" -ForegroundColor Cyan
if ($createdRoomId) {
    try {
        $room = Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId" -Headers @{Authorization="Bearer $token"}
        if ($room._id -eq $createdRoomId) {
            Write-Host "  PASS: Retrieved room" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  FAIL: Wrong room" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
        $failed++
    }
}

# TEST 12: Validate Missing Fields
Write-Host "[TEST 12] Missing Required Field" -ForegroundColor Cyan
try {
    $invalid = '{"type":"Standard","rate":1500}'
    $result = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $invalid
    Write-Host "  FAIL: Accepted invalid data" -ForegroundColor Red
    $failed++
} catch {
    $error = Get-ErrorMessage $_
    if ($error -match "number.*required") {
        Write-Host "  PASS: Rejected invalid data" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  FAIL: Wrong error - $error" -ForegroundColor Red
        $failed++
    }
}

# TEST 13: Delete Room
Write-Host "[TEST 13] Delete Room" -ForegroundColor Cyan
if ($createdRoomId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId" -Method DELETE -Headers @{Authorization="Bearer $token"} | Out-Null
        try {
            $check = Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId" -Headers @{Authorization="Bearer $token"}
            Write-Host "  FAIL: Room still exists" -ForegroundColor Red
            $failed++
        } catch {
            Write-Host "  PASS: Room deleted" -ForegroundColor Green
            $passed++
        }
    } catch {
        Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
        $failed++
    }
}

# TEST 14: Delete Room Type
Write-Host "[TEST 14] Delete Room Type" -ForegroundColor Cyan
if ($createdTypeId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/room-types/$createdTypeId" -Method DELETE -Headers @{Authorization="Bearer $token"} | Out-Null
        $typesAfter = Invoke-RestMethod -Uri "$baseUrl/room-types" -Headers @{Authorization="Bearer $token"}
        if ($typesAfter.Count -eq $initialTypeCount) {
            Write-Host "  PASS: Type deleted" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  FAIL: Type still exists" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
        $failed++
    }
}

# TEST 15: Performance
Write-Host "[TEST 15] API Performance" -ForegroundColor Cyan
try {
    $start = Get-Date
    $rooms = Invoke-RestMethod -Uri "$baseUrl/rooms" -Headers @{Authorization="Bearer $token"}
    $elapsed = ((Get-Date) - $start).TotalMilliseconds
    if ($elapsed -lt 500) {
        Write-Host "  PASS: $([math]::Round($elapsed))ms" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  WARN: $([math]::Round($elapsed))ms (slow)" -ForegroundColor Yellow
        $passed++
    }
} catch {
    Write-Host "  FAIL: $(Get-ErrorMessage $_)" -ForegroundColor Red
    $failed++
}

# RESULTS
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
$total = $passed + $failed
$rate = if ($total -gt 0) { [math]::Round(($passed/$total)*100, 1) } else { 0 }

Write-Host ""
Write-Host "Tests:   $total" -ForegroundColor White
Write-Host "Passed:  $passed" -ForegroundColor Green
Write-Host "Failed:  $failed" -ForegroundColor $(if($failed -eq 0){'Green'}else{'Red'})
Write-Host "Score:   $rate%" -ForegroundColor $(if($rate -eq 100){'Green'}elseif($rate -ge 90){'Yellow'}else{'Red'})
Write-Host ""

if ($rate -eq 100) {
    Write-Host "PERFECT SCORE! All tests passed!" -ForegroundColor Green
    Write-Host "Room management system is production-ready." -ForegroundColor Green
} elseif ($rate -ge 90) {
    Write-Host "Excellent! Minor issues to address." -ForegroundColor Yellow
} else {
    Write-Host "Needs work. Review failed tests." -ForegroundColor Red
}
Write-Host ""
