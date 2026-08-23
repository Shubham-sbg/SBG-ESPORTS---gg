import { useEffect } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { resolveThemeBranding } from '@/lib/themeBranding';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Fallbacks used only when DB has no data yet
const FB_STATS = [
  { id: 's1', label: 'Active Players', value: '50+', icon: '🎮', color: '#ff6b00' },
  { id: 's2', label: 'Tournaments Won', value: '120+', icon: '🏆', color: '#ffd700' },
  { id: 's3', label: 'Win Rate', value: '78%', icon: '📈', color: '#00d4ff' },
  { id: 's4', label: 'Years Active', value: '4+', icon: '⚡', color: '#e94560' },
];
const FB_TIMELINE = [
  { id: 't1', year: '2020', title: 'SBG ESPORTS Founded', description: 'Started as a squad of passionate gamers.' },
  { id: 't2', year: '2021', title: 'First Tournament Win', description: 'Secured our first regional BGMI championship.' },
  { id: 't3', year: '2022', title: 'Multi-Game Expansion', description: 'Expanded into Free Fire, Valorant, and COD Mobile.' },
  { id: 't4', year: '2023', title: 'Enterprise Division', description: 'Launched team management, analytics, and business operations.' },
  { id: 't5', year: '2024', title: 'National Recognition', description: 'Ranked among India\'s top 10 esports organizations.' },
  { id: 't6', year: '2025', title: 'Official Platform Launch', description: 'Launched the unified SBG ESPORTS Official Platform.' },
];
const FB_VALUES = [
  { id: 'v1', icon: '⚡', title: 'Excellence', description: 'We pursue the highest standards in every match, every decision, every action.' },
  { id: 'v2', icon: '🤝', title: 'Brotherhood', description: 'SBG ESPORTS is a family. We grow together, celebrate together, and win together.' },
  { id: 'v3', icon: '🎯', title: 'Discipline', description: 'Structured training, strategic thinking, and relentless focus on improvement.' },
  { id: 'v4', icon: '🌍', title: 'Integrity', description: 'Fair play, respect for opponents, and transparency in all our operations.' },
];

