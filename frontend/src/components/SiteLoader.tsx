import { motion, AnimatePresence } from "framer-motion";
import { Scissors } from "lucide-react";

export default function SiteLoader() {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-hidden"
        >
            {/* Background Pulsing Circles */}
            <div className="absolute inset-0 flex items-center justify-center">
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [0.8, 1.5],
                            opacity: [0.1, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.8,
                            ease: "easeOut"
                        }}
                        className="absolute w-[300px] h-[300px] border border-slate-100 rounded-full"
                    />
                ))}
            </div>

            <div className="relative flex flex-col items-center">
                {/* Logo Icon Container */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative mb-8"
                >
                    {/* Main Icon Background */}
                    <div className="w-24 h-24 bg-[#1A1A1A] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/10 relative z-10">
                        <motion.div
                            animate={{
                                rotate: [0, 5, -5, 0],
                                scale: [1, 1.05, 0.95, 1]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Scissors className="w-10 h-10 text-orange-400" />
                        </motion.div>
                    </div>

                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-[#1A1A1A] blur-2xl opacity-20 -z-10 rounded-[2rem]" />
                </motion.div>

                {/* Branding Text */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-center"
                >
                    {/* <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tighter mb-4">
                        StyleSync
                    </h1> */}

                    {/* Syncing Indicator Bars */}
                    <div className="flex items-center justify-center gap-1.5 h-6">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    height: [8, 20, 8],
                                    opacity: [0.3, 1, 0.3]
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                    ease: "easeInOut"
                                }}
                                className="w-1.5 bg-[#4A6670] rounded-full"
                            />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Footer Quote (Optional subtle addition for premium feel) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-12 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400"
            >
                Initializing Global Registry
            </motion.div>
        </motion.div>
    );
}
