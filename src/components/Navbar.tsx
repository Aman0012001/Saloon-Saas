import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Menu, LogOut, CalendarDays, Store } from "lucide-react";
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

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "All Services", href: "/salons" },
    { name: "Pricing", href: "/pricing" },
    { name: "Contact Us", href: "/contact" },
    { name: "About Us", href: "/about" },
  ];

  const salonOwnerLinks = [
    { name: "For Salon Owners", href: "/salon-owner/signup", isButton: true },
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

            {/* Salon Owner Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-accent hover:text-accent/80 hover:bg-accent/10 gap-2"
                >
                  <Store className="w-4 h-4" />
                  For Salon Owners
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/create-salon" className="w-full cursor-pointer">
                    <Store className="w-4 h-4 mr-2" />
                    Start Free Trial
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/salon-owner/login" className="w-full cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Salon Owner Login
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="w-full cursor-pointer">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Medium Screen - Simplified Navigation */}
          <div className="hidden md:flex lg:hidden items-center gap-3">
            {user ? (
              <>
                <Link to="/my-bookings">
                  <Button variant="outline" size="sm" className="rounded-full px-3 gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Bookings
                  </Button>
                </Link>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full px-4">
                      Login
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/login" className="w-full cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Customer Login
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/salon-owner/login" className="w-full cursor-pointer">
                        <Store className="w-4 h-4 mr-2" />
                        Salon Owner Login
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/signup" className="w-full cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Customer Signup
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/my-bookings">
                  <Button variant="outline" size="sm" className="rounded-full px-4 gap-2">
                    <CalendarDays className="w-4 h-4" />
                    My Bookings
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="rounded-full px-4 gap-2">
                  <User className="w-4 h-4" />
                  {user.email?.split('@')[0]}
                </Button>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" className="rounded-full px-6">
                      Log In
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/login" className="w-full cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Customer Login
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/salon-owner/login" className="w-full cursor-pointer">
                        <Store className="w-4 h-4 mr-2" />
                        Salon Owner Login
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full px-4 gap-2">
                      <User className="w-4 h-4" />
                      Sign Up
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/signup" className="w-full cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Customer Signup
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

                {/* Salon Owner Section */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    For Salon Owners
                  </h3>
                  <div className="space-y-2">
                    <Link to="/salon-owner/login" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <User className="w-4 h-4" />
                        Salon Owner Login
                      </Button>
                    </Link>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Mobile Auth Buttons */}
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground">Customer Login</h3>
                  {user ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">{user.email}</span>
                      </div>
                      <Link to="/my-bookings" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="rounded-full w-full gap-2">
                          <CalendarDays className="w-4 h-4" />
                          My Bookings
                        </Button>
                      </Link>
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
                          Customer Login
                        </Button>
                      </Link>
                      <Link to="/signup" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="rounded-full w-full gap-2">
                          <User className="w-4 h-4" />
                          Customer Signup
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
