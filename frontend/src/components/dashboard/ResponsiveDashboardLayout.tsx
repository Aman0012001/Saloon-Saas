import { ReactNode, useEffect, useState } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { MobileLayout } from "./MobileLayout";

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