import { Link } from "react-router-dom";
import {
  Users,
  Target,
  Award,
  Heart,
  Scissors,
  Calendar,
  TrendingUp,
  Shield,
  Clock,
  Star,
  ArrowRight,
  Sparkles,
  Globe,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AboutUs = () => {
  const stats = [
    { number: "500+", label: "Salons Trust Us", icon: Scissors },
    { number: "50,000+", label: "Appointments Booked", icon: Calendar },
    { number: "4.8/5", label: "Customer Rating", icon: Star },
    { number: "99.9%", label: "Uptime Guarantee", icon: Shield }
  ];

  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description: "Every feature we build is designed with salon owners and their customers in mind."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We constantly evolve our platform with cutting-edge technology and user feedback."
    },
    {
      icon: Shield,
      title: "Reliability",
      description: "Your business depends on us, so we ensure 99.9% uptime and secure data handling."
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "Making salon management simple and affordable for businesses of all sizes."
    }
  ];



  const milestones = [
    {
      year: "2022",
      title: "Founded",
      description: "Started with a vision to digitize salon management in Malaysia"
    },
    {
      year: "2023",
      title: "100+ Salons",
      description: "Reached our first major milestone with 100 salon partners"
    },
    {
      year: "2024",
      title: "Mobile App Launch",
      description: "Launched mobile app for seamless on-the-go management"
    },
    {
      year: "2024",
      title: "500+ Salons",
      description: "Now trusted by 500+ salons across Malaysia"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mt-8 mb-6 bg-accent/10 text-accent border-accent/20">
            About Noamskin
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Empowering Salons
            <br />
            <span className="text-accent">Across Malaysia</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            We're on a mission to transform how salons operate, helping beauty professionals
            focus on what they do best - making their customers look and feel amazing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard/create-salon">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/book">
              <Button size="lg" variant="outline" className="px-8">
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{stat.number}</h3>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Noamskin was born from a simple observation: salon owners were spending more time
                  managing paperwork than serving customers. Our founder, Priya, experienced this
                  firsthand while running her own salon in Mumbai.
                </p>
                <p>
                  After struggling with appointment books, manual billing, and customer management,
                  she envisioned a digital solution that would be simple, affordable, and designed
                  specifically for Malaysian salons.
                </p>
                <p>
                  Today, we're proud to serve 500+ salons across Malaysia, helping them streamline
                  operations, increase revenue, and provide better customer experiences.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-lg">👩‍💼</div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">👨‍💻</div>
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg">👩‍🎨</div>
                </div>
                <div>
                  <p className="font-semibold">Built by salon experts</p>
                  <p className="text-sm text-muted-foreground">For salon professionals</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img
                    src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300&h=200&fit=crop"
                    alt="Salon professional at work"
                    className="w-full h-48 object-cover rounded-xl shadow-lg"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=250&fit=crop"
                    alt="Modern salon interior"
                    className="w-full h-56 object-cover rounded-xl shadow-lg"
                  />
                </div>
                <div className="pt-8 space-y-4">
                  <img
                    src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&h=250&fit=crop"
                    alt="Customer getting haircut"
                    className="w-full h-56 object-cover rounded-xl shadow-lg"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&h=200&fit=crop"
                    alt="Salon equipment"
                    className="w-full h-48 object-cover rounded-xl shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 bg-gradient-to-br from-accent/5 to-accent/10">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Mission & Vision</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Driving the digital transformation of Malaysia's beauty industry
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-muted-foreground">
                  To empower every salon owner in Malaysia with technology that simplifies business
                  management, increases profitability, and enhances customer satisfaction. We believe
                  every salon, regardless of size, deserves access to world-class management tools.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-muted-foreground">
                  To become Malaysia's leading salon management platform, transforming how beauty
                  businesses operate and grow. We envision a future where technology seamlessly
                  integrates with creativity, allowing salon professionals to focus on their craft.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Journey Timeline */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Key milestones in our mission to transform salon management
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-accent/20 md:transform md:-translate-x-0.5"></div>

              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    {/* Timeline dot */}
                    <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-accent rounded-full md:transform md:-translate-x-1.5 z-10"></div>

                    {/* Content */}
                    <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                      <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                          <Badge className="mb-3 bg-accent/10 text-accent border-accent/20">
                            {milestone.year}
                          </Badge>
                          <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                          <p className="text-muted-foreground">{milestone.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 bg-gradient-to-br from-accent/5 to-accent/10">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Salons Choose Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built specifically for Malaysian salons with features that matter
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: "Save 5+ Hours Daily",
                description: "Automate scheduling, billing, and customer management"
              },
              {
                icon: TrendingUp,
                title: "Increase Revenue by 30%",
                description: "Better customer retention and optimized pricing"
              },
              {
                icon: Users,
                title: "Improve Customer Experience",
                description: "Online booking, reminders, and loyalty programs"
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                description: "Bank-grade security with 99.9% uptime guarantee"
              },
              {
                icon: Sparkles,
                title: "Easy to Use",
                description: "Intuitive interface designed for salon professionals"
              },
              {
                icon: Award,
                title: "24/7 Support",
                description: "Dedicated customer success team in Hindi & English"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Salon?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join 500+ salon owners who have already transformed their business with Noamskin.
            Start your 14-day free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard/create-salon">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/book">
              <Button size="lg" variant="outline" className="px-8">
                Schedule Demo
              </Button>
            </Link>
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

export default AboutUs;
