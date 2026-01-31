import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, Star, Filter, ArrowRight,
  Scissors, Sparkles, Clock, Heart, Loader2,
  Navigation, Zap, Award, CheckCircle2, User, Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { getImageUrl } from "@/utils/imageUrl";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";


export default function SalonListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [realSalons, setRealSalons] = useState<any[]>([]);
  const [visitedSalonIds, setVisitedSalonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchSalons = async () => {
    try {
      setLoading(true);
      // Fetch salons from local PHP API
      const data = await api.salons.getAll();

      // If user logged in, check visited salons in local backend
      if (user) {
        try {
          const bookings = await api.bookings.getAll({ user_id: user.id });
          if (bookings) {
            setVisitedSalonIds([...new Set(bookings.map((b: any) => b.salon_id))] as string[]);
          }
        } catch (e) {
          console.error("Local bookings sync failed:", e);
        }
      }

      // Handle the response - the API returns { salons: [...] }
      const salonsArray = Array.isArray(data) ? data : (data?.salons || []);
      console.log("[ServicesSection] Salons array mapped:", salonsArray);

      const formattedSalons = salonsArray.map((salon: any) => ({
        id: salon.id,
        name: salon.name,
        image: getImageUrl(salon.cover_image_url, 'cover', salon.id),
        logo: getImageUrl(salon.logo_url, 'logo', salon.id),
        rating: Number(salon.rating || 0),
        reviews: Number(salon.review_count || 0),
        address: salon.address || "Main Street",
        city: salon.city || "Local",
        distance: (Math.random() * 5).toFixed(1) + " km",
        categories: salon.categories ? salon.categories.split(',') : ["Beauty", "Spa"],
        status: "Open locally",
        priceRange: "RM",
        isFeatured: Math.random() > 0.5
      }));

      setRealSalons(formattedSalons);

      // Extract unique categories for the filters
      const allCategories = formattedSalons.reduce((acc: string[], salon: any) => {
        salon.categories.forEach((cat: string) => {
          if (cat && !acc.includes(cat)) acc.push(cat);
        });
        return acc;
      }, ["All"]);
      setCategories(allCategories);
    } catch (error) {
      console.error("Error fetching local salons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, [user]);

  const filteredSalons = realSalons.filter(salon => {
    const matchesCategory = activeCategory === "All" || salon.categories.includes(activeCategory);
    const matchesSearch = salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (salon.address?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredSalons.length / itemsPerPage);
  const paginatedSalons = filteredSalons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Navbar />

      {/* Modern Fixed Selection Header */}
      <div className="pt-32 pb-10 bg-[#FDFCFB]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-2 bg-accent/5 rounded-full border border-accent/10"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Discover Excellence</span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
              Local <span className="text-accent italic font-serif">Boutiques</span> & Stylists
            </h1>

            {/* Ultra-Luxe Concierge Search */}
            <div className="w-full max-w-3xl relative pt-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-slate-200/40 to-accent/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/70 backdrop-blur-3xl border border-white rounded-[2rem] p-0 flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="flex-grow flex items-center px-8">
                  <Input
                    placeholder="Search by name, specialist or location..."
                    className="border-none bg-transparent h-16 text-xl font-medium placeholder:text-slate-300 focus-visible:ring-0 shadow-none px-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="md:h-16 h-14 md:px-12 bg-slate-900 hover:bg-accent text-white rounded-none md:rounded-l-none font-black text-xs uppercase tracking-[0.3em] transition-all group">
                  Explore Registry <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>


          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="font-black text-slate-900 text-xs uppercase tracking-widest">
              {filteredSalons.length} Premium results
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Sorted by <span className="text-slate-900 underline underline-offset-4 decoration-accent/30 decoration-2">Registry Date</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Syncing local registry...</p>
          </div>
        ) : (
          <div className="space-y-16">
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedSalons.map((salon, index) => (
                  <motion.div
                    key={salon.id}
                    layoutId={salon.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <div
                      onClick={() => navigate(`/salons/${salon.id}`)}
                      className="group cursor-pointer bg-white rounded-[1.5rem] border border-slate-100 p-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] transition-all duration-500 flex flex-col h-full"
                    >
                      {/* Image Container */}
                      <div className="relative aspect-[4/3] rounded-[1.2rem] overflow-hidden">
                        <img
                          src={salon.image}
                          alt={salon.name}
                          className="w-full h-full object-cover transition-transform duration-[2.5s] group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/0 transition-colors duration-500" />

                        <div className="absolute top-4 left-4">
                          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm">
                            <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                            <span className="text-xs font-black text-slate-900">
                              {(typeof salon.rating === 'number' ? salon.rating : Number(salon.rating || 0)).toFixed(1)}
                              {salon.reviews > 0 && <span className="text-slate-400 font-bold ml-1">· {salon.reviews}</span>}
                            </span>
                          </div>
                        </div>

                        <div className="absolute top-4 right-4">
                          <div className="bg-white/80 backdrop-blur-md w-10 h-10 rounded-xl flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <Heart className="w-4 h-4 text-slate-400 hover:text-red-500" />
                          </div>
                        </div>

                        <div className="absolute bottom-4 left-4">
                          <Badge className="bg-slate-900 text-white border-none font-black px-3 py-1 rounded-lg text-[8px] uppercase tracking-widest flex items-center gap-1">
                            <Banknote className="w-3 h-3 text-accent" />
                            {salon.priceRange}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-grow pt-4 pb-1 px-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              {salon.isFeatured && (
                                <span className="text-[6px] font-black uppercase tracking-[0.3em] text-accent bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                                </span>
                              )}
                              {/* <span className="text-[6px] font-black uppercase tracking-[0.3em] text-slate-300">
                                {salon.reviews} Local Reviews
                              </span> */}
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-accent transition-colors truncate">
                              {salon.name}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-400">
                              <MapPin className="w-2.5 h-2.5 text-accent/50" />
                              <p className="text-[9px] font-bold uppercase tracking-widest truncate">{salon.address}, {salon.city}</p>
                            </div>
                          </div>

                          <div className="h-px bg-slate-50 w-full" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full border border-slate-50 p-0.5 overflow-hidden">
                                <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center overflow-hidden">
                                  <img
                                    src={salon.logo}
                                    alt={salon.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = getImageUrl(null, 'logo', salon.id);
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9.5px] font-black uppercase tracking-widest text-black">Managing By Owner</span>
                                {/* <p className="text-[10px] font-black text-slate-900 uppercase">{salon.owner_name || "Boutique Owner"}</p> */}
                              </div>
                            </div>

                          </div>
                        </div>

                        <div className="pt-4">
                          <Button className="w-full h-11 bg-[#5F4C3C] hover:bg-[#4E3F32] border-none text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] transition-all shadow-sm">
                            Visit Experience &rarr;
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {totalPages > 1 && (
              <div className="pt-24 border-t border-slate-100">
                <Pagination>
                  <PaginationContent className="bg-slate-900 p-2 rounded-2xl shadow-2xl">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); if (currentPage > 1) handlePageChange(currentPage - 1); }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                          className="w-12 h-12 rounded-xl border-none font-black"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) handlePageChange(currentPage + 1); }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}

        {!loading && filteredSalons.length === 0 && (
          <div className="py-40 text-center space-y-4">
            <Scissors className="w-16 h-16 text-slate-100 mx-auto" />
            <h2 className="text-3xl font-black text-slate-900">No saloons detected in this zone.</h2>
            <Button variant="link" onClick={() => { setSearchTerm(""); setActiveCategory("All"); }} className="text-accent font-bold underline">Reset Local Filter</Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
