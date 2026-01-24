-- Super Admin Setup Script
-- Run this in your Supabase SQL Editor to create super admin credentials

-- 1. First, let's create a super admin user in auth.users table
-- Note: This needs to be done through Supabase Auth Admin API or Dashboard
-- For now, we'll prepare the platform_admins entry

-- 2. Create super admin credentials (you'll need to create the auth user first)
-- Email: superadmin@salon.com
-- Password: SuperAdmin@2024

-- 3. Once you create the auth user, get the user_id and run this:
-- Replace 'USER_ID_HERE' with the actual user ID from auth.users

INSERT INTO public.platform_admins (user_id, is_active, created_at, updated_at)
VALUES (
  'USER_ID_HERE', -- Replace with actual user ID
  true,
  now(),
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  updated_at = now();

-- 4. Verify the admin was created
SELECT 
  pa.id,
  pa.user_id,
  pa.is_active,
  pa.created_at,
  au.email
FROM public.platform_admins pa
JOIN auth.users au ON au.id = pa.user_id
WHERE pa.is_active = true;