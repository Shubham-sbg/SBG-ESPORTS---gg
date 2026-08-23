import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetProduct, useCreateOrder } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, ShoppingCart, Check, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetailPage({ id }: { id: number }) {
  const { data: product, isLoading } = useGetProduct(id);
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { toast } = useToast();
  const [form, setForm] = useState({ size: "", color: "", qty: 1, name: "", email: "", phone: "", address: "", payment: "upi", paymentRef: "", customName: "", customNumber: "" });
  const [ordered, setOrdered] = useState(false);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#060611" }}><div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-slate-500" style={{ background: "#060611" }}>Product not found.</div>;

  const p = product as any;
  const sizes = p.sizes ? JSON.parse(p.sizes).map ? JSON.parse(p.sizes) : p.sizes.split(",").map((s: string) => s.trim()) : [];
  const colors = p.colors ? p.colors.split(",").map((c: string) => c.trim()) : [];

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.address) { toast({ title: "Please fill all required fields", variant: "destructive" }); return; }
    createOrder({
      productId: p.id, quantity: form.qty, size: form.size, color: form.color,
      customName: form.customName, customNumber: form.customNumber,
      totalAmount: p.price * form.qty, customerName: form.name, customerEmail: form.email,
      customerPhone: form.phone, deliveryAddress: form.address,
      paymentMethod: form.payment, paymentRef: form.paymentRef
    } as any, {
      onSuccess: () => { setOrdered(true); toast({ title: "Order placed successfully!" }); },
      onError: () => toast({ title: "Order failed", variant: "destructive" }),
    });
  };

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-5xl mx-auto">
        <Link href="/shop"><a className="inline-flex items-center gap-2 text-slate-400 hover:text-orange-400 text-sm mb-8 transition-colors font-inter"><ArrowLeft className="w-4 h-4" /> Back to Shop</a></Link>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="glass rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)] h-80 lg:h-auto flex items-center justify-center">
            {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <ShoppingCart className="w-16 h-16 text-orange-400/20" />}
          </div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-slate-500 text-xs capitalize font-inter mb-2">{p.category}</div>
            <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-4">{p.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <span className="font-orbitron text-3xl font-black text-orange-400">{formatCurrency(p.price)}</span>
              {p.originalPrice && p.originalPrice > p.price && <span className="text-slate-600 text-lg line-through font-inter">{formatCurrency(p.originalPrice)}</span>}
              {p.badge && <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#ff6b00] text-white">{p.badge}</span>}
            </div>
            {p.description && <p className="text-slate-400 text-sm font-inter leading-relaxed mb-6">{p.description}</p>}
            {!p.inStock ? (
              <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-red-400 text-sm font-inter mb-6">Out of Stock</div>
            ) : ordered ? (
              <div className="p-6 rounded-xl bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-center">
                <Check className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <div className="text-green-400 font-orbitron font-bold">Order Placed!</div>
                <p className="text-slate-400 text-sm font-inter mt-2">We'll contact you shortly for confirmation.</p>
              </div>
            ) : (
              <form onSubmit={handleOrder} className="space-y-4">
                {sizes.length > 0 && (
                  <div>
                    <label className="text-slate-400 text-xs font-semibold font-inter block mb-2">Size</label>
                    <div className="flex gap-2 flex-wrap">
                      {sizes.map((s: string) => (
                        <button type="button" key={s} onClick={() => setForm({ ...form, size: s })}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold font-inter transition-all ${form.size === s ? "bg-[#ff6b00] text-white" : "glass border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {colors.length > 0 && (
                  <div>
                    <label className="text-slate-400 text-xs font-semibold font-inter block mb-2">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {colors.map((c: string) => (
                        <button type="button" key={c} onClick={() => setForm({ ...form, color: c })}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold font-inter capitalize transition-all ${form.color === c ? "bg-[#ff6b00] text-white" : "glass border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-slate-400 text-xs font-inter block mb-1">Custom Name</label>
                    <input value={form.customName} onChange={(e) => setForm({ ...form, customName: e.target.value })} className="w-full px-3 py-2 rounded-lg input-dark text-sm font-inter" placeholder="On jersey" /></div>
                  <div><label className="text-slate-400 text-xs font-inter block mb-1">Number</label>
                    <input value={form.customNumber} onChange={(e) => setForm({ ...form, customNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg input-dark text-sm font-inter" placeholder="07" /></div>
                </div>
                <div className="border-t border-[rgba(255,255,255,0.05)] pt-4">
                  <p className="text-slate-400 text-xs font-semibold font-inter mb-3">Delivery Details</p>
                  <div className="space-y-3">
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg input-dark text-sm font-inter" placeholder="Full Name *" />
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg input-dark text-sm font-inter" placeholder="Email *" />
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg input-dark text-sm font-inter" placeholder="Phone" />
                    <textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg input-dark text-sm font-inter resize-none" placeholder="Delivery Address *" />
                    <select value={form.payment} onChange={(e) => setForm({ ...form, payment: e.target.value })} className="w-full px-3 py-2.5 rounded-lg input-dark text-sm font-inter">
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cod">Cash on Delivery</option>
                    </select>
                    {form.payment !== "cod" && <input value={form.paymentRef} onChange={(e) => setForm({ ...form, paymentRef: e.target.value })} className="w-full px-3 py-2.5 rounded-lg input-dark text-sm font-inter" placeholder="Payment Reference / UTR" />}
                  </div>
                </div>
                <button type="submit" disabled={isPending} className="w-full py-4 bg-[#ff6b00] hover:bg-[#e55e00] disabled:opacity-50 text-white font-bold rounded-xl font-inter text-sm flex items-center justify-center gap-2 transition-colors">
                  <Package className="w-4 h-4" />
                  {isPending ? "Placing Order..." : `Place Order — ${formatCurrency(p.price * form.qty)}`}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
