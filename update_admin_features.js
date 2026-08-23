const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/admin/AdminFeatures.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace boolean checks and state with new object structure
content = content.replace(/enabled: boolean/g, 'state: string; placements: string[]');
content = content.replace(/enabled\?/g, "state === 'enabled' || state === 'featured' ?");
content = content.replace(/enabled/g, "state === 'enabled' || state === 'featured'");
content = content.replace(/\{ icon: string; label: string; desc: string; enabled: boolean; onToggle: \(\) => void \}/g, "{ icon: string; label: string; desc: string; state: string; placements: string[]; onToggle: () => void; onChangeState: (s: string) => void; onTogglePlacement: (p: string) => void }");

// Replace ToggleCard implementation
const toggleCardReplacement = `function ToggleCard({
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
        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
          <button onClick={() => onChangeState('enabled')} className={\`px-2 py-1 text-[10px] font-bold rounded \${state === 'enabled' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}\`}>ON</button>
          <button onClick={() => onChangeState('featured')} className={\`px-2 py-1 text-[10px] font-bold rounded \${state === 'featured' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}\`}>★</button>
          <button onClick={() => onChangeState('hidden')} className={\`px-2 py-1 text-[10px] font-bold rounded \${state === 'hidden' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-red-400'}\`}>OFF</button>
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
                  className={\`px-2 py-0.5 rounded text-[10px] \${active ? 'bg-white/10 text-white border border-white/20' : 'bg-transparent text-gray-500 border border-transparent hover:border-white/10'}\`}
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
}`;

content = content.replace(/function ToggleCard\([\s\S]*?return \([\s\S]*?\}\)/, toggleCardReplacement);

// Fix initial state loading and toggling in AdminFeatures
content = content.replace(/const toggleSection = \(key: string\) => \{[\s\S]*?\};/, '');
content = content.replace(/const togglePage = \(key: string\) => \{[\s\S]*?\};/, '');

const newFunctions = `
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
`;

content = content.replace(/const enableAll = \(type: 'sections' \| 'pages'\) => \{/, newFunctions + "\n  const enableAll = (type: 'sections' | 'pages') => {");

content = content.replace(/Object\.fromEntries\(Object\.keys\(f\[type\]\)\.map\(k => \[k, true\]\)\)/g, "Object.fromEntries(Object.keys(f[type]).map(k => [k, { state: 'enabled', placements: getFeatureConfig(f[type][k]).placements }]))");
content = content.replace(/Object\.fromEntries\(Object\.keys\(f\[type\]\)\.map\(k => \[k, false\]\)\)/g, "Object.fromEntries(Object.keys(f[type]).map(k => [k, { state: 'hidden', placements: getFeatureConfig(f[type][k]).placements }]))");

content = content.replace(/const sectionOnCount = Object\.values\(features\.sections\)\.filter\(Boolean\)\.length;/, "const sectionOnCount = Object.values(features.sections).filter(v => getFeatureConfig(v).state !== 'hidden').length;");
content = content.replace(/const pageOnCount = Object\.values\(features\.pages\)\.filter\(Boolean\)\.length;/, "const pageOnCount = Object.values(features.pages).filter(v => getFeatureConfig(v).state !== 'hidden').length;");

content = content.replace(/enabled=\{features\.sections\[s\.key\] \?\? true\}/, "state={getFeatureConfig(features.sections[s.key]).state} placements={getFeatureConfig(features.sections[s.key]).placements}");
content = content.replace(/enabled=\{features\.pages\[p\.key\] \?\? true\}/, "state={getFeatureConfig(features.pages[p.key]).state} placements={getFeatureConfig(features.pages[p.key]).placements}");

content = content.replace(/onToggle=\{\(\) => toggleSection\(s\.key\)\}/, "onToggle={() => changeState('sections', s.key, getFeatureConfig(features.sections[s.key]).state === 'hidden' ? 'enabled' : 'hidden')} onChangeState={(st) => changeState('sections', s.key, st)} onTogglePlacement={(pl) => togglePlacement('sections', s.key, pl)}");
content = content.replace(/onToggle=\{\(\) => togglePage\(p\.key\)\}/, "onToggle={() => changeState('pages', p.key, getFeatureConfig(features.pages[p.key]).state === 'hidden' ? 'enabled' : 'hidden')} onChangeState={(st) => changeState('pages', p.key, st)} onTogglePlacement={(pl) => togglePlacement('pages', p.key, pl)}");

fs.writeFileSync(file, content);
