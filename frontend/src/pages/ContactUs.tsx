import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Headphones,
  CheckCircle,
  ArrowRight,
  Instagram,
  Facebook,
  Twitter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    inquiryType: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with our support team",
      contact: "011 23198819",
      availability: "Mon-Sat, 10 AM - 8 PM",
      action: "Call Now",
      href: "tel:01123198819"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us your questions",
      contact: "skinnoam@gmail.com",
      availability: "We respond within 24 hours",
      action: "Send Email",
      href: "mailto:skinnoam@gmail.com"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Chat with us instantly",
      contact: "011 23198819",
      availability: "Mon-Sat, 10 AM - 8 PM",
      action: "Start Chat",
      href: "https://wa.me/601123198819"
    },
    {
      icon: Headphones,
      title: "Visit Us",
      description: "Come experience luxury",
      contact: "Bangsar, KL",
      availability: "Walk-ins Welcome",
      action: "Get Directions",
      href: "https://maps.google.com/?q=46+Jalan+Limau+Nipis+59000+Bangsar+Kuala+Lumpur"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.contactEnquiries.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        // inquiryType is also available if the backend supports it, 
        // but the current migration used 'subject' for the main topic.
        // We'll combine them or just send subject.
      });

      toast({
        title: "Message Sent Successfully! 🎉",
        description: "We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        inquiryType: ""
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-accent/5 to-accent/10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="container mx-auto text-center relative z-10">
          <Badge className="mt-8 mb-6 bg-accent/10 text-accent border-accent/20 px-4 py-1.5 text-sm">
            Get In Touch
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            Contact
            <br />
            <span className="text-accent">Noamskin</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Have questions about our services? Ready to book your transformation?
            Our friendly team is here to help you achieve your beauty goals.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto -mt-24 relative z-20">
            {contactMethods.map((method, index) => {
              const IconComponent = method.icon;

              return (
                <Card key={method.title} className="text-center hover:shadow-xl transition-all duration-300 group border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                      <IconComponent className="w-8 h-8 text-accent group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="font-bold mb-2 text-lg">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                    <p className="font-medium text-accent mb-2">{method.contact}</p>
                    <p className="text-xs text-muted-foreground mb-4">{method.availability}</p>
                    <a href={method.href} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all duration-300">
                        {method.action}
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-accent to-purple-500" />
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Your full name"
                        className="bg-secondary/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your@email.com"
                        className="bg-secondary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="011 23198819"
                        className="bg-secondary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiryType">Inquiry Type</Label>
                      <Select value={formData.inquiryType} onValueChange={(value) => handleInputChange("inquiryType", value)}>
                        <SelectTrigger className="bg-secondary/20">
                          <SelectValue placeholder="Select inquiry type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">Book Appointment</SelectItem>
                          <SelectItem value="service">Service Question</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      placeholder="Brief description of your message"
                      className="bg-secondary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Tell us more about how we can help you..."
                      rows={5}
                      className="bg-secondary/20"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-white shadow-lg shadow-accent/20"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Main Location */}
              <Card className="border-0 shadow-xl overflow-hidden group">
                <div className="h-2 w-full bg-gradient-to-r from-purple-500 to-accent" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    Our Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="pb-4">
                    <h3 className="font-bold text-lg mb-2">Noamskin Salon</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-accent" />
                        </div>
                        <span className="leading-relaxed mt-1">46 Jalan Limau Nipis,<br />59000 Bangsar,<br />Kuala Lumpur</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-accent" />
                        </div>
                        <span>011 23198819</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-accent" />
                        </div>
                        <span>skinnoam@gmail.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3">Follow Us</h4>
                    <div className="flex gap-4">
                      <SocialButton icon={Instagram} href="#" />
                      <SocialButton icon={Facebook} href="#" />
                      <SocialButton icon={Twitter} href="#" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours */}
              {/* <Card className="border-0 shadow-xl overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-accent to-purple-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    Opening Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <span>Monday - Friday</span>
                    <span className="font-medium bg-secondary px-3 py-1 rounded-full text-sm">10:00 AM - 8:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <span>Saturday</span>
                    <span className="font-medium bg-secondary px-3 py-1 rounded-full text-sm">10:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <span>Sunday</span>
                    <span className="text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full text-sm">Closed</span>
                  </div>
                </CardContent>
              </Card> */}

              {/* CTA */}

            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const SocialButton = ({ icon: Icon, href }: { icon: any, href: string }) => (
  <a
    href={href}
    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-white transition-all duration-300 hover:scale-110"
  >
    <Icon className="w-5 h-5" />
  </a>
);

export default ContactUs;
