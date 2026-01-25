import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Gift, 
  Plus, 
  Percent,
  Calendar,
  Users,
  TrendingUp,
  Tag,
  Clock,
  Star,
  Edit,
  Trash2
} from "lucide-react";

const OffersPage = () => {
  const [activeTab, setActiveTab] = useState("active");

  // Mock data
  const offers = [
    {
      id: "OFF001",
      title: "New Customer Discount",
      description: "20% off on first visit for new customers",
      type: "percentage",
      value: 20,
      code: "WELCOME20",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
      status: "active",
      usageCount: 45,
      maxUsage: 100
    },
    {
      id: "OFF002",
      title: "Weekend Special",
      description: "$500 off on services above $2000",
      type: "fixed",
      value: 500,
      code: "WEEKEND500",
      startDate: "2024-01-15",
      endDate: "2024-02-15",
      status: "active",
      usageCount: 23,
      maxUsage: 50
    },
    {
      id: "OFF003",
      title: "Loyalty Reward",
      description: "15% off for customers with 5+ visits",
      type: "percentage",
      value: 15,
      code: "LOYAL15",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      status: "active",
      usageCount: 78,
      maxUsage: 200
    },
    {
      id: "OFF004",
      title: "Festival Offer",
      description: "Buy 2 services, get 1 free",
      type: "bogo",
      value: 0,
      code: "FESTIVAL2024",
      startDate: "2023-12-01",
      endDate: "2023-12-31",
      status: "expired",
      usageCount: 156,
      maxUsage: 200
    }
  ];

  const stats = [
    {
      title: "Active Offers",
      value: "3",
      change: "+1",
      icon: Gift
    },
    {
      title: "Total Redemptions",
      value: "302",
      change: "+45",
      icon: Tag
    },
    {
      title: "Revenue from Offers",
      value: "$45,600",
      change: "+12%",
      icon: TrendingUp
    },
    {
      title: "Avg. Discount",
      value: "18%",
      change: "-2%",
      icon: Percent
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-sage/20 text-sage border-0">Active</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500/20 text-blue-600 border-0">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOfferTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return <Percent className="w-5 h-5 text-accent" />;
      case "fixed":
        return <Tag className="w-5 h-5 text-accent" />;
      case "bogo":
        return <Gift className="w-5 h-5 text-accent" />;
      default:
        return <Gift className="w-5 h-5 text-accent" />;
    }
  };

  const activeOffers = offers.filter(offer => offer.status === "active");
  const expiredOffers = offers.filter(offer => offer.status === "expired");

  return (
    <ResponsiveDashboardLayout
      showBackButton={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Offers & Promotions</h1>
            <p className="text-muted-foreground">
              Create and manage promotional offers for your salon
            </p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 gap-2">
            <Plus className="w-4 h-4" />
            Create Offer
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-border shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-sage" />
                  <span className="text-sage">{stat.change}</span>
                  <span className="text-muted-foreground">this month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active Offers</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle>Active Promotional Offers</CardTitle>
                <CardDescription>
                  Currently running offers and promotions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                          {getOfferTypeIcon(offer.type)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{offer.title}</p>
                          <p className="text-sm text-muted-foreground">{offer.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Code: {offer.code}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Used: {offer.usageCount}/{offer.maxUsage}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {offer.type === "percentage" ? `${offer.value}% OFF` : 
                             offer.type === "fixed" ? `$${offer.value} OFF` : "BOGO"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires: {new Date(offer.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(offer.status)}
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle>Expired Offers</CardTitle>
                <CardDescription>
                  Previously run promotional campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expiredOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 opacity-75"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          {getOfferTypeIcon(offer.type)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{offer.title}</p>
                          <p className="text-sm text-muted-foreground">{offer.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Code: {offer.code}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Final Usage: {offer.usageCount}/{offer.maxUsage}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-muted-foreground">
                            {offer.type === "percentage" ? `${offer.value}% OFF` : 
                             offer.type === "fixed" ? `$${offer.value} OFF` : "BOGO"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expired: {new Date(offer.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(offer.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Top Performing Offers
                  </CardTitle>
                  <CardDescription>
                    Most successful promotional campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {offers.slice(0, 3).map((offer, index) => (
                      <div key={offer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-accent">{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium">{offer.title}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {offer.usageCount} uses
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Offer Performance Timeline
                  </CardTitle>
                  <CardDescription>
                    Usage trends over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-secondary/30 rounded-lg">
                    <div className="text-center">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Timeline chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveDashboardLayout>
  );
};

export default OffersPage;
    