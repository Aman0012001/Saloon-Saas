import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Star,
  Search,
  Bell,
  User,
  Scissors,
  Sparkles,
  Clock,
  ArrowRight,
  Heart,
  Gift,
  Zap,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMobile } from "@/hooks/use-mobile";
import api from "@/services/api";
import { getImageUrl } from "@/utils/imageUrl";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Original website components
import Navbar from "@/components/Navbar";
import HeroVideoCarousel from "@/components/HeroVideoCarousel";
import InsideSpaceSection from "@/components/InsideSpaceSection";
import ServicesSection from "@/components/ServicesSection";


import StatsSection from "@/components/StatsSection";
import NewsletterSection from "@/components/NewsletterSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import SalonOwnerCTA from "@/components/SalonOwnerCTA";
import TrialBenefits from "@/components/TrialBenefits";
import GlowConfidenceSection from "@/components/GlowConfidenceSection";
import FeaturedFacialSection from "@/components/FeaturedFacialSection";
import SkinConcernSection from "@/components/SkinConcernSection";
import SkinAdviceSection from "@/components/SkinAdviceSection";
import FacialMenuSection from "@/components/FacialMenuSection";
import BestSellersSection from "@/components/BestSellersSection";
import ReviewsSection from "@/components/ReviewsSection";
import BeforeAfterSection from "@/components/BeforeAfterSection";
import RecommendedProductsSection from "@/components/RecommendedProductsSection";
import Footer from "@/components/Footer";


