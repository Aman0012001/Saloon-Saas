import { ReactNode, useEffect, useState } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { MobileLayout } from "./MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface ResponsiveDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  headerActions?: ReactNode;
  showBottomNav?: boolean;
}

export const ResponsiveDashboardLayout = ({
  children,
  title,
  showBackButton,
  headerActions,
  showBottomNav
}: ResponsiveDashboardLayoutProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      const isStaffOrOwner = user.salon_role === 'staff' || user.salon_role === 'owner' || user.salon_role === 'manager' || user.user_type === 'salon_owner' || user.user_type === 'salon_staff' || user.user_type === 'admin';

      if (user.user_type === 'customer' && !isStaffOrOwner) {
        navigate("/");
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Use mobile layout for screens smaller than lg (1024px)
  if (isMobile) {
    return (
      <MobileLayout
        showBackButton={showBackButton}
        headerActions={headerActions}
        showBottomNav={showBottomNav}
      >
        {children}
      </MobileLayout>
    );
  }

  // Use desktop layout for larger screens
  return <DashboardLayout>{children}</DashboardLayout>;
};
