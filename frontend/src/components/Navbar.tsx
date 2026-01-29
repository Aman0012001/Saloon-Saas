import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Menu, LogOut, CalendarDays, Store, Shield, LayoutDashboard } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { UserNotificationSystem } from "./UserNotificationSystem";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    const fetchUpcomingCount = async () => {
      if (user && user.id && user.user_type === 'customer') {
        try {
          const bookings = await api.bookings.getAll({ user_id: user.id });
          const upcoming = bookings.filter((b: any) =>
            (b.status === 'pending' || b.status === 'confirmed') &&
            new Date(b.booking_date) >= new Date(new Date().setHours(0, 0, 0, 0))
          );
          setUpcomingCount(upcoming.length);
        } catch (error) {
          console.error("Error fetching upcoming bookings:", error);
        }
      }
    };

    fetchUpcomingCount();
    const interval = setInterval(fetchUpcomingCount, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [user]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Salons", href: "/salons" },
    { name: "All Services", href: "/services" },
    { name: "Shop", href: "/shop" },
    { name: "Pricing", href: "/pricing" },
    { name: "Contact Us", href: "/contact" },
    { name: "About Us", href: "/about" },
  ];


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <img src={logo} alt="Salon Logo" className="h-10 md:h-16 w-auto" />
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}

          </div>

          {/* Medium Screen - Simplified Navigation */}
          <div className="hidden md:flex lg:hidden items-center gap-3">
            {user ? (
              <>
                {user.user_type === 'customer' ? (
                  <Link to="/my-bookings">
                    <Button variant="outline" size="sm" className="rounded-full px-3 gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Bookings
                    </Button>
                  </Link>
                ) : (
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="rounded-full px-3 gap-2 border-accent/20 text-accent font-bold">
                      <LayoutDashboard className="w-4 h-4" />
                      Hub
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-3 gap-2"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="rounded-full px-4">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" size="sm" className="rounded-full px-4">
                    Signup
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                {user.user_type === 'customer' ? (
                  <Link to="/my-bookings">
                    <Button variant="outline" size="sm" className="rounded-full px-4 gap-2 relative">
                      <CalendarDays className="w-4 h-4" />
                      My Bookings
                    </Button>
                  </Link>
                ) : user.user_type !== 'admin' && (
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="rounded-full px-4 gap-2 border-accent/20 text-accent font-bold">
                      <LayoutDashboard className="w-4 h-4" />
                      Manage Salon
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="rounded-full px-4 gap-2 relative">
                    <User className="w-4 h-4" />
                    {user.full_name || user.email?.split('@')[0]}
                  </Button>
                </Link>
                <UserNotificationSystem />
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 gap-2"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="default" size="sm" className="rounded-full px-6">
                    Log In
                  </Button>
                </Link>

                <Link to="/signup">
                  <Button variant="outline" size="sm" className="rounded-full px-4 gap-2">
                    <User className="w-4 h-4" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 mt-8">
                {/* Mobile Navigation Links */}
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2 border-b border-border"
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>


                {/* Mobile Auth Buttons */}
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground">Account</h3>
                  {user && (
                    <div className="flex items-center gap-3 mb-2 px-1">
                      <UserNotificationSystem />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inbox</span>
                    </div>
                  )}
                  {user ? (
                    <>
                      <Link to="/profile" className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg relative" onClick={() => setIsOpen(false)}>
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">{user.full_name || user.email}</span>
                      </Link>
                      {user.user_type === 'customer' ? (
                        <Link to="/my-bookings" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="rounded-full w-full gap-2 relative">
                            <CalendarDays className="w-4 h-4" />
                            My Bookings
                          </Button>
                        </Link>
                      ) : user.user_type !== 'admin' && (
                        <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="rounded-full w-full gap-2 border-accent/20 text-accent font-bold">
                            <LayoutDashboard className="w-4 h-4" />
                            Manage Salon
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="destructive"
                        className="rounded-full w-full gap-2"
                        onClick={() => {
                          signOut();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="default" className="rounded-full w-full">
                          Login
                        </Button>
                      </Link>
                      <Link to="/signup" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="rounded-full w-full gap-2">
                          <User className="w-4 h-4" />
                          Signup
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
