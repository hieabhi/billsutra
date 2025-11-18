# 🏨 World-Class Hotel Billing System - Design Document

## Industry Research & Standards

### Top Hotel Management Systems Analyzed
1. **Opera PMS** (Oracle) - Global leader, 40,000+ properties
2. **Mews** - Modern cloud-based, used across 85+ countries
3. **Cloudbeds** - 22,000+ properties worldwide
4. **eZee Absolute** - Popular in India, 8,000+ properties
5. **Hotelogix** - Cloud-based, 4,000+ properties globally

---

## Core Features (Industry Standard)

### 1. **Guest Folio Management** ⭐⭐⭐⭐⭐
**What it is**: A detailed account statement for each guest showing all charges and payments

**Components**:
- **Room Charges**: Auto-posted nightly at configured time (usually midnight)
- **F&B Charges**: Food & Beverage from restaurant/room service
- **Additional Services**: Laundry, spa, minibar, airport transfer, etc.
- **Taxes**: GST breakdown (CGST, SGST, IGST) per item
- **Payments**: All payments received with method and timestamp
- **Adjustments**: Discounts, refunds, corrections
- **Balance**: Running balance showing what guest owes

**Industry Standard Features**:
- ✅ Real-time balance updates
- ✅ Multiple folios per booking (split bills)
- ✅ Transfer charges between folios
- ✅ Itemized tax calculation
- ✅ Advance payment tracking
- ✅ Credit limit warnings

---

### 2. **Point of Sale (POS) Integration** ⭐⭐⭐⭐⭐
**What it is**: Ability to post charges from restaurant, bar, spa, etc. to guest room

**Workflow**:
1. Guest orders food in restaurant
2. Staff asks for room number
3. Charges posted directly to guest folio
4. Guest pays everything at checkout

**Categories**:
- 🍽️ **Food & Beverage**: Meals, drinks, room service
- 🧺 **Laundry**: Washing, dry cleaning, ironing
- 💆 **Spa & Wellness**: Massages, treatments
- 🚗 **Transport**: Airport pickup, taxi, car rental
- 📞 **Telecom**: STD/ISD calls, internet (legacy)
- 🍺 **Minibar**: Beverages, snacks consumed from room
- 🎉 **Banquet**: Event charges, conference room
- 🛠️ **Miscellaneous**: Late checkout, pet fees, parking

---

### 3. **Advance Payment Handling** ⭐⭐⭐⭐⭐
**What it is**: Money paid before/at check-in, adjusted during checkout

**Types**:
- **Booking Deposit**: Paid when confirming reservation
- **Check-in Advance**: Paid at check-in to cover stay
- **Security Deposit**: Refundable deposit for incidentals

**Display**:
```
Room Charges:           ₹ 12,000
Food & Beverage:        ₹  3,500
Other Services:         ₹  1,200
─────────────────────────────────
Subtotal:              ₹ 16,700
CGST @6%:              ₹  1,002
SGST @6%:              ₹  1,002
─────────────────────────────────
GRAND TOTAL:           ₹ 18,704

Advance Paid:          ₹  5,000 ✅
Cash Paid:             ₹ 10,000 ✅
─────────────────────────────────
BALANCE DUE:           ₹  3,704 ❗
```

---

### 4. **Multi-Payment Methods** ⭐⭐⭐⭐⭐
**Supported Methods**:
- 💵 Cash
- 💳 Credit/Debit Card (Visa, Mastercard, Amex)
- 📱 UPI (GPay, PhonePe, Paytm)
- 🏦 Bank Transfer/NEFT/RTGS
- 🌐 Online Payment Gateway
- 📝 Cheque
- 🏢 Company Account (Direct Billing)
- ⭐ Loyalty Points Redemption

**Split Payments**: Guest can pay using multiple methods
Example: ₹ 10,000 Cash + ₹ 5,000 UPI + ₹ 3,704 Card

---

### 5. **Automated Room Charge Posting** ⭐⭐⭐⭐
**What it is**: System automatically posts room rent to folio every night

