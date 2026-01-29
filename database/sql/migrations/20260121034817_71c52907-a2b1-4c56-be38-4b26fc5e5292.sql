-- Super Admin Panel Database Schema

-- 1. Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2. Create platform_admins table to track super admins
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can read platform_admins
CREATE POLICY "Super admins can view platform admins"
ON public.platform_admins
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- Only super admins can manage platform admins
CREATE POLICY "Super admins can manage platform admins"
ON public.platform_admins
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- 3. Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_yearly NUMERIC(10,2),
    max_staff INTEGER DEFAULT 5,
    max_services INTEGER DEFAULT 20,
    max_bookings_per_month INTEGER,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view active plans
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- Super admins can manage plans
CREATE POLICY "Super admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- 4. Add subscription fields to salons table
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '14 days'),
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_by UUID,
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- 5. Create salon_subscriptions for subscription history
CREATE TABLE IF NOT EXISTS public.salon_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'upgraded', 'downgraded')),
    amount NUMERIC(10,2) NOT NULL,
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salon_subscriptions ENABLE ROW LEVEL SECURITY;

-- Salon owners can view their subscriptions
CREATE POLICY "Salon owners can view their subscriptions"
ON public.salon_subscriptions
FOR SELECT
USING (
    has_role(auth.uid(), salon_id, 'owner'::app_role) OR
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- Super admins can manage subscriptions
CREATE POLICY "Super admins can manage subscriptions"
ON public.salon_subscriptions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- 6. Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read public settings
CREATE POLICY "Anyone can read platform settings"
ON public.platform_settings
FOR SELECT
USING (key NOT LIKE 'private_%');

-- Only super admins can modify settings
CREATE POLICY "Super admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- 7. Create platform_banners table for promotional content
CREATE TABLE IF NOT EXISTS public.platform_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    link_url TEXT,
    link_text TEXT,
    position TEXT DEFAULT 'home_hero' CHECK (position IN ('home_hero', 'home_secondary', 'sidebar', 'popup')),
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    sort_order INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_banners ENABLE ROW LEVEL SECURITY;

-- Everyone can view active banners
CREATE POLICY "Anyone can view active banners"
ON public.platform_banners
FOR SELECT
USING (
    is_active = true AND
    (start_date IS NULL OR start_date <= now()) AND
    (end_date IS NULL OR end_date >= now())
);

-- Super admins can manage banners
CREATE POLICY "Super admins can manage banners"
ON public.platform_banners
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- 8. Create platform_offers table
CREATE TABLE IF NOT EXISTS public.platform_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_trial_days')),
    discount_value NUMERIC(10,2) NOT NULL,
    applicable_to TEXT NOT NULL DEFAULT 'all' CHECK (applicable_to IN ('all', 'new_salons', 'existing_salons', 'specific_plans')),
    applicable_plan_ids UUID[],
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_offers ENABLE ROW LEVEL SECURITY;

-- Everyone can view active offers
CREATE POLICY "Anyone can view active offers"
ON public.platform_offers
FOR SELECT
USING (
    is_active = true AND
    (start_date IS NULL OR start_date <= now()) AND
    (end_date IS NULL OR end_date >= now())
);

-- Super admins can manage offers
CREATE POLICY "Super admins can manage offers"
ON public.platform_offers
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- 9. Create admin_activity_logs table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can view logs
CREATE POLICY "Super admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- Super admins can create logs
CREATE POLICY "Super admins can create activity logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- 10. Create payments table for platform-level payment tracking
CREATE TABLE IF NOT EXISTS public.platform_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.salon_subscriptions(id),
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    payment_gateway TEXT,
    transaction_id TEXT,
    invoice_number TEXT,
    invoice_url TEXT,
    notes TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_payments ENABLE ROW LEVEL SECURITY;

-- Salon owners can view their payments
CREATE POLICY "Salon owners can view their payments"
ON public.platform_payments
FOR SELECT
USING (
    has_role(auth.uid(), salon_id, 'owner'::app_role) OR
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- Super admins can manage payments
CREATE POLICY "Super admins can manage payments"
ON public.platform_payments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.platform_admins pa
        WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
);

-- 11. Create security definer function for super admin check
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.platform_admins
        WHERE user_id = _user_id
          AND is_active = true
    )
$$;

-- 12. Add super admin policies to salons table for full access
DROP POLICY IF EXISTS "Users can view salons they belong to" ON public.salons;
CREATE POLICY "Users can view salons they belong to or active salons or super admin"
ON public.salons
FOR SELECT
USING (
    user_belongs_to_salon(auth.uid(), id) OR 
    (is_active = true AND approval_status = 'approved') OR
    is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Owners can update their salons" ON public.salons;
CREATE POLICY "Owners or super admins can update salons"
ON public.salons
FOR UPDATE
USING (
    has_role(auth.uid(), id, 'owner'::app_role) OR
    is_super_admin(auth.uid())
);

-- Super admins can delete salons
CREATE POLICY "Super admins can delete salons"
ON public.salons
FOR DELETE
USING (is_super_admin(auth.uid()));

-- 13. Add super admin policies to bookings table
DROP POLICY IF EXISTS "Users can view their own bookings or salon staff can view all" ON public.bookings;
CREATE POLICY "Users can view their own bookings or salon staff or super admin"
ON public.bookings
FOR SELECT
USING (
    auth.uid() = user_id OR 
    user_belongs_to_salon(auth.uid(), salon_id) OR
    is_super_admin(auth.uid())
);

-- 14. Add super admin policies to profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile or super admin"
ON public.profiles
FOR SELECT
USING (
    auth.uid() = user_id OR
    is_super_admin(auth.uid())
);

-- 15. Create updated_at triggers
CREATE TRIGGER update_platform_admins_updated_at
    BEFORE UPDATE ON public.platform_admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_banners_updated_at
    BEFORE UPDATE ON public.platform_banners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_offers_updated_at
    BEFORE UPDATE ON public.platform_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Insert default subscription plans
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, max_staff, max_services, max_bookings_per_month, features, sort_order, is_featured)
VALUES
    ('Free Trial', 'free-trial', '14-day trial with basic features', 0, 0, 2, 10, 50, '["Basic booking", "Email notifications", "1 staff member"]'::jsonb, 0, false),
    ('Starter', 'starter', 'Perfect for small salons', 499, 4999, 3, 20, 200, '["Unlimited bookings", "Email & SMS notifications", "3 staff members", "Basic reports"]'::jsonb, 1, false),
    ('Professional', 'professional', 'For growing businesses', 999, 9999, 10, 50, null, '["Everything in Starter", "10 staff members", "Advanced reports", "Customer loyalty", "Inventory management"]'::jsonb, 2, true),
    ('Enterprise', 'enterprise', 'For large salon chains', 2499, 24999, null, null, null, '["Everything in Professional", "Unlimited staff", "Multi-location", "API access", "Priority support", "Custom branding"]'::jsonb, 3, false)
ON CONFLICT (slug) DO NOTHING;

-- 17. Insert default platform settings
INSERT INTO public.platform_settings (key, value, description)
VALUES
    ('platform_name', '"GlamBook"'::jsonb, 'Platform brand name'),
    ('platform_commission', '10'::jsonb, 'Platform commission percentage'),
    ('trial_days', '14'::jsonb, 'Default trial period in days'),
    ('support_email', '"support@glambook.com"'::jsonb, 'Support email address'),
    ('currency', '"INR"'::jsonb, 'Default currency'),
    ('auto_approve_salons', 'false'::jsonb, 'Automatically approve new salon registrations')
ON CONFLICT (key) DO NOTHING;

-- 18. Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.salons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;