# ✅ Coupon Code Feature

## Feature Added
Users can now apply **coupon/discount codes** during the booking process to get discounts on their services.

## Features

### 1. **Coupon Input Field**
- Located in the Service Selection summary card
- Input field with "Apply" button
- Automatically converts input to uppercase
- Real-time error clearing on typing

### 2. **Coupon Validation**
- Validates coupon codes against a list of valid coupons
- Shows error message for invalid codes
- Success toast notification when applied

### 3. **Discount Calculation**
- Automatically calculates percentage discount
- Updates total price in real-time
- Shows discount breakdown

### 4. **Visual Feedback**
- ✅ Green success card when coupon is applied
- ❌ Red error message for invalid codes
- 🎉 Toast notification on successful application
- Shows discount percentage and amount saved

## Available Test Coupons

For testing purposes, these coupon codes are available:

| Code | Discount | Description |
|------|----------|-------------|
| `SAVE10` | 10% | Save 10% on your booking |
| `SAVE20` | 20% | Save 20% on your booking |
| `WELCOME` | 15% | Welcome discount |
| `FIRST50` | 50% | First-time customer special |

## User Flow

### Without Coupon:
```
1. Select services
2. See subtotal
3. Proceed to time selection
```

### With Coupon:
```
1. Select services
2. See subtotal
3. Enter coupon code
4. Click "Apply"
5. See discount applied
6. See new total (reduced price)
7. Proceed to time selection
```

## Visual Design

### Before Applying Coupon:
```
┌─────────────────────────────────────┐
│ Selected Services        Subtotal   │
│ 2 Services             RM 300.00    │
│                                     │
│ Have a Coupon?                      │
│ [Enter coupon code...] [Apply]      │
│                                     │
│ Total Amount           RM 300.00    │
└─────────────────────────────────────┘
```

### After Applying Coupon (20% off):
```
┌─────────────────────────────────────┐
│ Selected Services        Subtotal   │
│ 2 Services             RM 300.00    │
│                                     │
│ Have a Coupon?                      │
│ ┌─────────────────────────────────┐ │
│ │ ✓ SAVE20                        │ │
│ │ 20% discount applied   [Remove] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Discount (20%)        -RM 60.00     │
│                                     │
│ Total Amount           RM 240.00    │
└─────────────────────────────────────┘
```

## Technical Implementation

### State Management:
```tsx
const [couponCode, setCouponCode] = useState("");
const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
const [couponError, setCouponError] = useState("");
```

### Coupon Validation:
```tsx
const handleApplyCoupon = () => {
  const code = couponCode.trim().toUpperCase();
  
  const validCoupons: Record<string, number> = {
    'SAVE10': 10,
    'SAVE20': 20,
    'WELCOME': 15,
    'FIRST50': 50,
  };

  if (validCoupons[code]) {
    setAppliedCoupon({ code, discount: validCoupons[code] });
    toast({ 
      title: "Coupon Applied!", 
      description: `You saved ${validCoupons[code]}% on your booking!` 
    });
  } else {
    setCouponError("Invalid coupon code");
  }
};
```

### Price Calculation:
```tsx
const calculateTotal = () => {
  const subtotal = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  if (appliedCoupon) {
    const discount = (subtotal * appliedCoupon.discount) / 100;
    return subtotal - discount;
  }
  return subtotal;
};

const getDiscount = () => {
  if (!appliedCoupon) return 0;
  const subtotal = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  return (subtotal * appliedCoupon.discount) / 100;
};
```

## UI Components

### Coupon Input (Not Applied):
```tsx
<div className="flex gap-2">
  <Input
    placeholder="Enter coupon code"
    value={couponCode}
    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
    className="h-12 bg-slate-50 border-none rounded-xl font-bold uppercase"
  />
  <Button onClick={handleApplyCoupon}>
    Apply
  </Button>
</div>
```

### Coupon Applied (Success State):
```tsx
<div className="bg-green-50 border border-green-200 rounded-xl p-4">
  <div className="flex items-center gap-2">
    <CheckCircle className="w-5 h-5 text-green-600" />
    <div>
      <p className="font-black text-green-900">{appliedCoupon.code}</p>
      <p className="text-xs text-green-600">
        {appliedCoupon.discount}% discount applied
      </p>
    </div>
  </div>
  <Button onClick={handleRemoveCoupon}>Remove</Button>
</div>
```

### Discount Display:
```tsx
{appliedCoupon && (
  <div className="flex justify-between">
    <span>Discount ({appliedCoupon.discount}%)</span>
    <span className="text-green-600">-RM {getDiscount().toFixed(2)}</span>
  </div>
)}
```

## Benefits

1. ✅ **Increased Conversions**: Discounts encourage bookings
2. ✅ **Marketing Tool**: Can create promotional campaigns
3. ✅ **Customer Loyalty**: Reward repeat customers
4. ✅ **Clear Pricing**: Shows breakdown of savings
5. ✅ **Easy to Use**: Simple input and apply process
6. ✅ **Visual Feedback**: Clear success/error states

## Example Usage

### Scenario 1: Single Service with Coupon
```
Service: Haircut - RM 100.00
Coupon: SAVE20 (20% off)
Discount: -RM 20.00
Total: RM 80.00 ✅
```

### Scenario 2: Multiple Services with Coupon
```
Services:
- Haircut: RM 100.00
- Facial: RM 200.00
Subtotal: RM 300.00

Coupon: FIRST50 (50% off)
Discount: -RM 150.00
Total: RM 150.00 ✅
```

## Future Enhancements

For production, consider:
1. **API Integration**: Validate coupons via backend API
2. **Expiry Dates**: Check coupon validity period
3. **Usage Limits**: Track how many times a coupon has been used
4. **User-Specific**: Coupons tied to specific users
5. **Minimum Purchase**: Require minimum booking amount
6. **Service-Specific**: Coupons valid only for certain services
7. **First-Time Users**: Special coupons for new customers
8. **Referral Codes**: Track referral sources

## Testing

To test the coupon feature:

1. Go to booking page: http://localhost:5174/book?salonId={salon_id}
2. Select one or more services
3. In the summary card, enter a coupon code:
   - Try: `SAVE20`
   - Try: `WELCOME`
   - Try: `INVALID` (should show error)
4. Click "Apply"
5. See discount applied and total updated
6. Click "Remove" to remove the coupon

## Error Handling

- Empty input: "Please enter a coupon code"
- Invalid code: "Invalid coupon code"
- Successful application: Toast notification with savings amount

---

**Status**: ✅ IMPLEMENTED
**Date**: 2026-01-27 23:08 IST
**Impact**: Users can now apply discount coupons to reduce booking costs
**File Modified**: `src/pages/BookAppointment.tsx`
**Test Coupons**: SAVE10, SAVE20, WELCOME, FIRST50
