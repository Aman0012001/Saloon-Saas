import { Link } from "react-router-dom";
import { Store, TrendingUp, Users, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SalonOwnerCTA = () => {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Increase Revenue",
      description: "Boost your salon's income with online bookings"
    },
    {
      icon: Users,
      title: "Manage Customers",
      description: "Keep track of all your clients in one place"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Automated appointment management system"
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-accent/5 to-sage/5">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Store className="w-4 h-4" />
            For Salon Owners
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Grow Your Salon Business
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of salon owners who use NoamSkin to manage appointments,
            track revenue, and grow their business online.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-border shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* <Link to="/dashboard/create-salon">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 gap-2">
                <Store className="w-5 h-5" />
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link> */}
            <Link to="/salon-owner/login">
              <Button size="lg" variant="outline" className="gap-2 border-2 border-foreground/20 text-foreground hover:bg-foreground/5">
                Salon Owner Login
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-accent">14-day free trial</span> • No credit card required • Already managing 500+ salons across Malaysia
          </p>
        </div>
      </div>
    </section>
  );
};

export default SalonOwnerCTA;
