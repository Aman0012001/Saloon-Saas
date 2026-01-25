import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw, Database } from "lucide-react";

export default function SupabaseDebug() {
    const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking");
    const [salons, setSalons] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const checkConnection = async () => {
        setLoading(true);
        setConnectionStatus("checking");
        setError(null);

        try {
            console.log("🔍 Checking Supabase connection...");
            console.log("📍 Supabase URL:", import.meta.env.VITE_SUPABASE_URL);

            // Test connection by fetching salons
            const { data, error: fetchError, count } = await supabase
                .from('salons')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            if (fetchError) {
                console.error("❌ Error:", fetchError);
                setConnectionStatus("error");
                setError(fetchError.message);
                return;
            }

            console.log("✅ Connection successful!");
            console.log(`📊 Found ${data?.length || 0} salons`);
            setConnectionStatus("connected");
            setSalons(data || []);
        } catch (err: any) {
            console.error("❌ Connection failed:", err);
            setConnectionStatus("error");
            setError(err.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-3xl">
                            <Database className="h-8 w-8" />
                            Supabase Connection Debug
                        </CardTitle>
                        <p className="text-blue-100">Check your database connection and view stored data</p>
                    </CardHeader>
                </Card>

                {/* Connection Status */}
                <Card className="border-0 shadow-xl bg-gray-800 border border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-white">
                            <span>Connection Status</span>
                            <Button
                                onClick={checkConnection}
                                disabled={loading}
                                variant="outline"
                                size="sm"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            {connectionStatus === "checking" && (
                                <>
                                    <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                                    <span className="text-gray-300">Checking connection...</span>
                                </>
                            )}
                            {connectionStatus === "connected" && (
                                <>
                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                    <span className="text-green-400 font-semibold">Connected to Supabase!</span>
                                </>
                            )}
                            {connectionStatus === "error" && (
                                <>
                                    <XCircle className="h-6 w-6 text-red-400" />
                                    <span className="text-red-400 font-semibold">Connection Failed</span>
                                </>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <p className="text-red-400 font-mono text-sm">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-700 rounded-lg p-4">
                                <p className="text-gray-400 text-sm">Supabase URL</p>
                                <p className="text-white font-mono text-xs mt-1 break-all">
                                    {import.meta.env.VITE_SUPABASE_URL || "Not configured"}
                                </p>
                            </div>
                            <div className="bg-gray-700 rounded-lg p-4">
                                <p className="text-gray-400 text-sm">Total Salons</p>
                                <p className="text-white text-2xl font-bold mt-1">{salons.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Salons List */}
                {salons.length > 0 && (
                    <Card className="border-0 shadow-xl bg-gray-800 border border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white">Salons in Database</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {salons.map((salon, index) => (
                                    <div
                                        key={salon.id}
                                        className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-white font-semibold text-lg">
                                                    {index + 1}. {salon.name}
                                                </h3>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    Slug: <span className="text-blue-400">{salon.slug}</span>
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    Status: <span className={`font-semibold ${salon.approval_status === 'approved' ? 'text-green-400' :
                                                            salon.approval_status === 'pending' ? 'text-yellow-400' :
                                                                'text-red-400'
                                                        }`}>{salon.approval_status}</span>
                                                </p>
                                                {salon.city && (
                                                    <p className="text-gray-400 text-sm">
                                                        Location: {salon.city}, {salon.state}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-400 text-xs">
                                                    Created: {new Date(salon.created_at).toLocaleDateString()}
                                                </p>
                                                <p className="text-gray-400 text-xs">
                                                    Active: {salon.is_active ? '✅' : '❌'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {salons.length === 0 && connectionStatus === "connected" && (
                    <Card className="border-0 shadow-xl bg-gray-800 border border-gray-700">
                        <CardContent className="py-12 text-center">
                            <Database className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-white text-xl font-semibold mb-2">No Salons Found</h3>
                            <p className="text-gray-400">
                                The database is connected, but there are no salons yet.
                                <br />
                                Create a salon to see it appear here!
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Instructions */}
                <Card className="border-0 shadow-xl bg-gray-800 border border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">💡 Important Information</CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-300 space-y-3">
                        <p>
                            <strong className="text-white">Your data is stored in Supabase, NOT in XAMPP/MySQL!</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>This application uses <strong className="text-blue-400">Supabase</strong> (cloud PostgreSQL database)</li>
                            <li>All salons, users, and bookings are stored in the cloud</li>
                            <li>You can view your data at: <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-400 underline">https://supabase.com/dashboard</a></li>
                            <li>XAMPP is NOT being used by this application</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
