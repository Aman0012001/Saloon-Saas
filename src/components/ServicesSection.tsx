import { useState, useEffect } from "react";
import SalonCard from "./SalonCard";
import { supabase } from "@/integrations/supabase/client";
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
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      const { data, error } = await supabase
        .from("salons")
        .select("id, name, city, state, logo_url, cover_image_url")
        .eq("is_active", true)
        .eq("approval_status", "approved")
        .limit(8)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching salons:", error);
        return;
      }

      setSalons(data || []);
    } catch (error) {
      console.error("Error fetching salons:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatSalonData = (salon: Salon, index: number) => ({
    name: salon.name,
    location: `${salon.city || "India"}${salon.state ? `, ${salon.state}` : ""}`,
    rating: 4 + Math.floor(Math.random() * 2), // Random rating 4-5
    services: 2 + Math.floor(Math.random() * 3), // Random 2-4 services
    employees: 2 + Math.floor(Math.random() * 4), // Random 2-5 employees
    coverImage: salon.cover_image_url || defaultCoverImages[index % defaultCoverImages.length],
    logoImage: salon.logo_url || defaultLogoImages[index % defaultLogoImages.length],
  });

  return (
    <section id="services" className="py-12 md:py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">Our Salons</h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No salons available at the moment.</p>
          </div>
        ) : (
          <>
            {/* Mobile: Horizontal scroll */}
            <div className="flex md:hidden gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
              {salons.map((salon, index) => (
                <div key={salon.id} className="flex-shrink-0 w-72 snap-center">
                  <SalonCard {...formatSalonData(salon, index)} />
                </div>
              ))}
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {salons.map((salon, index) => (
                <SalonCard key={salon.id} {...formatSalonData(salon, index)} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
