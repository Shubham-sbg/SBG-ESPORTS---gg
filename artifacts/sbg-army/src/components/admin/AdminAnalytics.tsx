import { useState } from 'react';
import { Analytics, getDB, saveDB, getDisplayVisits } from '@/lib/database';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface Props {
  analytics: Analytics;
  onRefresh: () => void;
}

export default function AdminAnalytics({ analytics, onRefresh }: Props) {
  const [overrides, setOverrides] = useState({
    today: analytics.manualTodayVisits ?? '',
    weekly: analytics.manualWeeklyVisits ?? '',
    total: analytics.manualTotalVisits ?? '',
  });
  const [saved, setSaved] = useState(false);

  const display = getDisplayVisits(analytics);

  const saveOverrides = () => {
    const db = getDB();
    db.analytics.manualTodayVisits = overrides.today !== '' ? Number(overrides.today) : null;
    db.analytics.manualWeeklyVisits = overrides.weekly !== '' ? Number(overrides.weekly) : null;
    db.analytics.manualTotalVisits = overrides.total !== '' ? Number(overrides.total) : null;
    saveDB(db);
    onRefresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearOverride = (field: 'today' | 'weekly' | 'total') => {
    const db = getDB();
    if (field === 'today') { db.analytics.manualTodayVisits = null; setOverrides(o => ({ ...o, today: '' })); }
    if (field === 'weekly') { db.analytics.manualWeeklyVisits = null; setOverrides(o => ({ ...o, weekly: '' })); }
    if (field === 'total') { db.analytics.manualTotalVisits = null; setOverrides(o => ({ ...o, total: '' })); }
    saveDB(db);
    onRefresh();
  };

  const last7 = [...(analytics.visitHistory ?? [])].slice(-7);
  const max = Math.max(...last7.map(v => v.count), 1);

  const deviceCounts = (analytics.visitRecords ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.deviceType] = (acc[r.deviceType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="font-black text-xl text-white">Analytics</h2>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Today', value: display.today, color: '#00d4ff', manual: analytics.manualTodayVisits !== null },
          { label: 'This Week', value: display.weekly, color: '#ff6b00', manual: analytics.manualWeeklyVisits !== null },
          { label: 'All Time', value: display.total, color: '#ffd700', manual: analytics.manualTotalVisits !== null },
        ].map(stat => (
          <div key={stat.label} className="p-6 rounded-xl border border-white/5 bg-white/3 text-center relative">
            {stat.manual && (
              <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold">MANUAL</span>
            )}
            <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>
              {stat.value.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-xl border border-white/5 bg-white/3">
        <h3 className="font-bold text-white mb-4">Manual Override</h3>
        <p className="text-xs text-gray-500 mb-4">Set custom values to override auto-tracked counts. Clear to revert to live tracking.</p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Today Override', key: 'today' as const, current: analytics.manualTodayVisits },
            { label: 'Weekly Override', key: 'weekly' as const, current: analytics.manualWeeklyVisits },
            { label: 'Total Override', key: 'total' as const, current: analytics.manualTotalVisits },
          ].map(field => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <div className="flex gap-2">
                <input type="number" className="inp flex-1 min-w-0"
                  placeholder={field.current !== null ? String(field.current) : 'Auto'}
                  value={overrides[field.key]}
                  onChange={e => setOverrides(o => ({ ...o, [field.key]: e.target.value }))} />
                {field.current !== null && (
                  <button onClick={() => clearOverride(field.key)}
                    className="px-2 py-1.5 rounded-lg text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 flex-shrink-0">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={saveOverrides} className={`px-6 py-2.5 rounded-xl text-sm font-black tracking-widest uppercase transition-all ${saved ? 'bg-green-500 text-black' : 'bg-orange-500 text-black hover:bg-orange-400'}`}>
          {saved ? '✓ SAVED' : 'SAVE OVERRIDES'}
        </button>
      </div>

      <div className="p-6 rounded-xl border border-white/5 bg-white/3">
        <h3 className="font-bold text-white mb-2">Visitor Traffic & Tournament Registration Trends — Last 30 Days</h3>
        <p className="text-xs text-gray-500 mb-6">Daily breakdown of site visitors and new tournament team registrations.</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={(() => {
              const dbData = getDB();
              const regs = dbData.registrations ?? [];
              return Array.from({ length: 30 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                const dateStr = d.toISOString().slice(0, 10);
                const displayDate = `${d.getMonth() + 1}/${d.getDate()}`;
                
                const visitEntry = (analytics.visitHistory ?? []).find(v => v.date === dateStr);
                const visits = visitEntry ? visitEntry.count : 0;

                const regsCount = regs.filter(r => {
                  if (!r.createdAt) return false;
                  const rDate = new Date(r.createdAt).toISOString().slice(0, 10);
                  return rDate === dateStr;
                }).length;

                return {
                  date: displayDate,
                  visits,
                  registrations: regsCount,
                };
              });
            })()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ff6b00" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0a0f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="visits" name="Visitor Traffic" stroke="#00d4ff" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={2} />
              <Area type="monotone" dataKey="registrations" name="Tournament Registrations" stroke="#ff6b00" fillOpacity={1} fill="url(#colorRegs)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {Object.keys(deviceCounts).length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {(['mobile', 'tablet', 'desktop'] as const).map(d => (
            <div key={d} className="p-4 rounded-xl border border-white/5 bg-white/3 text-center">
              <div className="text-2xl mb-1">{d === 'mobile' ? '📱' : d === 'tablet' ? '📟' : '🖥️'}</div>
              <div className="font-black text-white text-xl">{deviceCounts[d] ?? 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">{d}</div>
            </div>
          ))}
        </div>
      )}

      <div className="p-6 rounded-xl border border-white/5 bg-white/3">
        <h3 className="font-bold text-white mb-4">Last 20 Visits</h3>
        {(analytics.visitRecords ?? []).length === 0 ? (
          <p className="text-gray-500 text-sm">No visit records yet. Visit the public site to start tracking!</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(analytics.visitRecords ?? []).map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-white/3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm">{v.deviceType === 'mobile' ? '📱' : v.deviceType === 'tablet' ? '📟' : '🖥️'}</span>
                  <span className="text-sm text-gray-400 font-mono truncate">{v.page}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-600 font-mono">{new Date(v.timestamp).toLocaleString()}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-500 capitalize">{v.deviceType}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
