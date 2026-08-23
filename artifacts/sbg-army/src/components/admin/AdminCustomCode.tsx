/**
 * AdminCustomCode — Custom Feature Manager
 * Super Admin only: manage custom HTML/CSS/JS snippets injected into the site.
 * Features: add/edit/delete, enable/disable, live preview, auto-backup, rollback, basic validation.
 */
import { useState, useEffect, useRef } from 'react';
import { getAdminToken } from '@/lib/auth';
import Combobox from '@/components/shared/Combobox';

interface Snippet {
  id: string;
  name: string;
  type: 'html' | 'css' | 'js';
  code: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

type SnippetType = Snippet['type'];

const GOLD = '#d4af37';
const TYPE_COLOR: Record<SnippetType, string> = { html: '#e07b39', css: '#4a9eff', js: '#f0db4f' };
const EMPTY: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'> = { name: '', type: 'html', code: '', enabled: true };

/** Minimal validation to catch obviously dangerous/broken snippets */
function validate(type: SnippetType, code: string): string | null {
  if (!code.trim()) return 'Code cannot be empty.';
  if (type === 'html') {
    if (/<script/i.test(code)) return 'HTML snippets must not contain <script> tags. Use a JS snippet instead.';
    if (/<iframe/i.test(code) && !/sandbox/i.test(code)) return 'iframes require a sandbox attribute for safety.';
  }
  if (type === 'js') {
    const dangerous = /document\.cookie|localStorage\.clear|eval\s*\(|Function\s*\(/;
    if (dangerous.test(code)) return 'Snippet contains potentially dangerous patterns. Review and adjust.';
  }
  return null;
}

/** Apply enabled snippets to the document (preview-only, sandboxed) */
function applyToPreview(snippets: Snippet[], iframe: HTMLIFrameElement) {
  const enabled = snippets.filter(s => s.enabled);
  const html = enabled.filter(s => s.type === 'html').map(s => s.code).join('\n');
  const css = enabled.filter(s => s.type === 'css').map(s => s.code).join('\n');
  const js = enabled.filter(s => s.type === 'js').map(s => `try{${s.code}}catch(e){console.warn('Snippet error:',e)}`).join('\n');
  const doc = `<!DOCTYPE html><html><head><style>
    body{font-family:system-ui,sans-serif;background:#111;color:#eee;padding:16px;margin:0}
    ${css}
  </style></head><body>
    <p style="color:#666;font-size:11px;margin-bottom:12px">── Live Preview (enabled snippets) ──</p>
    ${html}
    <script>${js}<\/script>
  </body></html>`;
  iframe.srcdoc = doc;
}

async function load(): Promise<Snippet[]> {
  const res = await fetch((import.meta.env.VITE_API_URL || "") + '/api/db/customCode');
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function save(snippets: Snippet[]): Promise<void> {
  const token = getAdminToken();
  await fetch((import.meta.env.VITE_API_URL || "") + '/api/db/customCode', { credentials: "include",
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(snippets),
  });
}

export default function AdminCustomCode({ adminRole, onRefresh }: { adminRole?: string; onRefresh: () => void }) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [backup, setBackup] = useState<Snippet[] | null>(null);
  const [editing, setEditing] = useState<Snippet | null>(null);
  const [draft, setDraft] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isSuperAdmin = adminRole === 'super_admin' || adminRole === 'admin';

  useEffect(() => { load().then(setSnippets); }, []);
  useEffect(() => {
    if (showPreview && iframeRef.current) applyToPreview(snippets, iframeRef.current);
  }, [showPreview, snippets]);

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-gray-400 text-sm">Super Admin access required.</p>
        </div>
      </div>
    );
  }

  const openNew = () => { setEditing(null); setDraft({ ...EMPTY }); setError(''); setShowForm(true); };
  const openEdit = (s: Snippet) => { setEditing(s); setDraft({ name: s.name, type: s.type, code: s.code, enabled: s.enabled }); setError(''); setShowForm(true); };
  const cancelEdit = () => { setEditing(null); setDraft({ ...EMPTY }); setError(''); setShowForm(false); };

  const handleSave = async () => {
    if (!draft.name.trim()) { setError('Name is required.'); return; }
    const err = validate(draft.type, draft.code);
    if (err) { setError(err); return; }
    setBusy(true);
    try {
      // Auto-backup before applying
      const current = await load();
      setBackup(current);

      const now = Date.now();
      let next: Snippet[];
      if (editing) {
        next = snippets.map(s => s.id === editing.id ? { ...s, ...draft, updatedAt: now } : s);
      } else {
        next = [...snippets, { id: `cc_${now}`, ...draft, createdAt: now, updatedAt: now }];
      }
      await save(next);
      setSnippets(next);
      cancelEdit();
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } finally { setBusy(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this snippet?')) return;
    const current = await load();
    setBackup(current);
    const next = snippets.filter(s => s.id !== id);
    await save(next);
    setSnippets(next);
  };

  const handleToggle = async (id: string) => {
    const next = snippets.map(s => s.id === id ? { ...s, enabled: !s.enabled, updatedAt: Date.now() } : s);
    await save(next);
    setSnippets(next);
  };

  const handleRollback = async () => {
    if (!backup) return;
    if (!confirm('Roll back to the previous version?')) return;
    await save(backup);
    setSnippets(backup);
    setBackup(null);
  };

  const TypeBadge = ({ type }: { type: SnippetType }) => (
    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
      style={{ background: `${TYPE_COLOR[type]}22`, color: TYPE_COLOR[type], border: `1px solid ${TYPE_COLOR[type]}44` }}>
      {type}
    </span>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-white tracking-widest flex items-center gap-2">
            <span>🧩</span> CUSTOM FEATURE MANAGER
          </h2>
          <p className="text-xs text-gray-500 mt-1">Inject custom HTML, CSS, or JavaScript. Super Admin only.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {backup && (
            <button onClick={handleRollback}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-all">
              ↩ Rollback
            </button>
          )}
          <button onClick={() => setShowPreview(v => !v)}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all">
            {showPreview ? '🙈 Hide Preview' : '👁 Live Preview'}
          </button>
          <button onClick={openNew}
            className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
            + Add Snippet
          </button>
        </div>
      </div>

      {/* Live Preview */}
      {showPreview && (
        <div className="rounded-2xl border border-blue-500/20 overflow-hidden">
          <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 text-xs font-black text-blue-400 uppercase tracking-widest">
            Live Preview — Enabled Snippets Only
          </div>
          <iframe ref={iframeRef} className="w-full h-64 bg-[#111]" sandbox="allow-scripts" title="custom-code-preview" />
        </div>
      )}

      {/* Edit / Add Form */}
      {showForm && (
        <div className="rounded-2xl border border-gold/20 bg-white/2 p-6 space-y-4">
          <h3 className="font-black text-white text-sm tracking-widest">{editing ? 'EDIT SNIPPET' : 'NEW SNIPPET'}</h3>
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5 text-gold/60">Name</label>
              <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Google Analytics"
                className="w-full px-3 py-2.5 bg-white/4 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5 text-gold/60">Type</label>
              <Combobox value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value as SnippetType }))}
                className="w-full px-3 py-2.5 bg-white/4 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40 transition-all">
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="js">JavaScript</option>
              </Combobox>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5 text-gold/60">Code</label>
            <textarea value={draft.code} onChange={e => setDraft(d => ({ ...d, code: e.target.value }))}
              rows={8} placeholder={draft.type === 'css' ? 'body { font-size: 16px; }' : draft.type === 'js' ? 'console.log("hello");' : '<div>Custom HTML</div>'}
              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-green-300 text-xs font-mono outline-none focus:border-gold/40 transition-all resize-y" />
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setDraft(d => ({ ...d, enabled: !d.enabled }))}
                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${draft.enabled ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${draft.enabled ? 'left-5' : 'left-0.5'}`} />
              </div>
              <span className="text-xs text-gray-400 font-bold">Enabled</span>
            </label>
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="px-4 py-2 rounded-xl text-xs font-black text-gray-400 border border-white/10 hover:border-white/25 transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={busy}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: saved ? '#10b981' : `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
                {busy ? 'Saving…' : saved ? '✓ Saved' : 'Save Snippet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snippet List */}
      {snippets.length === 0 ? (
        <div className="text-center py-16 border border-white/5 rounded-2xl bg-white/1">
          <div className="text-4xl mb-3">🧩</div>
          <p className="text-gray-500 text-sm">No custom snippets yet.</p>
          <button onClick={openNew} className="mt-4 px-5 py-2 rounded-xl text-xs font-black text-black uppercase tracking-widest"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
            Add Your First Snippet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {snippets.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border transition-all"
              style={{ background: s.enabled ? 'rgba(212,175,55,0.03)' : 'rgba(255,255,255,0.015)', borderColor: s.enabled ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)' }}>
              <button onClick={() => handleToggle(s.id)}
                className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-all duration-200 ${s.enabled ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${s.enabled ? 'left-5' : 'left-0.5'}`} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm truncate">{s.name}</span>
                  <TypeBadge type={s.type} />
                  {!s.enabled && <span className="text-[10px] text-gray-600 uppercase tracking-wider">DISABLED</span>}
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5 font-mono truncate">{s.code.slice(0, 80)}{s.code.length > 80 ? '…' : ''}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(s)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition-all">
                  Edit
                </button>
                <button onClick={() => handleDelete(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {backup && (
        <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 text-xs text-orange-400 flex items-center justify-between gap-4">
          <span>⚡ Auto-backup saved before last change.</span>
          <button onClick={handleRollback} className="px-3 py-1.5 rounded-lg font-black border border-orange-500/30 hover:bg-orange-500/10 transition-all uppercase tracking-widest">
            ↩ Rollback
          </button>
        </div>
      )}
    </div>
  );
}
