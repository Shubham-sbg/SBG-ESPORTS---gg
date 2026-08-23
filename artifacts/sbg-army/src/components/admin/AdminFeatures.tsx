import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/lib/database';

interface Features {
  sections: Record<string, any>;
  pages: Record<string, any>;
}

const DEFAULT_FEATURES: Features = {
  sections: {
    hero: true, heroStats: true, ads: true, roster: true, matches: true, schedule: true,
    games: true, creators: true, news: true, videos: true, founders: true,
    sponsors: true, facility: true, contact: true, announcement: true,
  },
  pages: {
    shop: true, tournaments: false, leaderboards: true, events: true,
    blog: true, hallOfFame: true, live: false, join: true,
    community: true, fanConnect: true, giveaways: true, collaborate: true,
    playerPortal: false, records: true, stats: true, trophyRoom: true,
    teamHistory: true, gallery: true, achievements: true, schedule: true,
    feedback: true, hofTimeline: true, dashboard: false,
  },
};

const SECTION_META: { key: string; label: string; icon: string; desc: string }[] = [
  { key: 'announcement', label: 'Announcement Bar', icon: '📢', desc: 'Top banner announcement strip' },
  { key: 'hero', label: 'Hero Section', icon: '🏠', desc: 'Main landing hero banner' },
  { key: 'heroStats', label: 'Hero Stats Counter', icon: '📊', desc: 'Hero statistics counter bar (Pro Players, Win Rate, etc.)' },
  { key: 'ads', label: 'Ads Banner', icon: '📣', desc: 'Promotional ad banners' },
  { key: 'roster', label: 'Player Roster', icon: '👥', desc: 'Team roster / player cards section' },
  { key: 'matches', label: 'Match Results', icon: '🎮', desc: 'Recent and upcoming match results' },
  { key: 'schedule', label: 'Schedule', icon: '📅', desc: 'Event and match schedule section' },
  { key: 'games', label: 'Games Section', icon: '🕹️', desc: 'Supported games showcase' },
  { key: 'creators', label: 'Content Creators', icon: '🎥', desc: 'Creator spotlights section' },
  { key: 'news', label: 'News / Blog', icon: '📰', desc: 'Latest news and posts section' },
  { key: 'videos', label: 'Video Gallery', icon: '▶️', desc: 'Highlights and video section' },
  { key: 'founders', label: 'Founders & Mgmt', icon: '🏆', desc: 'Leadership team section' },
  { key: 'sponsors', label: 'Sponsors', icon: '🤝', desc: 'Partner and sponsor logos' },
  { key: 'facility', label: 'Facility', icon: '🏢', desc: 'Gaming facility showcase' },
  { key: 'contact', label: 'Contact Section', icon: '📬', desc: 'Contact / reach us section' },
];

const PAGE_META: { key: string; label: string; icon: string; desc: string }[] = [
  { key: 'join', label: 'Join Team (CTA & Page)', icon: '🎯', desc: 'Recruitment page & Hero "Join Team" primary button' },
  { key: 'tournaments', label: 'Register for Tournament (CTA & Page)', icon: '🏆', desc: 'Tournaments page & Hero "Register for Tournament" button' },
  { key: 'playerPortal', label: 'Player Login / Portal (CTA & Page)', icon: '🎮', desc: 'Player login/registration portal & Hero "Player Login" button' },
  { key: 'dashboard', label: 'Dashboard (CTA & Page)', icon: '📊', desc: 'Player dashboard portal & Hero "Dashboard" button' },
  { key: 'live', label: 'Watch Live / Live Stream (CTA & Page)', icon: '🔴', desc: 'Live stream page & Hero "Watch Live" button' },
  { key: 'shop', label: 'Shop', icon: '🛒', desc: 'Merch & products store' },
  { key: 'leaderboards', label: 'Rankings / Leaderboards', icon: '📊', desc: 'Player ranking leaderboards' },
  { key: 'events', label: 'Events', icon: '🗓️', desc: 'Events page' },
  { key: 'blog', label: 'Blog', icon: '📝', desc: 'Full blog/news page' },
  { key: 'records', label: 'Records Center', icon: '📈', desc: 'Team records and milestones' },
  { key: 'stats', label: 'Stats Dashboard', icon: '📊', desc: 'Player and team statistics' },
  { key: 'trophyRoom', label: 'Trophy Room', icon: '🥇', desc: 'Interactive 3D trophy showcase' },
  { key: 'teamHistory', label: 'Team History', icon: '📅', desc: 'Historical roster and season archives' },
  { key: 'gallery', label: 'Gallery', icon: '🖼️', desc: 'Media and photo gallery' },
  { key: 'achievements', label: 'Achievements', icon: '🎖️', desc: 'Titles and honors list' },
  { key: 'schedule', label: 'Schedule Page', icon: '📅', desc: 'Full weekly and monthly match schedule' },
  { key: 'hallOfFame', label: 'Hall of Fame', icon: '🌟', desc: 'Legends and achievements' },
  { key: 'community', label: 'Community', icon: '👾', desc: 'Community hub page' },
  { key: 'fanConnect', label: 'Fan Connect', icon: '💬', desc: 'Fan interaction page' },
  { key: 'giveaways', label: 'Giveaways', icon: '🎁', desc: 'Giveaway listings page' },
  { key: 'collaborate', label: 'Collaborate', icon: '🤲', desc: 'Collaboration requests page' },
  { key: 'feedback', label: 'Feedback Reports', icon: '💬', desc: 'User feedback and bug report page' },
  { key: 'hofTimeline', label: 'HOF Timeline', icon: '👑', desc: 'Hall of Fame interactive timeline' },
];

