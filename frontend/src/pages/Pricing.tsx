import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Star,
  Zap,
  Crown,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/services/api";

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  features: string[];
  sort_order: number;
  is_featured: boolean;
  slug?: string;
}

const Pricing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansData = await api.subscriptions.getPlans();

        const plansArray = Array.isArray(plansData) ? plansData : (plansData?.plans || []);
        const processedPlans = plansArray.map((p: any) => ({
          ...p,
          features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || [])
        }));
        setPlans(processedPlans);
      } catch (error) {
        console.error("Failed to fetch dynamic pricing data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPlanIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('starter')) return Star;
    if (n.includes('enterprise')) return Zap;
    return Crown;
  };

  const faqs = [
    {
      question: "Is there a free trial?",
      answer: "Yes! We offer a 14-day free trial on our premium plans for new salons. No credit card required."
    },
    {
      question: "Can I change plans anytime?",
      answer: "Absolutely! You can upgrade or downgrade your plan at any time from your salon dashboard."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and local online banking options."
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees! We provide free onboarding support to help you migrate your data and train your staff."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-accent/5 to-accent/10">
        <div className="container mx-auto text-center">
          <Badge className="mt-8 mb-6 bg-accent/10 text-accent border-accent/20">
            Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Simple, Affordable
            <br />
            <span className="text-accent">Pricing Plans</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your salon business.
            Scale as you grow with no hidden fees and no surprises.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/salon-owner/signup">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan) => {
                const IconComponent = getPlanIcon(plan.name);
                const isPopular = plan.is_featured;

                return (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col h-full border-2 transition-all hover:shadow-xl ${isPopular ? 'border-accent shadow-lg scale-105' : 'border-border'
                      }`}
                  >
                    {/* {isPopular && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-4 py-1 rounded-full text-sm font-bold">
                        Most Popular
                      </div>
                    )} */}

                    <CardContent className="p-8 flex flex-col h-full">
                      <div className="mb-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${isPopular ? 'bg-accent text-white' : 'bg-accent/10 text-accent'
                          }`}>
                          <IconComponent className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                        <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">RM {parseFloat(plan.price_monthly.toString()).toLocaleString()}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8 flex-grow">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="mt-1 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Link to="/salon-owner/signup">
                        <Button
                          className={`w-full h-12 rounded-xl transition-all ${isPopular
                            ? 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20'
                            : 'bg-secondary hover:bg-secondary/80 text-foreground'
                            }`}
                        >
                          {isPopular ? 'Start Free Trial' : 'Get Started Now'}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-3 text-lg">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-accent/5 to-accent/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Salon?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of salon owners who have streamlined their business with our platform.
            Start your free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/salon-owner/signup">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
