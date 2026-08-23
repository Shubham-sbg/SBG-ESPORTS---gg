import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { Settings } from '@/lib/database';

interface Props { onRefresh: () => void }

const GOLD = '#d4af37';

export default function AdminCountdown({ onRefresh }: Props) {
  const db = getDB();
  const s = db.settings;

  const [enabled, setEnabled]       = useState<boolean>(s.countdownEnabled ?? false);
  const [targetDate, setTargetDate] = useState<string>(s.countdownTargetDate ?? '');
  const [title, setTitle]           = useState<string>(s.countdownTitle ?? 'Next Tournament');
  const [expired, setExpired]       = useState<string>(s.countdownExpiredMessage ?? 'Stay tuned — next event starting soon!');
  const [saved, setSaved]           = useState(false);
  const [preview, setPreview]       = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });

  // Live preview ticker
  useEffect(() => {
    if (!enabled || !targetDate) return;
    const td = new Date(targetDate);
    if (isNaN(td.getTime())) return;
    const tick = () => {
      const diff = td.getTime() - Date.now();
      if (diff <= 0) { setPreview({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
      setPreview({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [enabled, targetDate]);

  const save = async () => {
    const db2 = getDB();
    db2.settings = {
      ...db2.settings,
      countdownEnabled: enabled,
      countdownTargetDate: targetDate,
      countdownTitle: title,
      countdownExpiredMessage: expired,
    } as Settings;
    await saveDB(db2, 'settings');
    onRefresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="font-black text-xl text-white">Countdown Manager</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Controls the countdown timer displayed in the Hero section. Hidden until you enable it.
        </p>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between p-5 rounded-xl border border-white/8 bg-white/2">
        <div>
          <p className="font-bold text-white text-sm">Show Countdown on Hero</p>
          <p className="text-xs text-gray-500 mt-0.5">Displays a live countdown to your target date</p>
        </div>
        <button onClick={() => setEnabled(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-all ${enabled ? 'bg-yellow-500' : 'bg-gray-700'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      {/* Config fields */}
      <div className="space-y-4">
        <div>
          <label className="label">Countdown Title</label>
          <input className="inp" value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Next Tournament" />
        </div>

        <div>
          <label className="label">Target Date & Time</label>
          <input
            type="datetime-local"
            className="inp"
            value={targetDate ? targetDate.slice(0, 16) : ''}
            onChange={e => setTargetDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
          />
          <p className="text-xs text-gray-600 mt-1">When this moment is reached, the expired message shows instead.</p>
        </div>

        <div>
          <label className="label">Expired / In-Progress Message</label>
          <input className="inp" value={expired}
            onChange={e => setExpired(e.target.value)}
            placeholder="Tournament in progress!" />
        </div>
      </div>

      {/* Live Preview */}
      {enabled && targetDate && (
        <div className="p-5 rounded-xl border border-white/5 bg-white/2">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Live Preview</p>
          {preview.expired ? (
            <div className="flex items-center gap-2 px-5 py-3 rounded-full border border-green-500/30 bg-black/30 w-fit mx-auto">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400 font-black tracking-widest uppercase">{expired}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-5 py-3 rounded-full border border-gold/30 bg-black/30 w-fit mx-auto">
              <span className="w-2 h-2 rounded-full animate-pulse mr-2" style={{ background: GOLD }} />
              <span className="text-xs text-gray-400 tracking-widest uppercase font-bold mr-3">{title}</span>
              {[
                { val: pad(preview.d), label: 'D' },
                { val: pad(preview.h), label: 'H' },
                { val: pad(preview.m), label: 'M' },
                { val: pad(preview.s), label: 'S' },
              ].map(({ val, label }, i) => (
                <div key={label} className="flex items-center gap-1">
                  {i > 0 && <span className="font-bold text-sm" style={{ color: GOLD + '80' }}>:</span>}
                  <div className="text-center">
                    <div className="font-black text-lg leading-none tabular-nums" style={{ color: GOLD }}>{val}</div>
                    <div className="text-[9px] text-gray-600 tracking-widest">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!enabled && (
        <div className="p-4 rounded-xl border border-white/5 bg-white/2 text-center">
          <p className="text-gray-600 text-sm">Countdown is <span className="text-gray-400 font-bold">disabled</span>. Enable it above to show a live timer on the hero.</p>
        </div>
      )}

      <button onClick={save}
        className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all ${saved ? 'bg-green-500 text-black' : 'text-black hover:opacity-90'}`}
        style={!saved ? { background: `linear-gradient(135deg, ${GOLD}, #b8960c)` } : {}}>
        {saved ? '✓ SAVED!' : 'SAVE COUNTDOWN SETTINGS'}
      </button>
    </div>
  );
}