const GOLD = '#d4af37';

function ToggleCard({
  icon, label, desc, state, placements, onToggle, onChangeState, onTogglePlacement
}: { icon: string; label: string; desc: string; state: string; placements: string[]; onToggle: () => void; onChangeState: (s: string) => void; onTogglePlacement: (p: string) => void }) {
  const isEnabled = state !== 'hidden';
  return (
    <div
      className="flex flex-col p-4 rounded-xl border transition-all"
      style={{
        background: isEnabled ? (state === 'featured' ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.04)') : 'rgba(255,255,255,0.02)',
        borderColor: isEnabled ? (state === 'featured' ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.2)') : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl flex-shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate">{label}</p>
            <p className="text-[11px] text-gray-500 truncate">{desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-black/50 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => onChangeState('enabled')}
            className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider transition-all ${
              state === 'enabled'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            VISIBLE
          </button>
          <button
            onClick={() => onChangeState('hidden')}
            className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider transition-all ${
              state === 'hidden'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-gray-400 hover:text-red-400'
            }`}
          >
            HIDDEN
          </button>
        </div>
      </div>
      
      {isEnabled && (
        <div className="mt-2 pt-3 border-t border-white/5">
          <p className="text-[9px] font-bold text-gray-500 uppercase mb-2">Placements</p>
          <div className="flex flex-wrap gap-1.5">
            {['nav', 'home', 'footer', 'cta'].map(p => {
              const active = placements.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => onTogglePlacement(p)}
                  className={`px-2 py-0.5 rounded text-[10px] ${active ? 'bg-white/10 text-white border border-white/20' : 'bg-transparent text-gray-500 border border-transparent hover:border-white/10'}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 

export default function AdminFeatures({ onRefresh }: { onRefresh: () => void }) {
  const [features, setFeatures] = useState<Features>(DEFAULT_FEATURES);
  const [shortcuts, setShortcuts] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getDB() as any;
    if (db.navigation && db.navigation.shortcuts) {
      setShortcuts(db.navigation.shortcuts.length ? db.navigation.shortcuts : [
        { id: 's1', label: 'Home', href: '/', icon: '🏠', visible: true },
        { id: 's2', label: 'About', href: '/about', icon: '⚡', visible: true },
        { id: 's3', label: 'Gallery', href: '/gallery', icon: '📸', visible: true },
        { id: 's4', label: 'Tournaments', href: '/tournaments', icon: '🏆', visible: true },
        { id: 's5', label: 'Schedule', href: '/schedule', icon: '📅', visible: true },
        { id: 's6', label: 'Leaderboards', href: '/leaderboards', icon: '📈', visible: true },
        { id: 's7', label: 'Stats', href: '/stats', icon: '📊', visible: true },
        { id: 's8', label: 'Records', href: '/records', icon: '🏅', visible: true },
        { id: 's9', label: 'Trophy Room', href: '/trophy-room', icon: '🏆', visible: true },
        { id: 's10', label: 'Team History', href: '/team-history', icon: '📜', visible: true }
      ]);
    }
    if (db.features && db.features.sections && db.features.pages) {
      setFeatures({
        sections: { ...DEFAULT_FEATURES.sections, ...db.features.sections },
        pages: { ...DEFAULT_FEATURES.pages, ...db.features.pages },
      });
    }
  }, []);

  

  

  
  const getFeatureConfig = (obj: any): { state: string; placements: string[] } => {
    if (obj === undefined) return { state: 'enabled', placements: ['nav', 'home'] };
    if (typeof obj === 'boolean') return { state: obj ? 'enabled' : 'hidden', placements: ['nav', 'home'] };
    return { state: obj.state || 'enabled', placements: obj.placements || [] };
  };

  const changeState = (type: 'sections' | 'pages', key: string, newState: string) => {
    setFeatures(f => {
      const current = getFeatureConfig(f[type][key]);
      return { ...f, [type]: { ...f[type], [key]: { ...current, state: newState } } };
    });
  };

  const togglePlacement = (type: 'sections' | 'pages', key: string, placement: string) => {
    setFeatures(f => {
      const current = getFeatureConfig(f[type][key]);
      const placements = current.placements.includes(placement) 
        ? current.placements.filter(p => p !== placement)
        : [...current.placements, placement];
      return { ...f, [type]: { ...f[type], [key]: { ...current, placements } } };
    });
  };

  const enableAll = (type: 'sections' | 'pages') => {
    setFeatures(f => ({
      ...f,
      [type]: Object.fromEntries(Object.keys(f[type]).map(k => [k, { state: 'enabled', placements: getFeatureConfig(f[type][k]).placements }])),
    }));
  };

  const disableAll = (type: 'sections' | 'pages') => {
    setFeatures(f => ({
      ...f,
      [type]: Object.fromEntries(Object.keys(f[type]).map(k => [k, { state: 'hidden', placements: getFeatureConfig(f[type][k]).placements }])),
    }));
  };

  const handleSave = async () => {
    try {
      setError(null);
      const db = getDB() as any;
      db.features = features;
      if (!db.navigation) db.navigation = { items: [], shortcuts: [] };
      db.navigation.shortcuts = shortcuts;
      await saveDB(db);
      onRefresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save feature configurations.");
    }
  };

  
  const moveShortcut = (idx: number, dir: number) => {
    setShortcuts(s => {
      const copy = [...s];
      if (idx + dir < 0 || idx + dir >= copy.length) return copy;
      const temp = copy[idx];
      copy[idx] = copy[idx + dir];
      copy[idx + dir] = temp;
      return copy;
    });
  };

  const updateShortcut = (idx: number, key: string, val: any) => {
    setShortcuts(s => {
      const copy = [...s];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });
  };
  
  const addShortcut = () => {
    setShortcuts(s => [...s, { id: 's'+Date.now(), label: 'New Action', href: '/', icon: '🌟', visible: true }]);
  };
  
  const sectionOnCount = Object.values(features.sections).filter(v => getFeatureConfig(v).state !== 'hidden').length;
  const pageOnCount = Object.values(features.pages).filter(v => getFeatureConfig(v).state !== 'hidden').length;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-widest flex items-center gap-2">
            <span>🎛️</span> FEATURE CONTROLS
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage visibility, placement, and quick actions across the official public website.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95"
          style={{ background: saved ? '#10b981' : `linear-gradient(135deg, ${GOLD}, #b8960c)` }}
        >
          {saved ? '✓ SAVED' : 'SAVE CHANGES'}
        </button>
      </div>

      
      {/* Quick Actions / Shortcuts */}
      <div className="p-6 rounded-2xl border border-white/5 bg-white/2 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-black text-white text-sm tracking-widest flex items-center gap-2">
              ⚡ QUICK ACTIONS / FEATURE CARDS
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Control quick-action buttons across the website.</p>
          </div>
          <button onClick={addShortcut} className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all">+ ADD NEW</button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s, idx) => (
            <div key={s.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
              <div className="flex gap-1">
                <button onClick={() => moveShortcut(idx, -1)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400">↑</button>
                <button onClick={() => moveShortcut(idx, 1)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400">↓</button>
              </div>
              <input type="text" value={s.icon || ''} onChange={e => updateShortcut(idx, 'icon', e.target.value)} className="w-10 bg-transparent border-b border-white/20 text-center focus:outline-none focus:border-gold" placeholder="Emoji" />
              <input type="text" value={s.label || ''} onChange={e => updateShortcut(idx, 'label', e.target.value)} className="flex-1 min-w-[120px] bg-transparent border-b border-white/20 text-sm font-bold text-white focus:outline-none focus:border-gold" placeholder="Label" />
              <input type="text" value={s.href || ''} onChange={e => updateShortcut(idx, 'href', e.target.value)} className="flex-1 min-w-[150px] bg-transparent border-b border-white/20 text-xs text-gray-400 focus:outline-none focus:border-gold" placeholder="/url-or-route" />
              <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 ml-auto">
                <button onClick={() => updateShortcut(idx, 'visible', true)} className={`px-3 py-1 text-[10px] font-bold rounded ${s.visible !== false ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>SHOW</button>
                <button onClick={() => updateShortcut(idx, 'visible', false)} className={`px-3 py-1 text-[10px] font-bold rounded ${s.visible === false ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-red-400'}`}>HIDE</button>
              </div>
            </div>
          ))}
        </div>
      </div>
  
      {/* Homepage Sections */}
      <div className="p-6 rounded-2xl border border-white/5 bg-white/2 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-black text-white text-sm tracking-widest flex items-center gap-2">
              🏠 HOMEPAGE SECTIONS
              <span className="text-[11px] font-normal text-gray-500 ml-1">
                {sectionOnCount}/{SECTION_META.length} active
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Control which sections appear on the homepage</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => enableAll('sections')}
              className="px-3 py-1 rounded-lg text-[11px] font-bold text-green-400 border border-green-400/20 hover:bg-green-400/10 transition-all">
              All ON
            </button>
            <button onClick={() => disableAll('sections')}
              className="px-3 py-1 rounded-lg text-[11px] font-bold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all">
              All OFF
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {SECTION_META.map(s => (
            <ToggleCard
              key={s.key}
              icon={s.icon}
              label={s.label}
              desc={s.desc}
              state={getFeatureConfig(features.sections[s.key]).state} placements={getFeatureConfig(features.sections[s.key]).placements}
              onToggle={() => changeState('sections', s.key, getFeatureConfig(features.sections[s.key]).state === 'hidden' ? 'enabled' : 'hidden')} onChangeState={(st) => changeState('sections', s.key, st)} onTogglePlacement={(pl) => togglePlacement('sections', s.key, pl)}
            />
          ))}
        </div>
      </div>

      {/* Pages */}
      <div className="p-6 rounded-2xl border border-white/5 bg-white/2 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-black text-white text-sm tracking-widest flex items-center gap-2">
              📄 SITE PAGES
              <span className="text-[11px] font-normal text-gray-500 ml-1">
                {pageOnCount}/{PAGE_META.length} active
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Enable or disable entire pages — disabled pages redirect to home</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => enableAll('pages')}
              className="px-3 py-1 rounded-lg text-[11px] font-bold text-green-400 border border-green-400/20 hover:bg-green-400/10 transition-all">
              All ON
            </button>
            <button onClick={() => disableAll('pages')}
              className="px-3 py-1 rounded-lg text-[11px] font-bold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all">
              All OFF
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {PAGE_META.map(p => (
            <ToggleCard
              key={p.key}
              icon={p.icon}
              label={p.label}
              desc={p.desc}
              state={getFeatureConfig(features.pages[p.key]).state} placements={getFeatureConfig(features.pages[p.key]).placements}
              onToggle={() => changeState('pages', p.key, getFeatureConfig(features.pages[p.key]).state === 'hidden' ? 'enabled' : 'hidden')} onChangeState={(st) => changeState('pages', p.key, st)} onTogglePlacement={(pl) => togglePlacement('pages', p.key, pl)}
            />
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95"
          style={{ background: saved ? '#10b981' : `linear-gradient(135deg, ${GOLD}, #b8960c)` }}
        >
          {saved ? '✓ SAVED' : 'SAVE CHANGES'}
        </button>
      </div>
    </div>
  );
}
