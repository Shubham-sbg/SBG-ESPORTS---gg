import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { Settings } from '@/lib/database';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

interface Props { onRefresh: () => void }

type ExploreLink = { id: string; label: string; href: string };
const GOLD = '#d4af37';

const DEFAULT_EXPLORE_LINKS: ExploreLink[] = [
  { id: 'exp1', label: 'Join the Team',  href: '/join' },
  { id: 'exp2', label: 'Community',      href: '/community' },
  { id: 'exp3', label: 'Giveaways',      href: '/giveaways' },
  { id: 'exp4', label: 'Fan Connect',    href: '/fan-connect' },
  { id: 'exp5', label: 'Player Portal',  href: '/player-login' },
  { id: 'exp6', label: 'Contact Us',     href: '/contact' },
];

type Tab = 'text' | 'explore' | 'legal';

export default function AdminFooterCMS({ onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('text');
  const db = getDB();
  const s = db.settings;

  // Text fields
  const [footerDescription, setFooterDescription] = useState(s.footerDescription ?? '');
  const [footerText,         setFooterText]         = useState(s.footerText ?? '');
  const [footerCopyright,    setFooterCopyright]    = useState((s as any).footerCopyright ?? '');
  const [quickLinksTitle,    setQuickLinksTitle]    = useState(s.footerQuickLinksTitle ?? 'Quick Links');
  const [exploreTitle,       setExploreTitle]       = useState(s.footerExploreTitle ?? 'Explore');
  const [supportTitle,       setSupportTitle]       = useState(s.footerSupportTitle ?? 'Official Support');
  const [supportText,        setSupportText]        = useState(s.footerSupportText ?? '');

  // Explore links
  const [links,   setLinks]   = useState<ExploreLink[]>(s.footerExploreLinks?.length ? s.footerExploreLinks : DEFAULT_EXPLORE_LINKS);
  const [adding,  setAdding]  = useState(false);
  const [newLink, setNewLink] = useState({ label: '', href: '' });

  const [saved, setSaved] = useState(false);

  const save = async () => {
    const db2 = getDB();
    db2.settings = {
      ...db2.settings,
      footerDescription,
      footerText,
      footerCopyright,
      footerQuickLinksTitle: quickLinksTitle,
      footerExploreTitle: exploreTitle,
      footerSupportTitle: supportTitle,
      footerSupportText: supportText,
      footerExploreLinks: links,
    } as Settings;
    await saveDB(db2, 'settings');
    onRefresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateLink = (id: string, key: 'label' | 'href', val: string) =>
    setLinks(prev => prev.map(l => l.id === id ? { ...l, [key]: val } : l));

  const delLink = (id: string) => setLinks(prev => prev.filter(l => l.id !== id));

  const addLink = () => {
    if (!newLink.label.trim()) return;
    setLinks(prev => [...prev, { ...newLink, id: `exp_${Date.now()}` }]);
    setNewLink({ label: '', href: '' });
    setAdding(false);
  };

  const resetLinks = () => setLinks(DEFAULT_EXPLORE_LINKS);

  const inp = `w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all`;
  const lbl = (t: string) => <label className="block text-xs font-black tracking-widest uppercase text-gray-400 mb-1">{t}</label>;

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'text',    label: 'Text & Labels', icon: '✏️' },
    { id: 'explore', label: 'Explore Links', icon: '🔗' },
    { id: 'legal',   label: 'Bottom Bar',    icon: '⚖️' },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-black text-xl text-white">Footer CMS</h2>
          <p className="text-xs text-gray-500 mt-0.5">Control every piece of footer content.</p>
        </div>
        <button onClick={save}
          className={`px-5 py-2.5 rounded-xl font-black text-sm tracking-widest uppercase transition-all ${saved ? 'bg-green-500 text-black' : 'text-black hover:opacity-90'}`}
          style={!saved ? { background: `linear-gradient(135deg, ${GOLD}, #b8960c)` } : {}}>
          {saved ? '✓ Saved!' : 'Save All'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all`}
            style={activeTab === t.id ? { color: GOLD, background: `${GOLD}20` } : { color: '#6b7280' }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── Text & Labels tab ──────────────────────────────────── */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          <div>{lbl('Footer Description (under org name)')}
            <textarea className={inp} rows={3} value={footerDescription}
              onChange={e => setFooterDescription(e.target.value)}
              placeholder="Born to Win. Built to Dominate." />
          </div>
          <div>{lbl('"Quick Links" Column Title')}
            <input className={inp} value={quickLinksTitle} onChange={e => setQuickLinksTitle(e.target.value)} placeholder="Quick Links" />
          </div>
          <div>{lbl('"Explore" Column Title')}
            <input className={inp} value={exploreTitle} onChange={e => setExploreTitle(e.target.value)} placeholder="Explore" />
          </div>
          <div>{lbl('Support Box Title')}
            <input className={inp} value={supportTitle} onChange={e => setSupportTitle(e.target.value)} placeholder="Official Support" />
          </div>
          <div>{lbl('Support Box Text')}
            <input className={inp} value={supportText} onChange={e => setSupportText(e.target.value)} placeholder="Built for competitive excellence." />
          </div>
        </div>
      )}

      {/* ── Explore Links tab ──────────────────────────────────── */}
      {activeTab === 'explore' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Links shown in the "Explore" column of the footer.</p>
            <div className="flex gap-2">
              <button onClick={resetLinks}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs font-bold hover:text-white">
                Reset Defaults
              </button>
              <button onClick={() => setAdding(!adding)}
                className="px-3 py-1.5 rounded-lg text-black text-xs font-bold hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
                {adding ? 'Cancel' : '+ Add Link'}
              </button>
            </div>
          </div>

          {adding && (
            <div className="p-4 rounded-xl border border-gold/20 bg-gold/5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>{lbl('Label')}<input className={inp} value={newLink.label} onChange={e => setNewLink(n => ({ ...n, label: e.target.value }))} placeholder="Page Name" /></div>
                <div>{lbl('URL / Route')}<input className={inp} value={newLink.href} onChange={e => setNewLink(n => ({ ...n, href: e.target.value }))} placeholder="/page or https://..." /></div>
              </div>
              <button onClick={addLink}
                className="px-4 py-2 rounded-lg text-black text-sm font-bold hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
                Add
              </button>
            </div>
          )}

          <div className="space-y-2">
            {links.map(link => (
              <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input className={inp + ' text-sm py-2'} value={link.label}
                    onChange={e => updateLink(link.id, 'label', e.target.value)} placeholder="Label" />
                  <input className={inp + ' text-sm py-2'} value={link.href}
                    onChange={e => updateLink(link.id, 'href', e.target.value)} placeholder="/route" />
                </div>
                <button onClick={() => delLink(link.id)}
                  className="px-2 py-1.5 rounded-lg text-xs text-red-400 bg-red-400/10 hover:bg-red-400/20 flex-shrink-0">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Bar tab ─────────────────────────────────────── */}
      {activeTab === 'legal' && (
        <div className="space-y-4">
          <div>{lbl('Footer Tagline (bottom bar, right side)')}
            <input className={inp} value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Built for competitive excellence" />
          </div>
          <div>{lbl('Copyright Text (after © year + org name)')}
            <input className={inp} value={footerCopyright} onChange={e => setFooterCopyright(e.target.value)} placeholder="All rights reserved." />
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-white/2">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Preview</p>
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} <strong className="text-gray-400">{getDB().settings.organizationName || ADMIN_BRAND_NAME}</strong>. {footerCopyright || 'All rights reserved.'}
            </p>
          </div>
        </div>
      )}

      <button onClick={save}
        className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all ${saved ? 'bg-green-500 text-black' : 'text-black hover:opacity-90'}`}
        style={!saved ? { background: `linear-gradient(135deg, ${GOLD}, #b8960c)` } : {}}>
        {saved ? '✓ SAVED!' : 'SAVE FOOTER SETTINGS'}
      </button>
    </div>
  );
}
