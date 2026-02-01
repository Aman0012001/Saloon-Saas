import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Menu, LogOut, CalendarDays, LayoutDashboard, Search, ShoppingBag, ChevronDown, Star, ArrowRight } from "lucide-react";
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
import { getImageUrl } from "@/utils/imageUrl";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    suggestions: string[];
    products: any[];
    salons: any[];
    services: any[];
  }>({ suggestions: [], products: [], salons: [], services: [] });
  const [isSearching, setIsSearching] = useState(false);
  const { user, signOut } = useAuth();
  const { cartCount, addToCart } = useCart();

  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const data = await api.search.query(searchQuery);
          setSearchResults(data);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults({ suggestions: [], products: [], salons: [], services: [] });
      }
    };

    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "SALONS", href: "/salons" },
    { name: "SHOP", href: "/shop" },
    { name: "PRICING", href: "/pricing" },
    { name: "CONTACT US", href: "/contact" },
    { name: "ABOUT US", href: "/about" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Black Bar */}
      <div className="h-[2px] bg-[#1A1A1A] w-full" />

      <nav className="bg-[#F3EEEA] border-b border-[#E5E0D8]">
        <div className="container mx-auto px-4 h-20 md:h-24 flex items-center justify-between">

          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Salon Logo" className="h-10 md:h-16 w-auto" />
          </Link>

          {/* Desktop Navigation Links - Center */}
          <div className="hidden lg:flex items-center gap-10 xl:gap-14">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-[16px] font-['Outfit'] font-extrabold tracking-[0.1em] text-[#1A1A1A] transition-all flex items-center gap-1.5 relative py-1 group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#1A1A1A] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left" />
              </Link>
            ))}
          </div>

          {/* Action Icons Section - Right */}
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-[#1A1A1A] hover:opacity-60 transition-opacity"
            >
              <Search className="w-5 h-5 md:w-6 md:h-6 stroke-[1.2px]" />
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-[#1A1A1A] hover:opacity-60 transition-opacity outline-none">
                    <User className="w-5 h-5 md:w-6 md:h-6 stroke-[1.2px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-4 p-2 bg-white rounded-2xl border-none shadow-2xl">
                  <div className="px-3 py-2 border-b border-slate-50 mb-1">
                    <p className="text-sm font-black">{user.full_name}</p>
                    <p className="text-[10px] text-slate-400">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="rounded-xl h-10 focus:bg-[#F3EEEA] cursor-pointer">
                    <Link to="/user/profile" className="flex items-center gap-3">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {(() => {
                    let dashPath = "/user/dashboard";
                    let dashLabel = "My Dashboard";

                    if (user.user_type === 'admin' || user.user_type === 'super_admin') {
                      dashPath = "/super-admin/dashboard";
                      dashLabel = "Super Admin";
                    } else if (user.user_type === 'salon_owner' || user.salon_role === 'owner' || user.salon_role === 'manager') {
                      dashPath = "/salon/dashboard";
                      dashLabel = "Salon Hub";
                    } else if (user.user_type === 'salon_staff' || user.salon_role === 'staff') {
                      dashPath = "/staff/dashboard";
                      dashLabel = "Staff Hub";
                    } else if (user.user_type === 'customer') {
                      dashPath = "/my-bookings";
                      dashLabel = "My Bookings";
                    }

                    return (
                      <DropdownMenuItem asChild className="rounded-xl h-10 focus:bg-[#F3EEEA] cursor-pointer font-bold text-accent">
                        <Link to={dashPath} className="flex items-center gap-3">
                          <LayoutDashboard className="w-4 h-4" /> {dashLabel}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })()}
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem onClick={signOut} className="rounded-xl h-10 focus:bg-red-50 text-red-500 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-3" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="text-[#1A1A1A] hover:opacity-60 transition-opacity">
                <User className="w-5 h-5 md:w-6 md:h-6 stroke-[1.2px]" />
              </Link>
            )}

            <Link to="/cart" className="text-[#1A1A1A] hover:opacity-60 transition-opacity relative group">
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 stroke-[1.2px]" />
              {cartCount > 0 && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in h-fit px-1">
                  {cartCount}
                </div>
              )}
            </Link>
            <UserNotificationSystem />

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#1A1A1A]">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[350px] bg-[#F3EEEA] border-none p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-8 pb-4">
                      <SheetHeader>
                        <SheetTitle className="text-left font-serif text-2xl">Menu</SheetTitle>
                      </SheetHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-4">
                      <nav className="flex flex-col gap-6">
                        {navLinks.map((link) => (
                          <Link
                            key={link.name}
                            to={link.href}
                            onClick={() => setIsOpen(false)}
                            className="text-[16px] font-black tracking-widest text-[#1A1A1A] hover:opacity-100 transition-colors uppercase py-2 border-b border-[#1A1A1A]/5"
                          >
                            {link.name}
                          </Link>
                        ))}
                      </nav>

                      <div className="mt-12 space-y-4">
                        {user ? (
                          <>
                            <Link to="/user/profile" className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl" onClick={() => setIsOpen(false)}>
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-accent shadow-sm">
                                {user.full_name?.[0]}
                              </div>
                              <div>
                                <p className="font-black text-sm">{user.full_name}</p>
                                <p className="text-[10px] text-slate-400">View Registry Profile</p>
                              </div>
                            </Link>
                            <Button
                              variant="destructive"
                              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                              onClick={() => {
                                signOut();
                                setIsOpen(false);
                              }}
                            >
                              Sign Out
                            </Button>
                          </>
                        ) : (
                          <Link to="/login" onClick={() => setIsOpen(false)}>
                            <Button className="w-full h-14 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">
                              Join the Club
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="p-8 bg-[#1A1A1A]/5 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">
                        daily habits wellness club © 2026
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Drawer */}
      <Sheet open={isSearchOpen} onOpenChange={(open) => {
        setIsSearchOpen(open);
        if (!open) setSearchQuery("");
      }}>
        <SheetContent side="right" className="w-full sm:w-[450px] bg-[#F3EEEA] border-none p-0">
          <div className="p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-['DM_Serif_Display'] text-[#1A1A1A]">Search</h2>
            </div>

            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-[#1A1A1A] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-14 pr-6 bg-white/50 border-none rounded-full text-lg font-['Outfit'] focus:bg-white focus:ring-2 focus:ring-[#1A1A1A]/5 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {searchQuery.trim() !== "" && (
              <div className="flex-1 mt-12 overflow-y-auto scrollbar-hide">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-4 border-[#1A1A1A]/10 border-t-[#1A1A1A] animate-spin mb-4" />
                    <p className="text-sm font-['Outfit'] font-bold text-[#1A1A1A]/40 uppercase tracking-widest">Searching...</p>
                  </div>
                ) : (
                  <>
                    {/* Suggestions Section */}
                    {searchResults.suggestions.length > 0 && (
                      <div className="mb-10">
                        <h3 className="text-xl font-bold font-['Outfit'] text-[#1A1A1A] mb-4">Suggestions</h3>
                        <div className="flex flex-col gap-3">
                          {searchResults.suggestions.map((item) => (
                            <button
                              key={item}
                              onClick={() => setSearchQuery(item)}
                              className="text-left text-base font-['Outfit'] font-normal text-[#1A1A1A] hover:underline decoration-1 underline-offset-4"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products Section */}
                    {searchResults.products.length > 0 && (
                      <div className="mb-10 border-t border-[#1A1A1A]/5 pt-10">
                        <h3 className="text-xl font-bold font-['Outfit'] text-[#1A1A1A] mb-8">Products</h3>
                        <div className="flex flex-col gap-8">
                          {searchResults.products.map((product) => (
                            <div key={product.id} className="flex items-center gap-6 group cursor-pointer" onClick={() => setIsSearchOpen(false)}>
                              <div className="w-20 h-24 bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                <img
                                  src={getImageUrl(product.image_url, 'service', product.id)}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-lg font-bold font-['Outfit'] leading-tight group-hover:opacity-60 transition-opacity">
                                  {product.name}
                                </p>
                                <p className="text-sm font-['Outfit'] font-medium text-slate-500 mt-1">RM {product.price}</p>
                              </div>
                              <Button
                                size="sm"
                                className="rounded-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90 h-10 px-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart({
                                    id: product.id,
                                    name: product.name,
                                    price: Number(product.price),
                                    image_url: product.image_url,
                                    type: 'product'
                                  });
                                  toast.success("Added to bag");
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Services Section */}
                    {searchResults.services.length > 0 && (
                      <div className="mb-10 border-t border-[#1A1A1A]/5 pt-10">
                        <h3 className="text-xl font-bold font-['Outfit'] text-[#1A1A1A] mb-8">Services</h3>
                        <div className="flex flex-col gap-8">
                          {searchResults.services.map((service) => (
                            <div key={service.id} className="flex items-center gap-6 group cursor-pointer" onClick={() => setIsSearchOpen(false)}>
                              <div className="w-20 h-24 bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                <img
                                  src={getImageUrl(service.image_url, 'service', service.id)}
                                  alt={service.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-lg font-bold font-['Outfit'] leading-tight group-hover:opacity-60 transition-opacity">
                                  {service.name}
                                </p>
                                <p className="text-sm font-['Outfit'] font-medium text-slate-500 mt-1">{service.salon_name}</p>
                                <p className="text-sm font-['Outfit'] font-bold text-accent mt-1">RM {service.price}</p>
                              </div>
                              <Button
                                size="sm"
                                className="rounded-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90 h-10 px-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart({
                                    id: service.id,
                                    name: service.name,
                                    price: Number(service.price),
                                    image_url: service.image_url,
                                    type: 'service'
                                  });
                                  toast.success("Added to bag");
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Salons Section */}
                    {searchResults.salons.length > 0 && (
                      <div className="mb-10 border-t border-[#1A1A1A]/5 pt-10">
                        <h3 className="text-xl font-bold font-['Outfit'] text-[#1A1A1A] mb-8">Salons</h3>
                        <div className="flex flex-col gap-8">
                          {searchResults.salons.map((salon) => (
                            <div key={salon.id} className="flex items-center gap-6 group cursor-pointer" onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/salons/${salon.id}`);
                            }}>
                              <div className="w-20 h-24 bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                <img
                                  src={getImageUrl(salon.logo_url, 'logo', salon.id)}
                                  alt={salon.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-lg font-bold font-['Outfit'] leading-tight group-hover:opacity-60 transition-opacity">
                                  {salon.name}
                                </p>
                                <p className="text-sm font-['Outfit'] font-medium text-slate-500 mt-1">{salon.city}, {salon.state}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                                  <span className="text-xs font-black text-slate-900">
                                    {(typeof salon.rating === 'number' ? salon.rating : Number(salon.rating || 0)).toFixed(1)}
                                  </span>
                                  {Number(salon.review_count) > 0 && (
                                    <span className="text-[10px] text-slate-400 font-bold ml-1">· {salon.review_count} reviews</span>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Results Fallback */}
                    {searchResults.suggestions.length === 0 &&
                      searchResults.products.length === 0 &&
                      searchResults.services.length === 0 &&
                      searchResults.salons.length === 0 && (
                        <div className="py-20 text-center">
                          <p className="font-['Outfit'] text-slate-400">No results found for "{searchQuery}"</p>
                        </div>
                      )}

                    {/* Footer All Results */}
                    <div className="mt-auto border-t border-[#1A1A1A]/10 pt-6 pb-4">
                      <button className="flex items-center gap-2 text-sm font-['Outfit'] font-bold text-[#1A1A1A] hover:gap-4 transition-all group">
                        See all results for "{searchQuery}"
                        <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Navbar;
