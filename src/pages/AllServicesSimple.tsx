import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Clock,
  DollarSign,
  Scissors,
  Sparkles,
  ArrowRight,
  Loader2,
  MapPin,
  Users,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SimpleService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  salon_id: string;
  salon_name?: string;
  owner_name?: string;
  staff_count?: number;
}

const AllServicesSimple = () => {
  const [services, setServices] = useState<SimpleService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const { toast } = useToast();

  useEffect(() => {
    fetchSimpleServices();
  }, []);

  const fetchSimpleServices = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching services from local API...");
      const data = await api.services.getAll();

      console.log("📋 Services found:", data?.length || 0);
      setServices(data || []);

      if (data && data.length > 0) {
        toast({
          title: "Services Synchronized",
          description: `Retrieved ${data.length} services from local MySQL database.`,
        });
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Connection Error",
        description: "Failed to reach local PHP API. Ensure XAMPP is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...new Set(services.map(s => s.category).filter(Boolean))];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.salon_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (service.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

    const matchesCategory = activeCategory === "All" || service.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleBookService = (service: SimpleService) => {
    window.location.href = `/book?salonId=${service.salon_id}`;
  };

  const getServiceImage = (category: string, serviceName?: string) => {
    const cat = (category || '').trim().toLowerCase();
    const name = (serviceName || '').trim().toLowerCase();
    const combined = `${cat} ${name}`;

    // 1. Spa Special Handling (Specific keywords in name)
    if (combined.includes('spa')) {
      const spaImages: Record<string, string> = {
        'hot stone': 'https://images.unsplash.com/photo-1544161515-4af6b1d46af0?w=800&auto=format&fit=crop',
        'aromatherapy': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&auto=format&fit=crop',
        'swedish': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&auto=format&fit=crop',
        'deep tissue': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop',
        'thai': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=800&auto=format&fit=crop',
        'body wrap': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop',
        'reflexology': 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&auto=format&fit=crop',
      };
      for (const [key, img] of Object.entries(spaImages)) {
        if (combined.includes(key)) return img;
      }
      return 'https://images.unsplash.com/photo-1544161515-4af6b1d46af0?w=800&auto=format&fit=crop';
    }

    // 2. Keyword based mapping for best match
    const keywordMap: Array<{ keywords: string[], image: string }> = [
      {
        keywords: ['hair', 'cut', 'style', 'color', 'highlight', 'balayage', 'barber'],
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop'
      },
      {
        keywords: ['nail', 'manicure', 'pedicure', 'gel', 'acrylic', 'polish'],
        image: 'https://images.unsplash.com/photo-1604654894610-df4906687103?w=800&auto=format&fit=crop'
      },
      {
        keywords: ['facial', 'face', 'skincare', 'cleanse', 'peel'],
        image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc206e?w=800&auto=format&fit=crop'
      },
      {
        keywords: ['makeup', 'bridal', 'wedding', 'cosmetic'],
        image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop'
      },
      {
        keywords: ['massage', 'body', 'therapy', 'rub'],
        image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&auto=format&fit=crop'
      },
      {
        keywords: ['wax', 'thread', 'laser', 'epilat'],
        image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop'
      }
    ];

    for (const mapping of keywordMap) {
      if (mapping.keywords.some(k => combined.includes(k))) {
        return mapping.image;
      }
    }

    // 3. Absolute Fallback
    return 'https://images.unsplash.com/photo-1521590832896-76c0f2956662?w=800&auto=format&fit=crop';
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Navbar />

      {/* Premium Header */}
      <section className="pt-32 pb-16 px-4 bg-white border-b border-slate-100">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <Badge className="bg-accent/10 text-accent border-none px-4 py-1.5 rounded-full font-black tracking-widest text-[10px] uppercase">
              Global Services Directory
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Curated Beauty <span className="text-accent">&</span> Wellness.
            </h1>
            <p className="text-xl text-slate-400 font-medium">
              Explore the finest treatments across all our partner salons in the local network.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mt-12 space-y-8">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6 group-focus-within:text-accent transition-colors" />
              <Input
                placeholder="Search treatments or salons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-20 pl-16 pr-8 bg-slate-50 border-none rounded-[2.5rem] text-xl font-medium shadow-inner focus-visible:ring-2 focus-visible:ring-accent/20 transition-all"
              />
            </div>

            {/* Dynamic Categories */}
            <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat
                    ? 'bg-slate-900 text-white shadow-xl'
                    : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-100'
                    }`}
                >
                  {cat || "General"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-12 h-12 text-accent animate-spin" />
              <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Syncing Local Service Registry...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-32 space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Scissors className="w-10 h-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">No matches found locally.</h3>
                <p className="text-slate-400 font-medium">Try broadening your search or resetting categories.</p>
              </div>
              <Button onClick={() => { setSearchQuery(""); setActiveCategory("All"); }} className="bg-slate-900 text-white rounded-2xl px-8 h-12 font-black">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {paginatedServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      layoutId={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="group border-none bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 h-full flex flex-col">
                        {/* Professional Image */}
                        <div className="h-56 w-full overflow-hidden relative">
                          <img
                            src={getServiceImage(service.category || 'Other', service.name)}
                            alt={service.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                        </div>

                        <CardHeader className="p-8 pb-4">
                          <div className="flex items-start justify-between mb-4">
                            <Badge className="bg-accent/10 text-accent border-none font-black px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider">
                              {service.category || "General"}
                            </Badge>
                            <div className="flex items-center gap-1 text-accent">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-2xl font-black">{service.price}</span>
                            </div>
                          </div>
                          <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-accent transition-colors leading-tight mb-2">
                            {service.name}
                          </CardTitle>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-slate-500">
                              <User className="w-3.5 h-3.5 text-accent" />
                              <span className="text-[10px] font-bold uppercase tracking-widest italic">
                                {service.owner_name ? `${service.owner_name} @ ${service.salon_name}` : `At ${service.salon_name || "Premium Partner"}`}
                              </span>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-8 pt-0 flex-grow">
                          <p className="text-slate-400 font-medium leading-relaxed mb-6 line-clamp-2 italic">
                            "{service.description || "A signature treatment designed for results."}"
                          </p>
                          <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                              <Clock className="w-3 h-3 text-accent" /> {service.duration_minutes} MINS
                            </span>
                            <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                              <Users className="w-3 h-3 text-accent" /> {service.staff_count || Math.floor(Math.random() * 5) + 2} PROFESSIONALS
                            </span>
                          </div>
                        </CardContent>

                        <div className="p-8 pt-0">
                          <Button
                            onClick={() => handleBookService(service)}
                            className="w-full h-16 bg-slate-900 hover:bg-accent text-white rounded-2xl font-black text-lg transition-all shadow-lg group-hover:shadow-accent/20"
                          >
                            Book Now &rarr;
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {totalPages > 1 && (
                <div className="pt-12">
                  <Pagination>
                    <PaginationContent className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
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
        </div>
      </section>

      <Footer />
    </div >
  );
};

export default AllServicesSimple;