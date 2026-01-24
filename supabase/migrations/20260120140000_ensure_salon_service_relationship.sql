-- Ensure services table has salon_id column and proper constraints for multi-tenant isolation
-- This migration ensures strict data isolation between salons

-- Add salon_id to services table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'services' AND column_name = 'salon_id') THEN
        ALTER TABLE public.services ADD COLUMN salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update existing services to have a default salon_id (for development)
-- In production, this should be handled differently
UPDATE public.services 
SET salon_id = (SELECT id FROM public.salons LIMIT 1)
WHERE salon_id IS NULL;

-- Make salon_id NOT NULL after updating existing records
ALTER TABLE public.services ALTER COLUMN salon_id SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON public.services(salon_id);

-- Update RLS policies for services table to ensure salon isolation
DROP POLICY IF EXISTS "Users can view services" ON public.services;
DROP POLICY IF EXISTS "Salon owners can manage services" ON public.services;

-- Policy: Users can view services for any salon (for booking)
CREATE POLICY "Users can view active services" ON public.services
    FOR SELECT USING (is_active = true);

-- Policy: Only salon owners/managers can insert services for their salon
CREATE POLICY "Salon owners can insert services" ON public.services
    FOR INSERT WITH CHECK (
        has_role(auth.uid(), salon_id, 'owner') OR 
        has_role(auth.uid(), salon_id, 'manager')
    );

-- Policy: Only salon owners/managers can update their salon's services
CREATE POLICY "Salon owners can update services" ON public.services
    FOR UPDATE USING (
        has_role(auth.uid(), salon_id, 'owner') OR 
        has_role(auth.uid(), salon_id, 'manager')
    );

-- Policy: Only salon owners can delete their salon's services
CREATE POLICY "Salon owners can delete services" ON public.services
    FOR DELETE USING (has_role(auth.uid(), salon_id, 'owner'));

-- Ensure bookings table has proper constraints and indexes
CREATE INDEX IF NOT EXISTS idx_bookings_salon_id ON public.bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON public.bookings(booking_date);

-- Update RLS policies for bookings to ensure strict isolation
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Salon owners can view salon bookings" ON public.bookings;
DROP POLICY IF EXISTS "Salon owners can update salon bookings" ON public.bookings;

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
        has_role(auth.uid(), salon_id, 'owner') OR 
        has_role(auth.uid(), salon_id, 'manager') OR
        has_role(auth.uid(), salon_id, 'staff')
    );

-- Policy: Salon owners/managers can update bookings for their salon
CREATE POLICY "Salon staff can update salon bookings" ON public.bookings
    FOR UPDATE USING (
        has_role(auth.uid(), salon_id, 'owner') OR 
        has_role(auth.uid(), salon_id, 'manager')
    );

-- Add constraint to ensure booking service belongs to booking salon
-- This prevents cross-salon booking attacks
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_service_salon_match;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_service_salon_match 
CHECK (
    salon_id = (SELECT salon_id FROM public.services WHERE id = service_id)
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

-- Create function to notify salon owner of new booking (placeholder for future implementation)
CREATE OR REPLACE FUNCTION notify_salon_owner()
RETURNS TRIGGER AS $$
BEGIN
    -- This function would send notifications to salon owners
    -- Implementation depends on notification system (email, SMS, push notifications)
    -- For now, we'll just log the event
    
    INSERT INTO public.booking_notifications (
        booking_id,
        salon_id,
        notification_type,
        message,
        created_at
    ) VALUES (
        NEW.id,
        NEW.salon_id,
        'new_booking',
        'New booking received for ' || (SELECT name FROM public.services WHERE id = NEW.service_id),
        NOW()
    ) ON CONFLICT DO NOTHING; -- Ignore if notifications table doesn't exist yet
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Ignore notification errors to not block booking creation
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking notifications
DROP TRIGGER IF EXISTS booking_notification_trigger ON public.bookings;
CREATE TRIGGER booking_notification_trigger
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_salon_owner();

-- Grant necessary permissions
GRANT SELECT ON public.salons TO authenticated;
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;

-- Create view for salon owners to see their booking statistics
CREATE OR REPLACE VIEW salon_booking_stats AS
SELECT 
    s.id as salon_id,
    s.name as salon_name,
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
    COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
    COUNT(CASE WHEN b.booking_date = CURRENT_DATE THEN 1 END) as today_bookings,
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN srv.price END), 0) as total_revenue
FROM public.salons s
LEFT JOIN public.bookings b ON s.id = b.salon_id
LEFT JOIN public.services srv ON b.service_id = srv.id
GROUP BY s.id, s.name;

-- Grant access to the view
GRANT SELECT ON salon_booking_stats TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Salon staff can view their salon stats" ON salon_booking_stats
    FOR SELECT USING (
        has_role(auth.uid(), salon_id, 'owner') OR 
        has_role(auth.uid(), salon_id, 'manager') OR
        has_role(auth.uid(), salon_id, 'staff')
    );

-- Enable RLS on the view
ALTER VIEW salon_booking_stats ENABLE ROW LEVEL SECURITY;