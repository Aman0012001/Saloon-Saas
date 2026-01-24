-- Fix services table to properly associate with salons
-- This migration ensures all existing services are properly linked to salons

-- First, let's check if salon_id column exists in services table
DO $$ 
BEGIN
    -- Add salon_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'services' AND column_name = 'salon_id') THEN
        ALTER TABLE public.services ADD COLUMN salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE;
        
        -- Create index for performance
        CREATE INDEX idx_services_salon_id ON public.services(salon_id);
    END IF;
END $$;

-- Update existing services to be associated with all salons
-- This creates duplicate services for each salon (multi-tenant approach)
DO $$
DECLARE
    salon_record RECORD;
    service_record RECORD;
BEGIN
    -- Only proceed if there are services without salon_id
    IF EXISTS (SELECT 1 FROM public.services WHERE salon_id IS NULL) THEN
        
        -- For each salon, create a copy of each service
        FOR salon_record IN SELECT id, name FROM public.salons LOOP
            FOR service_record IN SELECT * FROM public.services WHERE salon_id IS NULL LOOP
                
                -- Insert service copy for this salon
                INSERT INTO public.services (
                    salon_id,
                    name,
                    description,
                    price,
                    duration_minutes,
                    category,
                    image_url,
                    is_active,
                    created_at
                ) VALUES (
                    salon_record.id,
                    service_record.name,
                    service_record.description,
                    service_record.price,
                    service_record.duration_minutes,
                    service_record.category,
                    service_record.image_url,
                    service_record.is_active,
                    NOW()
                );
                
            END LOOP;
        END LOOP;
        
        -- Delete original services without salon_id
        DELETE FROM public.services WHERE salon_id IS NULL;
        
    END IF;
END $$;

-- Make salon_id NOT NULL after associating services
ALTER TABLE public.services ALTER COLUMN salon_id SET NOT NULL;

-- Update RLS policies for services table
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Users can view services" ON public.services;
DROP POLICY IF EXISTS "Salon owners can manage services" ON public.services;

-- Policy: Users can view all active services (for booking selection)
CREATE POLICY "Users can view active services" ON public.services
    FOR SELECT USING (is_active = true);

-- Policy: Only salon owners/managers can insert services for their salon
CREATE POLICY "Salon owners can insert services" ON public.services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND salon_id = public.services.salon_id 
            AND role IN ('owner', 'manager')
        )
    );

-- Policy: Only salon owners/managers can update their salon's services
CREATE POLICY "Salon owners can update services" ON public.services
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND salon_id = public.services.salon_id 
            AND role IN ('owner', 'manager')
        )
    );

-- Policy: Only salon owners can delete their salon's services
CREATE POLICY "Salon owners can delete services" ON public.services
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND salon_id = public.services.salon_id 
            AND role = 'owner'
        )
    );

-- Update bookings table to include salon_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'salon_id') THEN
        ALTER TABLE public.bookings ADD COLUMN salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE;
        
        -- Create index for performance
        CREATE INDEX idx_bookings_salon_id ON public.bookings(salon_id);
    END IF;
END $$;

-- Update existing bookings to have salon_id based on their service
UPDATE public.bookings 
SET salon_id = (
    SELECT salon_id 
    FROM public.services 
    WHERE public.services.id = public.bookings.service_id
    LIMIT 1
)
WHERE salon_id IS NULL;

-- Make salon_id NOT NULL in bookings after updating
ALTER TABLE public.bookings ALTER COLUMN salon_id SET NOT NULL;

-- Add constraint to ensure booking service belongs to booking salon
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_service_salon_match;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_service_salon_match 
CHECK (
    salon_id = (SELECT salon_id FROM public.services WHERE id = service_id)
);

-- Update RLS policies for bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

-- Policy: Users can only view their own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert bookings for themselves
CREATE POLICY "Users can insert own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own pending bookings (for cancellation)
CREATE POLICY "Users can update own pending bookings" ON public.bookings
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        status = 'pending'
    );

-- Policy: Salon owners/managers can view bookings for their salon
CREATE POLICY "Salon staff can view salon bookings" ON public.bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND salon_id = public.bookings.salon_id 
            AND role IN ('owner', 'manager', 'staff')
        )
    );

-- Policy: Salon owners/managers can update bookings for their salon
CREATE POLICY "Salon staff can update salon bookings" ON public.bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND salon_id = public.bookings.salon_id 
            AND role IN ('owner', 'manager')
        )
    );

-- Create function to validate booking creation
CREATE OR REPLACE FUNCTION validate_booking_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure service belongs to the specified salon
    IF NOT EXISTS (
        SELECT 1 FROM public.services 
        WHERE id = NEW.service_id 
        AND salon_id = NEW.salon_id 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Service does not belong to the specified salon or is not active';
    END IF;
    
    -- Ensure salon is active
    IF NOT EXISTS (
        SELECT 1 FROM public.salons 
        WHERE id = NEW.salon_id 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Salon is not active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking validation
DROP TRIGGER IF EXISTS validate_booking_trigger ON public.bookings;
CREATE TRIGGER validate_booking_trigger
    BEFORE INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION validate_booking_creation();

-- Grant necessary permissions
GRANT SELECT ON public.salons TO authenticated;
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';