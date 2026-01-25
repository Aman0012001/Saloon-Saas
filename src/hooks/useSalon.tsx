import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  business_hours: any;
  tax_settings: any;
  notification_settings: any;
  is_active: boolean | null;
  approval_status: 'pending' | 'approved' | 'rejected' | null;
  rejection_reason: string | null;
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

    try {
      // 1. Fetch user's salons and roles directly from the new API
      const mySalons = await api.salons.getMySalons();

      // The backend returns salons with roles attached in mySalons query
      // or we can fetch roles separately. Let's assume roles are needed.
      const rolesData = await api.userRoles.getByUser(user.id);

      const formattedSalons: Salon[] = mySalons.map((s: any) => ({
        ...s,
        approval_status: s.approval_status as 'pending' | 'approved' | 'rejected' | null
      }));

      setSalons(formattedSalons);

      // 2. Set current salon from localStorage or first salon
      const savedSalonId = localStorage.getItem('currentSalonId');
      const savedSalon = formattedSalons.find(s => s.id === savedSalonId);
      const initialSalon = savedSalon || formattedSalons[0] || null;

      setCurrentSalon(initialSalon);

      // 3. Set user role for current salon
      if (initialSalon) {
        const role = rolesData.find((r: any) => r.salon_id === initialSalon.id);
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
    }
  };

  const refreshSalons = async () => {
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

    try {
      const newSalon = await api.salons.create(data);

      toast({
        title: "Salon Submitted Successfully!",
        description: "Your salon is pending admin approval. You'll be notified once it's reviewed.",
      });

      await refreshSalons();
      return newSalon as Salon;

    } catch (error: any) {
      console.error('Error creating salon:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create salon",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSetCurrentSalon = (salon: Salon | null) => {
    setCurrentSalon(salon);
    if (salon) {
      localStorage.setItem('currentSalonId', salon.id);
      // Update user role for new salon
      api.userRoles.getByUser(user?.id || '').then((roles) => {
        const role = roles.find((r: any) => r.salon_id === salon.id);
        setUserRole(role || null);
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
