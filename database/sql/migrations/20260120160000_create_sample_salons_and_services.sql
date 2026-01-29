-- Create sample salons and services for testing
-- This ensures there's data available for booking

-- Insert sample salons if none exist
INSERT INTO public.salons (name, slug, description, address, city, state, pincode, phone, email, is_active)
SELECT * FROM (VALUES
    ('Glamour Studio', 'glamour-studio', 'Premium beauty salon with expert stylists', '123 Fashion Street, Bandra West', 'Mumbai', 'Maharashtra', '400050', '+91 98765 43210', 'info@glamourstudio.com', true),
    ('Elite Beauty Lounge', 'elite-beauty-lounge', 'Luxury salon offering complete beauty services', '456 Park Avenue, Connaught Place', 'New Delhi', 'Delhi', '110001', '+91 98765 43211', 'contact@elitebeauty.com', true),
    ('Sparkle Salon & Spa', 'sparkle-salon-spa', 'Full-service salon and spa experience', '789 Brigade Road', 'Bangalore', 'Karnataka', '560025', '+91 98765 43212', 'hello@sparklesalon.com', true),
    ('Radiance Beauty Center', 'radiance-beauty-center', 'Modern salon with latest beauty treatments', '321 Anna Salai', 'Chennai', 'Tamil Nadu', '600002', '+91 98765 43213', 'info@radiancebeauty.com', true),
    ('Bliss Hair & Beauty', 'bliss-hair-beauty', 'Trendy salon for hair and beauty services', '654 FC Road, Pune', 'Pune', 'Maharashtra', '411005', '+91 98765 43214', 'contact@blisshair.com', true)
) AS v(name, slug, description, address, city, state, pincode, phone, email, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.salons LIMIT 1);

-- Create services for each salon
DO $$
DECLARE
    salon_record RECORD;
    service_data RECORD;
BEGIN
    -- Define services to create for each salon
    FOR salon_record IN SELECT id, name FROM public.salons LOOP
        
        -- Insert services for this salon
        FOR service_data IN 
            SELECT * FROM (VALUES
                ('Haircut & Styling', 'Professional haircut with expert styling', 299.00, 30, 'Hair'),
                ('Hair Coloring', 'Full hair color treatment with premium products', 999.00, 90, 'Hair'),
                ('Hair Spa Treatment', 'Relaxing hair spa with deep conditioning', 799.00, 60, 'Hair'),
                ('Keratin Treatment', 'Smoothening treatment for frizzy hair', 2499.00, 120, 'Hair'),
                ('Facial Cleanup', 'Deep cleansing facial for glowing skin', 599.00, 45, 'Skin'),
                ('Anti-Aging Facial', 'Advanced facial treatment for mature skin', 1299.00, 60, 'Skin'),
                ('Bridal Makeup', 'Complete bridal makeup package', 4999.00, 120, 'Makeup'),
                ('Party Makeup', 'Glamorous makeup for special occasions', 1999.00, 60, 'Makeup'),
                ('Manicure', 'Complete nail care for hands with polish', 349.00, 30, 'Nails'),
                ('Pedicure', 'Complete nail care for feet with polish', 449.00, 45, 'Nails'),
                ('Gel Nail Art', 'Creative nail art with gel polish', 799.00, 60, 'Nails'),
                ('Eyebrow Threading', 'Precise eyebrow shaping', 99.00, 15, 'Grooming'),
                ('Full Face Threading', 'Complete face threading service', 199.00, 30, 'Grooming'),
                ('Upper Lip Threading', 'Quick upper lip hair removal', 49.00, 10, 'Grooming'),
                ('Body Massage', 'Relaxing full body massage', 1499.00, 90, 'Spa'),
                ('Head Massage', 'Stress-relieving head and scalp massage', 499.00, 30, 'Spa')
            ) AS v(name, description, price, duration_minutes, category)
        LOOP
            
            INSERT INTO public.services (
                salon_id,
                name,
                description,
                price,
                duration_minutes,
                category,
                is_active,
                created_at
            ) VALUES (
                salon_record.id,
                service_data.name,
                service_data.description,
                service_data.price,
                service_data.duration_minutes,
                service_data.category,
                true,
                NOW()
            ) ON CONFLICT DO NOTHING; -- Avoid duplicates if services already exist
            
        END LOOP;
        
    END LOOP;
END $$;

-- Create sample user roles (salon owners) if none exist
-- This assumes there are users in the auth.users table
DO $$
DECLARE
    salon_record RECORD;
    user_record RECORD;
    counter INTEGER := 0;
BEGIN
    -- Get first 5 users from auth.users to make them salon owners
    FOR user_record IN 
        SELECT id FROM auth.users 
        WHERE email IS NOT NULL 
        LIMIT 5
    LOOP
        counter := counter + 1;
        
        -- Get the salon for this user (based on counter)
        SELECT id INTO salon_record FROM public.salons 
        ORDER BY created_at 
        OFFSET (counter - 1) 
        LIMIT 1;
        
        -- Make this user the owner of this salon
        INSERT INTO public.user_roles (user_id, salon_id, role)
        VALUES (user_record.id, salon_record.id, 'owner')
        ON CONFLICT (user_id, salon_id) DO NOTHING;
        
        -- Exit if we've assigned all salons
        EXIT WHEN counter >= 5;
    END LOOP;
END $$;

-- Update profiles to set user_type for salon owners
UPDATE public.profiles 
SET user_type = 'salon_owner'
WHERE user_id IN (
    SELECT user_id FROM public.user_roles WHERE role = 'owner'
) AND user_type IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_salon_category ON public.services(salon_id, category);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_date_salon ON public.bookings(booking_date, salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Grant permissions
GRANT SELECT ON public.salons TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;

-- Refresh schema
NOTIFY pgrst, 'reload schema';