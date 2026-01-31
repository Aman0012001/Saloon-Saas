import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, FileText, Upload, Camera } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TreatmentRecordModalProps {
    booking: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TreatmentRecordModal({ booking, open, onOpenChange }: TreatmentRecordModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [record, setRecord] = useState({
        treatment_details: "",
        products_used: "",
        skin_reaction: "",
        improvement_notes: "",
        recommended_next_treatment: "",
        post_treatment_instructions: "",
        before_photo_url: "",
        after_photo_url: ""
    });

    useEffect(() => {
        if (open && booking) {
            fetchRecord();
        }
    }, [open, booking]);

    const fetchRecord = async () => {
        setLoading(true);
        try {
            const data = await api.customerRecords.getTreatmentRecord(booking.id);
            if (data && data.record) {
                setRecord({
                    treatment_details: data.record.treatment_details || "",
                    products_used: data.record.products_used || "",
                    skin_reaction: data.record.skin_reaction || "",
                    improvement_notes: data.record.improvement_notes || "",
                    recommended_next_treatment: data.record.recommended_next_treatment || "",
                    post_treatment_instructions: data.record.post_treatment_instructions || "",
                    before_photo_url: data.record.before_photo_url || "",
                    after_photo_url: data.record.after_photo_url || ""
                });
            } else {
                // Reset if no record found (new record)
                setRecord({
                    treatment_details: "",
                    products_used: "",
                    skin_reaction: "",
                    improvement_notes: "",
                    recommended_next_treatment: "",
                    post_treatment_instructions: "",
                    before_photo_url: "",
                    after_photo_url: ""
                });
            }
        } catch (error) {
            console.error("Error fetching record:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.customerRecords.saveTreatmentRecord({
                booking_id: booking.id,
                ...record
            });
            toast({
                title: "Record Saved",
                description: "Treatment details have been successfully recorded.",
            });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save record",
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const uploadData = await api.uploads.upload(file);
            setRecord(prev => ({
                ...prev,
                [`${type}_photo_url`]: uploadData.url
            }));
            toast({ title: "Photo Uploaded", description: "Image attached successfully." });
        } catch (error) {
            toast({ title: "Upload Failed", description: "Could not upload photo.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Treatment Record</DialogTitle>
                    <DialogDescription>
                        Clinical notes for {booking?.service?.name || booking?.service_name} - {booking?.customer?.full_name || booking?.user_name}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                ) : (
                    <Tabs defaultValue="details" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Cilnical Details</TabsTrigger>
                            <TabsTrigger value="photos">Photos & Instructions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Treatment Details / Procedure Notes</Label>
                                <Textarea
                                    placeholder="Describe specific protocol used, settings, layers, etc..."
                                    className="min-h-[100px]"
                                    value={record.treatment_details}
                                    onChange={e => setRecord({ ...record, treatment_details: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Products Used</Label>
                                <Input
                                    placeholder="List specific serums, masks, or products applied..."
                                    value={record.products_used}
                                    onChange={e => setRecord({ ...record, products_used: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Skin Reaction / Observations</Label>
                                    <Textarea
                                        placeholder="Redness, frosting, sensitivity..."
                                        className="min-h-[80px]"
                                        value={record.skin_reaction}
                                        onChange={e => setRecord({ ...record, skin_reaction: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Improvements / Progress</Label>
                                    <Textarea
                                        placeholder="Comparison to last session..."
                                        className="min-h-[80px]"
                                        value={record.improvement_notes}
                                        onChange={e => setRecord({ ...record, improvement_notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="photos" className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Camera className="w-4 h-4" /> Before Photo</Label>
                                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-dashed border-slate-300 relative flex items-center justify-center group">
                                        {record.before_photo_url ? (
                                            <img src={record.before_photo_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-slate-400">No Image</span>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <label className="cursor-pointer bg-white text-xs font-bold px-3 py-2 rounded-lg">
                                                Upload
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'before')} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Camera className="w-4 h-4" /> After Photo</Label>
                                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-dashed border-slate-300 relative flex items-center justify-center group">
                                        {record.after_photo_url ? (
                                            <img src={record.after_photo_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-slate-400">No Image</span>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <label className="cursor-pointer bg-white text-xs font-bold px-3 py-2 rounded-lg">
                                                Upload
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'after')} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Post-Care Instructions</Label>
                                <Input
                                    placeholder="Instructions given to client..."
                                    value={record.post_treatment_instructions}
                                    onChange={e => setRecord({ ...record, post_treatment_instructions: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Recommended Next Treatment</Label>
                                <Input
                                    placeholder="What to book next time..."
                                    value={record.recommended_next_treatment}
                                    onChange={e => setRecord({ ...record, recommended_next_treatment: e.target.value })}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-accent text-white font-bold">
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" /> Save Record
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
