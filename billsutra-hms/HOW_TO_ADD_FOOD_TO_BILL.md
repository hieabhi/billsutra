# 📝 HOW TO ADD FOOD TO GUEST BILL

**Guest**: Tanvi  
**Room**: 302  
**Reservation**: RES00074  
**Status**: Checked In ✅

---

## ✅ 3 WAYS TO ADD FOOD TO HER BILL

### **METHOD 1: Using the Website (EASIEST)** 🌐

1. **Open the website**: http://localhost:5173

2. **Login**:
   - Username: `admin`
   - Password: `admin123`

3. **Go to Bookings**:
   - Click **"Bookings"** in the menu
   - Search for **"Tanvi"** or **"302"** or **"RES00074"**

4. **Open Folio**:
   - Find her booking in the list
   - Click the **"Folio"** button

5. **Add Food Charge**:
   - In the Folio modal, go to **"Charges"** tab
   - Click **"Add Charge"** button
   - Fill in the form:
     - **Category**: Food & Beverage
     - **Description**: "Lunch - Veg Thali" (or whatever she ordered)
     - **Quantity**: 1
     - **Rate**: 450 (or actual price)
     - **Tax Rate**: 5 (for food it's usually 5%)
     - **Remarks**: "Room service - Room 302"
   - Click **"Post Charge"**

6. **Done!** ✅
   - Food automatically added to her bill
   - GST calculated automatically (CGST + SGST)
   - Balance updated immediately
   - She can see it when checking out

---

### **METHOD 2: Using PowerShell Command** 💻

Run this command (replace the amount and description):

```powershell
# Login
$login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'

# Add food charge to Tanvi's bill
$headers = @{"Authorization"="Bearer $($login.token)"; "Content-Type"="application/json"}
$bookingId = "797e8055-5f09-4e29-a852-1ae361e73274"

$foodCharge = @{
    category = "FOOD_BEVERAGE"
    description = "Lunch - Veg Thali"  # Change this
    quantity = 1                        # Change quantity
    rate = 450                          # Change price
    taxRate = 5                         # 5% GST for food
    remarks = "Room service"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/$bookingId/folio/lines" -Method POST -Headers $headers -Body $foodCharge
```

---

### **METHOD 3: Quick Add Script** 📋

Save this as `add-food-tanvi.ps1`:

```powershell
# Quick script to add food to Tanvi's bill

# LOGIN
$login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$headers = @{"Authorization"="Bearer $($login.token)"; "Content-Type"="application/json"}
$bookingId = "797e8055-5f09-4e29-a852-1ae361e73274"

# WHAT DID SHE ORDER?
Write-Host "`nWhat food did Tanvi order?" -ForegroundColor Cyan
$description = Read-Host "Food item (e.g., Lunch Thali)"
$amount = Read-Host "Price (e.g., 450)"

# ADD TO BILL
$charge = @{
    category = "FOOD_BEVERAGE"
    description = $description
    quantity = 1
    rate = [int]$amount
    taxRate = 5
    remarks = "Room 302 - Room service"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/$bookingId/folio/lines" -Method POST -Headers $headers -Body $charge

Write-Host "`nSUCCESS! Added to bill:" -ForegroundColor Green
Write-Host "$description - Rs.$($result.line.totalAmount) (including GST)" -ForegroundColor White
```

Then just run: `.\add-food-tanvi.ps1`

---

## 📊 SAMPLE FOOD ITEMS & PRICES

Common items you can add:

| Item | Price | GST | Total |
|------|-------|-----|-------|
| Breakfast Buffet | Rs.350 | 5% | Rs.367.50 |
| Lunch Thali | Rs.450 | 5% | Rs.472.50 |
| Dinner Set | Rs.600 | 5% | Rs.630.00 |
| Sandwich & Coffee | Rs.200 | 5% | Rs.210.00 |
| Pizza | Rs.400 | 5% | Rs.420.00 |
| Chinese Combo | Rs.500 | 5% | Rs.525.00 |

---

## ✅ WHAT HAPPENS AFTER ADDING

1. **Charge Posted**: Food item added to her folio
2. **GST Calculated**: Automatically splits into CGST (2.5%) + SGST (2.5%)
3. **Balance Updated**: Her total bill increases
4. **Invoice Ready**: Shows up in her checkout invoice
5. **Itemized**: She sees exactly what she ordered

---

## 📱 CURRENT STATUS (After Adding Sample Food)

**Tanvi's Bill**:
- Room: 302
- Previous Balance: Rs.1,000 (room + previous charges)
- **NEW**: Lunch Order - Rs.472.50
- **Updated Total**: Rs.1,472.50
- **Balance Due**: Rs.672.50 (after advance payment)

---

## 🎯 RECOMMENDED: Use the Website

**Easiest way**:
1. Open http://localhost:5173
2. Login → Bookings → Find Tanvi
3. Click "Folio" → "Add Charge"
4. Enter food details → Post

**Takes only 30 seconds!** ⚡

---

## 💡 TIPS

- **Food GST**: Usually 5% (CGST 2.5% + SGST 2.5%)
- **Beverages**: Also 5% GST
- **Restaurant in hotel**: Use 5% GST
- **Alcohol**: Higher GST (18% or 28%)

**Category Options**:
- `FOOD_BEVERAGE` - For food/drinks
- `ROOM_SERVICE` - For delivery charges
- `MINIBAR` - For minibar items (12% GST)
- `LAUNDRY` - If she ordered laundry (18% GST)
- `SPA` - If she used spa (18% GST)

---

## ❓ FAQ

**Q: Can I add multiple items at once?**  
A: Yes! Just add each item separately using "Add Charge" button.

**Q: What if I entered wrong amount?**  
A: Currently you'd need to delete/edit through the folio interface.

**Q: Will she see this on checkout?**  
A: Yes! Everything is itemized in her final invoice.

**Q: Does it calculate tax automatically?**  
A: Yes! Just enter the base amount, system adds GST.

---

## ✅ VERIFICATION

To check if food was added successfully:

```powershell
$login = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$booking = Invoke-RestMethod -Uri "http://localhost:5051/api/bookings/797e8055-5f09-4e29-a852-1ae361e73274" -Headers @{"Authorization"="Bearer $($login.token)"}

Write-Host "Tanvi's Folio Charges:" -ForegroundColor Cyan
$booking.folio.lines | ForEach-Object {
    Write-Host "- $($_.description): Rs.$($_.totalAmount)" -ForegroundColor White
}
Write-Host "`nTotal Bill: Rs.$($booking.folio.total)" -ForegroundColor Yellow
```

---

**SUMMARY**: Use the website (Method 1) - it's the easiest and fastest way! 🎉
