import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  Loader2,
  Camera,
  Upload,
  X,
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";

export default function CreateSalon() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { salons, refreshSalons } = useSalon();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    logo_url: "",
    cover_image_url: "",
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') {
        setLogoPreview(reader.result as string);
        setFormData(p => ({ ...p, logo_url: reader.result as string }));
      } else {
        setCoverPreview(reader.result as string);
        setFormData(p => ({ ...p, cover_image_url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/salon-owner/login");
    }
  }, [user, authLoading, navigate]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Use local PHP API to create salon
      await api.salons.create({
        ...formData,
        owner_id: user.id,
        is_active: true,
        approval_status: 'approved' // Auto-approve for local development simplicity
      });

      toast({
        title: "Empire Launched! 🚀",
        description: "Your salon has been registered in the local MySQL database."
      });

      await refreshSalons();
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: error.message || "Could not sync with local backend.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Aura */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden bg-white/60 backdrop-blur-3xl border border-white/40 relative">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-8 left-8 w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:scale-105 z-20 group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>

          <CardHeader className="text-center pt-16 pb-8">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-slate-900/20 rotate-3 transition-all hover:rotate-0">
              <Store className="w-10 h-10 text-accent" />
            </div>
            <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">Register Saloon</CardTitle>
            <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">XAMPP MySQL Instance active</CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-16">
            <form onSubmit={handleSubmit} className="space-y-10">

              {/* Media Upload */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Brand Logo</Label>
                  <div className="h-40 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-100 flex items-center justify-center relative overflow-hidden group">
                    {logoPreview ? (
                      <img src={logoPreview} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-200 group-hover:text-accent transition-colors" />
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => onFileChange(e, 'logo')} />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Cover Aesthetic</Label>
                  <div className="h-40 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-100 flex items-center justify-center relative overflow-hidden group">
                    {coverPreview ? (
                      <img src={coverPreview} className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-200 group-hover:text-accent transition-colors" />
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => onFileChange(e, 'cover')} />
                  </div>
                </div>
              </div>

              {/* Identity Fields */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Saloon Name</Label>
                  <Input
                    placeholder="e.g. Noir Grooming Lounge"
                    className="h-16 bg-slate-50/50 border-none rounded-2xl text-xl font-black px-6 shadow-inner"
                    value={formData.name}
                    onChange={e => handleNameChange(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Phone</Label>
                    <Input
                      placeholder="+91..."
                      className="h-14 bg-slate-50/50 border-none rounded-2xl font-bold px-6 shadow-inner"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">City</Label>
                    <Input
                      placeholder="Location"
                      className="h-14 bg-slate-50/50 border-none rounded-2xl font-bold px-6 shadow-inner"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Physical Address</Label>
                  <Input
                    placeholder="Street, Building, Landmark..."
                    className="h-14 bg-slate-50/50 border-none rounded-2xl font-bold px-6 shadow-inner"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Introduction</Label>
                  <Textarea
                    placeholder="The soul of your salon..."
                    className="bg-slate-50/50 border-none rounded-[2rem] font-medium p-6 min-h-[120px] shadow-inner"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !formData.name}
                className="w-full h-18 bg-slate-900 hover:bg-black text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-slate-900/20 transition-all hover:scale-[1.02] overflow-hidden"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Establishing Local Data...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 uppercase tracking-tighter">
                    <span>Establish Local Hub</span>
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </Button>

            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
