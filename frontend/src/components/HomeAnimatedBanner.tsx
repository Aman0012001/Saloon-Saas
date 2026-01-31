import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Star, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const banners = [
    {
        image: "/images/salon_banner_1.png",
        title: "The Ultimate Salon Experience",
        subtitle: "Luxury Minimalist Spaces",
        description: "Experience the pinnacle of beauty and relaxation in our modern, curated salon environments.",
        accent: "New Premium Collection",
    },
    {
        image: "/images/salon_banner_2.png",
        title: "Holistic Spa & Wellness",
        subtitle: "Inner Peace, Outer Radiance",
        description: "Rejuvenate your skin and soul with our signature treatments using the finest organic essentials.",
        accent: "Tranquility Redefined",
    },
    {
        image: "/images/salon_banner_3.png",
        title: "Masterful Hair Artistry",
        subtitle: "Expert Cuts & Color",
        description: "Our master stylists create personalized looks that perfectly complement your unique features.",
        accent: "Signature Styles",
    },
    {
        image: "/images/salon_banner_4.png",
        title: "Advanced Skin Therapies",
        subtitle: "Clinical Excellence",
        description: "Transform your skin with our medically-backed facial treatments and advanced skincare technology.",
        accent: "Scientific Beauty",
    },
    {
        image: "/images/salon_banner_5.png",
        title: "Exquisite Nail Couture",
        subtitle: "Precision & Elegance",
        description: "Indulge in our luxurious manicure and pedicure services in a serene, high-end environment.",
        accent: "Artisan Finishes",
    }
];

const HomeAnimatedBanner = () => {
    const [current, setCurrent] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % banners.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden bg-slate-900 py-12 md:py-20 lg:py-24">
            {/* Background Layer */}
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="absolute inset-0 z-0"
                >
                    <motion.div
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 6, ease: "linear" }}
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${banners[current].image})` }}
                    />
                    {/* Professional Overlay System */}
                    <div className="absolute inset-0 bg-slate-900/40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/20 to-transparent" />
                </motion.div>
            </AnimatePresence>

            <div className="container relative h-full flex items-center px-6 lg:px-12 mx-auto z-10 py-12 md:py-20">
                <div className="max-w-3xl space-y-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="space-y-6"
                        >
                            {/* Accent Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-white shadow-lg">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-black uppercase tracking-wider">
                                    {banners[current].accent}
                                </span>
                            </div>

                            {/* Crisp Typography */}
                            <div className="space-y-4">
                                <p className="text-accent font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">
                                    {banners[current].subtitle}
                                </p>
                                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.1] tracking-tighter">
                                    {banners[current].title}
                                </h1>
                                <p className="text-lg md:text-xl text-slate-300 font-medium max-w-xl leading-relaxed">
                                    {banners[current].description}
                                </p>
                            </div>

                            {/* Clean CTAs */}
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Button
                                    onClick={() => navigate('/salons')}
                                    className="h-16 px-10 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 transition-all hover:-translate-y-1 active:scale-95"
                                >
                                    Explore Salons
                                    <ArrowRight className="w-4 h-4 ml-3" />
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/pricing')}
                                    className="h-16 px-10 bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-2xl font-black text-xs uppercase tracking-widest backdrop-blur-md transition-all hover:bg-white/20"
                                >
                                    Pricing Plans
                                </Button>
                            </div>

                            {/* Professional Trust Indicators */}
                            <div className="flex items-center gap-8 pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <Star className="w-5 h-5 text-accent fill-accent" />
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-lg leading-none">4.9/5</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Trust Score</p>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <ShieldCheck className="w-5 h-5 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-lg leading-none">Verified</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Premium Progress Indicators */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {banners.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className="group relative h-1 w-12 md:w-20 bg-white/20 rounded-full overflow-hidden"
                    >
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-accent"
                            initial={{ width: 0 }}
                            animate={{ width: current === i ? "100%" : 0 }}
                            transition={{ duration: current === i ? 6 : 0.3, ease: "linear" }}
                        />
                    </button>
                ))}
            </div>
        </section>
    );
};

export default HomeAnimatedBanner;
