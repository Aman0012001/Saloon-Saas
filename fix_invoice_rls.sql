-- FIX INVOICE CREATION PERMISSIONS
-- This script fixes the "Permission Denied" error when Salon Owners create invoices/bookings for customers.

-- 1. Enable owners/managers to create bookings for ANY user in their salon
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Salon staff can create bookings" ON public.bookings;

CREATE POLICY "Salon staff can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (
  -- Allow if user is creating their own booking
  auth.uid() = user_id 
  OR 
  -- OR if the user is a staff/manager/owner of the salon
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.salon_id = bookings.salon_id
    AND ur.role IN ('owner', 'manager', 'staff')
  )
);

-- 2. Enable owners/managers to VIEW all bookings in their salon (already exists but reinforcing)
DROP POLICY IF EXISTS "Users can view their own bookings or salon staff can view all" ON public.bookings;
CREATE POLICY "Users can view their own bookings or salon staff can view all"
ON public.bookings FOR SELECT
USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.salon_id = bookings.salon_id
    )
);

-- 3. Enable owners/managers to UPDATE bookings (e.g., mark as paid)
DROP POLICY IF EXISTS "Users can update their own bookings or salon staff can update" ON public.bookings;
CREATE POLICY "Users can update their own bookings or salon staff can update"
ON public.bookings FOR UPDATE
USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.salon_id = bookings.salon_id
      AND ur.role IN ('owner', 'manager', 'staff')
    )
);

-- 4. Enable owners/managers to select Profiles (to see customer names in dropdown)
DROP POLICY IF EXISTS "Salon staff can view customer profiles" ON public.profiles;
CREATE POLICY "Salon staff can view customer profiles"
ON public.profiles FOR SELECT
USING (
  -- Allow if viewing self
  auth.uid() = user_id
  OR
  -- OR if the viewer is a salon staff/owner, they can view ANY profile (simplified for business needs)
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('owner', 'manager', 'staff')
  )
);