const Index = () => {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [featuredSalons, setFeaturedSalons] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleBooking = (salonId: string) => {
    if (!user) {
      toast({
        title: "Registration Required",
        description: "To reserve your spot in our local registry, please sign up or log in first.",
        variant: "default",
      });
      navigate("/signup");
      return;
    }
    navigate(`/book?salonId=${salonId}`);
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        console.log("Fetching salons from API...");
        const data = await api.salons.getAll();
        console.log("Salons data received:", data);

        // Handle both array and object responses
        const salonsArray = Array.isArray(data) ? data : (data?.salons || []);
        console.log("Salons array:", salonsArray);

        if (salonsArray.length > 0) {
          const featured = salonsArray.slice(0, 3).map((s: any) => ({
            ...s,
            rating: Number(s.rating || 0).toFixed(1),
            reviews: s.review_count || 0,
            distance: "0.8 km",
            price: "RM 29+"
          }));
          console.log("Featured salons:", featured);
          setFeaturedSalons(featured);
        } else {
          console.log("No salons found in database");
        }
      } catch (err) {
        console.error("Local landing fetch failed:", err);
      }
    };
    fetchFeatured();
  }, []);

  const quickServices = [
    { icon: Scissors, name: "Haircut", color: "bg-blue-600" },
    { icon: Sparkles, name: "Facial", color: "bg-pink-600" },
    { icon: Star, name: "Manicure", color: "bg-indigo-600" },
    { icon: Heart, name: "Spa", color: "bg-red-600" },
    { icon: Gift, name: "Makeup", color: "bg-orange-600" },
    { icon: Zap, name: "Massage", color: "bg-emerald-600" }
  ];

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <Navbar />
        <HeroVideoCarousel />
        <div id="services">
          <ServicesSection />
        </div>
        {/* <InsideSpaceSection /> */}
        <GlowConfidenceSection />
        <FeaturedFacialSection />
        <SkinConcernSection />
        <SkinAdviceSection />
        <FacialMenuSection />
        <BestSellersSection />
        <ReviewsSection />
        <RecommendedProductsSection />
        <BeforeAfterSection />

        <StatsSection />
        <NewsletterSection />
        <HowItWorksSection />
        <SalonOwnerCTA />
        <TrialBenefits />
        <Footer />
      </div>

    );
  }

  // Mobile App Experience
  return (
    <div className="min-h-screen bg-[#FDFCFB] overflow-x-hidden pb-24">
      {/* Dynamic Header */}
      <div className="bg-white/80 backdrop-blur-xl px-6 py-6 border-b border-slate-100 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
            <Scissors className="w-6 h-6 text-accent" />
          </div>
          <div>
            {/* <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">StyleSync</h1> */}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Local Backend Active</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate("/login")} className="h-12 w-12 rounded-2xl bg-slate-50 border-none">
          <User className="w-6 h-6 text-slate-600" />
        </Button>
      </div>

      {/* Hero Search */}
      <div className="px-6 py-8 space-y-4">
        <p className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight">Luxury appointments, <br /><span className="text-accent underline decoration-accent/20">booked locally.</span></p>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-accent transition-colors" />
          <Input
            placeholder="Search local experts..."
            onClick={() => navigate("/salons")}
            className="h-14 pl-12 bg-white border-none shadow-sm rounded-2xl font-medium"
          />
        </div>
      </div>

      {/* Featured - Local Records */}
      <div className="px-6 py-10 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Nearby Saloons</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate("/salons")} className="font-bold text-accent h-auto py-0">See All</Button>
        </div>
        <div className="space-y-4">
          {featuredSalons.length === 0 ? (
            <div className="h-40 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-400 font-bold">Syncing local records...</div>
          ) : featuredSalons.map(salon => (
            <Card key={salon.id} onClick={() => handleBooking(salon.id)} className="border-none shadow-sm bg-white rounded-[2rem] p-4 flex gap-4 hover:shadow-xl transition-all">
              <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                <img
                  src={getImageUrl(salon.cover_image_url, 'cover', salon.id)}
                  className="w-full h-full object-cover"
                  alt={salon.name}
                />
                <div className="absolute top-1 right-1">
                  <div className="w-8 h-8 rounded-xl border-2 border-white bg-white overflow-hidden shadow-md">
                    <img
                      src={getImageUrl(salon.logo_url, 'logo', salon.id)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 py-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-slate-900 leading-tight">{salon.name}</h4>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-black">{salon.rating}</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {salon.city}</p>

                <div className="flex items-center justify-between mt-3">
                  <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[9px] px-3">{salon.distance}</Badge>
                  <p className="text-accent font-black">{salon.price}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div className="px-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 decoration-accent decoration-2 underline-offset-4">Quick Book</h3>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {quickServices.map((s, i) => (
            <button key={i} onClick={() => navigate("/salons")} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex flex-col items-center gap-3 group active:scale-95 transition-all">
              <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center text-white shadow-xl shadow-${s.color.split('-')[1]}-500/20`}>
                <s.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Products & Reviews */}
      <BestSellersSection />
      <ReviewsSection />
      <RecommendedProductsSection />
      <BeforeAfterSection />

      {/* Business Promotion */}
      <div className="px-6">
        <Card className="border-none bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl opacity-50" />
          <h4 className="text-2xl font-black leading-tight">Scale your <br />local saloon.</h4>
          <p className="text-xs font-medium text-slate-400 mt-2">Manage your MySQL bookings from anywhere.</p>
          <Button onClick={() => navigate("/salon-owner/login")} className="mt-6 bg-accent text-white font-black rounded-2xl h-12 w-full shadow-xl shadow-accent/20">
            Get Started Free
          </Button>
        </Card>
      </div>

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-6 left-6 right-6 h-18 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-2xl flex items-center justify-around px-4 py-2 z-[100]">
        <button onClick={() => navigate("/")} className="p-3 text-accent transition-all scale-110"><Calendar className="w-6 h-6" /></button>
        <button onClick={() => navigate("/salons")} className="p-3 text-slate-400"><Search className="w-6 h-6" /></button>
        <button onClick={() => navigate("/my-bookings")} className="p-3 text-slate-400"><Clock className="w-6 h-6" /></button>
        <button onClick={() => navigate("/login")} className="p-3 text-slate-400"><User className="w-6 h-6" /></button>
      </div>
      <Footer />
    </div>

  );
};

export default Index;
