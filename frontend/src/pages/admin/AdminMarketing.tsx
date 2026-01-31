import { useEffect, useState } from "react";
import {
  Megaphone,
  Image,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Tag,
  Sparkles,
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
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  position: string;
  is_active: boolean;
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
      // Fetch from local marketing API
      const [bannersData, offersData] = await Promise.all([
        api.admin.getBanners(),
        api.admin.getOffers(),
      ]);

      setBanners(bannersData || []);
      setOffers(offersData || []);
    } catch (error) {
      console.error('Local marketing sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBanner = async () => {
    try {
      await api.admin.createBanner(bannerForm);
      toast({ title: "Success", description: "Local banner policy initialized" });
      await fetchData();
      setShowBannerDialog(false);
      setBannerForm({ title: "", subtitle: "", image_url: "", link_url: "", link_text: "", position: "home_hero" });
    } catch (error) {
      console.error('Banner persist failed:', error);
      toast({ title: "Error", description: "Internal registry error", variant: "destructive" });
    }
  };

  const handleSaveOffer = async () => {
    try {
      await api.admin.createOffer(offerForm);
      toast({ title: "Success", description: "Promo code deployed to local node" });
      await fetchData();
      setShowOfferDialog(false);
      setOfferForm({ name: "", description: "", code: "", discount_type: "percentage", discount_value: 0 });
    } catch (error) {
      console.error('Offer persist failed:', error);
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 blur-[120px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-accent">
                <Megaphone className="h-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">Growth Catalyst</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Local Campaign Orchestration</p>
              </div>
            </div>
            <div className="flex gap-4">
              {activeTab === "banners" ? (
                <Button onClick={() => setShowBannerDialog(true)} className="bg-accent text-white font-black rounded-xl h-14 px-8 shadow-lg shadow-accent/20">
                  <Plus className="w-4 h-4 mr-2" /> CREATE ASSET
                </Button>
              ) : (
                <Button onClick={() => setShowOfferDialog(true)} className="bg-blue-600 text-white font-black rounded-xl h-14 px-8 shadow-lg shadow-blue-500/20 hover:bg-blue-700">
                  <Tag className="w-4 h-4 mr-2" /> GENERATE VOUCHER
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white p-1 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
            <TabsTrigger value="banners" className="rounded-[1.5rem] px-8 h-12 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Visual Assets</TabsTrigger>
            <TabsTrigger value="offers" className="rounded-[1.5rem] px-8 h-12 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Promotional Logic</TabsTrigger>
          </TabsList>

          <TabsContent value="banners" className="animate-in fade-in duration-500">
            {loading ? (
              <div className="flex justify-center p-20 animate-pulse text-slate-300"><Sparkles className="w-12 h-12" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {banners.map(banner => (
                  <Card key={banner.id} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all">
                    <div className="h-48 bg-slate-100 relative">
                      {banner.image_url && <img src={banner.image_url} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />}
                      <div className="absolute top-4 right-4"><Switch checked={banner.is_active} /></div>
                    </div>
                    <CardContent className="p-8">
                      <h3 className="text-xl font-black text-slate-900">{banner.title}</h3>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{banner.position}</p>
                      <Button variant="ghost" className="w-full mt-6 rounded-xl border border-slate-100 font-bold hover:bg-slate-50">MANAGE REGISTRY</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers" className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {offers.map(offer => (
                <Card key={offer.id} className="border-none shadow-sm bg-slate-50 rounded-[3rem] p-10 relative overflow-hidden group">
                  <div className="absolute -right-5 -bottom-5 text-slate-100 opacity-20"><Tag className="w-32 h-32" /></div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 mb-2">{offer.name}</h4>
                      <Badge className="bg-white text-slate-900 font-black border-none px-4 py-1 shadow-sm font-mono text-lg">{offer.code}</Badge>
                    </div>
                    <Switch checked={offer.is_active} />
                  </div>
                  <div className="mt-10 relative z-10">
                    <p className="text-4xl font-black text-slate-900">{offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `$${offer.discount_value}`}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Deduction Protocol</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
        <DialogContent className="rounded-[3rem] border-none shadow-2xl p-10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight">Broadcast Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Campaign Title</Label>
              <Input value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Image Source (URL)</Label>
              <Input value={bannerForm.image_url} onChange={e => setBannerForm({ ...bannerForm, image_url: e.target.value })} className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6" />
            </div>
          </div>
          <DialogFooter className="mt-8">
            <Button onClick={handleSaveBanner} className="w-full h-16 bg-slate-900 text-white font-black rounded-3xl shadow-xl">PERSIST TO REGISTRY</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
