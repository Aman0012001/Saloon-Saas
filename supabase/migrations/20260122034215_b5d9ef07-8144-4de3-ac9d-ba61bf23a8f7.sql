-- The salons INSERT policy is RESTRICTIVE which means it can only deny, not grant access
-- We need to drop and recreate it as PERMISSIVE

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create salons" ON public.salons;

-- Create a PERMISSIVE INSERT policy (default is permissive when AS RESTRICTIVE is not specified)
CREATE POLICY "Authenticated users can create salons"
ON public.salons
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also fix the SELECT policy to be permissive for public access
DROP POLICY IF EXISTS "Users can view salons they belong to or active salons or super" ON public.salons;

CREATE POLICY "Users can view salons they belong to or active approved salons or super admin"
ON public.salons
FOR SELECT
TO authenticated
USING (
  user_belongs_to_salon(auth.uid(), id) 
  OR (is_active = true AND approval_status = 'approved')
  OR is_super_admin(auth.uid())
);

-- Allow anon users to view approved salons (for public listing)
CREATE POLICY "Anyone can view active approved salons"
ON public.salons
FOR SELECT
TO anon
USING (is_active = true AND approval_status = 'approved');

-- Fix UPDATE policy to be permissive
DROP POLICY IF EXISTS "Owners or super admins can update salons" ON public.salons;

CREATE POLICY "Owners or super admins can update salons"
ON public.salons
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), id, 'owner'::app_role) OR is_super_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), id, 'owner'::app_role) OR is_super_admin(auth.uid()));

-- Fix DELETE policy to be permissive  
DROP POLICY IF EXISTS "Super admins can delete salons" ON public.salons;

CREATE POLICY "Super admins can delete salons"
ON public.salons
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));