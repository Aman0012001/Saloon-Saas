import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSalon } from "@/hooks/useSalon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { Calendar, Heart, AlertCircle, Pill, FileText, Save, Loader2, Image as ImageIcon, Camera } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CustomerHealthProfileProps {
    userId: string;
    userName: string;
    onClose?: () => void;
}

export default function CustomerHealthProfile({ userId, userName, onClose }: CustomerHealthProfileProps) {
    const { toast } = useToast();
    const { currentSalon } = useSalon();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [profile, setProfile] = useState({
        date_of_birth: "",
        skin_type: "",
        skin_issues: [] as string[],
        allergies: [] as string[],
        medical_conditions: [] as string[],
        notes: "",
        concern_photo_url: "",
        concern_photo_public_id: "",
    });

    const [uploading, setUploading] = useState(false);

    const [newSkinIssue, setNewSkinIssue] = useState("");
    const [newAllergy, setNewAllergy] = useState("");
    const [newCondition, setNewCondition] = useState("");

    const loadProfile = async () => {
        if (!currentSalon) return;

        setLoading(true);
        try {
            const data = await api.customerRecords.getProfile(userId, currentSalon.id);
            if (data && data.profile) {
                const profileData = data.profile;
                setProfile({
                    date_of_birth: profileData.date_of_birth || "",
                    skin_type: profileData.skin_type || "",
                    skin_issues: typeof profileData.skin_issues === 'string'
                        ? profileData.skin_issues.split(',').map((s: string) => s.trim()).filter(Boolean)
                        : profileData.skin_issues || [],
                    allergies: typeof profileData.allergy_records === 'string'
                        ? profileData.allergy_records.split(',').map((s: string) => s.trim()).filter(Boolean)
                        : profileData.allergy_records || [],
                    medical_conditions: typeof profileData.medical_conditions === 'string'
                        ? profileData.medical_conditions.split(',').map((s: string) => s.trim()).filter(Boolean)
                        : profileData.medical_conditions || [],
                    notes: profileData.notes || "",
                    concern_photo_url: profileData.concern_photo_url || "",
                    concern_photo_public_id: profileData.concern_photo_public_id || "",
                });
            }
        } catch (error: any) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await api.uploads.upload(file);
            setProfile(prev => ({
                ...prev,
                concern_photo_url: response.url,
                concern_photo_public_id: response.public_id
            }));
            toast({ title: "Photo Uploaded", description: "Concern photo added to profile." });
        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!currentSalon) return;

        setSaving(true);
        try {
            await api.customerRecords.saveProfile({
                user_id: userId,
                salon_id: currentSalon.id,
                ...profile,
            });

            toast({
                title: "Profile Saved",
                description: "Customer health profile updated successfully.",
            });

            if (onClose) onClose();
        } catch (error: any) {
            toast({
                title: "Save Failed",
                description: error.message || "Failed to save profile.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const addItem = (type: 'skin_issues' | 'allergies' | 'medical_conditions', value: string) => {
        if (!value.trim()) return;
        setProfile(prev => ({
            ...prev,
            [type]: [...prev[type], value.trim()]
        }));
        if (type === 'skin_issues') setNewSkinIssue("");
        if (type === 'allergies') setNewAllergy("");
        if (type === 'medical_conditions') setNewCondition("");
    };

    const removeItem = (type: 'skin_issues' | 'allergies' | 'medical_conditions', index: number) => {
        setProfile(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    useEffect(() => {
        loadProfile();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Health Profile</h2>
                    <p className="text-sm text-muted-foreground font-medium">{userName}</p>
                </div>
                <Button onClick={loadProfile} variant="outline" size="sm" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load Profile"}
                </Button>
            </div>

            {/* Concern Photo Section */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 px-6">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        Skin Concern Photo
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-32 h-32 bg-secondary/30 rounded-2xl overflow-hidden flex items-center justify-center relative group hover:bg-secondary/50 transition-colors border-2 border-dashed border-slate-200">
                            {profile.concern_photo_url ? (
                                <img src={profile.concern_photo_url} alt="Skin concern" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-8 h-8 text-slate-400" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleImageUpload}
                                disabled={uploading}
                            />
                            {uploading && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-sm text-muted-foreground font-medium mb-2">
                                {profile.concern_photo_url ? "Click image to change or update your concern photo." : "Upload a photo of your skin concern for clinical review."}
                            </p>
                            <Button variant="outline" size="sm" className="rounded-xl relative">
                                <ImageIcon className="w-4 h-4 mr-2" />
                                {profile.concern_photo_url ? "Change Photo" : "Upload Photo"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <Card className="border-none shadow-sm rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-accent" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="dob" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date of Birth</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={profile.date_of_birth}
                                onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                                className="h-11 bg-secondary/30 border-none rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="skin_type" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Skin Type</Label>
                            <Select value={profile.skin_type} onValueChange={(v) => setProfile({ ...profile, skin_type: v })}>
                                <SelectTrigger className="h-11 bg-secondary/30 border-none rounded-xl">
                                    <SelectValue placeholder="Select skin type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="dry">Dry</SelectItem>
                                    <SelectItem value="oily">Oily</SelectItem>
                                    <SelectItem value="combination">Combination</SelectItem>
                                    <SelectItem value="sensitive">Sensitive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Skin Issues */}
                <Card className="border-none shadow-sm rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Heart className="w-5 h-5 text-rose-500" />
                            Skin Issues
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add skin issue..."
                                value={newSkinIssue}
                                onChange={(e) => setNewSkinIssue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addItem('skin_issues', newSkinIssue)}
                                className="h-10 bg-secondary/30 border-none rounded-xl flex-1"
                            />
                            <Button size="sm" onClick={() => addItem('skin_issues', newSkinIssue)} className="rounded-xl">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.skin_issues.map((issue, i) => (
                                <Badge key={i} variant="secondary" className="px-3 py-1 rounded-lg">
                                    {issue}
                                    <button onClick={() => removeItem('skin_issues', i)} className="ml-2 text-xs">×</button>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Allergies */}
                <Card className="border-none shadow-sm rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Allergies
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add allergy..."
                                value={newAllergy}
                                onChange={(e) => setNewAllergy(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addItem('allergies', newAllergy)}
                                className="h-10 bg-secondary/30 border-none rounded-xl flex-1"
                            />
                            <Button size="sm" onClick={() => addItem('allergies', newAllergy)} className="rounded-xl">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.allergies.map((allergy, i) => (
                                <Badge key={i} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg border-none">
                                    {allergy}
                                    <button onClick={() => removeItem('allergies', i)} className="ml-2 text-xs">×</button>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Medical Conditions */}
                <Card className="border-none shadow-sm rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Pill className="w-5 h-5 text-blue-500" />
                            Medical Conditions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add condition..."
                                value={newCondition}
                                onChange={(e) => setNewCondition(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addItem('medical_conditions', newCondition)}
                                className="h-10 bg-secondary/30 border-none rounded-xl flex-1"
                            />
                            <Button size="sm" onClick={() => addItem('medical_conditions', newCondition)} className="rounded-xl">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.medical_conditions.map((condition, i) => (
                                <Badge key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg border-none">
                                    {condition}
                                    <button onClick={() => removeItem('medical_conditions', i)} className="ml-2 text-xs">×</button>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notes */}
            <Card className="border-none shadow-sm rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-accent" />
                        Additional Notes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Any additional notes about the customer..."
                        value={profile.notes}
                        onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
                        rows={4}
                        className="bg-secondary/30 border-none rounded-xl"
                    />
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                {onClose && (
                    <Button variant="outline" onClick={onClose} className="rounded-xl">
                        Cancel
                    </Button>
                )}
                <Button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/90 text-white rounded-xl px-8">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Profile
                </Button>
            </div>
        </div >
    );
}
