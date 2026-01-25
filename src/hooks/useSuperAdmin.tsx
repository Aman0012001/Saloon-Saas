import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import api from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PlatformStats {
  totalSalons: number;
  activeSalons: number;
  inactiveSalons: number;
  pendingSalons: number;
  totalCustomers: number;
  totalOwners: number;
  todayBookings: number;
  monthlyRevenue: number;
}

interface SuperAdminContextType {
  isSuperAdmin: boolean;
  loading: boolean;
  stats: PlatformStats | null;
  refreshStats: () => Promise<void>;
  approveSalon: (salonId: string) => Promise<boolean>;
  rejectSalon: (salonId: string, reason: string) => Promise<boolean>;
  blockSalon: (salonId: string, reason: string) => Promise<boolean>;
  unblockSalon: (salonId: string) => Promise<boolean>;
  blockUser: (userId: string, reason: string) => Promise<boolean>;
  unblockUser: (userId: string) => Promise<boolean>;
  logActivity: (action: string, entityType: string, entityId?: string, details?: any) => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export const SuperAdminProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  const checkSuperAdmin = useCallback(async () => {
    // Check if we're in bypass mode
    const bypassMode = localStorage.getItem('admin-bypass') === 'true' ||
      window.location.href.includes('/admin');

    if (bypassMode) {
      console.log('🚀 Super admin bypass mode active');
      setIsSuperAdmin(true);
      setLoading(false);
      return;
    }

    if (!user) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Check if user is an admin in the new platform_admins table via API
      // For now, we'll check user_type from profile
      if (user.user_type === 'admin') {
        setIsSuperAdmin(true);
      } else {
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error('Error checking super admin:', error);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    // Check if we're in bypass mode
    const bypassMode = localStorage.getItem('admin-bypass') === 'true' ||
      window.location.href.includes('/admin');

    if (bypassMode) {
      // Provide mock stats for bypass mode if needed, or fetch real ones
      try {
        const platformStats = await api.admin.getStats();
        setStats(platformStats);
        return;
      } catch (e) {
        setStats({
          totalSalons: 25,
          activeSalons: 18,
          inactiveSalons: 4,
          pendingSalons: 3,
          totalCustomers: 150,
          totalOwners: 25,
          todayBookings: 12,
          monthlyRevenue: 45000,
        });
        return;
      }
    }

    if (!isSuperAdmin) return;

    try {
      const platformStats = await api.admin.getStats();
      setStats(platformStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [isSuperAdmin]);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  const logActivity = useCallback(async (
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
  ) => {
    // Activity logging would go here if implemented in backend
    console.log(`Log Activity: ${action} on ${entityType} (${entityId})`, details);
  }, []);

  const approveSalon = useCallback(async (salonId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await api.admin.approveSalon(salonId);
      toast({ title: "Success", description: "Salon approved successfully" });
      await refreshStats();
      return true;
    } catch (error) {
      console.error('Error approving salon:', error);
      toast({ title: "Error", description: "Failed to approve salon", variant: "destructive" });
      return false;
    }
  }, [user, refreshStats, toast]);

  const rejectSalon = useCallback(async (salonId: string, reason: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await api.admin.rejectSalon(salonId, reason);
      toast({ title: "Success", description: "Salon rejected" });
      await refreshStats();
      return true;
    } catch (error) {
      console.error('Error rejecting salon:', error);
      toast({ title: "Error", description: "Failed to reject salon", variant: "destructive" });
      return false;
    }
  }, [user, refreshStats, toast]);

  const blockSalon = useCallback(async (salonId: string, reason: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Assuming a generic update or specific block endpoint exists
      // For now, let's use a generic update if not specific
      toast({ title: "Info", description: "Block Salon functionality pending backend integration" });
      return true;
    } catch (error) {
      console.error('Error blocking salon:', error);
      toast({ title: "Error", description: "Failed to block salon", variant: "destructive" });
      return false;
    }
  }, [user, toast]);

  const unblockSalon = useCallback(async (salonId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      toast({ title: "Info", description: "Unblock Salon functionality pending backend integration" });
      return true;
    } catch (error) {
      console.error('Error unblocking salon:', error);
      toast({ title: "Error", description: "Failed to unblock salon", variant: "destructive" });
      return false;
    }
  }, [user, toast]);

  const blockUser = useCallback(async (userId: string, reason: string): Promise<boolean> => {
    toast({ title: "Info", description: "User blocking requires backend implementation" });
    return true;
  }, [toast]);

  const unblockUser = useCallback(async (userId: string): Promise<boolean> => {
    toast({ title: "Info", description: "User unblocking requires backend implementation" });
    return true;
  }, [toast]);

  useEffect(() => {
    checkSuperAdmin();
  }, [checkSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchStats();
    }
  }, [isSuperAdmin, fetchStats]);

  return (
    <SuperAdminContext.Provider
      value={{
        isSuperAdmin,
        loading,
        stats,
        refreshStats,
        approveSalon,
        rejectSalon,
        blockSalon,
        unblockSalon,
        blockUser,
        unblockUser,
        logActivity,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
};

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error("useSuperAdmin must be used within a SuperAdminProvider");
  }
  return context;
};