export default function AboutPage() {
  const { db, loading, resolvedSettings } = useDatabase();

  useEffect(() => {
    if (!loading && resolvedSettings) applyTheme(resolvedSettings);
  }, [loading, resolvedSettings]);

  const about = db.about;
  const stats = about?.stats?.length ? about.stats : FB_STATS;
  const timeline = about?.timeline?.length ? about.timeline : FB_TIMELINE;
  const values = about?.values?.length ? about.values : FB_VALUES;
  const mission = about?.mission || `To build India's most elite esports organization — one that nurtures raw talent into professional champions and represents our nation on the global stage with pride and excellence.`;
  const vision = about?.vision || `A future where every aspiring Indian gamer has a pathway to professional esports. We envision ${resolvedSettings.organizationName} as a global powerhouse — competing at international championships, producing MVPs, and changing lives through gaming.`;
  const heroDesc = about?.description || resolvedSettings.aboutHeroDescription || 'Born from passion. Built on discipline. Driven by the relentless pursuit of victory. We are more than an esports organization — we are a movement.';
  const badgeText = resolvedSettings.aboutBadgeText || 'OUR STORY';
  const founders = (db.founders ?? []).filter(f => f.visible).sort((a, b) => a.order - b.order);
  const enabledGames = (db.games ?? []).filter(g => g.enabled).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <Navbar settings={resolvedSettings} navigation={db.navigation} />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a1a] to-black" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(ellipse at 30% 50%, ${resolvedSettings.primaryColor}18 0%, transparent 60%),
                           radial-gradient(ellipse at 70% 50%, ${resolvedSettings.accentColor}18 0%, transparent 60%)`
        }} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute w-px bg-orange-500/8 animate-pulse"
              style={{ left: `${(i + 1) * 8}%`, top: 0, bottom: 0, animationDelay: `${i * 0.3}s`, animationDuration: `${2 + i * 0.2}s` }} />
          ))}
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-xs font-bold tracking-widest uppercase mb-8">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            {badgeText}
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="text-white">ABOUT </span>
            <span style={{ color: resolvedSettings.primaryColor, textShadow: `0 0 40px ${resolvedSettings.primaryColor}66` }}>{resolvedSettings.organizationName}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">{heroDesc}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <div key={stat.id} className="relative bg-white/[0.03] border border-white/8 rounded-2xl p-4 sm:p-6 text-center overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(ellipse at center, ${stat.color || db.settings.primaryColor}08, transparent)` }} />
              <div className="text-2xl sm:text-3xl mb-2">{stat.icon || '⭐'}</div>
              <div className="text-3xl sm:text-4xl font-black mb-1" style={{ color: stat.color || db.settings.primaryColor }}>{stat.value}</div>
              <div className="text-xs font-bold tracking-widest text-gray-500 uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      {about?.story && (
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto bg-white/[0.02] border border-white/6 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-black text-white tracking-wider mb-4">OUR STORY</h2>
            <p className="text-gray-400 leading-relaxed">{about.story}</p>
          </div>
        </section>
      )}

      {/* Mission & Vision */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-2xl mb-6">🎯</div>
              <h2 className="text-2xl font-black text-white tracking-wider mb-4">OUR MISSION</h2>
              <p className="text-gray-400 leading-relaxed">{mission}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl mb-6">🔭</div>
              <h2 className="text-2xl font-black text-white tracking-wider mb-4">OUR VISION</h2>
              <p className="text-gray-400 leading-relaxed">{vision}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-xs font-bold tracking-widest uppercase mb-4">CORE VALUES</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">WHAT DEFINES US</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {values.map((v) => (
              <div key={v.id} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-orange-500/30 transition-all duration-300 group text-center">
                <div className="text-3xl sm:text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{v.icon}</div>
                <h3 className="font-black text-white tracking-wider mb-2 sm:mb-3 text-sm sm:text-base">{v.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games */}
      {enabledGames.length > 0 && (
        <section className="py-16 px-4 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-xs font-bold tracking-widest uppercase mb-4">COMPETITIVE TITLES</div>
              <h2 className="text-3xl sm:text-4xl font-black text-white">GAMES WE DOMINATE</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {enabledGames.map((g) => (
                <div key={g.id} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-white/15 transition-all duration-300 group text-center">
                  {g.logo ? (
                    <img src={g.logo} alt={g.name} className="w-12 h-12 object-contain mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="text-3xl mb-3">🎮</div>
                  )}
                  <h3 className="font-black text-white tracking-widest text-xs sm:text-sm">{g.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black" style={{ background: `${db.settings.primaryColor}22`, color: db.settings.primaryColor }}>ACTIVE</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-xs font-bold tracking-widest uppercase mb-4">HISTORY</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">OUR JOURNEY</h2>
          </div>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500/50 via-orange-500/20 to-transparent" />
            <div className="space-y-6 sm:space-y-8">
              {timeline.map((item, i) => (
                <div key={item.id} className={`relative flex ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-6 sm:gap-8`}>
                  <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'} pl-10 md:pl-0`}>
                    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-orange-500/25 transition-all duration-300">
                      <div className="font-black text-orange-500 text-sm tracking-widest mb-1">{item.year}</div>
                      <h3 className="font-black text-white text-base sm:text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-0 md:left-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-orange-500 bg-black flex items-center justify-center text-xs font-black text-orange-500 flex-shrink-0 -translate-x-[2px] md:-translate-x-1/2 z-10">
                    {i + 1}
                  </div>
                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      {founders.length > 0 && (
        <section className="py-16 px-4 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-xs font-bold tracking-widest uppercase mb-4">LEADERSHIP</div>
              <h2 className="text-3xl sm:text-4xl font-black text-white">THE TEAM BEHIND THE TEAM</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {founders.slice(0, 8).map((f) => (
                <div key={f.id} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 sm:p-6 text-center hover:border-orange-500/30 transition-all duration-300 group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl mb-3 sm:mb-4 overflow-hidden flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}33, ${db.settings.accentColor}22)` }}>
                    {f.photo ? (
                      <img src={f.photo} alt={f.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl sm:text-3xl font-black text-orange-400">{f.name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="font-black text-white tracking-wider mb-1 text-sm sm:text-base">{f.name}</h3>
                  <div className="text-xs font-bold text-orange-400 tracking-widest uppercase mb-2 sm:mb-3">{f.designation}</div>
                  {f.description && <p className="text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-3">{f.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">READY TO JOIN THE ARMY?</h2>
          <p className="text-gray-400 mb-8">We're always looking for talented players and passionate team members. Your journey starts here.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/join" className="px-6 sm:px-8 py-4 font-black text-sm tracking-widest uppercase text-black rounded-xl transition-all duration-300 hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}, ${db.settings.accentColor})` }}>
              JOIN THE TEAM →
            </a>
            <a href="/tournaments" className="px-6 sm:px-8 py-4 font-black text-sm tracking-widest uppercase text-white rounded-xl border border-white/20 hover:border-orange-500/50 hover:text-orange-400 transition-all duration-300">
              VIEW TOURNAMENTS
            </a>
          </div>
        </div>
      </section>

      <Footer settings={resolvedSettings} navigation={db.navigation} />
    </div>
  );
}
