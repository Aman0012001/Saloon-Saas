import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Scissors,
  Receipt,
  Package,
  BarChart3,
  Gift,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Store,
  Bell,
  Search,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SalonNotificationSystem } from "./SalonNotificationSystem";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    description: "Overview & analytics"
  },
  {
    icon: Calendar,
    label: "Appointments",
    path: "/dashboard/appointments",
    description: "Manage bookings"
  },
  {
    icon: Users,
    label: "Customers",
    path: "/dashboard/customers",
    description: "Client management"
  },
  {
    icon: UserCog,
    label: "Staff",
    path: "/dashboard/staff",
    description: "Team & roles"
  },
  {
    icon: Scissors,
    label: "Services",
    path: "/dashboard/services",
    description: "Service catalog"
  },
  {
    icon: Receipt,
    label: "Billing",
    path: "/dashboard/billing",
    description: "Payments & invoices"
  },
  {
    icon: Package,
    label: "Inventory",
    path: "/dashboard/inventory",
    description: "Stock management"
  },
  {
    icon: BarChart3,
    label: "Reports",
    path: "/dashboard/reports",
    description: "Analytics & insights"
  },
  {
    icon: Gift,
    label: "Offers",
    path: "/dashboard/offers",
    description: "Promotions & deals"
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/dashboard/settings",
    description: "Business configuration"
  },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { salons, currentSalon, setCurrentSalon, isOwner, isManager } = useSalon();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredNavItems = navItems.filter((item) => {
    // Staff can only see limited items
    if (!isOwner && !isManager) {
      return ["Dashboard", "Appointments", "Customers"].includes(item.label);
    }
    // Managers can see most items except Settings
    if (isManager && !isOwner) {
      return item.label !== "Settings";
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex w-full">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-72 h-screen bg-white shadow-[0_0_20px_rgba(0,0,0,0.05)] border-r border-border/50 transform transition-all duration-300 ease-in-out lg:transform-none shadow-2xl lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Salon Selector */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between mb-6">
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center shadow-lg">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-xl text-foreground">NoamSkin</span>
                  <p className="text-xs text-muted-foreground">Professional</p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-secondary/50"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Salon Selector */}
            {salons.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal h-12 bg-secondary/30 border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Store className="w-4 h-4 text-accent" />
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-sm truncate">
                          {currentSalon?.name || "Select Salon"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {currentSalon?.city || "Location"}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-xl border-border/50">
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
                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                          <Store className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">{salon.name}</p>
                          <p className="text-xs text-muted-foreground">{salon.city}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard/create-salon")}
                    className="cursor-pointer p-3 text-accent hover:bg-accent/10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Salon
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative",
                    isActive
                      ? "bg-gradient-to-r from-accent to-accent/90 text-white shadow-lg shadow-accent/25"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground",
                    "group-hover:scale-110"
                  )} />
                  <div className="flex-1 flex flex-col">
                    <span className={cn(
                      "font-medium leading-none",
                      isActive ? "text-white" : "text-foreground"
                    )}>
                      {item.label}
                    </span>
                    <span className={cn(
                      "text-[10px] mt-1 line-clamp-1",
                      isActive ? "text-white/80" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <Avatar className="w-10 h-10 ring-2 ring-accent/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-white text-sm font-medium">
                  {user?.email ? getInitials(user.email) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {user?.email?.split("@")[0]}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {isOwner ? "Owner" : isManager ? "Manager" : "Staff"}
                  </Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-xl border-border/50">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border/50 px-8 h-20 flex items-center justify-between shadow-sm">
          {/* Left: Mobile Menu & Logo */}
          <div className="flex-1 flex items-center gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-secondary/50 rounded-xl"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 text-foreground" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center shadow-md">
                  <Scissors className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-foreground tracking-tight">NoamSkin</span>
              </div>
            </div>

            {/* Desktop Page Info or Breadcrumb could go here */}
            <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Store className="w-4 h-4" />
              <span>{currentSalon?.name || "No Salon Selected"}</span>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-xl group">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              </div>
              <Input
                placeholder="Search customers, appointments, reports..."
                className="pl-11 pr-4 py-6 bg-secondary/20 border-border/30 rounded-2xl focus:bg-white focus:ring-4 focus:ring-accent/5 focus:border-accent/30 transition-all duration-300 text-sm font-medium placeholder:text-muted-foreground/60 w-full shadow-inner"
              />
              <div className="absolute inset-y-0 right-4 flex items-center gap-2 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">⌘K</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex-1 flex items-center justify-end gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-xl border-border/50 bg-white/50 hover:bg-white hover:border-accent/30 hover:shadow-lg transition-all"
                onClick={() => navigate("/dashboard/appointments")}
              >
                <Plus className="w-4 h-4 mr-2 text-accent" />
                <span className="font-bold text-xs uppercase tracking-wider text-foreground">Quick Add</span>
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 bg-border/50 hidden md:block" />

            <div className="flex items-center gap-3">
              <SalonNotificationSystem />

              <div className="h-11 w-11 rounded-xl overflow-hidden border-2 border-border/30 hover:border-accent/50 transition-colors cursor-pointer lg:hidden" onClick={() => navigate("/dashboard/settings")}>
                <Avatar className="h-full w-full">
                  <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">
                    {user?.email ? getInitials(user.email) : "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-10 bg-[#f8fafc]">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
