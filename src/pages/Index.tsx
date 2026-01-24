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
  Phone,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMobile } from "@/hooks/use-mobile";

// Original website components
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import StatsSection from "@/components/StatsSection";
import NewsletterSection from "@/components/NewsletterSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import SalonOwnerCTA from "@/components/SalonOwnerCTA";
import TrialBenefits from "@/components/TrialBenefits";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mobile App Data
  const featuredSalons = [
    {
      id: 1,
      name: "Glamour Studio",
      rating: 4.8,
      reviews: 234,
      distance: "0.5 km",
      image: "/placeholder.svg",
      services: ["Haircut", "Facial", "Manicure"],
      price: "₹500+",
      time: "30 min"
    },
    {
      id: 2,
      name: "Beauty Palace",
      rating: 4.9,
      reviews: 189,
      distance: "1.2 km",
      image: "/placeholder.svg",
      services: ["Hair Color", "Spa", "Massage"],
      price: "₹800+",
      time: "45 min"
    },
    {
      id: 3,
      name: "Style Hub",
      rating: 4.7,
      reviews: 156,
      distance: "2.1 km",
      image: "/placeholder.svg",
      services: ["Styling", "Makeup", "Pedicure"],
      price: "₹600+",
      time: "40 min"
    }
  ];

  const quickServices = [
    { icon: Scissors, name: "Haircut", color: "bg-blue-500" },
    { icon: Sparkles, name: "Facial", color: "bg-pink-500" },
    { icon: Star, name: "Manicure", color: "bg-purple-500" },
    { icon: Heart, name: "Spa", color: "bg-red-500" },
    { icon: Gift, name: "Makeup", color: "bg-orange-500" },
    { icon: Zap, name: "Massage", color: "bg-green-500" }
  ];

  // If desktop, show original website
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <HeroSection />
        <div id="services">
          <ServicesSection />
        </div>
        <StatsSection />
        <NewsletterSection />
        <HowItWorksSection />
        <SalonOwnerCTA />
        <TrialBenefits />
        <div id="pricing">
          <PricingSection />
        </div>
        <TestimonialsSection />
        <div id="contact">
          <Footer />
        </div>
      </div>
    );
  }

  // If mobile, show app-like design
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Mobile App Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Noamskin Logo"
                className="w-8 h-8 rounded-lg object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Noamskin</h1>
                <p className="text-xs text-gray-500">Book your beauty session</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Location & Time */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Current Location</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-xs text-gray-500">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">Bangsar, Kuala Lumpur</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-4 py-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search salons, services..."
            className="pl-10 bg-gray-50 border-0 rounded-xl h-12"
            onClick={() => navigate("/salons")}
          />
        </div>
      </div>

      {/* Quick Services */}
      <div className="bg-white px-4 py-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Quick Book</h2>
        <div className="grid grid-cols-3 gap-4">
          {quickServices.map((service, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-auto p-4 flex-col gap-2 hover:bg-gray-50"
              onClick={() => navigate("/salons")}
            >
              <div className={`w-12 h-12 ${service.color} rounded-xl flex items-center justify-center`}>
                <service.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium">{service.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="mx-4 my-4">
        <Card className="bg-gradient-to-r from-accent to-accent/80 border-0 text-white overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">50% OFF</h3>
                <p className="text-sm opacity-90">First booking discount</p>
                <p className="text-xs opacity-75">Valid till today</p>
              </div>
              <div className="text-right">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate("/salons")}
                >
                  Book Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Salons */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Near You</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/salons")}
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {featuredSalons.map((salon) => (
            <Card
              key={salon.id}
              className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate("/book-appointment")}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                    <Scissors className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{salon.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{salon.rating}</span>
                          <span className="text-xs text-gray-500">({salon.reviews})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-accent">{salon.price}</p>
                        <p className="text-xs text-gray-500">{salon.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{salon.distance}</span>
                      <Clock className="w-3 h-3 text-gray-400 ml-2" />
                      <span className="text-xs text-gray-500">Open now</span>
                    </div>

                    <div className="flex gap-1 mt-2">
                      {salon.services.slice(0, 2).map((service, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs px-2 py-0">
                          {service}
                        </Badge>
                      ))}
                      {salon.services.length > 2 && (
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          +{salon.services.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-4 py-6 mt-8">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Own a Salon?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Join thousands of salon owners managing their business with Noamskin
            </p>
            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => navigate("/salon-owner-login")}
            >
              Start Your Business
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 py-2">
          <Button
            variant="ghost"
            className="flex-col gap-1 h-auto py-3 text-accent"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Book</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-col gap-1 h-auto py-3"
            onClick={() => navigate("/salons")}
          >
            <Search className="w-5 h-5" />
            <span className="text-xs">Explore</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-col gap-1 h-auto py-3"
            onClick={() => navigate("/my-bookings")}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs">Bookings</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-col gap-1 h-auto py-3"
            onClick={() => navigate("/login")}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>

      {/* Bottom Padding for Fixed Navigation */}
      <div className="h-20"></div>
    </div>
  );
};

export default Index;
