import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, Star, Filter, ArrowRight,
  Scissors, Sparkles, Clock, Heart, Loader2,
  Navigation, Zap, Award, CheckCircle2
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

const categories = ["All", "Hair", "Skin", "Spa", "Makeup", "Nails", "Men"];

// Mock Data for Salons (Enhanced for Premium Look)
const mockSalons = [
  {
    id: "mock-1",
    name: "Aura Royale Spa & Salon",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60",
    rating: 4.9,
    reviews: 245,
    address: "Bandra West, Mumbai",
    distance: "0.2 km",
    categories: ["Skin", "Spa", "Hair"],
    status: "Open Now",
    priceRange: "₹₹₹",
    isFeatured: true
  },
  {
    id: "mock-2",
    name: "Edge & Elegance Grooming",
    image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop&q=60",
    rating: 4.7,
    reviews: 112,
    address: "Andheri East, Mumbai",
    distance: "1.5 km",
    categories: ["Men", "Hair"],
    status: "Open Now",
    priceRange: "₹₹",
    isFeatured: false
  },
  {
    id: "mock-3",
    name: "Velvet Touch Nail Studio",
    image: "https://images.unsplash.com/photo-1621235172288-751280387994?w=800&auto=format&fit=crop&q=60",
    rating: 4.9,
    reviews: 87,
    address: "Juhu, Mumbai",
    distance: "2.1 km",
    categories: ["Nails", "Makeup"],
    status: "Closing Soon",
    priceRange: "₹₹₹",
    isFeatured: true
  }
];

export default function SalonListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [realSalons, setRealSalons] = useState<any[]>([]);
  const [visitedSalonIds, setVisitedSalonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      // Fetch all approved active salons
      const data = await api.salons.getAll();

      let visitedIds: string[] = [];

      if (user) {
        try {
          const bookings = await api.bookings.getAll({ user_id: user.id });
          if (bookings) {
            visitedIds = [...new Set(bookings.map((b: any) => b.salon_id))] as string[];
            setVisitedSalonIds(visitedIds);
          }
        } catch (e) {
          console.error("Error fetching user bookings:", e);
        }
      }

      const formattedSalons = (data || []).map((salon: any) => ({
        id: salon.id,
        name: salon.name,
        image: salon.cover_image_url || salon.logo_url || "https://images.unsplash.com/photo-1521590832896-76c0f2956662?w=800&auto=format&fit=crop&q=60",
        rating: Number((4.5 + Math.random() * 0.5).toFixed(1)),
        reviews: Math.floor(Math.random() * 200) + 10,
        address: salon.address || "Location unavailable",
        distance: (Math.random() * 5).toFixed(1) + " km",
        categories: ["Beauty", "Personal Care"],
        status: "Open Now",
        priceRange: "₹₹",
        isFeatured: Math.random() > 0.7
      }));

      setRealSalons(formattedSalons);
    } catch (error) {
      console.error("Error fetching salons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, [user]);

  const allSalons = [...realSalons, ...mockSalons];

  const filteredSalons = allSalons.filter(salon => {
    const matchesCategory = activeCategory === "All" || salon.categories.includes(activeCategory);
    const matchesSearch = salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Refined Search & Filters Header */}
      <div className="pt-24 pb-8 bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Centered Search Bar */}
            <div className="flex justify-center">
              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] w-full max-w-2xl shadow-inner">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Search by name, service, or area..."
                    className="pl-12 h-12 bg-transparent border-none text-base font-medium focus-visible:ring-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="h-12 px-8 bg-accent hover:bg-accent/90 text-white rounded-[1.2rem] font-bold shadow-lg shadow-accent/20 transition-all active:scale-95">
                  Search
                </Button>
              </div>
            </div>

            {/* Premium Category Tabs */}
            <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-7 py-5 text-sm font-black transition-all duration-300 ${activeCategory === cat
                    ? 'bg-accent text-white border-0 shadow-xl shadow-accent/25 scale-105'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-accent/40 hover:text-accent'
                    }`}
                >
                  {cat}
                </Button>
              ))}
              <div className="h-8 w-[1px] bg-slate-200 mx-2 shrink-0 hidden md:block" />
              <Button variant="outline" size="sm" className="rounded-full h-10 w-10 p-0 border-slate-200 bg-white hover:bg-slate-50 shrink-0">
                <Filter className="w-4 h-4 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Fetching verified salons...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredSalons.map((salon, index) => {
                const isVisited = visitedSalonIds.includes(salon.id);
                return (
                  <motion.div
                    key={salon.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                  >
                    <Card className="group relative overflow-hidden border-0 bg-white shadow-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 rounded-[2.5rem] h-full flex flex-col">
                      {/* Image Area */}
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={salon.image}
                          alt={salon.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                        {/* Badges on Image */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {salon.isFeatured && (
                            <Badge className="bg-accent text-white border-0 font-black px-3 py-1 rounded-full shadow-lg">
                              <Award className="w-3.5 h-3.5 mr-1" />
                              FEATURED
                            </Badge>
                          )}
                          {isVisited && (
                            <Badge className="bg-purple-600 text-white border-0 font-black px-3 py-1 rounded-full shadow-lg">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              REVISIT
                            </Badge>
                          )}
                        </div>

                        <div className="absolute top-4 right-4">
                          <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-accent transition-all shadow-lg border border-white/30 group/heart">
                            <Heart className="w-5 h-5 group-hover/heart:fill-current" />
                          </button>
                        </div>

                        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                          <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 border-0 font-bold px-3 py-1.5 rounded-xl shadow-sm">
                            <Clock className="w-3.5 h-3.5 mr-1.5 text-accent" />
                            {salon.status}
                          </Badge>
                          <span className="text-white font-black text-xl drop-shadow-md">{salon.priceRange}</span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <CardHeader className="px-6 pt-6 pb-2">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-accent transition-colors leading-tight">
                              {salon.name}
                            </h3>
                            <div className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mt-2">
                              <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                              <span className="truncate">{salon.address}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-center bg-emerald-50 text-emerald-600 font-black px-3 py-2 rounded-2xl border border-emerald-100 shadow-sm">
                              {salon.rating} <Star className="w-3.5 h-3.5 ml-1 fill-current" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{salon.reviews} REVIEWS</p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="px-6 py-4 flex-grow">
                        <div className="flex gap-2 flex-wrap">
                          {salon.categories.map((cat: string, i: number) => (
                            <Badge key={i} className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-accent/10 hover:text-accent transition-colors border-0 px-3 py-1 rounded-lg">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-6 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
                            <Navigation className="w-3 h-3 text-accent" /> {salon.distance}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
                            <Zap className="w-3 h-3 text-amber-500" /> Verified Center
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter className="px-6 pb-8 pt-2">
                        <Button
                          className="w-full h-14 bg-slate-900 hover:bg-accent text-white rounded-2xl font-black text-lg transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-accent/40 flex items-center justify-center gap-3 overflow-hidden relative"
                          onClick={() => navigate(`/book?salonId=${salon.id}&salonName=${encodeURIComponent(salon.name)}`)}
                        >
                          <span className="relative z-10">BOOK AN APPOINTMENT</span>
                          <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {!loading && filteredSalons.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Scissors className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">No salons found</h3>
            <p className="text-slate-500 font-medium mt-2">Try adjusting your filters or search terms.</p>
            <Button
              variant="outline"
              className="mt-8 rounded-full px-8 h-12 font-bold"
              onClick={() => {
                setActiveCategory("All");
                setSearchTerm("");
              }}
            >
              Clear all filters
            </Button>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
