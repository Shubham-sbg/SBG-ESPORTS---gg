import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useState } from 'react';
import { Founder } from '@/lib/database';

interface Props {
  founders: Founder[];
}

function FounderCard({ f }: { f: Founder }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 200;
  const isLong = f.description && f.description.length > maxLength;

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-white/8 bg-gradient-to-b from-white/5 to-white/2 hover:border-orange-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
      style={{ '--glow': '#ff6b0015' } as React.CSSProperties}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: 'radial-gradient(ellipse at top, #ff6b0010 0%, transparent 60%)' }} />

      <div className="relative p-7">
        <div className="flex items-start gap-5 mb-5">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-orange-500/20 group-hover:border-orange-500/50 transition-all duration-300 shadow-xl">
              {f.photo ? (
                <Image src={f.photo} alt={f.name} loading="lazy" decoding="async" width={96} height={96} objectFit="cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl"
                  style={{ background: 'linear-gradient(135deg, #ff6b0020, #e9456010)' }}>
                  👤
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-[#0a0a0f] bg-green-500 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-xl leading-tight group-hover:text-orange-200 transition-colors">{f.name}</h3>
            <p className="text-sm font-black uppercase tracking-widest mt-1" style={{ color: 'var(--sbg-primary, #ff6b00)' }}>
              {f.designation}
            </p>
            {f.type === 'founder' && (
              <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 font-bold tracking-wider">
                ⭐ FOUNDER
              </span>
            )}
          </div>
        </div>

        {f.description && (
          <div className="mb-5">
            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
              {expanded || !isLong ? f.description : f.description.slice(0, maxLength) + '...'}
            </p>
            {isLong && (
              <button onClick={() => setExpanded(e => !e)}
                className="mt-2 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors">
                {expanded ? 'Show less ↑' : 'Read full bio →'}
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-white/5">
          {f.socialInstagram && (
            <a href={f.socialInstagram} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold hover:bg-pink-500/20 transition-all">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Instagram
            </a>
          )}
          {f.socialTwitter && (
            <a href={f.socialTwitter} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold hover:bg-sky-500/20 transition-all">
              𝕏 Twitter
            </a>
          )}
          {f.socialYoutube && (
            <a href={f.socialYoutube} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
              ▶ YouTube
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function MgmtCard({ f }: { f: Founder }) {
  return (
    <div className="group relative p-5 rounded-2xl border border-white/5 bg-white/3 hover:border-orange-500/20 transition-all duration-500 hover:-translate-y-1 hover:bg-white/5">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 group-hover:border-orange-500/30 flex-shrink-0 transition-all duration-300">
          {f.photo ? (
            <Image src={f.photo} alt={f.name} objectFit="cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #ff6b0015, #e9456008)' }}>
              👤
            </div>
          )}
        </div>
        <div>
          <h4 className="font-black text-white text-base leading-tight">{f.name}</h4>
          <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--sbg-primary, #ff6b00)' }}>{f.designation}</p>
        </div>
      </div>
      {f.description && (
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{f.description}</p>
      )}
      {(f.socialInstagram || f.socialTwitter || f.socialYoutube) && (
        <div className="flex gap-1.5 mt-3">
          {f.socialInstagram && <a href={f.socialInstagram} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs hover:bg-orange-500/20 hover:text-orange-400 transition-all text-gray-400">📸</a>}
          {f.socialTwitter && <a href={f.socialTwitter} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs hover:bg-orange-500/20 hover:text-orange-400 transition-all text-gray-400">𝕏</a>}
          {f.socialYoutube && <a href={f.socialYoutube} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs hover:bg-orange-500/20 hover:text-orange-400 transition-all text-gray-400">▶</a>}
        </div>
      )}
    </div>
  );
}

export default function FoundersSection({ founders }: Props) {
  const visible = (founders ?? []).filter(f => f.visible);
  const founderMembers = visible.filter(f => f.type === 'founder').sort((a, b) => a.order - b.order);
  const mgmtMembers = visible.filter(f => f.type === 'management').sort((a, b) => a.order - b.order);

  if (visible.length === 0) return null;

  return (
    <section id="team" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-orange-500/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {founderMembers.length > 0 && (
          <div className="mb-24">
            <div className="text-center mb-14">
              <p className="text-xs font-black tracking-[0.4em] text-orange-400 mb-3 uppercase">Leadership</p>
              <h2 className="text-4xl md:text-5xl font-black text-white">
                MEET THE <span style={{ color: 'var(--sbg-primary, #ff6b00)' }}>FOUNDERS</span>
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mt-4" />
              <p className="text-gray-500 text-sm mt-4 max-w-xl mx-auto">
                The visionaries who built SBG ESPORTS from the ground up — shaping its culture, ambition, and legacy.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {founderMembers.map(f => <FounderCard key={f.id} f={f} />)}
            </div>
          </div>
        )}

        {mgmtMembers.length > 0 && (
          <div>
            <div className="text-center mb-12">
              <p className="text-xs font-black tracking-[0.4em] text-orange-400 mb-3 uppercase">Team</p>
              <h2 className="text-4xl md:text-5xl font-black text-white">
                MANAGEMENT <span style={{ color: 'var(--sbg-primary, #ff6b00)' }}>TEAM</span>
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mgmtMembers.map(f => <MgmtCard key={f.id} f={f} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
