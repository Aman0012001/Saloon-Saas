-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'staff');

-- Create salons table (multi-tenant core)
CREATE TABLE public.salons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    gst_number TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    business_hours JSONB DEFAULT '{}',
    tax_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, salon_id)
);

-- Create staff_profiles table for salon staff details
CREATE TABLE public.staff_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    specializations TEXT[],
    commission_percentage NUMERIC DEFAULT 0,
    working_hours JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, salon_id)
);

-- Add salon_id to existing services table for multi-tenant
ALTER TABLE public.services ADD COLUMN salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE;

-- Add salon_id and staff_id to bookings for multi-tenant
ALTER TABLE public.bookings ADD COLUMN salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN staff_id UUID REFERENCES public.staff_profiles(id);

-- Enable RLS on all new tables
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _salon_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND salon_id = _salon_id
          AND role = _role
    )
$$;

-- Function to check if user belongs to a salon
CREATE OR REPLACE FUNCTION public.user_belongs_to_salon(_user_id UUID, _salon_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND salon_id = _salon_id
    )
$$;

-- Function to get user's salons
CREATE OR REPLACE FUNCTION public.get_user_salons(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT salon_id
    FROM public.user_roles
    WHERE user_id = _user_id
$$;

-- RLS Policies for salons
CREATE POLICY "Users can view salons they belong to"
ON public.salons FOR SELECT
USING (public.user_belongs_to_salon(auth.uid(), id) OR is_active = true);

CREATE POLICY "Owners can update their salons"
ON public.salons FOR UPDATE
USING (public.has_role(auth.uid(), id, 'owner'));

CREATE POLICY "Authenticated users can create salons"
ON public.salons FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their salons"
ON public.user_roles FOR SELECT
USING (public.user_belongs_to_salon(auth.uid(), salon_id) OR user_id = auth.uid());

CREATE POLICY "Owners can manage roles in their salons"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), salon_id, 'owner') OR auth.uid() = user_id);

CREATE POLICY "Owners can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), salon_id, 'owner'));

-- RLS Policies for staff_profiles
CREATE POLICY "Staff profiles visible to salon members"
ON public.staff_profiles FOR SELECT
USING (public.user_belongs_to_salon(auth.uid(), salon_id));

CREATE POLICY "Owners/Managers can create staff profiles"
ON public.staff_profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), salon_id, 'owner') OR public.has_role(auth.uid(), salon_id, 'manager'));

CREATE POLICY "Owners/Managers can update staff profiles"
ON public.staff_profiles FOR UPDATE
USING (public.has_role(auth.uid(), salon_id, 'owner') OR public.has_role(auth.uid(), salon_id, 'manager') OR user_id = auth.uid());

CREATE POLICY "Owners can delete staff profiles"
ON public.staff_profiles FOR DELETE
USING (public.has_role(auth.uid(), salon_id, 'owner'));

-- Update services policies for multi-tenant
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;

CREATE POLICY "Anyone can view active services"
ON public.services FOR SELECT
USING (is_active = true);

CREATE POLICY "Owners/Managers can insert services"
ON public.services FOR INSERT
WITH CHECK (public.has_role(auth.uid(), salon_id, 'owner') OR public.has_role(auth.uid(), salon_id, 'manager'));

CREATE POLICY "Owners/Managers can update services"
ON public.services FOR UPDATE
USING (public.has_role(auth.uid(), salon_id, 'owner') OR public.has_role(auth.uid(), salon_id, 'manager'));

CREATE POLICY "Owners can delete services"
ON public.services FOR DELETE
USING (public.has_role(auth.uid(), salon_id, 'owner'));

-- Update bookings policies for multi-tenant
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings or salon staff can view all"
ON public.bookings FOR SELECT
USING (
    auth.uid() = user_id OR 
    public.user_belongs_to_salon(auth.uid(), salon_id)
);

CREATE POLICY "Users can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings or salon staff can update"
ON public.bookings FOR UPDATE
USING (
    auth.uid() = user_id OR 
    public.user_belongs_to_salon(auth.uid(), salon_id)
);

CREATE POLICY "Users can cancel their own bookings or owners can delete"
ON public.bookings FOR DELETE
USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), salon_id, 'owner')
);

-- Create updated_at triggers
CREATE TRIGGER update_salons_updated_at
BEFORE UPDATE ON public.salons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_profiles_updated_at
BEFORE UPDATE ON public.staff_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_salon_id ON public.user_roles(salon_id);
CREATE INDEX idx_staff_profiles_salon_id ON public.staff_profiles(salon_id);
CREATE INDEX idx_services_salon_id ON public.services(salon_id);
CREATE INDEX idx_bookings_salon_id ON public.bookings(salon_id);