import { useState } from 'react';
import { ContactMessage, getDB, saveDB } from '@/lib/database';

interface Props { messages: ContactMessage[]; onRefresh: () => void; }

export default function AdminContactMessages({ messages, onRefresh }: Props) {
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  // Sort newest first
  const sorted = [...messages].sort((a, b) => b.createdAt - a.createdAt);
  const unread = sorted.filter(m => !m.read).length;

  const markRead = (id: string) => {
    const db = getDB();
    const msg = (db.contact_messages || []).find(m => m.id === id);
    if (msg) msg.read = true;
    saveDB(db);
    onRefresh();
  };

  const del = (id: string) => {
    const db = getDB();
    db.contact_messages = (db.contact_messages || []).filter(m => m.id !== id);
    saveDB(db);
    setSelected(null);
    onRefresh();
  };

  const openMessage = (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.read) markRead(msg.id);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="font-black text-xl text-white">Contact Messages</h2>
        <p className="text-xs text-gray-500 mt-0.5">{unread} unread · {messages.length} total — from the website contact form</p>
      </div>

      {sorted.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-white/5 bg-white/3">
          <div className="text-4xl mb-3">📬</div>
          <h3 className="font-bold text-white mb-1">No messages yet</h3>
          <p className="text-gray-500 text-sm">Contact form submissions will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/3">
                <th className="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Name</th>
                <th className="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest hidden md:table-cell">Email</th>
                <th className="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest hidden lg:table-cell">Project Title</th>
                <th className="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest hidden sm:table-cell">Date</th>
                <th className="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sorted.map(msg => (
                <tr key={msg.id}
                  className={`transition-colors hover:bg-white/3 ${!msg.read ? 'bg-orange-500/5' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {!msg.read && <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />}
                      <span className={`font-semibold ${msg.read ? 'text-gray-300' : 'text-white'}`}>
                        {msg.firstName} {msg.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400 hidden md:table-cell">{msg.email}</td>
                  <td className="px-5 py-4 text-gray-500 hidden lg:table-cell truncate max-w-[160px]">{msg.projectTitle || '—'}</td>
                  <td className="px-5 py-4 text-gray-600 hidden sm:table-cell text-xs">{new Date(msg.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openMessage(msg)}
                        className="px-3 py-1 rounded bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20">
                        View
                      </button>
                      {!msg.read && (
                        <button
                          onClick={() => markRead(msg.id)}
                          className="px-3 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-semibold hover:bg-orange-500/30">
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => del(msg.id)}
                        className="px-3 py-1 rounded bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Full message modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-white">Message Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-500 mb-1">First Name</p>
                  <p className="text-white font-semibold text-sm">{selected.firstName}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-500 mb-1">Last Name</p>
                  <p className="text-white font-semibold text-sm">{selected.lastName || '—'}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-orange-400 font-semibold text-sm">{selected.email}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500 mb-1">Project Title</p>
                <p className="text-white text-sm">{selected.projectTitle || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500 mb-2">Message</p>
                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>
              <p className="text-xs text-gray-600">Received: {new Date(selected.createdAt).toLocaleString()}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <a href={`mailto:${selected.email}`}
                className="flex-1 py-2.5 rounded-lg text-center text-sm font-bold text-black hover:opacity-90"
                style={{ background: 'var(--sbg-primary, #ff6b00)' }}>
                Reply by Email
              </a>
              <button onClick={() => del(selected.id)}
                className="px-5 py-2.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/30">
                Delete
              </button>
              <button onClick={() => setSelected(null)}
                className="px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold hover:bg-white/20">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
