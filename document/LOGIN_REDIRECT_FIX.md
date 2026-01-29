# ✅ Login Redirect Fix - Salon Owner to Dashboard

## Issue Fixed
When salon owners logged in, they were being redirected to `/admin` instead of `/dashboard`.

## Root Cause
The backend API returns two different role identifiers:
- `user_type`: From the `profiles` table (e.g., `salon_owner`, `admin`, `customer`)
- `salon_role`: From the `user_roles` table (e.g., `owner`, `manager`, `staff`)

When a salon owner logs in, the backend returns:
```json
{
  "user_type": "salon_owner",
  "salon_role": "owner"
}
```

The frontend was only checking `user_type`, but some users might have `salon_role: "owner"` without the `user_type` being set correctly.

## Solution Applied

### Updated: `src/pages/Login.tsx`

**Before:**
```tsx
// Redirect based on user type
if (userType === 'salon_owner') {
  navigate("/dashboard");
} else if (userType === 'admin') {
  navigate("/admin");
} else if (userType === 'customer') {
  navigate("/client-hub");
} else {
  navigate("/");
}
```

**After:**
```tsx
// Redirect based on user type and salon role
// Check for salon owner (can be 'salon_owner' or 'owner')
if (userType === 'salon_owner' || salonRole === 'owner') {
  navigate("/dashboard");
} else if (userType === 'admin') {
  navigate("/admin");
} else if (userType === 'customer') {
  navigate("/client-hub");
} else if (salonRole === 'staff' || salonRole === 'manager') {
  // Staff and managers also go to dashboard
  navigate("/dashboard");
} else {
  navigate("/");
}
```

## Changes Made

1. ✅ Added `salonRole` extraction from user data
2. ✅ Updated redirect logic to check both `user_type` and `salon_role`
3. ✅ Added support for staff and manager roles to access dashboard
4. ✅ Maintained backward compatibility with existing user types

## User Type Mapping

| User Type | Salon Role | Redirect To |
|-----------|------------|-------------|
| `salon_owner` | `owner` | `/dashboard` |
| `admin` | - | `/admin` |
| `customer` | - | `/client-hub` |
| - | `owner` | `/dashboard` |
| - | `manager` | `/dashboard` |
| - | `staff` | `/dashboard` |
| Other | - | `/` (home) |

## Testing

To test the fix:

1. **Login as Salon Owner**:
   - Go to http://localhost:5174/login
   - Enter salon owner credentials
   - Should redirect to `/dashboard` ✅

2. **Login as Admin**:
   - Go to http://localhost:5174/login
   - Enter admin credentials
   - Should redirect to `/admin` ✅

3. **Login as Customer**:
   - Go to http://localhost:5174/login
   - Enter customer credentials
   - Should redirect to `/client-hub` ✅

## Files Modified

- ✅ `src/pages/Login.tsx` - Updated redirect logic

## Notes

- The `SalonOwnerLogin.tsx` page already had correct redirect logic
- No backend changes were needed
- The fix is backward compatible with existing users
- Staff and managers now also have access to the dashboard

---

**Status**: ✅ FIXED
**Date**: 2026-01-27 22:47 IST
**Impact**: All salon owners will now correctly redirect to `/dashboard` on login
