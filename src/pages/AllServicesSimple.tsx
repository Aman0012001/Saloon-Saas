import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Clock, 
  IndianRupee,
  Scissors,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SimpleService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  salon_id: string;
}

const AllServicesSimple = () => {
  const [services, setServices] = useState<SimpleService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSimpleServices();
  }, []);

  const fetchSimpleServices = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching services (simple mode)...");
      
      const { data: servicesData, error } = await supabase
        .from("services")
        .select("id, name, description, price, duration_minutes, category, salon_id")
        .eq("is_active", true)
        .limit(20);

      if (error) {
        console.error("Services query error:", error);
        throw error;
      }

      console.log("📋 Services found:", servicesData?.length || 0);
      setServices(servicesData || []);

      if (servicesData && servicesData.length > 0) {
        toast({
          title: "Services Loaded",
          description: `Found ${servicesData.length} services available for booking.`,
        });
      } else {
        toast({
          title: "No Services Found",
          description: "Please set up the database first.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Error",
        description: "Failed to load services. Please try the admin setup page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookService = (service: SimpleService) => {
    window.location.href = `/book?salonId=${service.salon_id}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="pt-24 pb-8 px-4 bg-gradient-to-br from-accent/5 to-accent/10">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              All Services
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover all beauty and wellness services available across our partner salons
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-0 shadow-md"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              {loading ? (
                "Loading services..."
              ) : (
                `${filteredServices.length} service${filteredServices.length !== 1 ? 's' : ''} found`
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Services Listing */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Loading Services...</h3>
              <p className="text-muted-foreground">Please wait while we fetch available services.</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {services.length === 0 ? "No services available" : "No services found"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {services.length === 0 
                  ? "Please set up the database first to see available services."
                  : "Try adjusting your search criteria."
                }
              </p>
              <div className="flex gap-4 justify-center">
                {services.length === 0 ? (
                  <>
                    <Link to="/admin-setup">
                      <Button>Setup Database</Button>
                    </Link>
                    <Link to="/salons">
                      <Button variant="outline">Browse Salons</Button>
                    </Link>
                  </>
                ) : (
                  <Button onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg group-hover:text-accent transition-colors">
                        {service.name}
                      </CardTitle>
                      <Badge className="bg-accent/10 text-accent border-accent/20">
                        {service.category || "Service"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Service Details */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-accent/5 rounded-lg">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4 text-accent" />
                        <span className="text-lg font-bold text-accent">₹{service.price}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{service.duration_minutes} min</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      onClick={() => handleBookService(service)}
                      className="w-full bg-accent hover:bg-accent/90 text-white group-hover:shadow-md transition-all"
                    >
                      Book This Service
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Debug Links */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-center mt-12 pt-8 border-t">
              <p className="text-sm text-muted-foreground mb-4">Admin Tools</p>
              <div className="flex gap-4 justify-center">
                <Link to="/admin-setup">
                  <Button variant="outline" size="sm">Admin Setup</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AllServicesSimple;