import { useState } from 'react';
import { Giveaway, getDB, saveDB } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';

interface Props { giveaways: Giveaway[]; onRefresh: () => void; }

const BLANK: Omit<Giveaway, 'id' | 'createdAt'> = {
  title: '', rules: '', reward: '', deadline: '', status: 'draft', winners: [], visible: true,
};

export default function AdminGiveaways({ giveaways, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Giveaway, 'id' | 'createdAt'>>(BLANK);
  const [winnerInput, setWinnerInput] = useState('');

  const openCreate = () => { setEditId(null); setForm(BLANK); setWinnerInput(''); setShowForm(true); };
  const openEdit = (g: Giveaway) => {
    setEditId(g.id);
    setForm({ title: g.title, rules: g.rules, reward: g.reward, deadline: g.deadline,
      status: g.status, winners: g.winners || [], visible: g.visible });
    setWinnerInput((g.winners || []).join(', '));
    setShowForm(true);
  };

  const save = () => {
    const db = getDB();
    const data = { ...form, winners: winnerInput.split(',').map(w => w.trim()).filter(Boolean) };
    if (editId) {
      const idx = db.giveaways.findIndex(g => g.id === editId);
      if (idx !== -1) db.giveaways[idx] = { ...db.giveaways[idx], ...data };
    } else {
      db.giveaways.push({ id: `gv_${Date.now()}`, createdAt: Date.now(), ...data });
    }
    saveDB(db);
    setShowForm(false);
    onRefresh();
  };

  const del = (id: string) => {
    if (!confirm('Delete giveaway?')) return;
    const db = getDB();
    db.giveaways = db.giveaways.filter(g => g.id !== id);
    saveDB(db);
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl text-white">Contest & Giveaways</h2>
          <p className="text-xs text-gray-500 mt-0.5">Create giveaways, set rules, and publish winners.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">+ New Giveaway</button>
      </div>

      {giveaways.length === 0 && !showForm && (
        <div className="p-10 text-center text-gray-500 text-sm rounded-xl border border-white/5">No giveaways yet.</div>
      )}

      <div className="space-y-3">
        {giveaways.map(g => (
          <div key={g.id} className="p-5 rounded-xl border border-white/5 bg-white/3 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-white">{g.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Reward: {g.reward} · Deadline: {g.deadline}</p>
              <span className={`mt-1 inline-block px-2 py-0.5 rounded text-xs font-bold ${g.status === 'active' ? 'bg-green-500/20 text-green-400' : g.status === 'ended' ? 'bg-gray-500/20 text-gray-400' : g.status === 'winner_announced' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{g.status === 'winner_announced' ? '🏆 Winner Announced' : g.status}</span>
              {(g.winners || []).length > 0 && <p className="text-xs text-orange-400 mt-1">Winners: {g.winners!.join(', ')}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(g)} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20">Edit</button>
              <button onClick={() => del(g.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-white">{editId ? 'Edit Giveaway' : 'Create Giveaway'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xl font-bold">✕</button>
            </div>
            <div><label className="label">Title</label><input className="inp" placeholder="Giveaway title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><label className="label">Reward</label><input className="inp" placeholder="What do they win?" value={form.reward} onChange={e => setForm(f => ({ ...f, reward: e.target.value }))} /></div>
            <div><label className="label">Deadline</label><input className="inp" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></div>
            <div><label className="label">Status</label><Combobox className="inp" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Giveaway['status'] }))}><option value="draft">Draft</option><option value="active">Active</option><option value="ended">Ended</option><option value="winner_announced">🏆 Announce Winner</option></Combobox></div>
            <div><label className="label">Rules</label><textarea className="inp min-h-[80px]" placeholder="Rules and instructions..." value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} /></div>
            <div><label className="label">Winners (comma-separated usernames)</label><input className="inp" placeholder="player1, player2, ..." value={winnerInput} onChange={e => setWinnerInput(e.target.value)} /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} className="flex-1 py-2.5 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">{editId ? 'Save' : 'Create'}</button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold hover:bg-white/20">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
