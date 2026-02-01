import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Receipt,
  MoreHorizontal,
  UserCog,
  Scissors,
  BarChart3,
  Gift,
  Settings,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";

export const MobileBottomNav = () => {
  const location = useLocation();
  const { isOwner, isManager } = useSalon();
  const { user } = useAuth();

  const isUserStaff = user?.user_type === 'salon_staff' || user?.salon_role === 'staff';
  const basePath = isUserStaff ? '/staff' : '/salon';

  const mainTabs = [
    {
      icon: LayoutDashboard,
      label: "Home",
      path: `${basePath}/dashboard`,
      badge: null,
    },
  ];

  if (!isUserStaff) {
    mainTabs.push(
      {
        icon: Calendar,
        label: "Bookings",
        path: `${basePath}/appointments`,
        badge: "3",
      },
      {
        icon: Users,
        label: "Customers",
        path: `${basePath}/customers`,
        badge: null,
      },
      {
        icon: Receipt,
        label: "Billing",
        path: `${basePath}/billing`,
        badge: null,
      }
    );
  }

  const moreTabs = [
    {
      icon: UserCog,
      label: "Staff Management",
      path: `${basePath}/staff`,
      description: "Manage team members & roles",
    },
    {
      icon: Scissors,
      label: "Services & Pricing",
      path: `${basePath}/services`,
      description: "Service catalog & pricing",
    },
    {
      icon: Package,
      label: "Inventory",
      path: `${basePath}/inventory`,
      description: "Stock management",
    },
    {
      icon: BarChart3,
      label: "Reports & Analytics",
      path: `${basePath}/reports`,
      description: "Business insights & metrics",
    },
    {
      icon: Gift,
      label: "Offers & Promotions",
      path: `${basePath}/offers`,
      description: "Discounts & special deals",
    },
    {
      icon: Settings,
      label: "Settings",
      path: `${basePath}/settings`,
      description: "Business configuration",
    },
  ];

  const filteredMoreTabs = moreTabs.filter((tab) => {
    // Staff can only see limited items
    if (!isOwner && !isManager) {
      return ["Staff Management"].includes(tab.label);
    }
    // Managers can see most items except Settings
    if (isManager && !isOwner) {
      return tab.label !== "Settings";
    }
    return true;
  });

  const isMoreTabActive = filteredMoreTabs.some(tab => location.pathname === tab.path);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {mainTabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 relative",
                isActive
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div className="relative">
                <tab.icon className={cn(
                  "w-5 h-5 mb-1 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                {tab.badge && (
                  <Badge className="absolute -top-2 -right-2 w-4 h-4 p-0 text-[10px] bg-destructive text-white flex items-center justify-center">
                    {tab.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium truncate max-w-full",
                isActive ? "text-accent font-semibold" : "text-muted-foreground"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
              )}
            </Link>
          );
        })}

        {/* More Tab with Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 relative",
                isMoreTabActive
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <MoreHorizontal className={cn(
                "w-5 h-5 mb-1 transition-transform duration-200",
                isMoreTabActive && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium",
                isMoreTabActive ? "text-accent font-semibold" : "text-muted-foreground"
              )}>
                More
              </span>
              {isMoreTabActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] bg-white border-t border-border">
            <SheetHeader className="pb-6">
              <SheetTitle className="text-left text-xl font-bold">More Options</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-1 gap-3 overflow-y-auto pb-10">
              {filteredMoreTabs.map((tab) => {
                const isActive = location.pathname === tab.path;
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all duration-200 border",
                      isActive
                        ? "bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20 text-accent"
                        : "bg-secondary/30 border-border/30 hover:bg-secondary/50 text-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isActive ? "bg-accent/20" : "bg-secondary/50"
                    )}>
                      <tab.icon className={cn(
                        "w-6 h-6",
                        isActive ? "text-accent" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-semibold",
                        isActive ? "text-accent" : "text-foreground"
                      )}>
                        {tab.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {tab.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-accent rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
