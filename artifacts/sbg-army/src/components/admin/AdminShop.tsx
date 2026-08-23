import { useState } from 'react';
import { ShopItem, getDB, saveDB } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';
import { uploadFileToServer } from '@/lib/uploadService';

interface Props {
  shop: ShopItem[];
  onRefresh: () => void;
}

const STOCK_OPTS: { value: string; label: string; color: string }[] = [
  { value: 'in_stock', label: 'In Stock', color: '#00ff88' },
  { value: 'out_of_stock', label: 'Out of Stock', color: '#ff4444' },
  { value: 'coming_soon', label: 'Coming Soon', color: '#ffd700' },
];

const empty = (): Omit<ShopItem, 'id'> => ({
  title: '', image: '', price: 0, discountPrice: 0, description: '', stockStatus: 'in_stock', visible: true, order: 0,
  sizes: [], upiId: '', upiQr: '',
});

export default function AdminShop({ shop, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ShopItem | null>(null);
  const [form, setForm] = useState(empty());
  const [sizeInput, setSizeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      let imageUrl = form.image;
      if (imageUrl && imageUrl.startsWith('data:')) {
        try {
          const res = await uploadFileToServer(imageUrl, { filename: 'shop-item.png' });
          imageUrl = res.url;
        } catch (uploadErr) {
          console.warn('Server upload failed for shop image, using local DataURL:', uploadErr);
        }
      }
      let qrUrl = form.upiQr;
      if (qrUrl && qrUrl.startsWith('data:')) {
        try {
          const res = await uploadFileToServer(qrUrl, { filename: 'shop-qr.png' });
          qrUrl = res.url;
        } catch (uploadErr) {
          console.warn('Server upload failed for shop QR, using local DataURL:', uploadErr);
        }
      }

      const db = getDB();
      if (!db.shop) db.shop = [];
      const updatedForm = { ...form, image: imageUrl, upiQr: qrUrl };

      if (adding) {
        db.shop.push({ ...updatedForm, id: `sh${Date.now()}`, order: db.shop.length + 1 });
      } else if (editing) {
        const idx = db.shop.findIndex(s => s.id === editing.id);
        if (idx !== -1) db.shop[idx] = { ...editing, ...updatedForm };
      }
      await saveDB(db, 'shop');
      onRefresh();
      setAdding(false);
      setEditing(null);
      setForm(empty());
    } catch (e: any) {
      console.error('Shop save error:', e);
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        onRefresh();
        setAdding(false);
        setEditing(null);
        setForm(empty());
      } else {
        setSaveError(msg || 'Failed to save shop item. Check connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    try {
      const db = getDB();
      db.shop = db.shop.filter(s => s.id !== id);
      await saveDB(db, 'shop');
      onRefresh();
    } catch (e: any) {
      console.error('Failed to delete shop item:', e);
      onRefresh();
    }
  };

  const toggle = async (id: string) => {
    try {
      const db = getDB();
      const s = db.shop.find(s => s.id === id);
      if (s) s.visible = !s.visible;
      await saveDB(db, 'shop');
      onRefresh();
    } catch (e: any) {
      console.error('Failed to update shop item visibility:', e);
      onRefresh();
    }
  };

  const setStock = async (id: string, status: string) => {
    try {
      const db = getDB();
      const s = db.shop.find(s => s.id === id);
      if (s) s.stockStatus = status;
      await saveDB(db, 'shop');
      onRefresh();
    } catch (e: any) {
      console.error('Failed to update stock status:', e);
      onRefresh();
    }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFileToServer(file);
      setForm(f => ({ ...f, image: res.url }));
    } catch (err: any) {
      console.warn('Server image upload failed, converting file to local DataURL preview:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setForm(f => ({ ...f, image: event.target!.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const sorted = [...(shop ?? [])].sort((a, b) => a.order - b.order);

  if (adding || editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setAdding(false); setEditing(null); setForm(empty()); }} className="text-gray-400 hover:text-white">← Back</button>
          <h2 className="font-black text-xl text-white">{adding ? 'Add Product' : 'Edit Product'}</h2>
        </div>
        <div className="p-6 rounded-xl border border-white/5 bg-white/3 space-y-5">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/3 flex-shrink-0">
              {form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl">👕</span>}
            </div>
            <div className="space-y-3 flex-1">
              <label className="cursor-pointer px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400 inline-block">
                Upload Image <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
              <div><label className="label">Product Title</label><input className="inp" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Price (₹)</label><input type="number" className="inp" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
            <div><label className="label">Discount Price (₹)</label><input type="number" className="inp" placeholder="0 = no discount" value={form.discountPrice} onChange={e => setForm(f => ({ ...f, discountPrice: Number(e.target.value) }))} /></div>
            <div>
              <label className="label">Stock Status <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="shop-stock-status-list"
                value={form.stockStatus}
                onChange={e => setForm(f => ({ ...f, stockStatus: e.target.value }))}
                placeholder="e.g. in_stock, out_of_stock..."
              />
              <datalist id="shop-stock-status-list">
                {STOCK_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </datalist>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="inp min-h-[80px] resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Sizes (press Enter to add)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.sizes ?? []).map(s => (
                <span key={s} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-white text-sm">
                  {s}
                  <button onClick={() => setForm(f => ({ ...f, sizes: (f.sizes ?? []).filter(x => x !== s) }))} className="text-gray-500 hover:text-red-400 leading-none">×</button>
                </span>
              ))}
            </div>
            <input className="inp" value={sizeInput} placeholder="e.g. S, M, L, XL, Free"
              onChange={e => setSizeInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && sizeInput.trim()) {
                  setForm(f => ({ ...f, sizes: [...(f.sizes ?? []), sizeInput.trim()] }));
                  setSizeInput('');
                }
              }} />
            <p className="text-xs text-gray-600 mt-1">Press Enter to add each size. Leave empty for no size selection.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Product UPI ID (overrides global)</label>
              <input className="inp" placeholder="yourname@upi" value={form.upiId ?? ''} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} />
            </div>
            <div>
              <label className="label">Product UPI QR (overrides global)</label>
              <div className="flex items-center gap-2 mt-1">
                {form.upiQr && <img src={form.upiQr} alt="QR" className="h-12 rounded bg-white p-0.5" />}
                <label className="cursor-pointer px-3 py-2 rounded-lg bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20">
                  {form.upiQr ? 'Replace' : 'Upload QR'}
                  <input type="file" accept="image/*" className="hidden" onChange={async e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    try {
                      const res = await uploadFileToServer(file);
                      setForm(f => ({ ...f, upiQr: res.url }));
                    } catch (err: any) {
                      alert(err.message || 'QR upload failed');
                    }
                  }} />
                </label>
                {form.upiQr && <button onClick={() => setForm(f => ({ ...f, upiQr: '' }))} className="px-2 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20">Remove</button>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setForm(f => ({ ...f, visible: !f.visible }))} className={`relative w-12 h-6 rounded-full transition-all ${form.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? 'left-7' : 'left-1'}`} />
            </button>
            <span className="text-sm text-gray-400">Visible in shop</span>
          </div>
          {saveError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              ⚠️ {saveError}
            </div>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-orange-500 text-black font-black text-sm tracking-widest uppercase hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? '⏳ SAVING...' : adding ? 'ADD PRODUCT' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-xl text-white">Shop Products ({(shop ?? []).length})</h2>
        <button onClick={() => { setAdding(true); setForm(empty()); }} className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
          + Add Product
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map(item => {
          const stockOpt = STOCK_OPTS.find(s => s.value === item.stockStatus) ?? { value: item.stockStatus, label: item.stockStatus, color: '#888888' };
          return (
            <div key={item.id} className="p-4 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                  {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl">👕</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.discountPrice > 0 ? (
                      <>
                        <span className="font-black text-orange-400">₹{item.discountPrice}</span>
                        <span className="text-xs text-gray-500 line-through">₹{item.price}</span>
                      </>
                    ) : (
                      <span className="font-black text-white">₹{item.price}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold mt-1 inline-block" style={{ color: stockOpt.color }}>● {stockOpt.label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <Combobox value={item.stockStatus} onChange={e => setStock(item.id, e.target.value)}
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-gray-300 cursor-pointer">
                  {STOCK_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  {!STOCK_OPTS.find(s => s.value === item.stockStatus) && <option value={item.stockStatus}>{item.stockStatus}</option>}
                </Combobox>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggle(item.id)} className={`w-10 h-5 rounded-full relative transition-all ${item.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${item.visible ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                  <button onClick={() => { setEditing(item); setSizeInput(''); setForm({ title: item.title, image: item.image, price: item.price, discountPrice: item.discountPrice, description: item.description, stockStatus: item.stockStatus, visible: item.visible, order: item.order, sizes: item.sizes ?? [], upiId: item.upiId ?? '', upiQr: item.upiQr ?? '' }); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">Edit</button>
                  <button onClick={() => { if (confirm('Delete product?')) del(item.id); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <div className="col-span-2 text-center py-12 text-gray-600">No products yet. Add one!</div>}
      </div>
    </div>
  );
}
