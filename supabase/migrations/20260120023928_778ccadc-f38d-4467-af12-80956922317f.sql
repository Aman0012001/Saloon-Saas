-- Fix the permissive INSERT policy for salons
-- The policy allows anyone to create a salon, but we need to ensure
-- the creator automatically becomes the owner. This is intentional for SaaS onboarding.
-- However, we'll add a trigger to automatically assign owner role on salon creation.

CREATE OR REPLACE FUNCTION public.auto_assign_salon_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Automatically assign the creator as owner of the new salon
    INSERT INTO public.user_roles (user_id, salon_id, role)
    VALUES (auth.uid(), NEW.id, 'owner');
    
    -- Also create a staff profile for the owner
    INSERT INTO public.staff_profiles (user_id, salon_id, display_name, email)
    SELECT auth.uid(), NEW.id, 
           COALESCE(p.full_name, 'Owner'), 
           (SELECT email FROM auth.users WHERE id = auth.uid())
    FROM public.profiles p
    WHERE p.user_id = auth.uid();
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_salon_created
AFTER INSERT ON public.salons
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_salon_owner();