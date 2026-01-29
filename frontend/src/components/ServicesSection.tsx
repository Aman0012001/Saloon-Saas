import { useState, useEffect } from "react";
import SalonCard from "./SalonCard";
import api from "@/services/api";
import { Loader2 } from "lucide-react";

interface Salon {
  id: string;
  name: string;
  city: string;
  state: string;
  logo_url: string | null;
  cover_image_url: string | null;
}

const ServicesSection = () => {
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback images for salons without images
  const defaultCoverImages = [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=400&fit=crop",
  ];

  const defaultLogoImages = [
    "https://images.unsplash.com/photo-1620331311520-246422ff8347?w=120&h=120&fit=crop",
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=120&h=120&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=120&h=120&fit=crop",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=120&h=120&fit=crop",
  ];

  const fetchSalons = async () => {
    try {
      setLoading(true);
      console.log("[ServicesSection] Starting fetchSalons...");

      const data = await api.salons.getAll();
      console.log("[ServicesSection] API response received:", data);

      if (data && data.error) {
        console.error("[ServicesSection] API returned error:", data.error);
        setSalons([]);
        return;
      }

      const salonsArray = Array.isArray(data) ? data : (data?.salons || []);
      console.log("[ServicesSection] Processed salons array:", salonsArray);

      const formatted = salonsArray.map((salon: any, index: number) => ({
        id: salon.id || `salon-${index}`,
        name: salon.name || "Untitled Salon",
        location: `${salon.city || "Malaysia"}${salon.state ? `, ${salon.state}` : ""}`,
        rating: 4 + (index % 2),
        services: 2 + (index % 3),
        employees: 2 + (index % 4),
        coverImage: salon.cover_image_url || defaultCoverImages[index % defaultCoverImages.length],
        logoImage: salon.logo_url || defaultLogoImages[index % defaultLogoImages.length],
        ownerName: salon.owner_name || "Salon Owner",
      }));

      setSalons(formatted);
    } catch (error) {
      console.error("[ServicesSection] Error in fetchSalons:", error);
    } finally {
      console.log("[ServicesSection] Fetch complete, setting loading to false");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();

    // Safety timeout: 10 seconds absolute maximum for the loader
    const timer = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn("[ServicesSection] Safety timeout fallback triggered");
          return false;
        }
        return prev;
      });
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="services" className="py-12 md:py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 tracking-tight">Our Salons</h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No local salons registered in MySQL yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile: Horizontal scroll */}
            <div className="flex md:hidden gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide text-accent-foreground">
              {salons.map((salon) => (
                <div key={salon.id} className="flex-shrink-0 w-72 snap-center">
                  <SalonCard {...salon} />
                </div>
              ))}
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {salons.map((salon) => (
                <SalonCard key={salon.id} {...salon} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
