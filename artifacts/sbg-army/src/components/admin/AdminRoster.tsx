import ImageUpload from '@/components/shared/ImageUpload';
import { getImageUrl } from '@/lib/imageResolver';
import { useState } from 'react';
import { Player, Game, getDB, saveCollection } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';
import { uploadFileToServer } from '@/lib/uploadService';

interface Props {
  players: Player[];
  games: Game[];
  onRefresh: () => void;
}

const DEFAULT_ROLES = [
  'IGL', 'Fragger', 'Sniper', 'Support', 'Duelist', 'Controller',
  'Initiator', 'Sentinel', 'Flex', 'Assaulter', 'Shotcaller',
  'Entry Fragger', 'Support Captain', 'Coach', 'Manager', 'Analyst',
];

const STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: '#00ff88' },
  { value: 'benched', label: 'Benched', color: '#ffd700' },
  { value: 'trial', label: 'Trial', color: '#00d4ff' },
  { value: 'inactive', label: 'Inactive', color: '#666' },
];

const emptyPlayer = (): Omit<Player, 'id'> => ({
  name: '', ign: '', role: '', game: '', image: '', visible: true, order: 0, status: 'active',
  teamName: '', country: '', uid: '', kdRatio: '', kdRatioImage: '', mvpCount: 0,
  socialInstagram: '', socialYoutube: '', socialFacebook: '', socialDiscord: '',
  achievements: [],
});

