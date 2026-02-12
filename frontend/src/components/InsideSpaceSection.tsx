import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import WaitlistDialog from "./WaitlistDialog";
import { ApprovedBadge } from "./ApprovedBadge";
import api from "@/services/api";
import { getImageUrl } from "@/utils/imageUrl";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
const InsideSpaceSection = () => {
    const navigate = useNavigate();
    const [waitlistOpen, setWaitlistOpen] = useState(false);
    const [selectedService, setSelectedService] = useState("");
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fallback to static if none found in DB or for this specific design
        setCategories([
            { id: "facials", title: "Facials", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop" },
            { id: "body-massages", title: "Body Massages", image: "https://images.unsplash.com/photo-1544161515-4af6b1d46af0?w=800&auto=format&fit=crop" },
            { id: "acupuncture", title: "Acupuncture", image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop" },
            { id: "tea-bar", title: "Tea Bar", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc206e?w=800&auto=format&fit=crop" },
        ]);
        setLoading(false);
    }, []);

    const handleCardClick = (cat: any) => {
        navigate(`/salons?category=${encodeURIComponent(cat.title)}`);
    };

    return (
        <section className="py-24 px-4 bg-[#F8F5F2] overflow-hidden">
            <div className="container mx-auto">
                {/* Header Block */}
                <div className="max-w-4xl mx-auto text-center mb-16 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="space-y-4"
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-black tracking-tight font-['Playfair_Display']">
                            Inside Our Space
                        </h2>
                    </motion.div>
                </div>

                {/* Grid Area */}
                <div className="max-w-[1400px] mx-auto px-4 lg:px-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                        {categories.map((cat, index) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.6 }}
                            >
                                <div
                                    onClick={() => handleCardClick(cat)}
                                    className="group cursor-pointer flex flex-col items-center space-y-8"
                                >
                                    {/* Image Layer */}
                                    <div className="relative w-full aspect-[4/5] rounded-[48px] overflow-hidden transition-all duration-700 shadow-sm group-hover:shadow-2xl active:scale-[0.98]">
                                        <img
                                            src={getImageUrl(cat.image, 'service', cat.id)}
                                            alt={cat.title}
                                            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Content Area - CENTERED BELOW CARD */}
                                    <div className="text-center relative">
                                        <h3 className="font-bold text-2xl md:text-3xl text-black transition-colors">
                                            {cat.title}
                                        </h3>
                                        {/* Underline transition */}
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InsideSpaceSection;
