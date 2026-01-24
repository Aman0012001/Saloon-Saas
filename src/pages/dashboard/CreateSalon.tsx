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
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";

export default function CreateSalon() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { createSalon, salons } = useSalon();
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

  const handleFileUpload = async (file: File, bucket: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') setLogoPreview(reader.result as string);
      else setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to supabase (assuming 'salon-assets' bucket exists or similar)
    setLoading(true);
    const url = await handleFileUpload(file, 'salon_images');
    if (url) {
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'cover_image_url']: url
      }));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to salon owner login if not logged in
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
      slug: formData.slug || generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const salon = await createSalon({
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      description: formData.description,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      phone: formData.phone,
      email: formData.email,
      logo_url: formData.logo_url,
      cover_image_url: formData.cover_image_url,
    });

    setLoading(false);

    if (salon) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <Card className="border-0 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl border border-white/40">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent via-purple-500 to-accent" />

          <CardHeader className="text-center pt-12 pb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-accent to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-accent/20 rotate-3 group hover:rotate-0 transition-transform duration-500">
              <Store className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {salons.length === 0 ? "Launch Your Empire" : "Register New Salon"}
            </CardTitle>
            <CardDescription className="text-slate-500 text-base md:text-lg font-medium max-w-md mx-auto mt-2">
              {salons.length === 0
                ? "Experience NoamSkin's premium features free for 14 days. Scale your beauty business with ease."
                : "Expand your business by adding another location to your professional network."
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 md:px-12 pb-12">
            {/* Professional Trial Badge */}
            {salons.length === 0 && (
              <div className="mb-10 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-2xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1 bg-accent/20 backdrop-blur-md border border-accent/30 rounded-full flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent fill-current" />
                      <span className="text-xs font-black uppercase tracking-widest text-accent">Free Trial Active</span>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold mb-4">14-Day Full Access Unleashed</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, text: "Pro Features" },
                      { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, text: "Unlimited Bookings" },
                      { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, text: "AI Insights" },
                      { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, text: "VIP Support" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                        {item.icon}
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Brand Visuals - Premium Look */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-black">01</div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Brand Identity</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Logo Upload Field */}
                  <div className="space-y-3">
                    <Label className="text-slate-600 font-bold ml-1">Official Salon Logo</Label>
                    <div className="flex items-center gap-6">
                      <div className="relative group/logo">
                        <div className="w-32 h-32 rounded-[2rem] bg-slate-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group-hover/logo:border-accent group-hover/logo:bg-accent/5 transition-all duration-300 shadow-sm">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover p-1 rounded-[1.8rem]" />
                          ) : (
                            <div className="text-center">
                              <Camera className="w-10 h-10 text-slate-300 mx-auto group-hover/logo:text-accent group-hover/logo:scale-110 transition-all" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 block">Upload</span>
                            </div>
                          )}
                          <label className="absolute inset-0 cursor-pointer opacity-0">
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'logo')} />
                          </label>
                        </div>
                        {logoPreview && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setLogoPreview(null); setFormData(p => ({ ...p, logo_url: "" })); }}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-accent transition-colors border-4 border-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-black text-slate-900">Brand Logo</p>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Use a high-quality square logo (PNG/JPG). Transparent BG preferred.</p>
                      </div>
                    </div>
                  </div>

                  {/* Cover Upload Field */}
                  <div className="space-y-3">
                    <Label className="text-slate-600 font-bold ml-1">Signature Cover Photo</Label>
                    <div className="relative group/cover w-full h-32 rounded-[2rem] bg-slate-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group-hover/cover:border-accent group-hover/cover:bg-accent/5 transition-all duration-300 shadow-sm">
                      {coverPreview ? (
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm border border-slate-100 group-hover/cover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-slate-400 group-hover/cover:text-accent" />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Choose Background</span>
                        </div>
                      )}
                      <label className="absolute inset-0 cursor-pointer opacity-0">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'cover')} />
                      </label>
                      {coverPreview && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCoverPreview(null); setFormData(p => ({ ...p, cover_image_url: "" })); }}
                          className="absolute top-3 right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-accent transition-colors border-4 border-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Info - Premium Inputs */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-black">02</div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Basic Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-600 font-bold ml-1 uppercase text-[10px] tracking-widest">Salon Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Zenith Beauty Hub"
                      className="h-14 bg-slate-50/50 border-none rounded-2xl text-lg font-medium focus-visible:ring-2 focus-visible:ring-accent/20 transition-all px-6"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-slate-600 font-bold ml-1 uppercase text-[10px] tracking-widest">URL Alias *</Label>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">noamskin.com/</div>
                      <Input
                        id="slug"
                        className="h-14 bg-slate-50/50 border-none rounded-2xl text-lg font-medium focus-visible:ring-2 focus-visible:ring-accent/20 pl-[110px] pr-6"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-600 font-bold ml-1 uppercase text-[10px] tracking-widest">About the Salon</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your salon's magic..."
                    className="bg-slate-50/50 border-none rounded-[2rem] text-lg font-medium focus-visible:ring-2 focus-visible:ring-accent/20 min-h-[140px] p-6"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Contact & Location - Combined */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-black">03</div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Contact & Location</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-600 font-bold ml-1 uppercase text-[10px] tracking-widest">Business Phone</Label>
                    <Input id="phone" type="tel" placeholder="+91 0000 000 000" className="h-14 bg-slate-50/50 border-none rounded-2xl text-lg font-medium focus-visible:ring-2 focus-visible:ring-accent/20 px-6" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-600 font-bold ml-1 uppercase text-[10px] tracking-widest">Business Email</Label>
                    <Input id="email" type="email" placeholder="hello@yoursalon.com" className="h-14 bg-slate-50/50 border-none rounded-2xl text-lg font-medium focus-visible:ring-2 focus-visible:ring-accent/20 px-6" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-slate-600 font-bold ml-1 uppercase text-[10px] tracking-widest">Street Address</Label>
                    <Input id="address" placeholder="e.g., Floor 4, Platinum Towers" className="h-14 bg-slate-50/50 border-none rounded-2xl text-lg font-medium focus-visible:ring-2 focus-visible:ring-accent/20 px-6" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-slate-600 font-bold ml-1 uppercase text-[10px] tracking-widest">City</Label>
                      <Input id="city" placeholder="Mumbai" className="h-14 bg-slate-50/50 border-none rounded-2xl text-lg font-medium focus-visible:ring-2 focus-visible:ring-accent/20 px-6" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-slate-600 font-bold ml-1 uppercase text-[10px] tracking-widest">State</Label>
                      <Input id="state" placeholder="Maharashtra" className="h-14 bg-slate-50/50 border-none rounded-2xl text-lg font-medium focus-visible:ring-2 focus-visible:ring-accent/20 px-6" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-slate-600 font-bold ml-1 uppercase text-[10px] tracking-widest">ZIP/PIN Code</Label>
                      <Input id="pincode" placeholder="400001" className="h-14 bg-slate-50/50 border-none rounded-2xl text-lg font-medium focus-visible:ring-2 focus-visible:ring-accent/20 px-6" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action - Premium Button */}
              <div className="flex flex-col-reverse sm:flex-row gap-6 pt-10">
                {salons.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/dashboard")}
                    className="h-16 flex-1 text-slate-500 hover:text-slate-900 font-bold text-lg rounded-2xl border-2 border-transparent hover:bg-slate-100"
                  >
                    <ArrowLeft className="w-5 h-5 mr-3" />
                    Discard Changes
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading || !formData.name}
                  className="h-16 flex-1 bg-slate-900 hover:bg-black text-white rounded-[1.8rem] font-black text-lg shadow-2xl shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-white/10 to-accent/0 -translate-x-full group-hover:animate-shimmer" />
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>SECURELY REGISTERING...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>{salons.length === 0 ? "CLAIM YOUR FREE TRIAL" : "LAUNCH SALON PROFILE"}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
