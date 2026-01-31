import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import api from "@/services/api";
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
    const bypassMode = false;

    if (bypassMode) {
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
      // Local PHP backend check
      if (user.user_type === 'admin' || user.user_type === 'super_admin') {
        setIsSuperAdmin(true);
      } else {
        setIsSuperAdmin(false);
      }
    } catch (error) {
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    try {
      const platformStats = await api.admin.getStats();
      setStats({
        totalSalons: platformStats.total_salons || 0,
        activeSalons: platformStats.active_salons || 0,
        inactiveSalons: platformStats.inactive_salons || 0,
        pendingSalons: platformStats.pending_salons || 0,
        totalCustomers: platformStats.total_users || 0,
        totalOwners: 0,
        todayBookings: 0,
        monthlyRevenue: platformStats.total_revenue || 0,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  const logActivity = useCallback(async (
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
  ) => {
    console.log(`Log Activity Local: ${action} on ${entityType}`, details);
  }, []);

  const approveSalon = useCallback(async (salonId: string): Promise<boolean> => {
    try {
      await api.admin.approveSalon(salonId);
      toast({ title: "Success", description: "Saloon approved locally." });
      await refreshStats();
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Verification failed.", variant: "destructive" });
      return false;
    }
  }, [refreshStats, toast]);

  const rejectSalon = useCallback(async (salonId: string, reason: string): Promise<boolean> => {
    try {
      await api.admin.rejectSalon(salonId, reason);
      toast({ title: "Rejected", description: "Application discarded locally." });
      await refreshStats();
      return true;
    } catch (error) {
      return false;
    }
  }, [refreshStats]);

  const blockSalon = useCallback(async (salonId: string, reason: string): Promise<boolean> => {
    try {
      await api.salons.update(salonId, { is_active: false, block_reason: reason });
      toast({ title: "Blocked", description: "Saloon restricted." });
      return true;
    } catch (error) {
      return false;
    }
  }, [toast]);

  const unblockSalon = useCallback(async (salonId: string): Promise<boolean> => {
    try {
      await api.salons.update(salonId, { is_active: true });
      toast({ title: "Unblocked", description: "Saloon access restored." });
      return true;
    } catch (error) {
      return false;
    }
  }, [toast]);

  const blockUser = useCallback(async (userId: string, reason: string): Promise<boolean> => {
    toast({ title: "Info", description: "User blocking functionality pending local sync" });
    return true;
  }, [toast]);

  const unblockUser = useCallback(async (userId: string): Promise<boolean> => {
    return true;
  }, []);

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
