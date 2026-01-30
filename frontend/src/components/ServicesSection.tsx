import { useState, useEffect } from "react";
import SalonCard from "./SalonCard";
import api from "@/services/api";
import { Loader2 } from "lucide-react";
import { getImageUrl } from "@/utils/imageUrl";

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
        coverImage: getImageUrl(salon.cover_image_url, 'cover', salon.id),
        logoImage: getImageUrl(salon.logo_url, 'logo', salon.id),
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
