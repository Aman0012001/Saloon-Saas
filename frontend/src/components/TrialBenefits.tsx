import { Check, Clock, CreditCard, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TrialBenefits = () => {
  const trialFeatures = [
    {
      icon: Clock,
      title: "14 Days Free",
      description: "Full access to all premium features"
    },
    {
      icon: CreditCard,
      title: "No Credit Card",
      description: "Start immediately without payment details"
    },
    {
      icon: Shield,
      title: "Cancel Anytime",
      description: "No commitment, cancel with one click"
    }
  ];

  const includedFeatures = [
    "Unlimited appointments & bookings",
    "Staff & customer management",
    "Revenue tracking & analytics",
    "Online booking website",
    "SMS & email notifications",
    "Multi-location support",
    "24/7 customer support",
    "Mobile app access"
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-sage/5 to-accent/5">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Grow Your Salon
          </h2>
          <p className="text-lg text-muted-foreground">
            Start your free trial today and see why 500+ salon owners trust NoamSkin
          </p>
        </div>

        {/* Trial Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {trialFeatures.map((feature, index) => (
            <Card key={index} className="border-border shadow-card text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Included Features */}
        <Card className="border-border shadow-card">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold mb-6 text-center">
              What's Included in Your Free Trial
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {includedFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-sage/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-sage" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-accent/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-accent">After 14 days:</span> Continue with our affordable plans starting at RM 999/month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TrialBenefits;
