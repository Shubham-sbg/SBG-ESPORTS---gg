import { useState } from 'react';
import { CollabRequest, getDB, saveDB } from '@/lib/database';

interface Props { requests: CollabRequest[]; onRefresh: () => void; }

const STATUS_COLORS: Record<CollabRequest['status'], string> = {
  new: 'bg-blue-500/20 text-blue-400',
  reviewing: 'bg-yellow-500/20 text-yellow-400',
  accepted: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
};

export default function AdminCollabs({ requests, onRefresh }: Props) {
  const [filter, setFilter] = useState<CollabRequest['status'] | 'all'>('all');

  const setStatus = (id: string, status: CollabRequest['status']) => {
    const db = getDB();
    const req = (db.collab_requests || []).find(r => r.id === id);
    if (req) { req.status = status; req.read = true; }
    saveDB(db);
    onRefresh();
  };

  const del = (id: string) => {
    const db = getDB();
    db.collab_requests = (db.collab_requests || []).filter(r => r.id !== id);
    saveDB(db);
    onRefresh();
  };

  const unread = requests.filter(r => !r.read).length;
  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl text-white">Collaboration Inbox</h2>
          <p className="text-xs text-gray-500 mt-0.5">{unread} new · {requests.length} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'new', 'reviewing', 'accepted', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${filter === s ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <div className="p-10 text-center text-gray-500 text-sm rounded-xl border border-white/5">No collaboration requests.</div>}

      <div className="space-y-3">
        {filtered.map(req => (
          <div key={req.id} className={`p-5 rounded-xl border transition-all ${req.read ? 'border-white/5 bg-white/2' : 'border-blue-500/20 bg-blue-500/5'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {!req.read && <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />}
                  <span className="font-bold text-white">{req.name}</span>
                  <span className="text-xs text-gray-400">{req.organization}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Purpose: {req.purpose}</p>
                {req.budget && <p className="text-xs text-gray-500">Budget: {req.budget}</p>}
                <p className="text-xs text-gray-500">Email: {req.email}{req.phone && ` · Phone: ${req.phone}`}</p>
                {req.message && <p className="text-sm text-gray-300 mt-2 leading-relaxed">{req.message}</p>}
                <p className="text-xs text-gray-600 mt-1">{new Date(req.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {req.status === 'new' && <button onClick={() => setStatus(req.id, 'reviewing')} className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-bold">Review</button>}
                {req.status !== 'accepted' && <button onClick={() => setStatus(req.id, 'accepted')} className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold">Accept</button>}
                {req.status !== 'rejected' && <button onClick={() => setStatus(req.id, 'rejected')} className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold">Reject</button>}
                <button onClick={() => del(req.id)} className="px-2 py-1 rounded bg-white/5 text-gray-500 text-xs hover:bg-white/10">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
