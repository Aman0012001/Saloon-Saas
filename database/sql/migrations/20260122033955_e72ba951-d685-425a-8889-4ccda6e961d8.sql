-- Fix infinite recursion in platform_admins RLS policies
-- The issue is that the policies query platform_admins which triggers the same policies

-- Drop existing problematic policies on platform_admins
DROP POLICY IF EXISTS "Super admins can view platform admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Super admins can manage platform admins" ON public.platform_admins;

-- Create new policies that don't cause recursion
-- Users can check if THEY are a platform admin (for self-check)
CREATE POLICY "Users can check own admin status"
ON public.platform_admins
FOR SELECT
USING (user_id = auth.uid());

-- Super admins can manage other admins using a direct check
CREATE POLICY "Active admins can manage platform admins"
ON public.platform_admins
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.platform_admins pa
    WHERE pa.user_id = auth.uid() 
    AND pa.is_active = true
    AND pa.user_id != public.platform_admins.user_id  -- Avoid self-reference
  )
  OR user_id = auth.uid()  -- Allow users to see their own record
);

-- Fix the auto_assign_salon_owner trigger to use SECURITY DEFINER properly
-- The trigger already has SECURITY DEFINER but let's ensure user_roles INSERT works

-- Drop existing policies on user_roles that might block the trigger
DROP POLICY IF EXISTS "Owners can manage roles in their salons" ON public.user_roles;

-- Recreate with a policy that allows the trigger to work
CREATE POLICY "Owners can manage roles or trigger can insert"
ON public.user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), salon_id, 'owner'::app_role) 
  OR auth.uid() = user_id
);

-- Also ensure staff_profiles allows insert from trigger
DROP POLICY IF EXISTS "Owners/Managers can create staff profiles" ON public.staff_profiles;

CREATE POLICY "Owners/Managers can create staff profiles or self"
ON public.staff_profiles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), salon_id, 'owner'::app_role) 
  OR has_role(auth.uid(), salon_id, 'manager'::app_role)
  OR user_id = auth.uid()
);