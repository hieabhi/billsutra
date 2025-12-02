// Calculate GST for an item
export const calculateItemGST = (quantity, rate, cgst, sgst, igst) => {
  const amount = quantity * rate;
  const cgstAmount = (amount * cgst) / 100;
  const sgstAmount = (amount * sgst) / 100;
  const igstAmount = (amount * igst) / 100;
  const taxAmount = cgstAmount + sgstAmount + igstAmount;
  const totalAmount = amount + taxAmount;

  return {
    amount: parseFloat(amount.toFixed(2)),
    cgstAmount: parseFloat(cgstAmount.toFixed(2)),
    sgstAmount: parseFloat(sgstAmount.toFixed(2)),
    igstAmount: parseFloat(igstAmount.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
};

// Calculate bill totals
export const calculateBillTotals = (items) => {
  let subtotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  items.forEach(item => {
    const calculations = calculateItemGST(
      item.quantity,
      item.rate,
      item.cgst || 0,
      item.sgst || 0,
      item.igst || 0
    );

    subtotal += calculations.amount;
    cgstTotal += calculations.cgstAmount;
    sgstTotal += calculations.sgstAmount;
    igstTotal += calculations.igstAmount;
  });

  const totalTax = cgstTotal + sgstTotal + igstTotal;
  const grandTotal = subtotal + totalTax;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    cgstTotal: parseFloat(cgstTotal.toFixed(2)),
    sgstTotal: parseFloat(sgstTotal.toFixed(2)),
    igstTotal: parseFloat(igstTotal.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2))
  };
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Convert number to words (for invoice)
export const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;

  let result = '';
  if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
  if (remainder > 0) result += convertLessThanThousand(remainder);

  return result.trim() + ' Rupees Only';
};
