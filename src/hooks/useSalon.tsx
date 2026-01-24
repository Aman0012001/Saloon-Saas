import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface Salon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  business_hours: Json;
  tax_settings: Json;
  notification_settings: Json;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  salon_id: string;
  role: 'owner' | 'manager' | 'staff' | 'super_admin';
  created_at: string;
}

interface SalonContextType {
  salons: Salon[];
  currentSalon: Salon | null;
  userRole: UserRole | null;
  loading: boolean;
  setCurrentSalon: (salon: Salon | null) => void;
  refreshSalons: () => Promise<void>;
  createSalon: (data: CreateSalonData) => Promise<Salon | null>;
  isOwner: boolean;
  isManager: boolean;
  isStaff: boolean;
}

interface CreateSalonData {
  name: string;
  slug: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  cover_image_url?: string;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export const SalonProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSalons = async () => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    setLoading(true);
    if (!user) {
      setSalons([]);
      setCurrentSalon(null);
      setUserRole(null);
      setLoading(false);
      return;
    }

    // Safety timeout
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    try {
      // Fetch user's roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (rolesError) throw rolesError;

      if (!rolesData || rolesData.length === 0) {
        setSalons([]);
        setCurrentSalon(null);
        setUserRole(null);
        setLoading(false);
        clearTimeout(timeout);
        return;
      }

      // Fetch salons for user's roles
      const salonIds = rolesData.map(r => r.salon_id);
      const { data: salonsData, error: salonsError } = await supabase
        .from('salons')
        .select('*')
        .in('id', salonIds);

      if (salonsError) throw salonsError;

      setSalons(salonsData || []);

      // Set current salon from localStorage or first salon
      const savedSalonId = localStorage.getItem('currentSalonId');
      const savedSalon = salonsData?.find(s => s.id === savedSalonId);
      const initialSalon = savedSalon || salonsData?.[0] || null;

      setCurrentSalon(initialSalon);

      // Set user role for current salon
      if (initialSalon) {
        const role = rolesData.find(r => r.salon_id === initialSalon.id);
        setUserRole(role || null);
      }
    } catch (error) {
      console.error('Error fetching salons:', error);
      toast({
        title: "Error",
        description: "Failed to load salon data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      clearTimeout(timeout);
    }
  };

  const refreshSalons = async () => {
    setLoading(true);
    await fetchSalons();
  };

  const createSalon = async (data: CreateSalonData): Promise<Salon | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a salon",
        variant: "destructive",
      });
      return null;
    }

    const attemptCreate = async (slug: string, isRetry = false): Promise<Salon | null> => {
      try {
        const newSalonId = crypto.randomUUID();

        // 1. Create the salon
        const { error: salonError } = await supabase
          .from('salons')
          .insert({
            id: newSalonId,
            name: data.name,
            slug: slug,
            description: data.description || null,
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            pincode: data.pincode || null,
            phone: data.phone || null,
            email: data.email || null,
            logo_url: data.logo_url || null,
            cover_image_url: data.cover_image_url || null,
            is_active: false,
          });

        if (salonError) throw salonError;

        // 2. The database trigger 'on_salon_created' automatically creates the owner role
        // So we don't need to manually insert it here.

        toast({
          title: "Success",
          description: isRetry
            ? "Salon created successfully! (URL was auto-adjusted)"
            : "Salon created successfully!",
        });

        await refreshSalons();

        return {
          id: newSalonId,
          name: data.name,
          slug: slug,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...data
        } as Salon;

      } catch (error: any) {
        // Handle duplicate slug error
        if (!isRetry && error.message?.includes('salons_slug_key')) {
          console.log('Slug taken, retrying with unique suffix...');
          const uniqueSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
          return attemptCreate(`${data.slug}-${uniqueSuffix}`, true);
        }

        console.error('Error creating salon:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to create salon",
          variant: "destructive",
        });
        return null;
      }
    };

    return attemptCreate(data.slug);
  };

  const handleSetCurrentSalon = (salon: Salon | null) => {
    setCurrentSalon(salon);
    if (salon) {
      localStorage.setItem('currentSalonId', salon.id);
      // Update user role for new salon
      supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('salon_id', salon.id)
        .maybeSingle()
        .then(({ data }) => {
          setUserRole(data || null);
        });
    } else {
      localStorage.removeItem('currentSalonId');
      setUserRole(null);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, [user, authLoading]);

  const isOwner = userRole?.role === 'owner';
  const isManager = userRole?.role === 'manager';
  const isStaff = userRole?.role === 'staff';

  return (
    <SalonContext.Provider
      value={{
        salons,
        currentSalon,
        userRole,
        loading,
        setCurrentSalon: handleSetCurrentSalon,
        refreshSalons,
        createSalon,
        isOwner,
        isManager,
        isStaff,
      }}
    >
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (context === undefined) {
    throw new Error("useSalon must be used within a SalonProvider");
  }
  return context;
};
