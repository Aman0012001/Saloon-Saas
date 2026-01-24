import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    description: "Enjoy essential booking features at no cost with our Free Plan—ideal for getting started!",
    price: "$0",
    period: "Month",
    features: [
      "1 Business Allowed",
      "5 Services Allowed",
      "5 Employees Allowed",
      "50 Bookings Allowed",
      "Customer Support",
    ],
    popular: false,
  },
  {
    name: "Gold",
    description: "Upgrade to the exclusive Gold Plan for enhanced booking features and added convenience!",
    price: "$5",
    period: "Month",
    features: [
      "2 Businesses Allowed",
      "5 Services Allowed",
      "5 Employees Allowed",
      "300 Bookings Allowed",
      "Customer Support",
    ],
    popular: true,
  },
  {
    name: "Platinum",
    description: "Experience premium benefits with our Platinum Plan, designed for optimal booking and convenience!",
    price: "$10",
    period: "Month",
    features: [
      "5 Businesses Allowed",
      "10 Services Allowed",
      "10 Employees Allowed",
      "500 Bookings Allowed",
      "Customer Support",
    ],
    popular: false,
  },
  {
    name: "Enterprise",
    description: "Contact Admin",
    price: "Contact",
    period: "for custom offer",
    features: [],
    popular: false,
    isEnterprise: true,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-12 md:py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4">Pricing</h2>
        
        {/* Trial Banner */}
        <div className="max-w-2xl mx-auto text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Limited Time Offer
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            Start with a <span className="font-semibold text-accent">14-day free trial</span> of any plan
          </p>
          <Link to="/dashboard/create-salon">
            <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2">
              Start Free Trial
            </Button>
          </Link>
        </div>
        
        {/* Mobile: Horizontal scroll */}
        <div className="flex lg:hidden gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex-shrink-0 w-72 snap-center relative rounded-2xl p-5 ${
                plan.popular 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "bg-card shadow-card border border-border"
              }`}
            >
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                plan.popular ? "bg-gold text-primary" : "bg-secondary text-foreground"
              }`}>
                {plan.name}
              </div>

              <p className={`text-sm mb-4 ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {plan.description}
              </p>

              <div className="mb-4">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  / {plan.period}
                </span>
              </div>

              <Button 
                variant={plan.popular ? "secondary" : "default"}
                className="w-full rounded-full mb-4 h-10"
              >
                Get Started Now
              </Button>

              {plan.features.length > 0 && (
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? "text-gold" : "text-sage"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Desktop: Grid */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 ${
                plan.popular 
                  ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                  : "bg-card shadow-card border border-border"
              }`}
            >
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                plan.popular ? "bg-gold text-primary" : "bg-secondary text-foreground"
              }`}>
                {plan.name}
              </div>

              <p className={`text-sm mb-6 ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {plan.description}
              </p>

              <div className="mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  / {plan.period}
                </span>
              </div>

              <Button 
                variant={plan.popular ? "secondary" : "default"}
                className="w-full rounded-full mb-6"
              >
                Get Started Now
              </Button>

              {plan.features.length > 0 && (
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 ${plan.popular ? "text-gold" : "text-sage"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
