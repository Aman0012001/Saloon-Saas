import React, { useState, useEffect } from 'react';
import { useCart } from "@/context/CartContext";
import { getImageUrl } from "@/utils/imageUrl";
import { ChevronRight, HelpCircle, Truck, Store, Search, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";

const CheckoutPage = () => {
    const { cart, cartTotal, cartCount, clearCart } = useCart();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    const [deliveryMethod, setDeliveryMethod] = useState<'ship' | 'pickup'>('ship');
    const [loading, setLoading] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderId, setOrderId] = useState("");

    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        address: "",
        apartment: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Malaysia",
        saveInfo: false
    });

    // Tax rate constant (e.g., 6% SST)
    const TAX_RATE = 0.06;

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || "",
                firstName: user.full_name?.split(' ')[0] || "",
                lastName: user.full_name?.split(' ').slice(1).join(' ') || "",
            }));
        }
    }, [user]);

    // Redirect empty cart if not order complete
    useEffect(() => {
        if (cart.length === 0 && !orderComplete) {
            navigate("/cart");
        }
    }, [cart, orderComplete, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const shippingCost = deliveryMethod === 'ship' ? (cartTotal > 150 ? 0 : 15) : 0;
    const taxAmount = cartTotal * TAX_RATE;
    const finalTotal = cartTotal + shippingCost + taxAmount;

    const handleCheckout = async () => {
        // Basic Validation
        if (!formData.email || !formData.firstName || !formData.lastName || (deliveryMethod === 'ship' && !formData.address)) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required contact and shipping details.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            // Prepare order data
            const orderData = {
                items: cart,
                total_amount: finalTotal,
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                shipping_address: deliveryMethod === 'ship' ? {
                    address: formData.address,
                    apartment: formData.apartment,
                    city: formData.city,
                    state: formData.state,
                    postalCode: formData.postalCode,
                    country: formData.country
                } : null,
                delivery_method: deliveryMethod
            };

            console.log("Creating order...", orderData);
            const response: any = await api.orders.create(orderData);

            if (response && (response.order_id || response.id)) {
                const newOrderId = response.order_id || response.id;
                setOrderId(newOrderId);
                setOrderComplete(true);
                clearCart();

                toast({
                    title: "Order Placed Successfully!",
                    description: `Your order #${newOrderId} has been confirmed.`,
                });

                window.scrollTo(0, 0);
            } else {
                throw new Error("Invalid response from server");
            }

        } catch (error: any) {
            console.error("Checkout validation failed:", error);
            toast({
                title: "Checkout Failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (orderComplete) {
        return (
            <div className="min-h-screen bg-[#F3EEEA] font-['Outfit']">
                <Navbar />
                <main className="container mx-auto px-4 max-w-3xl pt-32 pb-20 text-center">
                    <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-[#1A1A1A]/5">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-4xl font-['DM_Serif_Display'] text-[#1A1A1A] mb-4">Thank You!</h1>
                        <p className="text-xl text-slate-500 font-medium mb-2">Your order <span className="text-[#1A1A1A] font-bold">#{orderId}</span> has been confirmed.</p>
                        <p className="text-slate-400 mb-10 max-w-md mx-auto">
                            We've sent a confirmation email to <span className="font-bold text-slate-600">{formData.email}</span>.
                            We'll notify you when your items are on the way.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild className="h-14 px-8 rounded-full bg-[#1A1A1A] text-white hover:bg-black font-bold text-lg">
                                <Link to="/shop">Continue Shopping</Link>
                            </Button>
                            <Button asChild variant="outline" className="h-14 px-8 rounded-full border-slate-200 text-[#1A1A1A] font-bold text-lg hover:bg-slate-50">
                                <Link to="/my-bookings">View Account</Link>
                            </Button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3EEEA] font-['Outfit']">
            <Navbar />

            <main className="container mx-auto px-4 max-w-7xl pt-24 lg:pt-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[calc(100vh-89px)]">

                    {/* Left Column: Form */}
                    <div className="py-12 lg:pr-16 order-2 lg:order-1">
                        <div className="max-w-xl ml-auto">

                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">
                                <Link to="/cart" className="hover:text-accent transition-colors">Cart</Link>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-[#1A1A1A]">Checkout</span>
                            </div>

                            {/* Express Checkout */}
                            <div className="mb-10 text-center">
                                <p className="text-xs text-slate-400 mb-4 uppercase tracking-widest font-bold">Express checkout</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <button className="h-12 bg-[#5A31F4] rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                                        <span className="text-white italic font-black">shop <span className="bg-white text-[#5A31F4] px-1 rounded not-italic text-[10px] font-bold">Pay</span></span>
                                    </button>
                                    <button className="h-12 bg-[#FFC439] rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity px-4">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                                    </button>
                                    <button className="h-12 bg-black rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                                        <div className="flex items-center gap-1.5 grayscale invert">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Pay_Logo_%282020%29.svg" alt="GPay" className="h-5" />
                                        </div>
                                    </button>
                                </div>
                                <div className="relative mt-8 mb-8">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                    <div className="relative flex justify-center text-xs uppercase tracking-widest text-slate-300"><span className="bg-[#F3EEEA] px-4">OR</span></div>
                                </div>
                            </div>

                            {/* Contact Section */}
                            <section className="mb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold">Contact</h2>
                                    {!user && <Link to="/login" className="text-sm text-[#1A1A1A] underline underline-offset-4 decoration-1 hover:opacity-60 transition-opacity">Sign in</Link>}
                                </div>
                                <Input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Email or mobile phone number"
                                    className="h-14 border-slate-200 rounded-lg focus:ring-0 focus:border-[#1A1A1A] transition-all bg-white/50"
                                />
                                <label className="flex items-center gap-3 mt-4 cursor-pointer group">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#1A1A1A] focus:ring-0" />
                                    <span className="text-sm text-slate-600">Email me with news and offers</span>
                                </label>
                            </section>

                            {/* Delivery Section */}
                            <section className="mb-10">
                                <h2 className="text-xl font-bold mb-4">Delivery</h2>
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white/50">
                                    <button
                                        onClick={() => setDeliveryMethod('ship')}
                                        className={`w-full flex items-center justify-between p-5 text-left border-b border-slate-100 transition-all ${deliveryMethod === 'ship' ? 'bg-[#F3F7FF] border-[#5A31F4]' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryMethod === 'ship' ? 'border-[#5A31F4] bg-[#5A31F4]' : 'border-slate-300'}`}>
                                                {deliveryMethod === 'ship' && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <span className="font-bold">Ship</span>
                                        </div>
                                        <Truck className="w-5 h-5 text-slate-400" />
                                    </button>
                                    <button
                                        onClick={() => setDeliveryMethod('pickup')}
                                        className={`w-full flex items-center justify-between p-5 text-left transition-all ${deliveryMethod === 'pickup' ? 'bg-[#F3F7FF] border-[#5A31F4]' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryMethod === 'pickup' ? 'border-[#5A31F4] bg-[#5A31F4]' : 'border-slate-300'}`}>
                                                {deliveryMethod === 'pickup' && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <div className="text-left">
                                                <span className="font-bold block">Pick up</span>
                                                <span className="text-xs text-slate-400 font-medium">Free • Usually ready in 24 hours</span>
                                            </div>
                                        </div>
                                        <Store className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                            </section>

                            {/* Shipping Address */}
                            <section className={`space-y-4 transition-all duration-300 ${deliveryMethod === 'ship' ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                                <div className="relative group">
                                    <label className="absolute left-4 top-1 text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none pointer-events-none transition-all">Country/Region</label>
                                    <select
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full h-14 pl-4 pr-10 pt-4 bg-white/50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:border-[#1A1A1A]"
                                    >
                                        <option value="Malaysia">Malaysia</option>
                                        <option value="Singapore">Singapore</option>
                                        <option value="United States">United States</option>
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="First name"
                                        className="h-14 border-slate-200 rounded-lg bg-white/50"
                                    />
                                    <Input
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Last name"
                                        className="h-14 border-slate-200 rounded-lg bg-white/50"
                                    />
                                </div>
                                <div className="relative">
                                    <Input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Address"
                                        className="h-14 pl-4 pr-10 border-slate-200 rounded-lg bg-white/50"
                                    />
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                                <Input
                                    name="apartment"
                                    value={formData.apartment}
                                    onChange={handleChange}
                                    placeholder="Apartment, suite, etc. (optional)"
                                    className="h-14 border-slate-200 rounded-lg bg-white/50"
                                />
                                <div className="grid grid-cols-3 gap-4">
                                    <Input
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="City"
                                        className="h-14 border-slate-200 rounded-lg bg-white/50"
                                    />
                                    <Input
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="State"
                                        className="h-14 border-slate-200 rounded-lg bg-white/50"
                                    />
                                    <Input
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleChange}
                                        placeholder="Postcode"
                                        className="h-14 border-slate-200 rounded-lg bg-white/50"
                                    />
                                </div>
                            </section>

                            <Button
                                onClick={handleCheckout}
                                disabled={loading}
                                className="w-full h-16 bg-[#1A1A1A] hover:bg-black text-white rounded-lg mt-12 text-lg font-bold transition-all relative"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    deliveryMethod === 'ship' ? 'Pay now' : 'Complete Order'
                                )}
                            </Button>

                            <footer className="mt-20 py-8 border-t border-slate-200 flex flex-wrap gap-6">
                                {['Refund policy', 'Shipping policy', 'Privacy policy', 'Terms of service'].map(item => (
                                    <Link key={item} to="/terms" className="text-xs text-slate-400 underline underline-offset-4 decoration-1 hover:text-[#1A1A1A] transition-colors">
                                        {item}
                                    </Link>
                                ))}
                            </footer>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="bg-black/5 lg:border-l border-slate-200 py-12 lg:pl-16 order-1 lg:order-2">
                        <div className="max-w-xl">
                            {/* Products List */}
                            <div className="space-y-6 mb-10 mr-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 bg-white border border-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={getImageUrl(item.image_url, 'service', item.id)} alt={item.name} className="w-full h-full object-contain p-2" />
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#666] text-white text-[11px] rounded-full flex items-center justify-center font-bold">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium pr-4 leading-tight">{item.name}</h3>
                                            {item.type && <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{item.type}</p>}
                                        </div>
                                        <p className="text-sm font-bold">RM {(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Discount Code */}
                            <div className="flex gap-2 pb-8 border-b border-slate-200 mb-8 mr-4">
                                <Input placeholder="Discount code or gift card" className="h-12 border-slate-200 rounded-lg focus:ring-0 focus:border-[#1A1A1A] bg-white/50" />
                                <Button className="h-12 bg-white text-slate-500 hover:bg-slate-50 px-6 rounded-lg font-bold transition-all disabled:opacity-50 border border-slate-200" disabled>Apply</Button>
                            </div>

                            {/* Subtotal / Shipping */}
                            <div className="space-y-4 pb-6 mr-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal</span>
                                    <span className="font-bold text-[#1A1A1A]">RM {cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <span>Shipping</span>
                                        <HelpCircle className="w-3 h-3 cursor-help text-slate-400" />
                                    </div>
                                    <span className="text-slate-400 font-medium">
                                        {shippingCost === 0 ? 'Free' : `RM ${shippingCost.toFixed(2)}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Estimated Taxes (6%)</span>
                                    <span className="font-bold text-[#1A1A1A]">RM {taxAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex items-center justify-between pt-6 border-t border-slate-200 mr-4">
                                <span className="text-lg font-bold text-[#1A1A1A]">Total</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">MYR</span>
                                    <span className="text-2xl font-black text-[#1A1A1A]">RM {finalTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
