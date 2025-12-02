# Sample Data for Testing

Use this sample data to quickly test the application.

## Sample Hotel Settings

**Hotel Name:** Grand Plaza Hotel  
**Address:** 123 MG Road, Bangalore, Karnataka - 560001  
**Phone:** +91 80 1234 5678  
**Email:** billing@grandplaza.com  
**GST Number:** 29ABCDE1234F1Z5  
**Invoice Prefix:** GPH

**Bank Details:**
- Bank Name: State Bank of India
- Account Number: 12345678901234
- IFSC Code: SBIN0001234
- Branch: MG Road, Bangalore

**Terms & Conditions:**
```
1. All disputes subject to Bangalore jurisdiction only.
2. Goods once sold cannot be returned or exchanged.
3. Payment is due within 30 days.
4. E&OE - Errors and Omissions Excepted
```

## Sample Menu Items

### Food Items
| Name | Category | HSN | Rate | CGST% | SGST% | IGST% |
|------|----------|-----|------|-------|-------|-------|
| Butter Chicken | Food | 9963 | 450 | 2.5 | 2.5 | 0 |
| Paneer Tikka | Food | 9963 | 350 | 2.5 | 2.5 | 0 |
| Dal Makhani | Food | 9963 | 250 | 2.5 | 2.5 | 0 |
| Biryani (Veg) | Food | 9963 | 300 | 2.5 | 2.5 | 0 |
| Biryani (Chicken) | Food | 9963 | 400 | 2.5 | 2.5 | 0 |
| Masala Dosa | Food | 9963 | 150 | 2.5 | 2.5 | 0 |
| Idli Sambar | Food | 9963 | 100 | 2.5 | 2.5 | 0 |
| Naan | Food | 9963 | 50 | 2.5 | 2.5 | 0 |

### Beverages
| Name | Category | HSN | Rate | CGST% | SGST% | IGST% |
|------|----------|-----|------|-------|-------|-------|
| Fresh Lime Soda | Beverage | 2202 | 80 | 2.5 | 2.5 | 0 |
| Mango Lassi | Beverage | 2202 | 120 | 2.5 | 2.5 | 0 |
| Coffee (Filter) | Beverage | 2202 | 60 | 2.5 | 2.5 | 0 |
| Tea | Beverage | 2202 | 40 | 2.5 | 2.5 | 0 |
| Soft Drink | Beverage | 2202 | 50 | 6 | 6 | 0 |
| Mineral Water | Beverage | 2202 | 30 | 6 | 6 | 0 |

### Room Service
| Name | Category | HSN | Rate | CGST% | SGST% | IGST% |
|------|----------|-----|------|-------|-------|-------|
| Deluxe Room (per night) | Accommodation | 9963 | 3500 | 6 | 6 | 0 |
| Suite Room (per night) | Accommodation | 9963 | 6000 | 6 | 6 | 0 |
| Laundry Service | Room Service | 9996 | 200 | 9 | 9 | 0 |
| Room Service Charge | Room Service | 9963 | 100 | 2.5 | 2.5 | 0 |

## Sample Customers

### Walk-in Customers
| Name | Phone | Email | Type |
|------|-------|-------|------|
| Rajesh Kumar | +91 98765 43210 | rajesh@email.com | Walk-in |
| Priya Sharma | +91 98765 43211 | priya@email.com | Walk-in |
| Amit Patel | +91 98765 43212 | amit@email.com | Walk-in |

### Regular Customers
| Name | Phone | Email | Address | Type |
|------|-------|-------|---------|------|
| Sunita Desai | +91 98765 43213 | sunita@email.com | 456 Park Street, Mumbai | Regular |
| Vikram Singh | +91 98765 43214 | vikram@email.com | 789 Lake View, Delhi | Regular |

### Corporate Customers
| Name | Phone | Email | Address | GST Number | Type |
|------|-------|-------|---------|------------|------|
| Tech Solutions Pvt Ltd | +91 80 2345 6789 | billing@techsolutions.com | IT Park, Whitefield, Bangalore | 29ABCDE1234F2Z5 | Corporate |
| Global Enterprises | +91 80 3456 7890 | accounts@global.com | MG Road, Bangalore | 29FGHIJ5678K3Z5 | Corporate |

## Sample Bills to Create

### Bill 1: Simple Breakfast
**Customer:** Rajesh Kumar  
**Items:**
- Idli Sambar x2 = ₹200
- Coffee (Filter) x2 = ₹120
- **Total:** ₹320 + GST (5%) = ₹336

### Bill 2: Lunch Order
**Customer:** Tech Solutions Pvt Ltd  
**Items:**
- Butter Chicken x3 = ₹1350
- Dal Makhani x2 = ₹500
- Naan x6 = ₹300
- Soft Drink x4 = ₹200
- **Total:** ₹2350 + GST = ₹2,467.50

### Bill 3: Room Booking with Meals
**Customer:** Sunita Desai  
**Items:**
- Deluxe Room (per night) x1 = ₹3500
- Biryani (Veg) x1 = ₹300
- Mango Lassi x1 = ₹120
- Room Service Charge x1 = ₹100
- **Total:** ₹4020 + GST = ₹4,501.20

## Testing Scenarios

### Scenario 1: Basic Bill Creation
1. Add a few items from menu
2. Select walk-in customer
3. Create bill and verify GST calculations
4. Print invoice

### Scenario 2: Corporate Billing
1. Add corporate customer with GST number
2. Create bill with multiple items
3. Verify GST number appears on invoice
4. Test PDF generation

### Scenario 3: Reports Testing
1. Create 5-10 bills over different dates
2. Go to Reports page
3. Filter by date range
4. Export to CSV
5. Verify totals match

### Scenario 4: Settings Update
1. Update hotel information
2. Add bank details
3. Set custom terms
4. Create new bill and verify details appear on invoice

## Quick Test Data Entry

Copy-paste these for quick testing:

**Hotel Name:** Grand Plaza Hotel  
**Address:** 123 MG Road, Bangalore, Karnataka - 560001  
**Phone:** +91 80 1234 5678  
**Email:** billing@grandplaza.com  
**GST:** 29ABCDE1234F1Z5

**Customer Name:** Rajesh Kumar  
**Phone:** +91 98765 43210  
**Email:** rajesh@email.com

**Item:** Butter Chicken  
**Category:** Food  
**HSN:** 9963  
**Rate:** 450  
**CGST:** 2.5  
**SGST:** 2.5

---

**Happy Testing! 🎉**

Use this sample data to explore all features of BillSutra.
