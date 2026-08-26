import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useState } from 'react';
import { Order, getDB, saveDB } from '@/lib/database';

interface Props {
  orders: Order[];
  onRefresh: () => void;
}

const STATUS_CONFIG = {
  waiting: { label: 'Waiting', color: 'text-yellow-400 bg-yellow-500/10' },
  approved: { label: 'Approved', color: 'text-green-400 bg-green-500/10' },
  rejected: { label: 'Rejected', color: 'text-red-400 bg-red-500/10' },
};

export default function AdminOrders({ orders, onRefresh }: Props) {
  const [filter, setFilter] = useState<'all' | Order['status']>('all');
  const [viewScreenshot, setViewScreenshot] = useState<string | null>(null);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

  const setStatus = (id: string, status: Order['status']) => {
    const db = getDB();
    const idx = (db.orders ?? []).findIndex(o => o.id === id);
    if (idx !== -1) {
      db.orders[idx].status = status;
      saveDB(db);
      onRefresh();
    }
  };

  const deleteOrder = (id: string) => {
    if (!confirm('Delete this order?')) return;
    const db = getDB();
    db.orders = (db.orders ?? []).filter(o => o.id !== id);
    saveDB(db);
    onRefresh();
  };

  const waiting = orders.filter(o => o.status === 'waiting').length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-black text-xl text-white">Shop Orders</h2>
          <p className="text-xs text-gray-500 mt-0.5">Review payment screenshots and approve or reject orders.</p>
        </div>
        {waiting > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-black">
            {waiting} pending review
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'waiting', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            {f === 'all' ? 'All' : STATUS_CONFIG[f].label}
            {f !== 'all' && <span className="ml-1.5">({orders.filter(o => o.status === f).length})</span>}
          </button>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="p-16 text-center text-gray-500 text-sm rounded-xl border border-white/5">
          No orders {filter !== 'all' ? `with status "${filter}"` : ''} yet.
        </div>
      )}

      <div className="space-y-4">
        {sorted.map(order => (
          <div key={order.id} className={`p-5 rounded-xl border ${order.status === 'waiting' ? 'border-yellow-500/20 bg-yellow-500/3' : 'border-white/5 bg-white/3'}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-white text-sm">#{order.orderNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_CONFIG[order.status].color}`}>
                    {STATUS_CONFIG[order.status].label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-300 truncate">{order.productTitle}</p>
                {order.size && <p className="text-xs text-gray-500">Size: <span className="text-gray-300 font-bold">{order.size}</span></p>}
                <p className="text-xs text-gray-500">Amount: <span className="text-orange-400 font-bold">₹{order.amount}</span></p>
                <p className="text-xs text-gray-500">Player: <span className="text-gray-300">{order.userId}</span></p>
                <p className="text-xs text-gray-600">{new Date(order.createdAt).toLocaleString()}</p>
                {order.notes && <p className="text-xs text-gray-500 italic">"{order.notes}"</p>}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {order.paymentScreenshot && (
                  <button onClick={() => setViewScreenshot(order.paymentScreenshot!)}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 whitespace-nowrap">
                    📸 View Screenshot
                  </button>
                )}
                {order.status === 'waiting' && (
                  <>
                    <button onClick={() => setStatus(order.id, 'approved')}
                      className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20">
                      ✓ Approve
                    </button>
                    <button onClick={() => setStatus(order.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20">
                      ✗ Reject
                    </button>
                  </>
                )}
                {order.status !== 'waiting' && (
                  <button onClick={() => setStatus(order.id, 'waiting')}
                    className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 whitespace-nowrap">
                    Reset
                  </button>
                )}
                <button onClick={() => deleteOrder(order.id)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-500 text-xs font-bold hover:bg-red-500/10 hover:text-red-400">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setViewScreenshot(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewScreenshot(null)} className="absolute -top-10 right-0 text-gray-400 hover:text-white font-black text-2xl">✕</button>
            <Image src={viewScreenshot} alt="Payment Screenshot" objectFit="contain" className="w-full rounded-xl border border-white/10" />
          </div>
        </div>
      )}
    </div>
  );
}
