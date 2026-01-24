-- QUICK SUPER ADMIN SETUP
-- Copy and paste this into your Supabase SQL Editor and run it

-- 1. Temporarily disable RLS on platform_admins for setup
ALTER TABLE public.platform_admins DISABLE ROW LEVEL SECURITY;

-- 2. Create the super admin user (this will create both auth user and admin record)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'superadmin@salon.com';
    
    -- If user doesn't exist, we need to create it manually
    -- Note: In production, create the user through Supabase Auth Admin API
    -- For now, we'll just prepare the platform_admins entry
    
    -- Insert or update platform_admins record
    -- Replace 'YOUR_USER_ID_HERE' with the actual user ID after creating the auth user
    INSERT INTO public.platform_admins (user_id, is_active, created_at, updated_at)
    VALUES (
        'YOUR_USER_ID_HERE', -- Replace this with actual user ID
        true,
        now(),
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        is_active = true,
        updated_at = now();
    
    RAISE NOTICE 'Super admin setup prepared. Please replace YOUR_USER_ID_HERE with actual user ID.';
END $$;

-- 3. Re-enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- 4. Add a more permissive policy for development
DROP POLICY IF EXISTS "Development admin access" ON public.platform_admins;
CREATE POLICY "Development admin access"
ON public.platform_admins
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Verify setup
SELECT 
    pa.id,
    pa.user_id,
    pa.is_active,
    pa.created_at
FROM public.platform_admins pa
WHERE pa.is_active = true;

-- INSTRUCTIONS:
-- 1. First, create a user with email 'superadmin@salon.com' and password 'SuperAdmin@2024' 
--    in Supabase Auth > Users section
-- 2. Copy the user ID from the created user
-- 3. Replace 'YOUR_USER_ID_HERE' above with the actual user ID
-- 4. Run this script
-- 5. Try logging in at /admin-access