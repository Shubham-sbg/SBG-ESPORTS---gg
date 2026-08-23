import { useState } from 'react';
import { Navigation, getDB, saveDB } from '@/lib/database';

interface Props {
  navigation: Navigation;
  onRefresh: () => void;
}

export default function AdminNavigation({ navigation, onRefresh }: Props) {
  const [items, setItems] = useState(navigation.items);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', href: '' });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

  const save = async () => {
    setSaveState('saving');
    setSaveError('');
    try {
      const db = getDB();
      db.navigation = { ...db.navigation, items };
      await saveDB(db, 'navigation');
      onRefresh();
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (e: any) {
      console.error('Navigation save error:', e);
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        onRefresh();
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2500);
      } else {
        setSaveError(msg || 'Failed to save navigation. Please check connection.');
        setSaveState('error');
      }
    }
  };

  const toggleVisible = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, visible: !item.visible } : item));
  };

  const del = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (!newItem.label.trim()) return;
    setItems(prev => [...prev, { ...newItem, id: `nav${Date.now()}`, visible: true }]);
    setNewItem({ label: '', href: '' });
    setAdding(false);
  };

  const updateItem = (id: string, key: 'label' | 'href', value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-xl text-white">Navigation</h2>
        <button onClick={() => setAdding(!adding)}
          className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
          {adding ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {adding && (
        <div className="p-5 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Label</label><input className="inp" placeholder="e.g. Community" value={newItem.label} onChange={e => setNewItem(n => ({ ...n, label: e.target.value }))} /></div>
            <div><label className="label">Link</label><input className="inp" placeholder="#section or /page" value={newItem.href} onChange={e => setNewItem(n => ({ ...n, href: e.target.value }))} /></div>
          </div>
          <button onClick={addItem} className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">Add</button>
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/3">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <input className="inp text-sm" value={item.label} onChange={e => updateItem(item.id, 'label', e.target.value)} placeholder="Label" />
              <input className="inp text-sm" value={item.href} onChange={e => updateItem(item.id, 'href', e.target.value)} placeholder="Link" />
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => toggleVisible(item.id)}
                className={`relative w-10 h-5 rounded-full transition-all ${item.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${item.visible ? 'left-5' : 'left-0.5'}`} />
              </button>
              <button onClick={() => del(item.id)}
                className="px-2 py-1 rounded text-xs text-red-400 bg-red-400/10 hover:bg-red-400/20">✕</button>
            </div>
          </div>
        ))}
      </div>

      {saveError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
          ⚠️ {saveError}
        </div>
      )}

      <button
        onClick={save}
        disabled={saveState === 'saving'}
        className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          saveState === 'saved' ? 'bg-green-500 text-black' : 'bg-orange-500 text-black hover:bg-orange-400'
        }`}
      >
        {saveState === 'saving' ? '⏳ SAVING...' : saveState === 'saved' ? '✓ SAVED!' : 'SAVE NAVIGATION'}
      </button>
    </div>
  );
}
