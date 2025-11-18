# 📄 Invoice & Checkout Guide

## How the Invoice System Works

### Understanding Guest Invoices

The **Guest Folio Invoice** is displayed in the **Summary tab** of the Folio modal. This is the complete, print-ready invoice that shows:

✅ **All Charges**:
- Room charges (nights × rate)
- Food & Beverage orders
- Laundry services
- Minibar items
- Transport/Airport pickup
- Any other additional charges

✅ **Complete Tax Breakdown**:
- CGST (Central GST)
- SGST (State GST)
- IGST (Integrated GST - if applicable)
- Subtotal before tax
- Grand total with taxes

✅ **Payment Summary**:
- Advance payment (if any)
- All payments received (Cash, UPI, Card, etc.)
- Total paid
- Balance due or refund amount

---

## 🖨️ How to View & Print Invoice

### Method 1: Using the Folio Modal (Recommended)

1. **Open Bookings Page**
   - Go to http://localhost:5173 → Click "Bookings"

2. **Find the Guest**
   - Search for guest by name, room number, or reservation number
   - Works for both checked-in and departed guests

3. **Open Folio**
   - Click the **"Folio"** button next to the guest's name

4. **View Invoice**
   - Click the **"📊 Summary"** tab
   - This shows the complete invoice with all charges

5. **Print Invoice**
   - Click the **"🖨️ Print Invoice"** button at the top
   - OR press `Ctrl+P` (Windows) or `Cmd+P` (Mac)
   - Choose your printer or "Save as PDF"
   - Click Print

---

## 📋 Where to Find Departed Guests

### The "Departed" Section

1. **Go to Bookings Page**
   - http://localhost:5173 → Bookings

2. **Click "✈️ Departed" Tab**
   - Shows all checked-out guests
   - Displays reservation number, guest name, dates, room, and amount

3. **Access Invoice**
   - Click **"Folio"** button
   - Go to **"Summary"** tab
   - Print or save the invoice

**Note**: Previously labeled "Past", now renamed to "Departed" for clarity.

---

## 🔍 Troubleshooting

### Issue: Food charges not showing in invoice

**Solution**: Make sure you're viewing the **Summary tab** in the Folio modal, not a separate invoice window.

**Steps to verify**:
1. Click "Folio" button for the guest
2. Click "📊 Summary" tab (third tab)
3. Scroll down - you should see:
   - 🛏️ Room Charges
   - 🍽️ Food & Beverage (if ordered)
   - Other charge categories
   - GST Breakdown
   - Payments
   - Balance

### Issue: Departed section is empty

**Check these**:
1. **Status**: Departed guests have status `CheckedOut`
2. **Tab**: Click on "✈️ Departed" tab (not "All Bookings")
3. **Date**: Filter may be hiding old bookings
4. **Data**: Check if guests were actually checked out (not just checked in)

### Issue: Cannot print invoice

**Solutions**:
1. **Use the Print Button**: Click "🖨️ Print Invoice" in Summary tab
2. **Browser Print**: Press `Ctrl+P` or `Cmd+P`
3. **Check Browser**: Ensure pop-ups are not blocked
4. **PDF Option**: Choose "Save as PDF" instead of printer

---

## 💡 Best Practices

### At Check-in
1. ✅ Record advance payment immediately
2. ✅ Verify room charges are correct
3. ✅ Inform guest about check-out time

### During Stay
1. ✅ Add charges as they occur (food, minibar, etc.)
2. ✅ Record any additional payments
3. ✅ Keep folio up to date

### At Check-out
1. ✅ Open Folio → Summary tab
2. ✅ Review all charges with guest
3. ✅ Collect balance due (if any)
4. ✅ Record final payment
5. ✅ Print/email invoice to guest
6. ✅ Click "Check-out" button
7. ✅ Guest moves to "Departed" section automatically

### After Check-out
1. ✅ Invoice is still accessible in "Departed" section
2. ✅ Can reprint invoice anytime
3. ✅ Room automatically marked for housekeeping
4. ✅ Room becomes available after cleaning

---

## 🎯 Quick Reference

| Action | Location | Button |
|--------|----------|--------|
| Add food to bill | Folio → Charges tab | "Add Charge" |
| Record payment | Folio → Payments tab | "Add Payment" |
| View complete invoice | Folio → Summary tab | - |
| Print invoice | Summary tab | "🖨️ Print Invoice" |
| Check out guest | Bookings list | "Check-out" |
| Find departed guests | Bookings page | "✈️ Departed" tab |

---

## 📊 Invoice Sample Structure

```
Guest Folio Invoice
─────────────────────────────────────

GUEST INFORMATION
Name: Mr. Rajesh Kumar
Room: 302
Reservation: RES00074
Check-in: 14-Nov-2025
Check-out: 15-Nov-2025
Nights: 1

CHARGES
─────────────────────────────────────
🛏️ Room Charges
  Room 302 × 1 night @ ₹1,000/night
  ₹1,000.00

🍽️ Food & Beverage
  Lunch Thali (1 × ₹450)
  ₹472.50
  
  Paneer Masala (1 × ₹202)
  ₹212.39

─────────────────────────────────────
Subtotal (before tax): ₹1,652.00

📊 GST Breakdown
  CGST: ₹16.44
  SGST: ₹16.44

─────────────────────────────────────
GRAND TOTAL: ₹1,684.89

💰 Payments Received
  Advance Payment (Cash): ₹1,500.00
  
  Total Paid: ₹1,500.00

─────────────────────────────────────
BALANCE DUE: ₹184.89
─────────────────────────────────────
```

---

## 🔐 Security Notes

- Only authenticated users can access invoices
- Departed guest data is preserved indefinitely
- All transactions are logged with timestamps
- Balance calculations are automatic and accurate

---

## 🆘 Support

If you encounter any issues:

1. **Check browser console** (F12) for errors
2. **Verify server is running** (http://localhost:5051)
3. **Refresh the page** and try again
4. **Check network connectivity**

For technical support, provide:
- Guest name and reservation number
- What you were trying to do
- Any error messages shown
- Screenshot if possible

---

**Last Updated**: November 15, 2025  
**System Version**: BillSutra v1.0  
**Status**: Production Ready ✅
