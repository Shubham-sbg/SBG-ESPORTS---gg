import { getImageUrl } from '@/lib/imageResolver';
import { useState } from 'react';
import { Game, getDB, saveDB } from '@/lib/database';
import { uploadFileToServer } from '@/lib/uploadService';

interface Props {
  games: Game[];
  onRefresh: () => void;
}

const empty = (): Omit<Game, 'id'> => ({ name: '', logo: '', enabled: true, order: 0 });

export default function AdminGames({ games, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const toggle = async (id: string) => {
    try {
      const db = getDB();
      const g = db.games.find(g => g.id === id);
      if (g) g.enabled = !g.enabled;
      await saveDB(db, 'games');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to update game status');
    }
  };

  const del = async (id: string) => {
    try {
      const db = getDB();
      db.games = db.games.filter(g => g.id !== id);
      await saveDB(db, 'games');
      onRefresh();
    } catch (e: any) {
      console.error('Failed to delete game:', e);
      onRefresh();
    }
  };

  const add = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      let logoUrl = form.logo;
      if (logoUrl && logoUrl.startsWith('data:')) {
        try {
          const res = await uploadFileToServer(logoUrl, { filename: 'game-logo.png' });
          logoUrl = res.url;
        } catch (uploadErr) {
          console.warn('Server upload failed for game logo, using local DataURL:', uploadErr);
        }
      }

      const db = getDB();
      if (!db.games) db.games = [];
      db.games.push({ ...form, logo: logoUrl, id: `g${Date.now()}`, order: db.games.length + 1 });
      await saveDB(db, 'games');
      onRefresh();
      setAdding(false);
      setForm(empty());
    } catch (e: any) {
      console.error('Game save error:', e);
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        onRefresh();
        setAdding(false);
        setForm(empty());
      } else {
        setSaveError(msg || 'Failed to add game. Please check connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFileToServer(file);
      setForm(f => ({ ...f, logo: res.url }));
    } catch (err: any) {
      console.warn('Server logo upload failed, converting file to local DataURL preview:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setForm(f => ({ ...f, logo: event.target!.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const sorted = [...games].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-xl text-white">Games ({games.length})</h2>
        <button onClick={() => setAdding(!adding)}
          className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
          {adding ? 'Cancel' : '+ Add Game'}
        </button>
      </div>

      {adding && (
        <div className="p-6 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/3">
              {form.logo ? <img src={getImageUrl(form.logo)} alt="" className="w-full h-full object-contain p-1" /> : <span>🕹️</span>}
            </div>
            <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-bold hover:bg-white/20">
              Upload Logo <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
          <input className="inp" placeholder="Game name (e.g. BGMI)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          {saveError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              ⚠️ {saveError}
            </div>
          )}
          <button
            onClick={add}
            disabled={saving || !form.name.trim()}
            className="w-full py-3 rounded-xl bg-orange-500 text-black font-black text-sm uppercase hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? '⏳ ADDING GAME...' : 'ADD GAME'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(g => (
          <div key={g.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all">
            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
              {g.logo ? <img src={getImageUrl(g.logo)} alt="" className="w-full h-full object-contain p-1" /> : <span className="font-black text-orange-400">{g.name.charAt(0)}</span>}
            </div>
            <div className="flex-1 font-bold text-white">{g.name}</div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => toggle(g.id)}
                className={`relative w-12 h-6 rounded-full transition-all ${g.enabled ? 'bg-orange-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${g.enabled ? 'left-7' : 'left-1'}`} />
              </button>
              <span className="text-xs text-gray-500">{g.enabled ? 'Enabled' : 'Disabled'}</span>
              <button onClick={() => { if (confirm(`Delete ${g.name}?`)) del(g.id); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
