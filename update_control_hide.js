const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/admin/AdminFeatures.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/FEATURE CONTROLS/g, 'CONTROL HIDE');
content = content.replace(/Toggle sections and pages on or off — changes apply site-wide instantly/g, 'Manage visibility, placement, and quick actions across the official public website.');

// We need to add state for shortcuts
// Currently: const [features, setFeatures] = useState<Features>(DEFAULT_FEATURES);
// We need to add shortcuts state
if (!content.includes('const [shortcuts, setShortcuts]')) {
  content = content.replace(
    /const \[features, setFeatures\] = useState<Features>\(DEFAULT_FEATURES\);/g,
    `const [features, setFeatures] = useState<Features>(DEFAULT_FEATURES);
  const [shortcuts, setShortcuts] = useState<any[]>([]);`
  );
  
  content = content.replace(
    /if \(db\.features && db\.features\.sections && db\.features\.pages\) \{/g,
    `if (db.navigation && db.navigation.shortcuts) {
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
    if (db.features && db.features.sections && db.features.pages) {`
  );

  content = content.replace(
    /db\.features = features;/g,
    `db.features = features;
    if (!db.navigation) db.navigation = { items: [], shortcuts: [] };
    db.navigation.shortcuts = shortcuts;`
  );

  const shortcutMethods = `
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
  `;

  content = content.replace(
    /const sectionOnCount = Object\.values\(features\.sections\)/g,
    shortcutMethods + '\n  const sectionOnCount = Object.values(features.sections)'
  );

  const shortcutsUI = `
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
                <button onClick={() => updateShortcut(idx, 'visible', true)} className={\`px-3 py-1 text-[10px] font-bold rounded \${s.visible !== false ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}\`}>SHOW</button>
                <button onClick={() => updateShortcut(idx, 'visible', false)} className={\`px-3 py-1 text-[10px] font-bold rounded \${s.visible === false ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-red-400'}\`}>HIDE</button>
              </div>
            </div>
          ))}
        </div>
      </div>
  `;

  content = content.replace(
    /\{\/\* Homepage Sections \*\/\}/g,
    shortcutsUI + '\n      {/* Homepage Sections */}'
  );

  fs.writeFileSync(file, content);
}
