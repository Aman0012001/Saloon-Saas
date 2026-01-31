import { useState, useEffect } from "react";
import SalonCard from "./SalonCard";
import api from "@/services/api";
import { Loader2 } from "lucide-react";
import { getImageUrl } from "@/utils/imageUrl";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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
      const data = await api.salons.getAll();

      if (data && data.error) {
        setSalons([]);
        return;
      }

      const salonsArray = Array.isArray(data) ? data : (data?.salons || []);

      const formatted = salonsArray.map((salon: any, index: number) => ({
        id: salon.id || `salon-${index}`,
        name: salon.name || "Untitled Salon",
        location: `${salon.city || "Malaysia"}${salon.state ? `, ${salon.state}` : ""}`,
        rating: Number(salon.rating || 0),
        reviewCount: salon.review_count || 0,
        services: 2 + (index % 3),
        employees: 2 + (index % 4),
        coverImage: getImageUrl(salon.cover_image_url, 'cover', salon.id),
        logoImage: getImageUrl(salon.logo_url, 'logo', salon.id),
        ownerName: salon.owner_name || "Salon Owner",
      }));

      // Limit to Top 10
      setSalons(formatted.slice(0, 10));
    } catch (error) {
      console.error("[ServicesSection] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  return (
    <section id="services" className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center mb-12 gap-4 text-center">
          <div>
            <h2 className="text-4xl rounded-2xl md:text-5xl font-black text-slate-900 tracking-tight">
              Our Salons
            </h2>
            <p className="text-slate-500 font-medium text-lg mt-3 max-w-lg mx-auto">
              Curated selection of the finest grooming destinations rated by our community.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-20 bg-slate-100 rounded-[3rem]">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No available salons at the moment</p>
          </div>
        ) : (
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
                {salons.map((salon) => (
                  <CarouselItem key={salon.id} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <div className="transform transition-all duration-500 hover:scale-[1.02]">
                      <SalonCard {...salon} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-2 md:-left-6 top-1/2 rounded-xl h-12 w-12 border-slate-200 bg-white/90 backdrop-blur-sm text-slate-900 shadow-xl hover:bg-black hover:text-white transition-all" />
              <CarouselNext className="absolute -right-2 md:-right-6 top-1/2 rounded-xl h-12 w-12 border-slate-200 bg-white/90 backdrop-blur-sm text-slate-900 shadow-xl hover:bg-black hover:text-white transition-all" />
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
