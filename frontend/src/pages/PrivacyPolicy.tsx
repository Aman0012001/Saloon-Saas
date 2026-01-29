import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, FileText } from "lucide-react";
import { useEffect } from "react";

const PrivacyPolicy = () => {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-32 pb-20 container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-6 text-accent">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Privacy Policy</h1>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <Eye className="w-6 h-6 text-accent" />
                            1. Information We Collect
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We collect information that you provide directly to us, including when you create an account, make a booking, or communicate with us. This may include:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Contact information (name, email address, phone number)</li>
                            <li>Booking details and history</li>
                            <li>Payment information (processed securely through our payment partners)</li>
                            <li>Communication preferences and feedback</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <Lock className="w-6 h-6 text-accent" />
                            2. How We Use Your Information
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use the collected information for various purposes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>To provide and maintain our Service</li>
                            <li>To notify you about changes to our Service</li>
                            <li>To provide customer support</li>
                            <li>To gather analysis or valuable information so that we can improve our Service</li>
                            <li>To monitor the usage of our Service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <FileText className="w-6 h-6 text-accent" />
                            3. Data Security
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                        </p>
                    </section>

                    <section className="bg-muted p-8 rounded-2xl border border-border">
                        <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                        <p className="text-muted-foreground mb-4">
                            If you have any questions about this Privacy Policy, please contact us:
                        </p>
                        <div className="space-y-2">
                            <p className="font-semibold text-foreground">Email: skinnoam@gmail.com</p>
                            <p className="font-semibold text-foreground">Address: 46 Jalan Limau Nipis, 59000 Bangsar, Kuala Lumpur</p>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
