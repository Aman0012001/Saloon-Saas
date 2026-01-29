-- Run this in Supabase SQL Editor to create the first super admin
-- This bypasses RLS policies by using a function with SECURITY DEFINER

-- 1. Create a function to add the first super admin
CREATE OR REPLACE FUNCTION create_first_super_admin(admin_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into platform_admins table
    INSERT INTO public.platform_admins (user_id, is_active)
    VALUES (admin_user_id, true)
    ON CONFLICT (user_id) DO UPDATE SET
        is_active = true,
        updated_at = now();
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_first_super_admin(UUID) TO authenticated;

-- 3. Create a simpler policy for initial admin creation
DROP POLICY IF EXISTS "Allow initial admin creation" ON public.platform_admins;
CREATE POLICY "Allow initial admin creation"
ON public.platform_admins
FOR INSERT
WITH CHECK (
    -- Allow insert if no admins exist yet
    NOT EXISTS (SELECT 1 FROM public.platform_admins WHERE is_active = true)
);

-- 4. Allow reading platform_admins for the user's own record
DROP POLICY IF EXISTS "Users can read own admin status" ON public.platform_admins;
CREATE POLICY "Users can read own admin status"
ON public.platform_admins
FOR SELECT
USING (user_id = auth.uid());

-- 5. Verify the function works (replace with actual user ID)
-- SELECT create_first_super_admin('your-user-id-here');