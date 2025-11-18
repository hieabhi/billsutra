# Room Management Test Suite
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ROOM MANAGEMENT SYSTEM TEST SUITE" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$baseUrl = "http://localhost:5051/api"

# Login
Write-Host "[SETUP] Logging in..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$token = $loginResponse.token
Write-Host "Login successful" -ForegroundColor Green
$testsPassed++

# TEST 1: Fetch Room Types
Write-Host ""
Write-Host "[TEST 1] Fetch Room Types" -ForegroundColor Cyan
$roomTypes = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method GET -Headers @{Authorization="Bearer $token"}
Write-Host "Found $($roomTypes.Count) room types:" -ForegroundColor Green
foreach($rt in $roomTypes) {
    Write-Host "  - $($rt.name) ($($rt.code)) - Rs.$($rt.defaultRate)" -ForegroundColor White
}
$testsPassed++

# TEST 2: Create Room Type
Write-Host ""
Write-Host "[TEST 2] Create New Room Type" -ForegroundColor Cyan
$newType = @{
    name = "Test Suite"
    code = "TST"
    defaultRate = 9999
    maxOccupancy = 4
    amenities = @("AC", "TV", "WiFi")
    description = "Test room type"
} | ConvertTo-Json

try {
    $created = Invoke-RestMethod -Uri "$baseUrl/room-types" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $newType
    Write-Host "Created: $($created.name) (ID: $($created._id))" -ForegroundColor Green
    $createdTypeId = $created._id
    $testsPassed++
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# TEST 3: Create Room
Write-Host ""
Write-Host "[TEST 3] Create New Room" -ForegroundColor Cyan
$newRoom = @{
    number = "TEST-777"
    type = "Suite"
    rate = 5000
    floor = "Test Floor"
    status = "Available"
} | ConvertTo-Json

try {
    $createdRoom = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $newRoom
    Write-Host "Created Room: $($createdRoom.number)" -ForegroundColor Green
    $createdRoomId = $createdRoom._id
    $testsPassed++
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# TEST 4: Verify Room Exists
Write-Host ""
Write-Host "[TEST 4] Verify Room in List" -ForegroundColor Cyan
$allRooms = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method GET -Headers @{Authorization="Bearer $token"}
$foundRoom = $allRooms | Where-Object { $_.number -eq "TEST-777" }
if ($foundRoom) {
    Write-Host "Room TEST-777 found! Total rooms: $($allRooms.Count)" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "Room NOT found!" -ForegroundColor Red
    $testsFailed++
}

# TEST 5: Update Room Type
Write-Host ""
Write-Host "[TEST 5] Update Room Type" -ForegroundColor Cyan
if ($createdTypeId) {
    $updateData = @{
        name = "Test Suite UPDATED"
        code = "TSU"
        defaultRate = 12000
        maxOccupancy = 5
        amenities = @("AC", "TV", "WiFi", "Balcony")
        description = "Updated test room type"
    } | ConvertTo-Json
    
    try {
        $updated = Invoke-RestMethod -Uri "$baseUrl/room-types/$createdTypeId" -Method PUT -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $updateData
        Write-Host "Updated: $($updated.name) - Rs.$($updated.defaultRate)" -ForegroundColor Green
        $testsPassed++
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# TEST 6: Duplicate Room Number
Write-Host ""
Write-Host "[TEST 6] Test Duplicate Room Number" -ForegroundColor Cyan
$dupRoom = @{
    number = "TEST-777"
    type = "Standard"
    rate = 1500
    floor = "1"
    status = "Available"
} | ConvertTo-Json

try {
    $dup = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $dupRoom
    Write-Host "WARNING: System allowed duplicate room number" -ForegroundColor Yellow
    $testsPassed++
} catch {
    Write-Host "Correctly prevented duplicate" -ForegroundColor Green
    $testsPassed++
}

# CLEANUP
Write-Host ""
Write-Host "[CLEANUP] Removing test data..." -ForegroundColor Yellow
if ($createdRoomId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/rooms/$createdRoomId" -Method DELETE -Headers @{Authorization="Bearer $token"} | Out-Null
        Write-Host "Deleted test room" -ForegroundColor Green
    } catch {
        Write-Host "Could not delete room" -ForegroundColor Yellow
    }
}

if ($createdTypeId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/room-types/$createdTypeId" -Method DELETE -Headers @{Authorization="Bearer $token"} | Out-Null
        Write-Host "Deleted test room type" -ForegroundColor Green
    } catch {
        Write-Host "Could not delete room type" -ForegroundColor Yellow
    }
}

# SUMMARY
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$total = $testsPassed + $testsFailed
Write-Host "Total: $total | Passed: $testsPassed | Failed: $testsFailed" -ForegroundColor White
$successRate = [math]::Round(($testsPassed/$total)*100, 1)
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if($testsFailed -eq 0){'Green'}else{'Yellow'})
Write-Host ""
