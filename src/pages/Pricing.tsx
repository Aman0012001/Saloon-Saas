import { Link } from "react-router-dom";
import { 
  Check, 
  Star, 
  Crown, 
  Zap, 
  Shield, 
  Users, 
  Calendar, 
  BarChart3,
  Headphones,
  Smartphone,
  Globe,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      icon: Star,
      price: "₹999",
      period: "/month",
      description: "Perfect for small salons getting started",
      popular: false,
      features: [
        "Up to 100 bookings/month",
        "Basic appointment management",
        "Customer database",
        "SMS notifications",
        "Mobile app access",
        "Basic reporting",
        "Email support"
      ],
      limitations: [
        "Limited to 1 salon location",
        "Basic customization",
        "Standard support"
      ]
    },
    {
      name: "Professional",
      icon: Crown,
      price: "₹2,499",
      period: "/month",
      description: "Most popular choice for growing salons",
      popular: true,
      features: [
        "Unlimited bookings",
        "Advanced appointment management",
        "Customer loyalty programs",
        "SMS + Email + WhatsApp notifications",
        "Staff management",
        "Inventory tracking",
        "Advanced analytics",
        "Online payments",
        "Custom branding",
        "Priority support"
      ],
      limitations: [
        "Up to 3 salon locations"
      ]
    },
    {
      name: "Enterprise",
      icon: Zap,
      price: "₹4,999",
      period: "/month",
      description: "Complete solution for salon chains",
      popular: false,
      features: [
        "Everything in Professional",
        "Unlimited salon locations",
        "Multi-location management",
        "Advanced staff scheduling",
        "Franchise management",
        "Custom integrations",
        "White-label solution",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom training"
      ],
      limitations: []
    }
  ];

  const addOns = [
    {
      name: "Advanced Analytics",
      price: "₹499/month",
      description: "Detailed business insights and performance metrics",
      icon: BarChart3
    },
    {
      name: "WhatsApp Integration",
      price: "₹299/month", 
      description: "Send booking confirmations and reminders via WhatsApp",
      icon: Smartphone
    },
    {
      name: "Website Integration",
      price: "₹799/month",
      description: "Embed booking widget on your salon website",
      icon: Globe
    },
    {
      name: "Dedicated Support",
      price: "₹1,999/month",
      description: "Priority support with dedicated account manager",
      icon: Headphones
    }
  ];

  const faqs = [
    {
      question: "Is there a free trial?",
      answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required."
    },
    {
      question: "Can I change plans anytime?",
      answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, UPI, and net banking. All payments are secure and encrypted."
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees! We'll help you get started for free, including data migration and staff training."
    },
    {
      question: "What if I need more bookings?",
      answer: "Our Professional and Enterprise plans include unlimited bookings. For Starter plan, additional bookings are ₹2 each."
    },
    {
      question: "Do you offer discounts for annual payments?",
      answer: "Yes! Save 20% when you pay annually. Contact our sales team for custom pricing for multiple locations."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-accent/5 to-accent/10">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-accent/10 text-accent border-accent/20">
            Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Simple, Affordable
            <br />
            <span className="text-accent">Pricing Plans</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your salon. Start with our free trial and scale as you grow.
            No hidden fees, no surprises.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard/create-salon">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon;
              
              return (
                <Card 
                  key={plan.name} 
                  className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                    plan.popular 
                      ? 'border-accent bg-gradient-to-b from-accent/5 to-accent/10 scale-105' 
                      : 'border-border hover:border-accent/30'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-accent text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-accent" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <p className="text-muted-foreground">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-accent">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {plan.limitations.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Limitations:</p>
                        {plan.limitations.map((limitation, idx) => (
                          <p key={idx} className="text-xs text-muted-foreground">
                            • {limitation}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    <Link to="/dashboard/create-salon" className="block">
                      <Button 
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-accent hover:bg-accent/90 text-white' 
                            : 'bg-background border-2 border-accent text-accent hover:bg-accent hover:text-white'
                        }`}
                        size="lg"
                      >
                        {plan.popular ? 'Start Free Trial' : 'Get Started'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Add-on Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enhance your salon management with these optional add-ons
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {addOns.map((addon, index) => {
              const IconComponent = addon.icon;
              
              return (
                <Card key={addon.name} className="text-center hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-bold mb-2">{addon.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{addon.description}</p>
                    <p className="text-lg font-bold text-accent">{addon.price}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
            <Link to="/dashboard/create-salon">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8">
              Contact Sales
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            ⚡ Setup in 5 minutes • 📞 Free onboarding support • 🔒 Secure & reliable
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;