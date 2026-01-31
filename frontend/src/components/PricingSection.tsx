import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
}

const PricingSection = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await api.subscriptions.getPlans();
        // Handle potential different response structures
        const plansArray = Array.isArray(data) ? data : (data?.plans || []);

        const processedPlans = plansArray.map((p: any) => ({
          ...p,
          features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || [])
        }));

        setPlans(processedPlans);
      } catch (error) {
        console.error("Failed to fetch pricing plans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <section id="pricing" className="py-12 md:py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8">Pricing</h2>

        {/* Trial Banner */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Limited Time Offer
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            Start with a <span className="font-semibold text-accent">14-day free trial</span> of any plan
          </p>
          <Link to="/signup">
            <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2">
              Start Free Trial
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans
              .filter(plan => plan.price_monthly > 0)
              .map((plan) => {
                const isPopular = plan.name.toLowerCase().includes('platinum') || plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('gold');

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl p-6 flex flex-col h-full ${isPopular
                      ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                      : "bg-card shadow-card border border-border"
                      }`}
                  >
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 w-fit ${isPopular ? "bg-gold text-primary" : "bg-secondary text-foreground"
                      }`}>
                      {plan.name}
                    </div>

                    <p className={`text-sm mb-6 line-clamp-2 ${isPopular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <span className="text-3xl font-bold">RM {plan.price_monthly}</span>
                      <span className={`text-sm ${isPopular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        / Month
                      </span>
                    </div>

                    <Link to="/signup">
                      <Button
                        variant={isPopular ? "secondary" : "default"}
                        className="w-full rounded-full mb-6"
                      >
                        Get Started Now
                      </Button>
                    </Link>

                    <ul className="space-y-3 mt-auto">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className={`w-4 h-4 flex-shrink-0 ${isPopular ? "text-gold" : "text-sage"}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </section>
  );
};

// Add Badge and cn if they aren't imported or available
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default PricingSection;
