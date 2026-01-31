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
  logo_public_id: string | null;
  cover_image_url: string | null;
  cover_image_public_id: string | null;
  business_hours: any;
  tax_settings: any;
  notification_settings: any;
  is_active: boolean | null;
  approval_status: 'pending' | 'approved' | 'rejected' | null;
  rejection_reason: string | null;
  upi_id: string | null;
  bank_details: string | null;
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
  subscription: SubscriptionDetails | null;
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

interface SubscriptionDetails {
  plan_name: string;
  max_staff: number;
  max_services: number;
  current_staff_count: number;
  current_service_count: number;
  status: string;
  subscription_end_date: string;
  is_valid: boolean;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export const SalonProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);

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
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user's salons
      const mySalons = await api.salons.getMySalons();
      const rolesData = await api.userRoles.getByUser(user.id);

      const formattedSalons: Salon[] = (mySalons as any[]).map((s: any) => ({
        ...s,
        approval_status: s.approval_status as 'pending' | 'approved' | 'rejected' | null
      }));

      setSalons(formattedSalons);

      // 2. Set current salon
      const savedSalonId = localStorage.getItem('currentSalonId');
      const savedSalon = formattedSalons.find(s => s.id === savedSalonId);
      const initialSalon = savedSalon || formattedSalons[0] || null;

      setCurrentSalon(initialSalon);

      // 3. Set user role & subscription for current salon
      if (initialSalon) {
        const role = rolesData.find((r: any) => r.salon_id === initialSalon.id);
        setUserRole(role || null);

        // Fetch subscription details
        try {
          const subData: any = await api.subscriptions.getMySalonSubscriptions(initialSalon.id);
          // Backend now returns { subscription: ... } object or list. API service unwraps it.
          // If the backend returns a single object from 'subscription' key:
          setSubscription(subData?.subscription || subData || null);
        } catch (e) {
          console.error("Failed to load subscription status", e);
          setSubscription(null);
        }
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

  // When switching salon, update limits
  const handleSetCurrentSalon = async (salon: Salon | null) => {
    setCurrentSalon(salon);
    if (salon) {
      localStorage.setItem('currentSalonId', salon.id);

      // Update role
      const roles = await api.userRoles.getByUser(user?.id || '');
      const role = roles.find((r: any) => r.salon_id === salon.id);
      setUserRole(role || null);

      // Update subscription
      try {
        const subData: any = await api.subscriptions.getMySalonSubscriptions(salon.id);
        setSubscription(subData?.subscription || subData || null);
      } catch (e) {
        setSubscription(null);
      }
    } else {
      localStorage.removeItem('currentSalonId');
      setUserRole(null);
      setSubscription(null);
    }
  };

  const refreshSalons = async () => {
    await fetchSalons();
  };

  const createSalon = async (data: CreateSalonData): Promise<Salon | null> => {
    if (!user) {
      toast({ title: "Error", description: "Login required", variant: "destructive" });
      return null;
    }
    try {
      const newSalon = await api.salons.create(data);
      toast({ title: "Success", description: "Salon submitted for approval." });
      await refreshSalons();
      return newSalon as Salon;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
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
        subscription,
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
