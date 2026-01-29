import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import api from "@/services/api";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Direct fetch for now as api service might not have newsletter yet
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Successfully Subscribed",
          description: data.data?.message || "You've been added to our beauty updates!",
        });
        setEmail("");
      } else {
        throw new Error(data.data?.error || "Subscription failed");
      }
    } catch (error: any) {
      toast({
        title: "Subscription Failed",
        description: error.message || "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 md:py-24 px-4 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -z-10" />
      <div className="container mx-auto">
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-16 text-center max-w-5xl mx-auto relative shadow-2xl shadow-slate-900/20 border border-white/5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-8 border border-accent/20">
            <Mail className="w-8 h-8 text-accent" />
          </div>

          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
            Stay Updated with the <br />
            <span className="text-accent underline decoration-accent/20 underline-offset-8">Latest Salon Trends</span>
          </h2>

          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto font-medium">
            Subscribe to our newsletter and stay ahead in the beauty industry! <br className="hidden md:block" />
            Get exclusive salon tips and promotions delivered locally.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto bg-white/5 p-2 rounded-[2rem] border border-white/10 backdrop-blur-sm">
            <Input
              type="email"
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="h-14 bg-transparent border-none text-white placeholder:text-slate-500 font-bold px-6 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="h-14 rounded-[1.5rem] px-8 bg-accent hover:bg-accent/90 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Subscribe Now"
              )}
            </Button>
          </form>

          <p className="mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            🛡️ Zero spam • Secure local registry • Unsubscribe anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
