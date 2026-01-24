import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
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

    // Safety timeout
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    try {
      const { data, error } = await supabase
        .from('platform_admins')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      } else {
        setIsSuperAdmin(!!data);
      }
    } catch (error) {
      console.error('Error checking super admin:', error);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
      clearTimeout(timeout);
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    // Check if we're in bypass mode
    const bypassMode = localStorage.getItem('admin-bypass') === 'true' ||
      window.location.href.includes('/admin');

    if (bypassMode) {
      // Provide mock stats for bypass mode
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

    if (!isSuperAdmin) return;

    try {
      // Fetch all counts in parallel
      const [
        salonsResult,
        bookingsResult,
        profilesResult,
        ownersResult,
      ] = await Promise.all([
        supabase.from('salons').select('id, is_active, approval_status'),
        supabase.from('bookings').select('id, created_at, salon_id'),
        supabase.from('profiles').select('id'),
        supabase.from('user_roles').select('user_id').eq('role', 'owner'),
      ]);

      const salons = salonsResult.data || [];
      const bookings = bookingsResult.data || [];
      const profiles = profilesResult.data || [];
      const owners = ownersResult.data || [];

      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookings.filter(b =>
        b.created_at?.startsWith(today)
      ).length;

      // Calculate monthly revenue (simplified - would use actual payments in production)
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      setStats({
        totalSalons: salons.length,
        activeSalons: salons.filter(s => s.is_active && s.approval_status === 'approved').length,
        inactiveSalons: salons.filter(s => !s.is_active).length,
        pendingSalons: salons.filter(s => s.approval_status === 'pending').length,
        totalCustomers: profiles.length,
        totalOwners: new Set(owners.map(o => o.user_id)).size,
        todayBookings,
        monthlyRevenue: 0, // Would calculate from platform_payments
      });
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
    if (!user) return;

    try {
      await supabase.from('admin_activity_logs').insert({
        admin_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, [user]);

  const approveSalon = useCallback(async (salonId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('salons')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          is_active: true,
        })
        .eq('id', salonId);

      if (error) throw error;

      await logActivity('approve_salon', 'salon', salonId);
      toast({ title: "Success", description: "Salon approved successfully" });
      await refreshStats();
      return true;
    } catch (error) {
      console.error('Error approving salon:', error);
      toast({ title: "Error", description: "Failed to approve salon", variant: "destructive" });
      return false;
    }
  }, [user, logActivity, refreshStats, toast]);

  const rejectSalon = useCallback(async (salonId: string, reason: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('salons')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
          is_active: false,
        })
        .eq('id', salonId);

      if (error) throw error;

      await logActivity('reject_salon', 'salon', salonId, { reason });
      toast({ title: "Success", description: "Salon rejected" });
      await refreshStats();
      return true;
    } catch (error) {
      console.error('Error rejecting salon:', error);
      toast({ title: "Error", description: "Failed to reject salon", variant: "destructive" });
      return false;
    }
  }, [user, logActivity, refreshStats, toast]);

  const blockSalon = useCallback(async (salonId: string, reason: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('salons')
        .update({
          is_active: false,
          blocked_at: new Date().toISOString(),
          blocked_by: user.id,
          block_reason: reason,
        })
        .eq('id', salonId);

      if (error) throw error;

      await logActivity('block_salon', 'salon', salonId, { reason });
      toast({ title: "Success", description: "Salon blocked" });
      await refreshStats();
      return true;
    } catch (error) {
      console.error('Error blocking salon:', error);
      toast({ title: "Error", description: "Failed to block salon", variant: "destructive" });
      return false;
    }
  }, [user, logActivity, refreshStats, toast]);

  const unblockSalon = useCallback(async (salonId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('salons')
        .update({
          is_active: true,
          blocked_at: null,
          blocked_by: null,
          block_reason: null,
        })
        .eq('id', salonId);

      if (error) throw error;

      await logActivity('unblock_salon', 'salon', salonId);
      toast({ title: "Success", description: "Salon unblocked" });
      await refreshStats();
      return true;
    } catch (error) {
      console.error('Error unblocking salon:', error);
      toast({ title: "Error", description: "Failed to unblock salon", variant: "destructive" });
      return false;
    }
  }, [user, logActivity, refreshStats, toast]);

  const blockUser = useCallback(async (userId: string, reason: string): Promise<boolean> => {
    // This would require backend function to disable auth user
    await logActivity('block_user', 'user', userId, { reason });
    toast({ title: "Info", description: "User blocking requires backend implementation" });
    return true;
  }, [logActivity, toast]);

  const unblockUser = useCallback(async (userId: string): Promise<boolean> => {
    await logActivity('unblock_user', 'user', userId);
    toast({ title: "Info", description: "User unblocking requires backend implementation" });
    return true;
  }, [logActivity, toast]);

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