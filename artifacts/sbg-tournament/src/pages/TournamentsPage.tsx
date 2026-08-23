import { useEffect, useState } from 'react';
import { getTournaments } from '@/lib/api';
import TournamentCard from '@/components/TournamentCard';
import type { Tournament, TournamentStatus } from '@/lib/types';
import { Trophy, Search } from 'lucide-react';

const RED = '#e8192c';
const STATUSES: { key: TournamentStatus | 'all'; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'registration',label: 'Open' },
  { key: 'ongoing',     label: 'Live' },
  { key: 'completed',   label: 'Completed' },
];

export default function TournamentsPage() {
  const [all, setAll] = useState<Tournament[]>([]);
  const [filter, setFilter] = useState<TournamentStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTournaments().then(list => {
      setAll(list.filter(t => t.status !== 'draft'));
      setLoading(false);
    });
  }, []);

  const filtered = all.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (query && !t.title.toLowerCase().includes(query.toLowerCase()) && !t.game.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-14 fade-in">
          <p className="text-[11px] font-black tracking-[0.4em] uppercase mb-2" style={{ color: RED }}>All Events</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider mb-4">Tournaments</h1>
          <p className="text-gray-500">Find your next battleground. Register and compete.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by tournament or game…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white text-sm outline-none focus:border-red-500/40 transition-all placeholder-gray-700"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s.key} onClick={() => setFilter(s.key)}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                style={{
                  background: filter === s.key ? `${RED}20` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${filter === s.key ? `${RED}50` : 'rgba(255,255,255,0.08)'}`,
                  color: filter === s.key ? RED : '#9ca3af',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32">
            <Trophy size={56} className="mx-auto mb-4 opacity-10" />
            <p className="text-gray-500 text-lg">No tournaments found.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(t => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
