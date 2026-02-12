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
import { motion } from "framer-motion";


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
    <section id="services" className="py-24 px-4 bg-white overflow-hidden">
      <div className="container mx-auto">
        {/* Header Block */}
        <div className="max-w-4xl mx-auto text-center mb-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1A2338] tracking-tight uppercase">
              Inside Our Space Salons
            </h2>
            <p className="text-base md:text-xl text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto">
              Step into a place designed just for you. Our space is all about personalized care, comfort, and results.            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem]">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No available salons at the moment</p>
          </div>
        ) : (
          <div className="relative max-w-[1400px] mx-auto px-4 md:px-12">
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
              <CarouselContent className="-ml-6 py-4">
                {salons.map((salon) => (
                  <CarouselItem key={salon.id} className="pl-6 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <SalonCard {...salon} />
                  </CarouselItem>
                ))}
              </CarouselContent>

              <div className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/1 items-center">
                <CarouselPrevious className="relative left-0 translate-y-0 h-12 w-12 rounded-full border-none bg-white shadow-xl hover:bg-slate-50 transition-all" />
              </div>
              <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 items-center">
                <CarouselNext className="relative right-0 translate-y-0 h-12 w-12 rounded-full border-none bg-white shadow-xl hover:bg-slate-50 transition-all" />
              </div>
            </Carousel>
          </div>
        )}
      </div>
    </section>

  );
};

export default ServicesSection;
