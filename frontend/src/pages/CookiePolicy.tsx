import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Cookie, Info, Settings, ShieldCheck } from "lucide-react";
import { useEffect } from "react";

const CookiePolicy = () => {
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
                        <Cookie className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Cookie Policy</h1>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <Info className="w-6 h-6 text-accent" />
                            1. What are Cookies?
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Cookies are small text files that are placed on your computer or mobile device by websites that you visit. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-accent" />
                            2. How We Use Cookies
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div className="p-6 rounded-xl bg-secondary/30 border border-border">
                                <h3 className="font-bold mb-2">Essential Cookies</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    These are necessary for the website to function. They include, for example, cookies that enable you to log into secure areas.
                                </p>
                            </div>
                            <div className="p-6 rounded-xl bg-secondary/30 border border-border">
                                <h3 className="font-bold mb-2">Performance Cookies</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    They allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <Settings className="w-6 h-6 text-accent" />
                            3. Managing Cookies
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit <a href="https://allaboutcookies.org" target="_blank" className="text-accent hover:underline">allaboutcookies.org</a>.
                        </p>
                    </section>

                    <section className="bg-muted p-8 rounded-2xl border border-border text-center">
                        <h2 className="text-2xl font-bold mb-4">Questions?</h2>
                        <p className="text-muted-foreground mb-4">
                            If you have any questions regarding our use of cookies, please email us at:
                        </p>
                        <p className="font-black text-xl text-foreground">skinnoam@gmail.com</p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CookiePolicy;
