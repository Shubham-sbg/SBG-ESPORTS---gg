import { useState } from 'react';
import { PlayerUser, getDB, saveDB } from '@/lib/database';

interface Props { users: PlayerUser[]; onRefresh: () => void; }

export default function AdminPlayerUsers({ users, onRefresh }: Props) {
  const [selected, setSelected] = useState<PlayerUser | null>(null);
  const [search, setSearch] = useState('');

  const del = (id: string) => {
    if (!confirm('Delete this player account?')) return;
    const db = getDB();
    db.playerUsers = (db.playerUsers || []).filter(u => u.id !== id);
    saveDB(db);
    setSelected(null);
    onRefresh();
  };

  const filtered = (users || [])
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()) || u.uid.includes(search))
    .sort((a, b) => b.createdAt - a.createdAt);

  // Get registration count per user
  const db = getDB();
  const getRegCount = (uid: string) => (db.registrations || []).filter(r => r.leaderUid === uid).length;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-black text-xl text-white">Player Accounts</h2>
          <p className="text-xs text-gray-500 mt-0.5">{users.length} registered players</p>
        </div>
        <input
          className="inp w-64"
          placeholder="Search by name, username, UID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-white/5 bg-white/3">
          <div className="text-4xl mb-3">👤</div>
          <h3 className="font-bold text-white mb-1">No player accounts yet</h3>
          <p className="text-gray-500 text-sm">Players who register on the website will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/3">
                <th className="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Player</th>
                <th className="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest hidden md:table-cell">UID</th>
                <th className="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest hidden lg:table-cell">Game</th>
                <th className="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest hidden sm:table-cell">Tournaments</th>
                <th className="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest hidden sm:table-cell">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{u.name}</p>
                        <p className="text-xs text-gray-500">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-orange-400 font-mono text-xs hidden md:table-cell">{u.uid}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs hidden lg:table-cell">{u.preferredGame}</td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 text-xs">{getRegCount(u.uid)}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-xs hidden sm:table-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(u)} className="px-3 py-1 rounded bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20">View</button>
                      <button onClick={() => del(u.id)} className="px-3 py-1 rounded bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-white">Player Profile</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl font-bold">✕</button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl font-black text-white">
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-black text-white text-xl">{selected.name}</p>
                <p className="text-gray-400 text-sm">@{selected.username}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5"><p className="text-xs text-gray-500 mb-1">UID</p><p className="text-orange-400 font-mono font-bold text-sm">{selected.uid}</p></div>
              <div className="p-3 rounded-lg bg-white/5"><p className="text-xs text-gray-500 mb-1">Game</p><p className="text-white text-sm">{selected.preferredGame}</p></div>
              <div className="p-3 rounded-lg bg-white/5"><p className="text-xs text-gray-500 mb-1">WhatsApp</p><p className="text-white text-sm">{selected.whatsapp}</p></div>
              <div className="p-3 rounded-lg bg-white/5"><p className="text-xs text-gray-500 mb-1">Country</p><p className="text-white text-sm">{selected.country}</p></div>
              {selected.email && <div className="col-span-2 p-3 rounded-lg bg-white/5"><p className="text-xs text-gray-500 mb-1">Email</p><p className="text-white text-sm">{selected.email}</p></div>}
              <div className="p-3 rounded-lg bg-white/5"><p className="text-xs text-gray-500 mb-1">Tournaments</p><p className="text-white font-bold text-sm">{getRegCount(selected.uid)}</p></div>
              <div className="p-3 rounded-lg bg-white/5"><p className="text-xs text-gray-500 mb-1">Joined</p><p className="text-white text-sm">{new Date(selected.createdAt).toLocaleDateString()}</p></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => del(selected.id)} className="flex-1 py-2.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/30">Delete Account</button>
              <button onClick={() => setSelected(null)} className="px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold hover:bg-white/20">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
