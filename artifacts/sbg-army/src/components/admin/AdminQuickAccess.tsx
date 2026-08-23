import { useState } from 'react';
import { Navigation, NavigationItem, getDB, saveDB } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';

interface Props {
  navigation: Navigation;
  onRefresh: () => void;
}

const DEFAULT_SHORTCUTS: NavigationItem[] = [
  { id: 's1',  label: 'Home',        href: '/',            icon: '🏠', visible: true },
  { id: 's2',  label: 'About',       href: '/about',       icon: '⚡', visible: true },
  { id: 's3',  label: 'Gallery',     href: '/gallery',     icon: '📸', visible: true },
  { id: 's4',  label: 'Tournaments', href: '/tournaments', icon: '🏆', visible: true },
  { id: 's5',  label: 'Schedule',    href: '/schedule',    icon: '📅', visible: true },
  { id: 's6',  label: 'Leaderboards',href: '/leaderboards',icon: '📈', visible: true },
  { id: 's7',  label: 'Stats',       href: '/stats',       icon: '📊', visible: true },
  { id: 's8',  label: 'Records',     href: '/records',     icon: '🏅', visible: true },
  { id: 's9',  label: 'Trophy Room', href: '/trophy-room', icon: '🏆', visible: true },
  { id: 's10', label: 'Team History',href: '/team-history',icon: '📜', visible: true },
  { id: 's11', label: 'Hall of Fame',href: '/hof-timeline',icon: '⭐', visible: true },
  { id: 's12', label: 'Feedback',    href: '/feedback',    icon: '💬', visible: true },
];

const COMMON_ICONS = ['🏠','⚡','📸','🏆','📅','📈','📊','🏅','📜','⭐','💬','🎮','👥','🎯','🎁','🤝','🛒','📰','🖼️','🎬','📋'];

export default function AdminQuickAccess({ navigation, onRefresh }: Props) {
  const [shortcuts, setShortcuts] = useState<NavigationItem[]>(
    navigation.shortcuts?.length ? navigation.shortcuts : DEFAULT_SHORTCUTS
  );
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', href: '', icon: '🔗' });
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const save = async () => {
    const db = getDB();
    db.navigation = { ...db.navigation, shortcuts };
    try {
      await saveDB(db, 'navigation');
      onRefresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        onRefresh();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert(msg || 'Failed to save quick access shortcuts.');
      }
    }
  };

  const toggle = (id: string) =>
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));

  const del = (id: string) =>
    setShortcuts(prev => prev.filter(s => s.id !== id));

  const addItem = () => {
    if (!newItem.label.trim()) return;
    setShortcuts(prev => [...prev, {
      ...newItem,
      id: `sc_${Date.now()}`,
      visible: true,
    }]);
    setNewItem({ label: '', href: '', icon: '🔗' });
    setAdding(false);
  };

  const update = (id: string, key: keyof NavigationItem, value: string | boolean) =>
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, [key]: value } : s));

  const resetToDefaults = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    setShowReset(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-black text-xl text-white">Quick Access</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Shortcut grid shown in the mobile menu. Empty = uses built-in defaults.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReset(true)}
            className="px-3 py-2 rounded-lg border border-white/10 text-gray-400 text-xs font-bold hover:text-white hover:border-white/25 transition-all">
            Reset Defaults
          </button>
          <button onClick={() => setAdding(!adding)}
            className="px-4 py-2 rounded-lg bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-400">
            {adding ? 'Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      {/* Reset confirm */}
      {showReset && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-center justify-between">
          <p className="text-sm text-gray-300">Reset all shortcuts to defaults?</p>
          <div className="flex gap-2">
            <button onClick={() => setShowReset(false)}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-gray-400 hover:text-white">Cancel</button>
            <button onClick={resetToDefaults}
              className="px-3 py-1.5 rounded-lg text-xs bg-red-500 text-white font-bold hover:bg-red-400">Reset</button>
          </div>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Icon</label>
              <Combobox className="inp"
                value={newItem.icon}
                onChange={e => setNewItem(n => ({ ...n, icon: e.target.value }))}>
                {COMMON_ICONS.map(ic => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </Combobox>
            </div>
            <div>
              <label className="label">Label</label>
              <input className="inp" placeholder="e.g. Gallery"
                value={newItem.label}
                onChange={e => setNewItem(n => ({ ...n, label: e.target.value }))} />
            </div>
            <div>
              <label className="label">Link</label>
              <input className="inp" placeholder="/gallery or https://..."
                value={newItem.href}
                onChange={e => setNewItem(n => ({ ...n, href: e.target.value }))} />
            </div>
          </div>
          <button onClick={addItem}
            className="px-4 py-2 rounded-lg bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-400">
            Add Shortcut
          </button>
        </div>
      )}

      {/* Preview */}
      <div className="p-4 rounded-xl border border-white/5 bg-white/2">
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Preview (mobile menu)</p>
        <div className="grid grid-cols-2 gap-2">
          {shortcuts.filter(s => s.visible !== false).map(s => (
            <div key={s.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/5 text-xs font-bold uppercase text-gray-400">
              {s.icon && <span>{s.icon}</span>} {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Shortcut list */}
      <div className="space-y-2">
        {shortcuts.map(item => (
          <div key={item.id}
            className={`flex items-center gap-3 p-3 rounded-xl border ${item.visible === false ? 'border-white/3 opacity-50' : 'border-white/8 bg-white/2'}`}>
            {/* Icon picker */}
            <Combobox
              className="bg-transparent border border-white/10 rounded px-1 py-1 text-sm w-14 text-center"
              value={item.icon || '🔗'}
              onChange={e => update(item.id, 'icon', e.target.value)}>
              {COMMON_ICONS.map(ic => (
                <option key={ic} value={ic}>{ic}</option>
              ))}
            </Combobox>

            <div className="flex-1 grid grid-cols-2 gap-2">
              <input className="inp text-xs" value={item.label}
                onChange={e => update(item.id, 'label', e.target.value)}
                placeholder="Label" />
              <input className="inp text-xs" value={item.href}
                onChange={e => update(item.id, 'href', e.target.value)}
                placeholder="/page" />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Toggle visible */}
              <button onClick={() => toggle(item.id)}
                className={`relative w-9 h-5 rounded-full transition-all ${item.visible !== false ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${item.visible !== false ? 'left-4' : 'left-0.5'}`} />
              </button>
              <button onClick={() => del(item.id)}
                className="px-2 py-1 rounded text-xs text-red-400 bg-red-400/10 hover:bg-red-400/20">✕</button>
            </div>
          </div>
        ))}
      </div>

      {shortcuts.length === 0 && (
        <p className="text-center text-gray-600 text-sm py-6">
          No shortcuts configured — mobile menu will use built-in defaults.
        </p>
      )}

      <button onClick={save}
        className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all ${saved ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black hover:bg-yellow-400'}`}>
        {saved ? '✓ SAVED!' : 'SAVE QUICK ACCESS'}
      </button>
    </div>
  );
}
