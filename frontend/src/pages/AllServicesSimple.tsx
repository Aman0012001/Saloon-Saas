import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  Clock,
  Banknote,
  Scissors,
  Sparkles,
  ArrowRight,
  Loader2,
  MapPin,
  Users,
  User,
  Waves,
  Zap,
  Flower2,
  ShoppingBag,
  Tag,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeAnimatedBanner from "../components/HomeAnimatedBanner";
import ServicesSection from "../components/ServicesSection";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "@/utils/imageUrl";
import { useAuth } from "@/hooks/useAuth";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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
  salon_logo_url?: string;
  salon_cover_url?: string;
  image_url?: string;
  staff_count?: number;
  rating?: number;
  review_count?: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user_name: string;
  user_avatar: string | null;
  service_name: string;
  created_at?: string;
}

interface PlatformProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  image_url: string | null;
  category: string;
  brand?: string;
}

const AllServicesSimple = () => {
  const [services, setServices] = useState<SimpleService[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<PlatformProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to subscribe.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Successfully Subscribed!",
      description: "Thank you for joining our newsletter. Stay tuned for updates!",
    });
    setEmail("");
  };


  const fetchSimpleServices = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching services from local API...");
      const data = await api.services.getAll();

      console.log("📋 Services found:", data?.length || 0);
      const formatted = (data || []).map((s: any) => ({
        ...s,
        rating: Number(s.rating || 0),
        review_count: s.review_count || 0
      }));
      setServices(formatted);

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

  const fetchPlatformProducts = async () => {
    try {
      const data = await api.platformProducts.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await api.reviews.getAll();
      const fetchedReviews = data?.reviews || data || [];
      if (Array.isArray(fetchedReviews)) {
        // Map backend fields to ensure they match the UI interface
        const mappedReviews = fetchedReviews.map((r: any) => ({
          id: r.id,
          rating: Number(r.rating),
          comment: r.comment,
          user_name: r.user_name || r.customer_name || "Global Customer",
          user_avatar: r.user_avatar || r.customer_avatar,
          service_name: r.service_name || "Verified Service", // Fallback if service name is missing
          created_at: r.created_at
        }));
        setReviews(mappedReviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  useEffect(() => {
    fetchSimpleServices();
    fetchPlatformProducts();
    fetchReviews();
  }, []);

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
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign up or log in to book this ritual.",
        variant: "default",
      });
      navigate("/signup");
      return;
    }
    window.location.href = `/book?salonId=${service.salon_id}&serviceId=${service.id}`;
  };

  const getCategoryIcon = (category: string) => {
    const cat = (category || "").toLowerCase();
    if (cat === "all") return <Zap className="w-4 h-4" />;
    if (cat.includes("hair")) return <Scissors className="w-4 h-4" />;
    if (cat.includes("nail")) return <Sparkles className="w-4 h-4" />;
    if (cat.includes("massage") || cat.includes("spa")) return <Waves className="w-4 h-4" />;
    if (cat.includes("facial") || cat.includes("skin")) return <Flower2 className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
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

      <HomeAnimatedBanner />

      {/* Global Search Section */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
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
          </div>
        </div>
      </section>


      {/* Services List */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 tracking-tight text-slate-900">Our Services</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      layoutId={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        onClick={() => navigate(`/services/${service.id}`)}
                        className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer h-full border border-border/50"
                      >
                        <div className="relative h-48 overflow-hidden bg-slate-100">
                          <img
                            src={service.image_url ? getImageUrl(service.image_url, 'service', service.id) : getServiceImage(service.category || 'Other', service.name)}
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.src = getServiceImage(service.category || 'Other', service.name);
                            }}
                          />
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-slate-900 shadow-sm">
                            RM {service.price}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 relative">
                          {/* Logo Overlay */}
                          <div className="absolute -top-10 right-4">
                            <div className="h-14 w-14 rounded-2xl border-4 border-white overflow-hidden shadow-xl bg-white group-hover:scale-110 transition-transform">
                              <img
                                src={getImageUrl(service.salon_logo_url, 'logo', service.salon_id)}
                                className="w-full h-full object-cover"
                                alt="Logo"
                                onError={(e) => {
                                  e.currentTarget.src = getImageUrl(null, 'logo', service.id);
                                }}
                              />
                            </div>
                          </div>

                          <div className="pt-4 space-y-3">
                            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-accent transition-colors">{service.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{service.salon_name || "Premium Salon"}</p>

                            {/* Rating Placeholder */}
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < Math.floor(service.rating || 0) ? "fill-[#F2A93B] text-[#F2A93B]" : "text-slate-200"}`}
                                />
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">({(typeof service.rating === 'number' ? service.rating : Number(service.rating || 0)).toFixed(1)})</span>
                              {service.review_count !== undefined && (
                                <span className="text-[10px] text-slate-400 ml-1">· {service.review_count} reviews</span>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="font-bold text-sky-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {service.duration_minutes}m
                              </span>
                              <span className="flex items-center gap-1 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                {service.category}
                              </span>
                            </div>

                            {/* Book Button */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookService(service);
                              }}
                              variant="ghost"
                              className="w-full mt-2 text-foreground hover:bg-[#533B26] hover:text-white font-medium transition-all duration-300 border border-slate-100"
                            >
                              Book Now &rarr;
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

            </div >
          )}
        </div >
      </section >


      <ServicesSection />

      {/* Recommended Products Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 tracking-tight text-slate-900">Recommended Products</h2>

          {products.length > 0 ? (
            <div className="relative px-4 md:px-12">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 5000,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent className="-ml-4 md:-ml-6 py-4">
                  {products.map((product) => (
                    <CarouselItem key={product.id} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                      >
                        <div
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer h-full border border-border/50 flex flex-col"
                        >
                          {/* Product Image */}
                          <div className="relative h-56 overflow-hidden bg-slate-100 flex items-center justify-center">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <ShoppingBag className="w-16 h-16 text-slate-300" />
                            )}

                            {/* Discount Badge */}
                            {(Number(product.discount) > 0) && (
                              <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                SAVE RM {product.discount}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-5 flex flex-col flex-grow">
                            <div className="mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{product.brand || product.category || "General"}</span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 line-clamp-2 mb-2 group-hover:text-accent transition-colors">{product.name}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-grow">{product.description}</p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                              <div className="flex flex-col">
                                <span className="text-xs text-slate-400 font-medium line-through">
                                  {Number(product.discount) > 0 ? `RM ${(Number(product.price) + Number(product.discount)).toFixed(2)}` : ''}
                                </span>
                                <span className="text-xl font-black text-slate-900">RM {product.price}</span>
                              </div>
                              <Button size="sm" className="rounded-xl px-4 bg-slate-900 text-white hover:bg-accent font-bold">
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute -left-2 md:-left-6 top-1/2 rounded-xl h-12 w-12 border-slate-200 bg-white/90 backdrop-blur-sm text-slate-900 shadow-xl hover:bg-black hover:text-white transition-all" />
                <CarouselNext className="absolute -right-2 md:-right-6 top-1/2 rounded-xl h-12 w-12 border-slate-200 bg-white/90 backdrop-blur-sm text-slate-900 shadow-xl hover:bg-black hover:text-white transition-all" />
              </Carousel>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">No products available at the moment.</p>
            </div>
          )}
        </div>
      </section>
      {/* Platform Stats Section */}
      <section className="py-24 px-4 bg-[#F8F9FA]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Salon: The Ultimate Service Booking Platform
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {[
              {
                value: "15k+",
                label: "Trusted by over 15k+ service providers and customers."
              },
              {
                value: "100k+",
                label: "Over 100k+ bookings successfully completed across various services."
              },
              {
                value: "95k+",
                label: "93k+ positive reviews from satisfied customers."
              }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-12 rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] text-center flex flex-col items-center justify-center min-h-[280px]"
              >
                <div className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter">
                  {stat.value}
                </div>
                <p className="text-slate-500 font-medium leading-relaxed max-w-[240px]">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Newsletter Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#1A1A1A] rounded-[2.5rem] p-12 md:p-16 text-center shadow-2xl"
          >
            <div className="space-y-6 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                Stay Updated with the Latest Salon Trends
              </h2>
              <p className="text-slate-300 text-base md:text-lg font-normal max-w-2xl mx-auto leading-relaxed">
                Subscribe to our newsletter and stay ahead in the beauty industry! Get exclusive salon tips and promotions.
              </p>

              <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row items-center justify-center gap-4 pt-6 max-w-lg mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  className="h-14 bg-white/10 border-white/20 text-white rounded-full px-6 focus-visible:ring-white/30"
                />
                <Button
                  type="submit"
                  className="h-14 px-10 rounded-full bg-white text-black hover:bg-slate-200 font-bold text-base transition-all shrink-0"
                >
                  Subscribe Now
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Testimonials Section */}
          <div className="mt-32">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                Customers love using Salon.
              </h2>
            </div>

            <div className="relative">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 4000,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent className="-ml-4 md:-ml-6 py-4">
                  {(reviews.length > 0 ? reviews : [
                    {
                      id: "static-1",
                      rating: 5,
                      comment: "Salon Website has transformed the way we manage our bookings. It's incredibly user-friendly. Highly recommend trying it out!",
                      user_name: "Jenny Wilson",
                      service_name: "Hair Styling",
                      user_avatar: null
                    },
                    {
                      id: "static-2",
                      rating: 5,
                      comment: "Salon's customer management service is designed to simplify your workflow. Keep all your important information at your fingertips.",
                      user_name: "John Doe",
                      service_name: "Massage Therapy",
                      user_avatar: null
                    },
                    {
                      id: "static-3",
                      rating: 5,
                      comment: "The support team at Salon is phenomenal! They are quick to respond and truly understand our needs.",
                      user_name: "Hailey",
                      service_name: "Nail Care",
                      user_avatar: null
                    },
                    {
                      id: "static-4",
                      rating: 5,
                      comment: "Salon has saved us so much time in scheduling and organization. It's a reliable tool that makes complex bookings feel easy.",
                      user_name: "Jenifer",
                      service_name: "Facial Treatment",
                      user_avatar: null
                    }
                  ]).map((t, i) => (
                    <CarouselItem key={i} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <div className="bg-white p-8 rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-50 h-full flex flex-col">
                        <div className="flex gap-1 mb-4">
                          {[...Array(5)].map((_, starIndex) => (
                            <Star
                              key={starIndex}
                              className={`w-4 h-4 ${starIndex < (t.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`}
                            />
                          ))}
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mb-4">"{t.comment ? (t.comment.length > 30 ? t.comment.substring(0, 30) + "..." : t.comment) : "Great Experience"}"</h4>
                        <p className="text-slate-500 font-medium leading-relaxed flex-grow line-clamp-4">
                          {t.comment}
                        </p>
                        <div className="pt-6 border-t border-slate-50 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                            {t.user_avatar ? (
                              <img src={t.user_avatar} alt={t.user_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-accent text-white font-bold">
                                {t.user_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{t.user_name}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t.service_name}</p>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </div>
      </section>


      <Footer />
    </div >
  );
};

export default AllServicesSimple;
