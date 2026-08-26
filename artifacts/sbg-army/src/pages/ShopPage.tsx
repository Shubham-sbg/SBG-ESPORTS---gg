import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useEffect, useState, useCallback } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { trackPageVisit } from '@/lib/analytics';
import { ShopItem, Settings } from '@/lib/database';
import { supabase, uploadBase64, SupabaseProfile } from '@/lib/supabase';
import Combobox from '@/components/shared/Combobox';

const STOCK_CONFIG = {
  in_stock: { label: 'In Stock', color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
  out_of_stock: { label: 'Out of Stock', color: '#ff4444', bg: 'rgba(255,68,68,0.1)' },
  coming_soon: { label: 'Coming Soon', color: '#ffd700', bg: 'rgba(255,215,0,0.1)' },
};

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry'];

type Step = 'product' | 'delivery' | 'payment' | 'done';

interface OrderForm {
  size: string;
  color: string;
  customName: string;
  customNumber: string;
  quantity: number;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryPincode: string;
  deliveryState: string;
  screenshot: string | null;
  orderId: string | null;
}

const EMPTY_FORM: OrderForm = {
  size: '', color: '', customName: '', customNumber: '', quantity: 1,
  deliveryName: '', deliveryPhone: '', deliveryAddress: '', deliveryPincode: '', deliveryState: '',
  screenshot: null, orderId: null,
};

interface BuyModalProps {
  item: ShopItem;
  settings: Settings;
  profile: SupabaseProfile | null;
  onClose: () => void;
}

function BuyModal({ item, settings, profile, onClose }: BuyModalProps) {
  const price = item.discountPrice > 0 ? item.discountPrice : item.price;
  const [step, setStep] = useState<Step>('product');
  const [form, setForm] = useState<OrderForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const hasSizes = (item.sizes ?? []).length > 0;
  const hasColors = (item.colors ?? []).length > 0;
  const upiId = settings.upiId || '';
  const upiQr = settings.upiQr || '';
  const total = price * form.quantity;

  const set = <K extends keyof OrderForm>(k: K, v: OrderForm[K]) => setForm(f => ({ ...f, [k]: v }));

  const validateStep = () => {
    if (step === 'product') {
      if (hasSizes && !form.size) return 'Please select a size.';
      if (hasColors && !form.color) return 'Please select a color.';
    }
    if (step === 'delivery') {
      if (!form.deliveryName.trim()) return 'Name is required.';
      if (!form.deliveryPhone.trim()) return 'Phone number is required.';
      if (!form.deliveryAddress.trim()) return 'Address is required.';
      if (!form.deliveryPincode.trim()) return 'Pincode is required.';
      if (!form.deliveryState) return 'Please select a state.';
    }
    if (step === 'payment') {
      if (!form.screenshot) return 'Please upload your payment screenshot.';
    }
    return '';
  };

  const next = () => {
    const e = validateStep();
    if (e) { setErr(e); return; }
    setErr('');
    if (step === 'product') setStep('delivery');
    else if (step === 'delivery') setStep('payment');
    else handleSubmit();
  };

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr('Screenshot must be under 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => set('screenshot', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!profile) { setErr('You must be logged in.'); return; }
    setSubmitting(true);
    setErr('');
    try {
      let screenshotUrl: string | null = null;
      if (form.screenshot) {
        screenshotUrl = await uploadBase64('payments', `${profile.id}/${Date.now()}.jpg`, form.screenshot);
      }

      const { data, error } = await supabase.from('orders').insert({
        user_id: profile.id,
        product_name: item.title,
        size: form.size || null,
        color: form.color || null,
        custom_name: form.customName.trim() || null,
        custom_number: form.customNumber.trim() || null,
        quantity: form.quantity,
        total_amount: total,
        delivery_name: form.deliveryName.trim(),
        delivery_phone: form.deliveryPhone.trim(),
        delivery_address: form.deliveryAddress.trim(),
        delivery_pincode: form.deliveryPincode.trim(),
        delivery_state: form.deliveryState,
        payment_screenshot_url: screenshotUrl,
        status: 'pending',
      }).select('id').single();

      if (error) { setErr('Failed to submit order. Please try again.'); return; }
      set('orderId', data?.id || null);
      setStep('done');
    } catch {
      setErr('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors';
  const label = 'block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5';

  const StepBar = () => (
    <div className="flex items-center gap-1 px-6 pt-4 pb-2">
      {(['product', 'delivery', 'payment'] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div className={`h-1.5 flex-1 rounded-full transition-all ${['product', 'delivery', 'payment', 'done'].indexOf(step) > i || step === s ? 'bg-orange-500' : 'bg-white/10'}`} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={step !== 'done' ? undefined : onClose}>
      <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-md max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {step !== 'done' && (
          <div className="p-5 border-b border-white/8 flex items-center justify-between">
            <div>
              <h3 className="font-black text-white text-lg">{item.title}</h3>
              <p className="text-orange-400 font-black mt-0.5">₹{total.toLocaleString('en-IN')}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xl font-bold leading-none">✕</button>
          </div>
        )}
        {step !== 'done' && <StepBar />}

        <div className="p-6 space-y-4">
          {step === 'product' && (
            <>
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                  Step 1 — Product Options
                </p>
              </div>
              {hasSizes && (
                <div>
                  <label className={label}>Select Size *</label>
                  <div className="flex flex-wrap gap-2">
                    {item.sizes!.map(s => (
                      <button key={s} onClick={() => set('size', s)}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${form.size === s ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {hasColors && (
                <div>
                  <label className={label}>Select Color *</label>
                  <div className="flex flex-wrap gap-2">
                    {item.colors!.map(c => (
                      <button key={c} onClick={() => set('color', c)}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${form.color === c ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className={label}>Custom Name Print (optional)</label>
                <input className={inp} placeholder="e.g. ARJUN or leave blank" value={form.customName}
                  onChange={e => set('customName', e.target.value)} maxLength={20} />
                <p className="text-xs text-gray-600 mt-1">Printed on the back of the jersey</p>
              </div>
              <div>
                <label className={label}>Custom Number Print (optional)</label>
                <input className={inp} placeholder="e.g. 7 or leave blank" value={form.customNumber}
                  onChange={e => set('customNumber', e.target.value.replace(/\D/g, '').slice(0, 2))} maxLength={2} />
              </div>
              <div>
                <label className={label}>Quantity</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => set('quantity', Math.max(1, form.quantity - 1))}
                    className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all">−</button>
                  <span className="text-white font-black text-lg w-8 text-center">{form.quantity}</span>
                  <button onClick={() => set('quantity', Math.min(10, form.quantity + 1))}
                    className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all">+</button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Unit Price</span>
                  <span className="text-white">₹{price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Quantity</span>
                  <span className="text-white">×{form.quantity}</span>
                </div>
                <div className="flex justify-between font-black mt-2 pt-2 border-t border-white/8">
                  <span className="text-white">Total</span>
                  <span className="text-orange-400">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </>
          )}

          {step === 'delivery' && (
            <>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Step 2 — Delivery Details</p>
              <div>
                <label className={label}>Full Name *</label>
                <input className={inp} placeholder="Recipient full name" value={form.deliveryName}
                  onChange={e => set('deliveryName', e.target.value)} />
              </div>
              <div>
                <label className={label}>Phone Number *</label>
                <input className={inp} placeholder="+91 9876543210" value={form.deliveryPhone}
                  onChange={e => set('deliveryPhone', e.target.value)} />
              </div>
              <div>
                <label className={label}>Delivery Address *</label>
                <textarea className={`${inp} resize-none`} rows={3} placeholder="House/Flat, Street, Area..."
                  value={form.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Pincode *</label>
                  <input className={inp} placeholder="400001" value={form.deliveryPincode}
                    onChange={e => set('deliveryPincode', e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
                </div>
                <div>
                  <label className={label}>State *</label>
                  <Combobox className={inp} value={form.deliveryState} onChange={e => set('deliveryState', e.target.value)}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Combobox>
                </div>
              </div>
            </>
          )}

          {step === 'payment' && (
            <>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Step 3 — Payment</p>
              <div className="p-5 rounded-xl border border-white/10 bg-white/3 space-y-3 text-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pay via UPI</p>
                {upiQr ? (
                  <div className="flex flex-col items-center gap-3">
                    <Image src={upiQr} alt="UPI QR Code" objectFit="contain" className="h-44 w-44 rounded-xl object-contain bg-white p-2" />
                    {upiId && <p className="text-sm text-gray-300">UPI ID: <span className="font-mono font-black text-white">{upiId}</span></p>}
                  </div>
                ) : upiId ? (
                  <p className="font-mono font-black text-white text-lg">{upiId}</p>
                ) : (
                  <p className="text-sm text-gray-500 py-2">Contact admin for payment details.</p>
                )}
                <div className="pt-2 border-t border-white/8">
                  <p className="text-xs text-gray-500">Amount to pay</p>
                  <p className="text-2xl font-black text-orange-400">₹{total.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div>
                <label className={label}>Upload Payment Screenshot *</label>
                {form.screenshot ? (
                  <div className="relative">
                    <Image src={form.screenshot} alt="Screenshot" objectFit="contain" className="w-full rounded-xl border border-green-500/30 object-contain max-h-48" />
                    <button onClick={() => set('screenshot', null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 text-white text-sm flex items-center justify-center hover:bg-red-500">✕</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-white/10 hover:border-orange-500/40 cursor-pointer transition-colors">
                    <span className="text-4xl">📸</span>
                    <span className="text-sm text-gray-400 font-semibold">Click to upload screenshot</span>
                    <span className="text-xs text-gray-600">JPG, PNG, WebP · Max 5MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
                  </label>
                )}
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-8 space-y-5">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center text-4xl mx-auto">
                ✅
              </div>
              <div>
                <h3 className="font-black text-2xl text-white mb-2">Order Submitted!</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your order for <span className="text-white font-bold">{item.title}</span> has been received.
                  Our admin will verify your payment and confirm the order.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-yellow-400 text-xs font-bold">⏳ Pending Admin Verification</p>
                <p className="text-gray-500 text-xs mt-1">Check your player dashboard for status updates.</p>
              </div>
              <div className="flex gap-3">
                <a href="/player-dashboard" className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-black text-sm text-center hover:bg-orange-400 transition-colors">
                  View Dashboard
                </a>
                <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/10 text-gray-300 font-bold text-sm hover:bg-white/15 transition-colors">
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

          {step !== 'done' && (
            <>
              {err && <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">{err}</p>}
              <div className="flex gap-3 pt-1">
                {step !== 'product' && (
                  <button onClick={() => { setErr(''); if (step === 'delivery') setStep('product'); else if (step === 'payment') setStep('delivery'); }}
                    className="px-5 py-3 rounded-xl bg-white/10 text-gray-300 text-sm font-bold hover:bg-white/15 transition-colors">
                    ← Back
                  </button>
                )}
                <button onClick={next} disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-black text-sm tracking-widest uppercase hover:bg-orange-400 disabled:opacity-50 transition-all">
                  {submitting ? 'Submitting...' : step === 'payment' ? 'Submit Order' : 'Next →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ShopCard({ item, onBuy, isLoggedIn }: { item: ShopItem; onBuy: () => void; isLoggedIn: boolean }) {
  const stock = STOCK_CONFIG[item.stockStatus as keyof typeof STOCK_CONFIG] || STOCK_CONFIG.coming_soon;
  const hasDiscount = item.discountPrice > 0;
  const discountPct = hasDiscount ? Math.round((1 - item.discountPrice / item.price) * 100) : 0;
  const [lightbox, setLightbox] = useState(false);

  return (
    <div className="group relative rounded-2xl border border-white/5 bg-white/3 hover:border-orange-500/20 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-white/3 cursor-pointer" onClick={() => item.image && setLightbox(true)}>
        {item.image ? (
          <Image src={item.image} alt={item.title} objectFit="cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl opacity-20">👕</span>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-lg">
            -{discountPct}%
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-xl shadow-lg" style={{ background: stock.bg, color: stock.color }}>
            ● {stock.label}
          </span>
        </div>
        {item.image && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-black text-white text-lg leading-tight mb-2 group-hover:text-orange-200 transition-colors">{item.title}</h3>
        {item.description && <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{item.description}</p>}

        {(item.sizes ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.sizes!.map(s => (
              <span key={s} className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-500 text-xs font-semibold border border-white/8">{s}</span>
            ))}
          </div>
        )}

        {(item.colors ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.colors!.map(c => (
              <span key={c} className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-400 text-xs border border-white/8">{c}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-2">
            {hasDiscount ? (
              <>
                <span className="text-2xl font-black" style={{ color: 'var(--sbg-primary, #ff6b00)' }}>₹{item.discountPrice}</span>
                <span className="text-sm text-gray-600 line-through">₹{item.price}</span>
              </>
            ) : (
              <span className="text-2xl font-black" style={{ color: 'var(--sbg-primary, #ff6b00)' }}>₹{item.price}</span>
            )}
          </div>
          <button
            onClick={item.stockStatus === 'in_stock' ? onBuy : undefined}
            className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 ${
              item.stockStatus === 'in_stock'
                ? 'bg-orange-500 text-black hover:bg-orange-400 shadow-lg hover:shadow-orange-500/25'
                : item.stockStatus === 'coming_soon'
                ? 'border border-yellow-500/40 text-yellow-400 cursor-not-allowed'
                : 'border border-white/10 text-gray-600 cursor-not-allowed'
            }`}
            disabled={item.stockStatus !== 'in_stock'}>
            {item.stockStatus === 'in_stock' ? (isLoggedIn ? 'Buy Now' : 'Login to Buy') :
             item.stockStatus === 'coming_soon' ? 'Coming Soon' : 'Sold Out'}
          </button>
        </div>
      </div>

      {lightbox && item.image && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-orange-400 transition-colors">✕</button>
          <Image src={item.image} alt={item.title} objectFit="contain" className="max-w-full max-h-[90vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  const { db, loading } = useDatabase();
  const [buyItem, setBuyItem] = useState<ShopItem | null>(null);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data as SupabaseProfile);
    }
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      applyTheme(db.settings);
      trackPageVisit('/shop');
      loadProfile();
    }
  }, [loading, db.settings, loadProfile]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isLoggedIn = !!profile;
  const visibleItems = (db.shop ?? []).filter(s => s.visible).sort((a, b) => a.order - b.order);
  const inStock = visibleItems.filter(i => i.stockStatus === 'in_stock').length;

  const handleBuy = (item: ShopItem) => {
    if (!isLoggedIn) { window.location.href = '/player-login'; return; }
    setBuyItem(item);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            {db.settings.logo
              ? <Image src={db.settings.logo} alt={db.settings.organizationName} objectFit="contain" className="h-10 w-auto object-contain" />
              : <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-black text-white text-sm">SBG</div>
            }
            <span className="font-black text-xl tracking-widest text-white">{db.settings.organizationName}</span>
          </a>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <a href="/player-dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-orange-400 transition-colors">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-black text-orange-400">
                  {(profile?.username || profile?.email || 'P').charAt(0).toUpperCase()}
                </span>
                My Orders
              </a>
            ) : (
              <a href="/player-login" className="px-4 py-2 rounded-xl bg-orange-500 text-black text-sm font-black hover:bg-orange-400 transition-colors">Login</a>
            )}
            <a href="/" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">← Back</a>
          </div>
        </div>
      </header>

      <div className="pt-16">
        <div className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
          </div>
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <p className="text-xs font-black tracking-[0.4em] text-orange-400 mb-3 uppercase">Official Merchandise</p>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4">
              SBG <span style={{ color: 'var(--sbg-primary, #ff6b00)' }}>STORE</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Represent the Army. Official jerseys, apparel, and gear.</p>
            <div className="flex items-center justify-center gap-6 mt-8">
              <div className="text-center">
                <div className="font-black text-2xl text-white">{visibleItems.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">Products</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <div className="font-black text-2xl text-green-400">{inStock}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">In Stock</div>
              </div>
            </div>
            {!isLoggedIn && (
              <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-semibold">
                <span>🔐</span>
                <span><a href="/player-login" className="underline hover:text-orange-300">Login to your player account</a> to place orders</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-24">
          {visibleItems.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-6">🛒</div>
              <h2 className="text-2xl font-black text-white mb-3">Shop Coming Soon</h2>
              <p className="text-gray-500">Official merchandise will be available here. Stay tuned!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleItems.map(item => (
                <ShopCard key={item.id} item={item} isLoggedIn={isLoggedIn} onBuy={() => handleBuy(item)} />
              ))}
            </div>
          )}
        </div>

        <footer className="border-t border-white/5 py-8 text-center">
          <p className="text-xs text-gray-600 tracking-widest">
            © {new Date().getFullYear()} {db.settings.organizationName}. All rights reserved.
          </p>
        </footer>
      </div>

      {buyItem && (
        <BuyModal
          item={buyItem}
          settings={db.settings}
          profile={profile}
          onClose={() => setBuyItem(null)}
        />
      )}
    </div>
  );
}
