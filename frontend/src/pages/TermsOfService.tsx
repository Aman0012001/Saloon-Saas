import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, CheckCircle, AlertTriangle, Scale } from "lucide-react";
import { useEffect } from "react";

const TermsOfService = () => {
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
                        <Scale className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Terms of Service</h1>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-accent" />
                            1. Acceptance of Terms
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing and using Noamskin's platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <FileText className="w-6 h-6 text-accent" />
                            2. Use License
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Permission is granted to temporarily use the Noamskin platform for personal or business salon management purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Modify or copy the materials</li>
                            <li>Attempt to decompile or reverse engineer any software contained on the platform</li>
                            <li>Remove any copyright or other proprietary notations</li>
                            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-accent" />
                            3. Disclaimer
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The materials on Noamskin's platform are provided on an 'as is' basis. Noamskin makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </section>

                    <section className="bg-muted p-8 rounded-2xl border border-border">
                        <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These terms and conditions are governed by and construed in accordance with the laws of Malaysia and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;
