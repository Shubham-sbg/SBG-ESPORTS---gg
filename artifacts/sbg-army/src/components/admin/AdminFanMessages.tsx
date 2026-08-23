import { useState } from 'react';
import { FanMessage, getDB, saveDB } from '@/lib/database';

interface Props { messages: FanMessage[]; onRefresh: () => void; }

const TYPE_LABELS: Record<FanMessage['type'], string> = {
  feedback: 'Feedback', newsletter: 'Newsletter', discord: 'Discord', whatsapp: 'WhatsApp', other: 'Other',
};

export default function AdminFanMessages({ messages, onRefresh }: Props) {
  const [filter, setFilter] = useState<FanMessage['type'] | 'all'>('all');

  const markRead = (id: string) => {
    const db = getDB();
    const msg = (db.fan_messages || []).find(m => m.id === id);
    if (msg) msg.read = true;
    saveDB(db);
    onRefresh();
  };

  const del = (id: string) => {
    const db = getDB();
    db.fan_messages = (db.fan_messages || []).filter(m => m.id !== id);
    saveDB(db);
    onRefresh();
  };

  const unread = messages.filter(m => !m.read).length;
  const filtered = filter === 'all' ? messages : messages.filter(m => m.type === filter);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl text-white">Fan Connect Inbox</h2>
          <p className="text-xs text-gray-500 mt-0.5">{unread} unread · {messages.length} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'feedback', 'newsletter', 'discord', 'whatsapp', 'other'] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === t ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {t === 'all' ? 'All' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <div className="p-10 text-center text-gray-500 text-sm rounded-xl border border-white/5">No messages yet.</div>}

      <div className="space-y-3">
        {filtered.map(msg => (
          <div key={msg.id} className={`p-4 rounded-xl border transition-all ${msg.read ? 'border-white/5 bg-white/2' : 'border-orange-500/20 bg-orange-500/5'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {!msg.read && <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />}
                  <span className="font-bold text-white text-sm">{msg.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold bg-white/10 text-gray-400`}>{TYPE_LABELS[msg.type]}</span>
                  <span className="text-xs text-gray-600">{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
                {msg.email && <p className="text-xs text-gray-500 mt-1">{msg.email}</p>}
                {msg.whatsapp && <p className="text-xs text-gray-500 mt-0.5">WhatsApp: {msg.whatsapp}</p>}
                {msg.message && <p className="text-sm text-gray-300 mt-2 leading-relaxed">{msg.message}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!msg.read && <button onClick={() => markRead(msg.id)} className="px-2 py-1 rounded bg-white/10 text-gray-300 text-xs hover:bg-white/20">Mark Read</button>}
                <button onClick={() => del(msg.id)} className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
