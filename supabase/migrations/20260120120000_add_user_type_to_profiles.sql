-- Add user_type and business fields to profiles table
ALTER TABLE profiles 
ADD COLUMN user_type TEXT DEFAULT 'customer' CHECK (user_type IN ('customer', 'salon_owner')),
ADD COLUMN business_name TEXT,
ADD COLUMN business_type TEXT DEFAULT 'salon',
ADD COLUMN city TEXT,
ADD COLUMN experience TEXT;

-- Create index for faster queries
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_business_name ON profiles(business_name);

-- Update existing profiles to have customer type
UPDATE profiles SET user_type = 'customer' WHERE user_type IS NULL;