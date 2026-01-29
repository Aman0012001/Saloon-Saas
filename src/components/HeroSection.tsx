import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Star, CalendarCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/salons?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="pt-24 pb-8 md:pt-28 md:pb-16 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 md:space-y-8 animate-fade-in text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Salon Management
              <br />
              <span className="text-accent">Made Simple</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
              Complete SaaS solution for salon owners. Manage bookings, staff, customers, and grow your business.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto lg:mx-0">
              <Input
                type="text"
                placeholder="Search by Service, Salon Name..."
                className="pl-4 pr-14 py-6 rounded-full border-border bg-background text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                size="icon"
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full w-10 h-10"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">

              <Link to="/salons">
                <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 border-2 border-foreground/20 text-foreground hover:bg-foreground/5">
                  <CalendarCheck className="w-5 h-5" />
                  Book Appointment
                </Button>
              </Link>
            </div>

            {/* Trust Badge */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Trusted by 500+ salons across Malaysia</p>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 md:w-5 md:h-5 ${i <= 4 ? 'fill-gold text-gold' : 'fill-gold/50 text-gold/50'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">4.8/5</span>
                <span className="text-sm text-muted-foreground">(2.1k+ Reviews)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚡ 14-day free trial • No credit card required
              </p>
            </div>
          </div>

          {/* Right Content - Image Grid (Mobile: horizontal scroll, Desktop: grid) */}
          <div className="relative mt-4 lg:mt-0">
            {/* Mobile: Horizontal scroll */}
            <div className="flex lg:hidden gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
              <div className="flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden shadow-card snap-start">
                <img
                  src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop"
                  alt="Barber styling client"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden shadow-card snap-start">
                <img
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=350&fit=crop"
                  alt="Getting a haircut"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden shadow-card snap-start">
                <img
                  src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop"
                  alt="Barbershop interior"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-48 rounded-2xl overflow-hidden shadow-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <img
                    src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop"
                    alt="Barber styling client"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="h-64 rounded-2xl overflow-hidden shadow-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <img
                    src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop"
                    alt="Barbershop interior"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="pt-8 space-y-4">
                <div className="h-56 rounded-2xl overflow-hidden shadow-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <img
                    src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=350&fit=crop"
                    alt="Getting a haircut"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="h-48 rounded-2xl overflow-hidden shadow-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop"
                    alt="Salon chairs"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