**Process**:
1. **Night Audit** runs at midnight
2. For each occupied room:
   - Post room charge (Rate Plan amount)
   - Apply any discounts
   - Calculate taxes
   - Update folio balance
3. Generate daily revenue report

**Benefits**:
- No manual posting required
- Accurate billing
- Real-time balance tracking

---

### 6. **GST Calculation & Compliance** ⭐⭐⭐⭐⭐
**Indian GST Rules for Hotels**:
- Room Rent < ₹1,000: 0% GST
- Room Rent ₹1,000-2,499: 12% GST
- Room Rent ₹2,500-7,499: 18% GST
- Room Rent ≥ ₹7,500: 28% GST

**For other services**:
- Food & Non-AC Restaurant: 5% GST
- Food & AC Restaurant: 5% GST (if non-liquor)
- Alcoholic Beverages: 18% GST
- Laundry: 18% GST
- Other Services: 18% GST

**CGST + SGST** (Same State): Split 50-50
**IGST** (Different State): Full amount

**Compliance**:
- ✅ HSN/SAC Codes
- ✅ GSTIN on invoice
- ✅ Tax breakup clearly shown
- ✅ Summary for filing returns

---

### 7. **Checkout Process** ⭐⭐⭐⭐⭐
**World-Class Checkout Flow**:

**Step 1: Folio Review**
- Display complete itemized statement
- Show all charges by category
- Display all payments
- Calculate final balance

**Step 2: Settlement**
- If balance > 0: Collect payment
- If balance < 0: Process refund
- Support split payments
- Apply last-minute discounts if needed

**Step 3: Bill Generation**
- Generate professional invoice
- Include all legal requirements (GSTIN, HSN, etc.)
- Email to guest
- Print copy for guest
- Print copy for accounts

**Step 4: Completion**
- Mark booking as CHECKED_OUT
- Update room status to DIRTY
- Generate housekeeping task
- Archive folio
- Update statistics

---

### 8. **Invoice/Bill Template** ⭐⭐⭐⭐⭐
**Professional Bill Components**:

