import { useEffect, useState } from "react";
import {
  Megaphone,
  Image,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  position: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface Offer {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  max_uses: number | null;
  used_count: number;
}

export default function AdminMarketing() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("banners");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    link_text: "",
    position: "home_hero",
  });
  
  const [offerForm, setOfferForm] = useState({
    name: "",
    description: "",
    code: "",
    discount_type: "percentage",
    discount_value: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bannersResult, offersResult] = await Promise.all([
        supabase.from('platform_banners').select('*').order('sort_order'),
        supabase.from('platform_offers').select('*').order('created_at', { ascending: false }),
      ]);

      setBanners(bannersResult.data || []);
      setOffers(offersResult.data || []);
    } catch (error) {
      console.error('Error fetching marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBanner = async () => {
    try {
      const { error } = await supabase.from('platform_banners').insert({
        title: bannerForm.title,
        subtitle: bannerForm.subtitle || null,
        image_url: bannerForm.image_url || null,
        link_url: bannerForm.link_url || null,
        link_text: bannerForm.link_text || null,
        position: bannerForm.position,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Banner created successfully" });
      await fetchData();
      setShowBannerDialog(false);
      setBannerForm({
        title: "",
        subtitle: "",
        image_url: "",
        link_url: "",
        link_text: "",
        position: "home_hero",
      });
    } catch (error) {
      console.error('Error saving banner:', error);
      toast({ title: "Error", description: "Failed to create banner", variant: "destructive" });
    }
  };

  const handleSaveOffer = async () => {
    try {
      const { error } = await supabase.from('platform_offers').insert({
        name: offerForm.name,
        description: offerForm.description || null,
        code: offerForm.code || null,
        discount_type: offerForm.discount_type,
        discount_value: offerForm.discount_value,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Offer created successfully" });
      await fetchData();
      setShowOfferDialog(false);
      setOfferForm({
        name: "",
        description: "",
        code: "",
        discount_type: "percentage",
        discount_value: 0,
      });
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({ title: "Error", description: "Failed to create offer", variant: "destructive" });
    }
  };

  const toggleBannerStatus = async (id: string, isActive: boolean) => {
    try {
      await supabase
        .from('platform_banners')
        .update({ is_active: isActive })
        .eq('id', id);
      await fetchData();
    } catch (error) {
      console.error('Error updating banner:', error);
    }
  };

  const toggleOfferStatus = async (id: string, isActive: boolean) => {
    try {
      await supabase
        .from('platform_offers')
        .update({ is_active: isActive })
        .eq('id', id);
      await fetchData();
    } catch (error) {
      console.error('Error updating offer:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 bg-gray-900 text-white min-h-screen">
        {/* Header - Dark Theme */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-700 to-black p-8 text-white">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Marketing</h1>
                <p className="text-gray-300 text-lg">Manage banners and promotional offers</p>
              </div>
            </div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full bg-orange-400/20 blur-2xl"></div>
        </div>

        {/* Tabs - Dark Theme */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList className="bg-gray-800 border border-gray-700">
              <TabsTrigger value="banners" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Banners</TabsTrigger>
              <TabsTrigger value="offers" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Offers</TabsTrigger>
            </TabsList>
            
            {/* Banner Dialog - Dark Theme */}
            {activeTab === "banners" ? (
              <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Banner
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create Banner</DialogTitle>
                    <DialogDescription className="text-gray-400">Add a new promotional banner</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Title</Label>
                      <Input
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                        placeholder="Banner title"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Subtitle</Label>
                      <Input
                        value={bannerForm.subtitle}
                        onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                        placeholder="Optional subtitle"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Image URL</Label>
                      <Input
                        value={bannerForm.image_url}
                        onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                        placeholder="https://..."
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Link URL</Label>
                        <Input
                          value={bannerForm.link_url}
                          onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                          placeholder="/page or https://..."
                          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Link Text</Label>
                        <Input
                          value={bannerForm.link_text}
                          onChange={(e) => setBannerForm({ ...bannerForm, link_text: e.target.value })}
                          placeholder="Learn More"
                          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Position</Label>
                      <Select
                        value={bannerForm.position}
                        onValueChange={(v) => setBannerForm({ ...bannerForm, position: v })}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="home_hero" className="text-white hover:bg-gray-700 focus:bg-gray-700">Home Hero</SelectItem>
                          <SelectItem value="home_secondary" className="text-white hover:bg-gray-700 focus:bg-gray-700">Home Secondary</SelectItem>
                          <SelectItem value="sidebar" className="text-white hover:bg-gray-700 focus:bg-gray-700">Sidebar</SelectItem>
                          <SelectItem value="popup" className="text-white hover:bg-gray-700 focus:bg-gray-700">Popup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBannerDialog(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveBanner} disabled={!bannerForm.title} className="bg-blue-600 hover:bg-blue-700">
                      Create Banner
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Offer
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create Offer</DialogTitle>
                    <DialogDescription className="text-gray-400">Add a new promotional offer</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Offer Name</Label>
                      <Input
                        value={offerForm.name}
                        onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
                        placeholder="e.g., Summer Sale"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Description</Label>
                      <Textarea
                        value={offerForm.description}
                        onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                        placeholder="Offer details"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Promo Code</Label>
                      <Input
                        value={offerForm.code}
                        onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                        placeholder="e.g., SUMMER20"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Discount Type</Label>
                        <Select
                          value={offerForm.discount_type}
                          onValueChange={(v) => setOfferForm({ ...offerForm, discount_type: v })}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="percentage" className="text-white hover:bg-gray-700 focus:bg-gray-700">Percentage</SelectItem>
                            <SelectItem value="fixed" className="text-white hover:bg-gray-700 focus:bg-gray-700">Fixed Amount</SelectItem>
                            <SelectItem value="free_trial_days" className="text-white hover:bg-gray-700 focus:bg-gray-700">Free Trial Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">
                          {offerForm.discount_type === 'percentage' ? 'Discount %' :
                           offerForm.discount_type === 'fixed' ? 'Amount (₹)' : 'Days'}
                        </Label>
                        <Input
                          type="number"
                          value={offerForm.discount_value}
                          onChange={(e) => setOfferForm({ ...offerForm, discount_value: Number(e.target.value) })}
                          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowOfferDialog(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveOffer} disabled={!offerForm.name} className="bg-blue-600 hover:bg-blue-700">
                      Create Offer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <TabsContent value="banners" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : banners.length === 0 ? (
              <Card className="border-0 shadow-lg bg-gray-800 border border-gray-700">
                <CardContent className="py-12 text-center">
                  <Image className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-50" />
                  <p className="text-gray-400">No banners created yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((banner) => (
                  <Card key={banner.id} className="border-0 shadow-lg bg-gray-800 border border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-white">{banner.title}</CardTitle>
                          {banner.subtitle && (
                            <CardDescription className="text-gray-400">{banner.subtitle}</CardDescription>
                          )}
                        </div>
                        <Switch
                          checked={banner.is_active}
                          onCheckedChange={(checked) => toggleBannerStatus(banner.id, checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Position</span>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">{banner.position.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Status</span>
                          <Badge className={banner.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                            {banner.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : offers.length === 0 ? (
              <Card className="border-0 shadow-lg bg-gray-800 border border-gray-700">
                <CardContent className="py-12 text-center">
                  <Tag className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-50" />
                  <p className="text-gray-400">No offers created yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map((offer) => (
                  <Card key={offer.id} className="border-0 shadow-lg bg-gray-800 border border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg text-white">{offer.name}</CardTitle>
                        <Switch
                          checked={offer.is_active}
                          onCheckedChange={(checked) => toggleOfferStatus(offer.id, checked)}
                        />
                      </div>
                      {offer.description && (
                        <CardDescription className="text-gray-400">{offer.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {offer.code && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono text-lg bg-gray-700 text-gray-300">
                              {offer.code}
                            </Badge>
                          </div>
                        )}
                        <div className="text-2xl font-bold text-blue-400">
                          {offer.discount_type === 'percentage' && `${offer.discount_value}% OFF`}
                          {offer.discount_type === 'fixed' && `₹${offer.discount_value} OFF`}
                          {offer.discount_type === 'free_trial_days' && `${offer.discount_value} Days Free`}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>Used: {offer.used_count}</span>
                          <span>{offer.max_uses ? `Max: ${offer.max_uses}` : 'Unlimited'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}