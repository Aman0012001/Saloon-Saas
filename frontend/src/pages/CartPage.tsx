import React from 'react';
import { useCart } from "@/context/CartContext";
import { getImageUrl } from "@/utils/imageUrl";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

    const shipping = cart.length > 0 ? 15 : 0;
    const finalTotal = cartTotal + shipping;

    return (
        <div className="min-h-screen bg-[#F3EEEA]">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-12">
                        <Link to="/" className="p-2 bg-white rounded-full hover:bg-slate-50 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-['DM_Serif_Display'] text-[#1A1A1A]">Your Bag</h1>
                        {cartCount > 0 && (
                            <span className="text-xl font-['Outfit'] text-slate-400">({cartCount} items)</span>
                        )}
                    </div>

                    {cart.length === 0 ? (
                        <div className="bg-white rounded-[2rem] p-12 md:p-20 text-center shadow-sm border border-[#1A1A1A]/5">
                            <div className="w-24 h-24 bg-[#F3EEEA] rounded-full flex items-center justify-center mx-auto mb-8">
                                <ShoppingBag className="w-10 h-10 text-slate-400" />
                            </div>
                            <h2 className="text-2xl font-bold font-['Outfit'] mb-4">Your bag is empty</h2>
                            <p className="text-slate-500 mb-10 max-w-md mx-auto">
                                Looks like you haven't added anything to your bag yet. Explore our services and products to find what suits you best.
                            </p>
                            <Button asChild className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white px-10 h-14 rounded-full text-lg">
                                <Link to="/salons">Start Shopping</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            {/* Items List */}
                            <div className="lg:col-span-8 space-y-6">
                                {cart.map((item) => (
                                    <div key={item.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1A1A1A]/5 flex items-center gap-6 group transition-all hover:shadow-md">
                                        <div className="w-24 h-32 md:w-32 md:h-40 bg-[#F3EEEA] rounded-2xl overflow-hidden flex-shrink-0">
                                            <img
                                                src={getImageUrl(item.image_url, item.type === 'product' ? 'service' : 'service', item.id)}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        </div>

                                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div>
                                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-2 block">
                                                    {item.type}
                                                </span>
                                                <h3 className="text-xl font-bold font-['Outfit'] mb-1 group-hover:text-accent transition-colors">
                                                    {item.name}
                                                </h3>
                                                <p className="text-slate-500 font-medium">RM {item.price.toFixed(2)}</p>
                                            </div>

                                            <div className="flex items-center gap-10">
                                                <div className="flex items-center bg-[#F3EEEA] rounded-full p-1 border border-[#1A1A1A]/5">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-all text-[#1A1A1A]"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-10 text-center font-bold font-['Outfit']">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-all text-[#1A1A1A]"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <p className="text-xl font-black font-['Outfit']">
                                                        RM {(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary Card */}
                            <div className="lg:col-span-4">
                                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1A1A1A]/5 sticky top-32">
                                    <h2 className="text-2xl font-bold font-['Outfit'] mb-8">Summary</h2>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between text-slate-500">
                                            <span>Subtotal</span>
                                            <span className="font-bold text-[#1A1A1A]">RM {cartTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Shipping Fee</span>
                                            <span className="font-bold text-[#1A1A1A]">RM {shipping.toFixed(2)}</span>
                                        </div>
                                        <div className="h-px bg-slate-100 my-4" />
                                        <div className="flex justify-between text-xl font-bold font-['Outfit']">
                                            <span>Total</span>
                                            <span className="text-accent">RM {finalTotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <Button asChild className="w-full bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white h-16 rounded-full text-lg group">
                                        <Link to="/checkout" className="flex items-center justify-center">
                                            Checkout Now
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>

                                    <div className="mt-6 flex flex-col gap-4">
                                        <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
                                            Secure payments & instant booking
                                        </p>
                                        <div className="flex justify-center gap-3 grayscale opacity-30">
                                            {/* Logic for payment icons could go here */}
                                            <div className="w-10 h-6 bg-slate-200 rounded" />
                                            <div className="w-10 h-6 bg-slate-200 rounded" />
                                            <div className="w-10 h-6 bg-slate-200 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CartPage;
