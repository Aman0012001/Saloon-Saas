import { ReactNode, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Search,
  Plus,
  Menu,
  Store,
  ChevronDown,
  MoreHorizontal,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MobileBottomNav } from "./MobileBottomNav";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  headerActions?: ReactNode;
  showBottomNav?: boolean;
}

export const MobileLayout = ({
  children,
  title: customTitle,
  showBackButton: customShowBackButton,
  headerActions,
  showBottomNav: customShowBottomNav
}: MobileLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { salons, currentSalon, setCurrentSalon, isOwner, isManager } = useSalon();

  const isUserStaff = user?.user_type === 'salon_staff' || user?.salon_role === 'staff';
  const basePath = isUserStaff ? '/staff' : '/salon';

  // Define which pages should show back button and which should show bottom nav
  const getPageConfig = (pathname: string) => {
    // Main tab pages - show bottom nav, no back button
    const mainPages = [
      `${basePath}/dashboard`,
      `${basePath}/appointments`,
      `${basePath}/customers`,
      `${basePath}/billing`
    ];

    // More tab pages - show bottom nav with back button
    const morePages = [
      `${basePath}/staff`,
      `${basePath}/services`,
      `${basePath}/inventory`,
      `${basePath}/reports`,
      `${basePath}/offers`,
      `${basePath}/settings`,
      `${basePath}/profile`
    ];

    const isMainPage = mainPages.includes(pathname);
    const isMorePage = morePages.includes(pathname);

    return {
      showBackButton: isMorePage,
      showBottomNav: isMainPage || isMorePage,
      title: getPageTitle(pathname)
    };
  };

  const getPageTitle = (pathname: string): string => {
    const titles: Record<string, string> = {
      [`${basePath}/dashboard`]: 'Dashboard',
      [`${basePath}/appointments`]: 'Appointments',
      [`${basePath}/customers`]: 'Customers',
      [`${basePath}/billing`]: 'Billing',
      [`${basePath}/staff`]: 'Staff',
      [`${basePath}/services`]: 'Services',
      [`${basePath}/reports`]: 'Reports',
      [`${basePath}/offers`]: 'Offers',
      [`${basePath}/settings`]: 'Settings',
      [`${basePath}/inventory`]: 'Inventory',
      [`${basePath}/profile`]: 'My Profile',
      [`${basePath}/create-salon`]: 'Create Salon',
    };

    return titles[pathname] || 'NoamSkin';
  };

  // Get page configuration
  const pageConfig = getPageConfig(location.pathname);
  const showBackButton = customShowBackButton ?? pageConfig.showBackButton;
  const showBottomNav = customShowBottomNav ?? pageConfig.showBottomNav;
  const title = customTitle ?? pageConfig.title;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`${basePath}/dashboard`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header - Full Screen App Style */}
      <header className="sticky top-0 z-50 bg-white border-b border-border px-4 h-14 flex items-center gap-3 safe-area-top">
        {/* Back Button or Menu */}
        {showBackButton ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="w-10 h-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="w-10 h-10">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-white">
              <SheetHeader className="pb-6">
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>

              {/* Profile Section */}
              {!isOwner && (
                <Link
                  to={`${basePath}/profile`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 mb-6 active:scale-95 transition-transform"
                >
                  <Avatar className="w-12 h-12 ring-2 ring-accent/20">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-white">
                      {user?.email ? getInitials(user.email) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user?.email?.split("@")[0]}</p>
                    <p className="text-sm text-muted-foreground">
                      {isOwner ? "Owner" : isManager ? "Manager" : "Staff"}
                    </p>
                  </div>
                  <User className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}

              {/* Salon Selector */}
              {salons.length > 0 && (
                <div className="mb-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left font-normal h-12"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Store className="w-4 h-4 text-muted-foreground" />
                          <div className="truncate">
                            <p className="font-medium text-sm truncate">
                              {currentSalon?.name || "Select Salon"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {currentSalon?.city || "Location"}
                            </p>
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      {salons.map((salon) => (
                        <DropdownMenuItem
                          key={salon.id}
                          onClick={() => setCurrentSalon(salon)}
                          className={cn(
                            "cursor-pointer p-3",
                            currentSalon?.id === salon.id && "bg-accent/10 text-accent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Store className="w-4 h-4" />
                            <div>
                              <p className="font-medium">{salon.name}</p>
                              <p className="text-xs text-muted-foreground">{salon.city}</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate(`${basePath}/create-salon`)}
                        className="cursor-pointer p-3 text-accent"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Salon
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                Sign Out
              </Button>
            </SheetContent>
          </Sheet>
        )}

        {/* Page Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {headerActions}

          {!showBackButton && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="relative w-10 h-10"
              >
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-destructive">
                  3
                </Badge>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Page Content - Full Screen */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 pb-safe">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Only on main pages */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
};
