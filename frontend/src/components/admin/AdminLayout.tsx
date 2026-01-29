import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  Megaphone,
  Shield,
  Menu,
  LogOut,
  Bell,
  ChevronDown,
  MessageSquare,
  Package,
  Plus,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { NotificationSystem } from "@/components/admin/NotificationSystem";
import { cn } from "@/lib/utils";
import "../../styles/admin-dark.css";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Building2, label: "Salons", path: "/admin/salons" },
  { icon: Users, label: "Manage Members", path: "/admin/members" },
  { icon: Zap, label: "Membership Plans", path: "/admin/plans" },
  { icon: MessageSquare, label: "Contact Enquiries", path: "/admin/contact-enquiries" },
  { icon: Plus, label: "Add Product", path: "/admin/products/add" },
  { icon: Package, label: "Products", path: "/admin/products" },
  { icon: CreditCard, label: "Payments", path: "/admin/payments" },
  { icon: BarChart3, label: "Reports", path: "/admin/reports" },
  { icon: Megaphone, label: "Marketing", path: "/admin/marketing" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isSuperAdmin, loading: adminLoading, stats } = useSuperAdmin();

  // No bypass mode for security
  const bypassMode = false;

  useEffect(() => {
    // Skip authentication checks in bypass mode
    if (bypassMode) {
      console.log('🚀 Admin bypass mode active - skipping auth checks');
      return;
    }

    if (!authLoading && !user) {
      navigate("/login");
    } else if (!adminLoading && user && !isSuperAdmin) {
      navigate("/");
    }
  }, [user, authLoading, isSuperAdmin, adminLoading, navigate, bypassMode]);

  // Show loading only if not in bypass mode
  if (!bypassMode && (authLoading || adminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location.pathname === item.path;

    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
          isActive
            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
            : "text-gray-300 hover:text-white hover:bg-gray-700/50 hover:transform hover:scale-105"
        )}
      >
        <item.icon className={cn(
          "w-5 h-5 transition-all duration-200",
          isActive ? "text-white" : "text-gray-400 group-hover:text-white"
        )} />
        <span className="font-medium">{item.label}</span>
        {isActive && (
          <div className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse"></div>
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      <div className="p-6 border-b border-gray-700">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-white">Super Admin</h1>
            <p className="text-xs text-gray-400">Platform Control Center</p>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-gray-700 bg-gray-800/50 space-y-3">
        {(stats?.pendingSalons || 0) > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
              <span className="text-sm font-medium text-orange-300">Pending Approvals</span>
            </div>
            <Badge className="bg-orange-500 text-white shadow-lg">{stats?.pendingSalons || 0}</Badge>
          </div>
        )}

        <Link
          to="/admin/notifications"
          className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-colors"
        >
          <div className="flex items-center gap-2 text-blue-300">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">System Alerts</span>
          </div>
          {/* We can use a small portion of stats if unread count exists for admin */}
          <Badge className="bg-blue-600 text-white shadow-lg">Live</Badge>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 shadow-2xl">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 lg:hidden bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 shadow-sm">
        <div className="flex h-16 items-center gap-4 px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-gray-700 text-gray-300">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-gray-900 border-gray-700 text-white">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <h1 className="font-bold text-lg text-white">Super Admin</h1>
          </div>

          <Button variant="ghost" size="icon" className="hover:bg-gray-700 text-gray-300">
            <NotificationSystem />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 h-16 items-center gap-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm px-8 shadow-sm">
          <div className="flex-1" />

          <NotificationSystem />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hover:bg-gray-700 text-gray-300">
                <div className="relative">
                  <Avatar className="h-9 w-9 ring-2 ring-blue-500/20">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">SA</AvatarFallback>
                  </Avatar>
                  {(stats?.pendingSalons || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-black text-white border-2 border-gray-800 animate-pulse shadow-lg">
                      {stats?.pendingSalons}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline-block font-medium text-white">Super Admin</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700 text-white">
              <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700">
                <Link to="/">View Platform</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem onClick={signOut} className="text-red-400 hover:bg-gray-700 focus:bg-gray-700">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8 min-h-screen bg-gray-900 text-white">
          {children}
        </main>
      </div>
    </div>
  );
}