export default function AdminRoster({ players, games, onRefresh }: Props) {
  const [editing, setEditing] = useState<Player | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyPlayer());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const enabledGames = (games || []).filter(g => g.enabled).map(g => g.name);

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      let imageUrl = form.image;
      if (imageUrl && imageUrl.startsWith('data:')) {
        try {
          const res = await uploadFileToServer(imageUrl, { filename: 'player-photo.png' });
          imageUrl = res.url;
        } catch (uploadErr) {
          console.warn('Server upload failed for player image, using local DataURL:', uploadErr);
        }
      }

      const db = getDB();
      const updatedForm = { ...form, image: imageUrl };

      if (adding) {
        db.players.push({ ...updatedForm, id: `p${Date.now()}`, order: (db.players || []).length + 1 });
      } else if (editing) {
        const idx = (db.players || []).findIndex(p => p.id === editing.id);
        if (idx !== -1) db.players[idx] = { ...editing, ...updatedForm };
      }
      await saveCollection('players', db.players);
      onRefresh();
      setAdding(false);
      setEditing(null);
      setForm(emptyPlayer());
    } catch (e: any) {
      console.error('Player save error:', e);
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        onRefresh();
        setAdding(false);
        setEditing(null);
        setForm(emptyPlayer());
      } else {
        setSaveError(msg || 'Failed to save player. Check connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  const deletePlayer = async (id: string) => {
    try {
      const db = getDB();
      db.players = (db.players || []).filter(p => p.id !== id);
      await saveCollection('players', db.players);
      onRefresh();
    } catch (e: any) {
      console.error('Failed to delete player:', e);
      onRefresh();
    }
  };

  const toggleVisible = async (id: string) => {
    try {
      const db = getDB();
      const p = (db.players || []).find(p => p.id === id);
      if (p) p.visible = !p.visible;
      await saveCollection('players', db.players);
      onRefresh();
    } catch (e: any) {
      console.error('Failed to update player visibility:', e);
      onRefresh();
    }
  };

  const setPlayerStatus = async (id: string, status: string) => {
    try {
      const db = getDB();
      const p = (db.players || []).find(p => p.id === id);
      if (p) p.status = status;
      await saveCollection('players', db.players);
      onRefresh();
    } catch (e: any) {
      console.error('Failed to update player status:', e);
      onRefresh();
    }
  };

  const moveOrder = async (id: string, dir: 'up' | 'down') => {
    try {
      const db = getDB();
      const sorted = [...(db.players || [])].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(p => p.id === id);
      if (dir === 'up' && idx > 0) [sorted[idx].order, sorted[idx - 1].order] = [sorted[idx - 1].order, sorted[idx].order];
      else if (dir === 'down' && idx < sorted.length - 1) [sorted[idx].order, sorted[idx + 1].order] = [sorted[idx + 1].order, sorted[idx].order];
      db.players = sorted;
      await saveCollection('players', db.players);
      onRefresh();
    } catch (e: any) {
      console.error('Failed to reorder players:', e);
      onRefresh();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const sorted = [...(players || [])].sort((a, b) => a.order - b.order);
  const displayed = filterStatus === 'all' ? sorted : sorted.filter(p => p.status === filterStatus);

  if (adding || editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setAdding(false); setEditing(null); setForm(emptyPlayer()); }} className="text-gray-400 hover:text-white transition-colors">← Back</button>
          <h2 className="font-black text-xl text-white">{adding ? 'Add Player' : 'Edit Player'}</h2>
        </div>
        <div className="p-6 rounded-xl border border-white/5 bg-white/3 space-y-5">
          <div className="flex items-center gap-6">
            <ImageUpload imageUrl={form.image || ""} onImageChange={url => setForm(f => ({ ...f, image: url }))} label="Upload Image" size="lg" shape="square" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="label">In-Game Name (IGN)</label><input className="inp" value={form.ign} onChange={e => setForm(f => ({ ...f, ign: e.target.value }))} /></div>
            <div>
              <label className="label">Role <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="roster-roles-list"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. IGL, Fragger, Coach..."
              />
              <datalist id="roster-roles-list">
                {DEFAULT_ROLES.map(r => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Game <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="roster-games-list"
                value={form.game}
                onChange={e => setForm(f => ({ ...f, game: e.target.value }))}
                placeholder="e.g. BGMI, Free Fire, Valorant..."
              />
              <datalist id="roster-games-list">
                {enabledGames.map(g => <option key={g} value={g} />)}
                {['Free Fire', 'BGMI', 'PUBG KR', 'COD Mobile', 'Valorant', 'Apex Legends'].filter(g => !enabledGames.includes(g)).map(g => <option key={g} value={g} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Player Status <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="roster-status-list"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                placeholder="e.g. active, benched, trial..."
              />
              <datalist id="roster-status-list">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </datalist>
            </div>
            <div><label className="label">Team / Lineup Name</label><input className="inp" placeholder="e.g. Main Roster, CS Lineup, FF Squad..." value={form.teamName ?? ''} onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))} /></div>
            <div><label className="label">Country / Region</label><input className="inp" placeholder="e.g. India, Indonesia..." value={form.country ?? ''} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
            <div><label className="label">Player UID</label><input className="inp" placeholder="e.g. 5123456789" value={form.uid ?? ''} onChange={e => setForm(f => ({ ...f, uid: e.target.value }))} /></div>
            <div className="col-span-2 grid grid-cols-2 gap-4 border border-white/10 p-4 rounded-xl bg-white/5">
              <div>
                <label className="label">K/D Ratio</label>
                <input className="inp" placeholder="e.g. 4.2" value={form.kdRatio ?? ''} onChange={e => setForm(f => ({ ...f, kdRatio: e.target.value }))} />
              </div>
              <div>
                <label className="label">K/D Ratio Proof (Screenshot)</label>
                <div className="flex items-center gap-4">
                  <ImageUpload imageUrl={form.kdRatioImage || ""} onImageChange={url => setForm(f => ({ ...f, kdRatioImage: url }))} label="Upload Proof" size="sm" shape="square" showRatioControls={false} />
                </div>
              </div>
            </div>
            <div><label className="label">MVP Count</label><input className="inp" type="number" min="0" placeholder="0" value={form.mvpCount ?? 0} onChange={e => setForm(f => ({ ...f, mvpCount: parseInt(e.target.value) || 0 }))} /></div>
            <div><label className="label">Instagram URL</label><input className="inp" placeholder="https://instagram.com/..." value={form.socialInstagram ?? ''} onChange={e => setForm(f => ({ ...f, socialInstagram: e.target.value }))} /></div>
            <div><label className="label">YouTube URL</label><input className="inp" placeholder="https://youtube.com/..." value={form.socialYoutube ?? ''} onChange={e => setForm(f => ({ ...f, socialYoutube: e.target.value }))} /></div>
            <div><label className="label">Facebook URL</label><input className="inp" placeholder="https://facebook.com/..." value={form.socialFacebook ?? ''} onChange={e => setForm(f => ({ ...f, socialFacebook: e.target.value }))} /></div>
            <div><label className="label">Discord URL/Invite</label><input className="inp" placeholder="https://discord.gg/..." value={form.socialDiscord ?? ''} onChange={e => setForm(f => ({ ...f, socialDiscord: e.target.value }))} /></div>
            <div><label className="label">Social Link (legacy)</label><input className="inp" placeholder="https://..." value={form.social ?? ''} onChange={e => setForm(f => ({ ...f, social: e.target.value }))} /></div>
          </div>
          <div>
            <label className="label">Achievements (one per line)</label>
            <textarea className="inp" rows={3} placeholder="e.g. BGMI Pro League Winner 2025&#10;MVP – Regional Finals" value={(form.achievements ?? []).join('\n')} onChange={e => setForm(f => ({ ...f, achievements: e.target.value.split('\n').filter(Boolean) }))} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setForm(f => ({ ...f, visible: !f.visible }))} className={`relative w-12 h-6 rounded-full transition-all ${form.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? 'left-7' : 'left-1'}`} />
            </button>
            <span className="text-sm text-gray-400">Visible on website</span>
          </div>
          {saveError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              ⚠️ {saveError}
            </div>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-orange-500 text-black font-black text-sm tracking-widest uppercase hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? '⏳ SAVING...' : adding ? 'ADD PLAYER' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="font-black text-xl text-white">Players ({(players || []).length})</h2>
        <button onClick={() => { setAdding(true); setForm(emptyPlayer()); }} className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400 transition-colors">
          + Add Player
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>ALL</button>
        {STATUSES.map(s => (
          <button key={s.value} onClick={() => setFilterStatus(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === s.value ? 'text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            style={filterStatus === s.value ? { backgroundColor: s.color } : {}}>
            {s.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {displayed.map((player, idx) => {
          const statusOpt = STATUSES.find(s => s.value === (player.status ?? 'active')) ?? { value: player.status ?? 'active', label: player.status ?? 'active', color: '#888888' };
          return (
            <div key={player.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveOrder(player.id, 'up')} disabled={idx === 0} className="text-gray-500 hover:text-white disabled:opacity-30 text-xs">▲</button>
                <button onClick={() => moveOrder(player.id, 'down')} disabled={idx === displayed.length - 1} className="text-gray-500 hover:text-white disabled:opacity-30 text-xs">▼</button>
              </div>
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                {player.image ? <img src={getImageUrl(player.image)} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">👤</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{player.ign}</p>
                <p className="text-xs text-gray-500">{player.name} · {player.role} · {player.game}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Combobox value={player.status ?? 'active'} onChange={e => setPlayerStatus(player.id, e.target.value)}
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 cursor-pointer"
                  style={{ color: statusOpt.color }}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  {!STATUSES.find(s => s.value === (player.status ?? 'active')) && <option value={player.status}>{player.status}</option>}
                </Combobox>
                <button onClick={() => toggleVisible(player.id)} className={`w-10 h-5 rounded-full relative transition-all ${player.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${player.visible ? 'left-5.5' : 'left-0.5'}`} />
                </button>
                <button onClick={() => {
                  setEditing(player);
                  setForm({
                    name: player.name,
                    ign: player.ign,
                    role: player.role,
                    game: player.game,
                    image: player.image,
                    visible: player.visible,
                    order: player.order,
                    status: player.status ?? 'active',
                    social: player.social,
                    country: player.country ?? '',
                    uid: player.uid ?? '',
                    kdRatio: player.kdRatio ?? '',
                    kdRatioImage: player.kdRatioImage ?? '',
                    mvpCount: player.mvpCount ?? 0,
                    socialInstagram: player.socialInstagram ?? '',
                    socialYoutube: player.socialYoutube ?? '',
                    socialFacebook: player.socialFacebook ?? '',
                    socialDiscord: player.socialDiscord ?? '',
                    achievements: player.achievements ?? [],
                  });
                }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all">Edit</button>
                <button onClick={() => { if (confirm(`Delete ${player.ign}?`)) deletePlayer(player.id); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">Delete</button>
              </div>
            </div>
          );
        })}
        {(players || []).length === 0 && <div className="text-center py-12 text-gray-600">No players yet. Add one!</div>}
      </div>
    </div>
  );
}