```
┌─────────────────────────────────────────┐
│           HOTEL NAME & LOGO             │
│         Complete Address                │
│     GSTIN: XXXXXXXXXXXX                 │
│─────────────────────────────────────────│
│           TAX INVOICE                   │
│                                         │
│ Invoice No: INV-2025-00123             │
│ Date: 15-Nov-2025 12:30 PM            │
│ Reservation: RES-00456                 │
│                                         │
│ Guest: Mr. Rajesh Kumar                │
│ Address: Mumbai, Maharashtra           │
│ GSTIN: (if applicable)                 │
│ Phone: +91 98765 43210                │
│─────────────────────────────────────────│
│ Check-in:  13-Nov-2025 02:00 PM       │
│ Check-out: 15-Nov-2025 11:00 AM       │
│ Room: 301 (Deluxe Double)             │
│ Nights: 2                              │
│─────────────────────────────────────────│
│                                         │
│ CHARGES                                │
│                                         │
│ Room Charges              ₹ 12,000.00 │
│   - 13-Nov (Night 1)  ₹ 6,000         │
│   - 14-Nov (Night 2)  ₹ 6,000         │
│                                         │
│ Food & Beverage            ₹  3,500.00│
│   - Breakfast (14-Nov) ₹ 800          │
│   - Lunch (14-Nov)     ₹ 1,200        │
│   - Room Service       ₹ 1,500        │
│                                         │
│ Other Services             ₹  1,200.00│
│   - Laundry              ₹ 400        │
│   - Airport Transfer     ₹ 800        │
│                                         │
│───────────────────────────────────────  │
│ SUBTOTAL                  ₹ 16,700.00 │
│                                         │
│ TAX BREAKUP                            │
│   CGST @ 6%              ₹  1,002.00  │
│   SGST @ 6%              ₹  1,002.00  │
│───────────────────────────────────────  │
│ GRAND TOTAL               ₹ 18,704.00 │
│                                         │
│ PAYMENTS RECEIVED                      │
│   Advance (11-Nov)       ₹  5,000.00  │
│   Cash (15-Nov)          ₹ 10,000.00  │
│   UPI (15-Nov)           ₹  3,704.00  │
│───────────────────────────────────────  │
│ BALANCE DUE               ₹      0.00 │
│                                         │
│───────────────────────────────────────  │
│ Amount in Words:                       │
│ Eighteen Thousand Seven Hundred        │
│ and Four Rupees Only                   │
│                                         │
│ Terms & Conditions:                    │
│ - Check-out time: 11:00 AM            │
│ - Late checkout charges applicable     │
│                                         │
│ Thank you for staying with us!         │
│ Please visit again!                    │
│                                         │
│ For queries: billing@hotel.com         │
│                                         │
│ [QR Code for UPI Payment]             │
└─────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Enhanced Folio ✅
- [x] Improve folio data structure
- [ ] Category-wise charge grouping
- [ ] GST calculation per item
- [ ] Advance payment display
- [ ] Real-time balance calculation

### Phase 2: POS Charge Posting ⏳
- [ ] Item master with categories
- [ ] Quick charge buttons
- [ ] Custom charge entry
- [ ] Auto tax calculation
- [ ] Charge templates

### Phase 3: Checkout Enhancement 🔜
- [ ] Professional checkout screen
- [ ] Multi-payment support
- [ ] Split payment handling
- [ ] Final bill preview
- [ ] Email/Print bill

### Phase 4: Bill Generation 🔜
- [ ] Professional invoice template
- [ ] GST-compliant format
- [ ] PDF generation
- [ ] Email integration
- [ ] Print formatting

---

## Database Schema Enhancements

### Folio Line Item Structure
```javascript
{
  _id: "line-001",
  bookingId: "booking-001",
  date: "2025-11-15T10:30:00Z",
  category: "FOOD_BEVERAGE", // ROOM, FOOD_BEVERAGE, LAUNDRY, TRANSPORT, MINIBAR, SPA, MISC
  description: "Lunch - Veg Thali",
  itemId: "item-123", // Link to item master
  quantity: 2,
  rate: 350,
  amount: 700,
  taxRate: 5,
  cgst: 17.50,
  sgst: 17.50,
  igst: 0,
  totalAmount: 735,
  postedBy: "user-001",
  postedAt: "2025-11-15T10:30:00Z",
  remarks: "Table 5"
}
```

### Payment Structure
```javascript
{
  _id: "payment-001",
  bookingId: "booking-001",
  date: "2025-11-15T12:00:00Z",
  method: "CASH", // CASH, CARD, UPI, BANK_TRANSFER, CHEQUE, COMPANY_ACCOUNT
  amount: 5000,
  reference: "TXN123456", // Card/UPI transaction ID
  remarks: "Advance payment",
  collectedBy: "user-001"
}
```

---

## User Experience Goals

✅ **Simple**: Staff should post charges in 3 clicks
✅ **Fast**: Checkout should take < 2 minutes
✅ **Accurate**: Auto-calculate all taxes and totals
✅ **Professional**: Bills look better than competitors
✅ **Compliant**: Meet all GST requirements
✅ **Transparent**: Guest sees itemized breakdown

---

## Competitive Advantage

| Feature | Opera | Mews | Cloudbeds | **BillSutra** |
|---------|-------|------|-----------|---------------|
| Auto Room Posting | ✅ | ✅ | ✅ | ✅ |
| POS Integration | ✅ | ✅ | ✅ | ✅ |
| Multi-Payment | ✅ | ✅ | ✅ | ✅ |
| Indian GST Rules | ❌ | ❌ | ⚠️ | ✅ **Better** |
| Advance Tracking | ✅ | ✅ | ✅ | ✅ |
| Split Bills | ✅ | ✅ | ✅ | 🔜 Next |
| Mobile-First UI | ⚠️ | ✅ | ✅ | ✅ **Better** |
| Offline Mode | ❌ | ❌ | ❌ | 🔜 Unique |
| Price | $$$$ | $$$ | $$ | $ **Best** |

---

*This design follows best practices from worldwide hotel management leaders while optimizing for Indian market requirements.*
