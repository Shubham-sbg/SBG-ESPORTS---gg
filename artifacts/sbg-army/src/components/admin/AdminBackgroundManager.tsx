import { useState } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { Settings } from '@/lib/database';

interface Props { onRefresh: () => void }

const GOLD = '#d4af37';

const PRESET_COLORS = [
  { name: 'Gold (Default)', value: '#d4af37' },
  { name: 'Orange Fire',    value: '#ff6b00' },
  { name: 'Neon Cyan',      value: '#00d4ff' },
  { name: 'Purple Blaze',   value: '#9945ff' },
  { name: 'Matrix Green',   value: '#00ff88' },
  { name: 'Red Alert',      value: '#e94560' },
  { name: 'Ice White',      value: '#ffffff' },
];

export default function AdminBackgroundManager({ onRefresh }: Props) {
  const db = getDB();
  const s = db.settings;

  const [particlesOn,  setParticlesOn]  = useState<boolean>(s.bgParticlesEnabled !== false);
  const [glowOn,       setGlowOn]       = useState<boolean>(s.bgGlowEnabled !== false);
  const [particleColor,setParticleColor]= useState<string>(s.bgParticleColor ?? GOLD);
  const [glowOpacity,  setGlowOpacity]  = useState<number>(s.bgOverlayOpacity ?? 0.07);
  const [animSpeed,    setAnimSpeed]    = useState<number>(s.bgAnimationSpeed ?? 1);
  const [saved,        setSaved]        = useState(false);

  const save = async () => {
    const db2 = getDB();
    db2.settings = {
      ...db2.settings,
      bgParticlesEnabled: particlesOn,
      bgGlowEnabled: glowOn,
      bgParticleColor: particleColor,
      bgOverlayOpacity: glowOpacity,
      bgAnimationSpeed: animSpeed,
    } as Settings;
    await saveDB(db2, 'settings');
    onRefresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ label, desc, val, onChange }: { label: string; desc: string; val: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-white/2">
      <div>
        <p className="font-bold text-white text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!val)}
        className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${val ? 'bg-yellow-500' : 'bg-gray-700'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${val ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );

  const speedLabel = animSpeed < 0.7 ? 'Very Slow' : animSpeed < 1.0 ? 'Slow' : animSpeed === 1.0 ? 'Normal' : animSpeed < 1.5 ? 'Fast' : 'Very Fast';

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="font-black text-xl text-white">Background Manager</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Controls the animated 3D background on the homepage Hero section.
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <Toggle
          label="3D Particle Animation"
          desc="The rotating wireframe shapes and particle field in the hero background"
          val={particlesOn}
          onChange={setParticlesOn}
        />
        <Toggle
          label="Gold Glow Overlay"
          desc="Soft golden radial glow behind the hero content"
          val={glowOn}
          onChange={setGlowOn}
        />
      </div>

      {/* Particle/Glow Color */}
      <div>
        <label className="label">Glow & Accent Color</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_COLORS.map(p => (
            <button key={p.value} onClick={() => setParticleColor(p.value)}
              title={p.name}
              className={`w-9 h-9 rounded-full border-2 transition-all ${particleColor === p.value ? 'scale-110 border-white' : 'border-transparent opacity-70 hover:opacity-100'}`}
              style={{ background: p.value }} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input type="color" value={particleColor}
            onChange={e => setParticleColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
          <input className="inp flex-1" value={particleColor}
            onChange={e => setParticleColor(e.target.value)}
            placeholder="#d4af37" />
        </div>
      </div>

      {/* Glow Intensity */}
      {glowOn && (
        <div>
          <label className="label">Glow Intensity — <span className="text-gold">{Math.round(glowOpacity * 100)}%</span></label>
          <input type="range" min="0" max="0.4" step="0.01"
            value={glowOpacity}
            onChange={e => setGlowOpacity(parseFloat(e.target.value))}
            className="w-full accent-yellow-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>None</span><span>Subtle</span><span>Strong</span>
          </div>
        </div>
      )}

      {/* Animation Speed */}
      {particlesOn && (
        <div>
          <label className="label">Animation Speed — <span className="text-gold">{speedLabel}</span></label>
          <input type="range" min="0.1" max="3" step="0.1"
            value={animSpeed}
            onChange={e => setAnimSpeed(parseFloat(e.target.value))}
            className="w-full accent-yellow-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Very Slow</span><span>Normal (1×)</span><span>Very Fast</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Keep below 1.5× for best performance on mobile devices.
          </p>
        </div>
      )}

      {/* Visual Preview */}
      <div className="rounded-xl overflow-hidden border border-white/8" style={{ height: 120, background: '#080808', position: 'relative' }}>
        {glowOn && (
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${particleColor}${Math.round(glowOpacity * 255).toString(16).padStart(2,'0')} 0%, transparent 70%)`
          }} />
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          {particlesOn && (
            <div className="w-5 h-5 rounded-full border-2 opacity-60 animate-spin" style={{ borderColor: particleColor }} />
          )}
          <span className="text-white/40 text-xs tracking-widest uppercase font-bold">Hero Background Preview</span>
          {particlesOn && (
            <div className="w-3 h-3 rounded-full border opacity-40 animate-bounce" style={{ borderColor: particleColor }} />
          )}
        </div>
      </div>

      <button onClick={save}
        className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all ${saved ? 'bg-green-500 text-black' : 'text-black hover:opacity-90'}`}
        style={!saved ? { background: `linear-gradient(135deg, ${GOLD}, #b8960c)` } : {}}>
        {saved ? '✓ SAVED!' : 'SAVE BACKGROUND SETTINGS'}
      </button>
    </div>
  );
}
