import { useState } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { StaffAccount } from '@/lib/database';
import { STAFF_ASSIGNABLE_MODULES } from '@/lib/auth';
import { MODULE_LABELS, MODULE_ICONS, ROLE_COLORS, ROLE_LABELS } from '@/lib/roles';
import type { AdminModule } from '@/lib/auth';
import MediaUpload from '@/components/shared/MediaUpload';

const GOLD = '#d4af37';

const ROLE_OPTIONS = [
  { value: 'admin' as const, label: 'ADMIN', desc: 'All operational modules — roster, matches, news, etc.' },
  { value: 'staff' as const, label: 'STAFF', desc: 'Custom module access only — you choose what they can see' },
];

function generateId() {
  return 'staff_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

const EMPTY_FORM = {
  name: '', email: '', password: '', role: 'staff' as 'admin' | 'staff',
  allowedModules: [] as AdminModule[], active: true, photo: '',
};

function Avatar({ acc }: { acc: StaffAccount }) {
  const role = acc.role;
  const color = ROLE_COLORS[role] ?? '#666';
  if ((acc as any).photo) {
    return (
      <img
        src={(acc as any).photo}
        alt={acc.name}
        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
        style={{ border: `2px solid ${color}40` }}
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-black"
      style={{ background: `${color}18`, border: `2px solid ${color}35`, color }}>
      {acc.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AdminStaffManager({ onRefresh }: { onRefresh: () => void }) {
  const db = getDB();
  const accounts: StaffAccount[] = db.staffAccounts ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'staff'>('all');
  const [searchQ, setSearchQ] = useState('');

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setMsg('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (acc: StaffAccount) => {
    setEditId(acc.id);
    setForm({
      name: acc.name, email: acc.email, password: acc.password,
      role: acc.role, allowedModules: acc.allowedModules as AdminModule[],
      active: acc.active, photo: (acc as any).photo ?? '',
    });
    setMsg('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleModule = (mod: AdminModule) => {
    setForm(f => ({
      ...f,
      allowedModules: f.allowedModules.includes(mod)
        ? f.allowedModules.filter(m => m !== mod)
        : [...f.allowedModules, mod],
    }));
  };

  const selectAllModules = () => setForm(f => ({ ...f, allowedModules: [...STAFF_ASSIGNABLE_MODULES] }));
  const clearModules = () => setForm(f => ({ ...f, allowedModules: [] }));

  const getAdminToken = () => {
    try { return '' ?? ''; } catch { return ''; }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setMsg('Name and email are required.'); return;
    }
    if (!editId && !form.password.trim()) {
      setMsg('Password is required for new accounts.'); return;
    }
    setSaving(true);
    setSaveState('saving');
    try {
      const token = getAdminToken();
      // Use the dedicated /api/admin/staff endpoint so passwords are bcrypt-hashed server-side.
      // Never store plain-text passwords through the regular DB save path.
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        role: form.role,
        allowedModules: form.allowedModules,
        active: form.active,
        ...(form.photo ? { photo: form.photo } : {}),
      };
      if (form.password.trim()) payload.password = form.password.trim();
      if (editId) payload.id = editId;

      const res = await fetch((import.meta.env.VITE_API_URL || "") + '/api/admin/staff', { credentials: "include",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!data.success) {
        setSaveState('error');
        setMsg(data.error ?? 'Save failed.');
        return;
      }
      onRefresh();
      setSaveState('saved');
      setMsg(editId ? 'Account updated.' : 'Account created.');
      setTimeout(() => { setSaveState('idle'); setShowForm(false); }, 1000);
    } catch {
      setSaveState('error');
      setMsg('Save failed — check your connection or re-login.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = getAdminToken();
    try {
      await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/staff/${id}`, { credentials: "include",
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch {
      // If the API call fails, fall back to local delete
      const db2 = getDB();
      db2.staffAccounts = (db2.staffAccounts ?? []).filter(a => a.id !== id);
      await saveDB(db2);
    }
    onRefresh();
    setDeleteId(null);
  };

  const toggleActive = async (id: string) => {
    const db2 = getDB();
    const arr = db2.staffAccounts ?? [];
    const idx = arr.findIndex(a => a.id === id);
    if (idx >= 0) arr[idx].active = !arr[idx].active;
    db2.staffAccounts = arr;
    await saveDB(db2);
    onRefresh();
  };

  const filtered = accounts.filter(a => {
    if (filterRole !== 'all' && a.role !== filterRole) return false;
    if (searchQ && !a.name.toLowerCase().includes(searchQ.toLowerCase()) && !a.email.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const activeCount = accounts.filter(a => a.active).length;
  const adminCount  = accounts.filter(a => a.role === 'admin').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-widest">👔 STAFF MANAGER</h2>
          <p className="text-xs text-gray-500 mt-1">
            {accounts.length} accounts · {activeCount} active · {adminCount} admins
          </p>
        </div>
        <button onClick={openCreate}
          className="px-5 py-2.5 rounded-xl text-sm font-black tracking-widest uppercase text-black transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)`, boxShadow: `0 0 20px ${GOLD}30` }}>
          + ADD STAFF
        </button>
      </div>

      {/* Info banner */}
      <div className="px-4 py-3 rounded-xl text-xs font-semibold text-yellow-200/70"
        style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
        <span className="font-black text-yellow-400">OWNER</span> accounts (full access) are managed securely via the server config.
        Staff &amp; Admin accounts below log in via <strong>/staff → /staff-dashboard</strong>.
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${GOLD}30` }}>
          {/* Form header */}
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${GOLD}12, transparent)`, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="font-black text-white text-sm tracking-widest">
              {editId ? '✏️ EDIT STAFF ACCOUNT' : '+ CREATE NEW ACCOUNT'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
          </div>

          <div className="p-6 space-y-6">
            {/* Photo + basic info */}
            <div className="flex flex-col sm:flex-row gap-6">
              <MediaUpload
                value={form.photo}
                onChange={url => setForm(f => ({ ...f, photo: url }))}
                label="Profile Photo"
                size="lg"
                shape="circle"
                showBgRemove
                useServerUpload
                hint="Optional — team member's photo"
              />
              <div className="flex-1 space-y-3">
                <Field label="Full Name *">
                  <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Staff Member Name" />
                </Field>
                <Field label="Email Address *">
                  <Input type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="staff@example.com" />
                </Field>
                <Field label={editId ? 'Password (leave blank to keep current)' : 'Password *'}>
                  <Input type="text" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="Set a strong password" />
                </Field>
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Role</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {ROLE_OPTIONS.map(r => {
                  const selected = form.role === r.value;
                  const color = ROLE_COLORS[r.value];
                  return (
                    <button key={r.value} onClick={() => setForm(f => ({ ...f, role: r.value }))}
                      className="p-4 rounded-xl text-left transition-all border group"
                      style={{
                        background: selected ? `${color}12` : 'rgba(255,255,255,0.02)',
                        borderColor: selected ? `${color}50` : 'rgba(255,255,255,0.08)',
                      }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: selected ? color : '#444' }} />
                        <span className="font-black text-sm" style={{ color: selected ? color : 'rgba(255,255,255,0.5)' }}>{r.label}</span>
                      </div>
                      <p className="text-[11px] text-gray-500">{r.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Module permissions for STAFF role */}
            {form.role === 'staff' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    Module Access ({form.allowedModules.length}/{STAFF_ASSIGNABLE_MODULES.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button onClick={selectAllModules} className="text-[11px] px-2.5 py-1 rounded-lg font-bold text-green-400 border border-green-400/20 hover:bg-green-400/10 transition-all">All ON</button>
                    <button onClick={clearModules} className="text-[11px] px-2.5 py-1 rounded-lg font-bold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STAFF_ASSIGNABLE_MODULES.map(mod => {
                    const selected = form.allowedModules.includes(mod);
                    return (
                      <button key={mod} onClick={() => toggleModule(mod)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left"
                        style={{
                          background: selected ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.02)',
                          borderColor: selected ? 'rgba(255,107,0,0.4)' : 'rgba(255,255,255,0.07)',
                          color: selected ? '#ff8c40' : 'rgba(255,255,255,0.4)',
                        }}>
                        <span>{MODULE_ICONS[mod]}</span>
                        <span className="truncate">{MODULE_LABELS[mod]}</span>
                      </button>
                    );
                  })}
                </div>
                {form.allowedModules.length === 0 && (
                  <p className="text-[11px] text-yellow-400/60 flex items-center gap-1">
                    ⚠ No modules selected — staff will see an empty dashboard
                  </p>
                )}
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Account Status</label>
              <button
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest border"
                style={{
                  background: form.active ? 'rgba(16,185,129,0.1)' : 'rgba(233,69,96,0.1)',
                  borderColor: form.active ? 'rgba(16,185,129,0.3)' : 'rgba(233,69,96,0.3)',
                  color: form.active ? '#10b981' : '#e94560',
                }}>
                {form.active ? '● ACTIVE' : '○ DISABLED'}
              </button>
            </div>

            {/* Error */}
            {msg && <p className="text-sm font-bold" style={{ color: saveState === 'error' ? '#e94560' : '#10b981' }}>{msg}</p>}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: saveState === 'saved' ? '#10b981' : saveState === 'error' ? '#e94560' : `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
                {saving && <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                {saving ? 'SAVING…' : saveState === 'saved' ? '✓ SAVED!' : editId ? 'UPDATE ACCOUNT' : 'CREATE ACCOUNT'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl font-bold text-sm text-gray-400 border border-white/10 hover:border-white/20 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search */}
      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search staff…"
            className="flex-1 min-w-[160px] px-4 py-2 rounded-xl bg-white/4 border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40"
          />
          <div className="flex gap-1">
            {(['all', 'admin', 'staff'] as const).map(r => (
              <button key={r} onClick={() => setFilterRole(r)}
                className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                style={filterRole === r
                  ? { background: GOLD, color: '#000' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {r === 'all' ? `ALL (${accounts.length})` : `${r.toUpperCase()} (${accounts.filter(a => a.role === r).length})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Account cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600 space-y-3">
          <div className="text-5xl">👔</div>
          <p className="font-bold">{searchQ ? 'No results found' : 'No staff accounts yet'}</p>
          <p className="text-sm">{searchQ ? 'Try a different search' : 'Create your first staff account above'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(acc => {
            const color = ROLE_COLORS[acc.role] ?? '#666';
            return (
              <div key={acc.id}
                className="p-5 rounded-2xl transition-all group"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: `1px solid rgba(255,255,255,0.07)`,
                }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left: Avatar + info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <Avatar acc={acc} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-white text-base">{acc.name}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-widest"
                          style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}>
                          {ROLE_LABELS[acc.role]}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase"
                          style={{
                            background: acc.active ? 'rgba(16,185,129,0.1)' : 'rgba(233,69,96,0.1)',
                            color: acc.active ? '#10b981' : '#e94560',
                            border: `1px solid ${acc.active ? 'rgba(16,185,129,0.3)' : 'rgba(233,69,96,0.3)'}`,
                          }}>
                          {acc.active ? '● ACTIVE' : '○ DISABLED'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{acc.email}</p>
                      {acc.role === 'staff' && acc.allowedModules.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {(acc.allowedModules as AdminModule[]).map(mod => (
                            <span key={mod} className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                              style={{ background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.25)', color: 'rgba(255,140,64,0.9)' }}>
                              {MODULE_ICONS[mod]} {MODULE_LABELS[mod]}
                            </span>
                          ))}
                        </div>
                      )}
                      {acc.role === 'admin' && (
                        <p className="text-[11px] text-orange-400/60">All operational modules enabled</p>
                      )}
                      {(acc as any).createdAt && (
                        <p className="text-[10px] text-gray-600 mt-1">
                          Created {new Date((acc as any).createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(acc.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all hover:scale-105"
                      style={acc.active
                        ? { color: '#e94560', borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)' }
                        : { color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }
                      }>
                      {acc.active ? 'DISABLE' : 'ENABLE'}
                    </button>
                    <button onClick={() => openEdit(acc)}
                      className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all hover:scale-105"
                      style={{ color: GOLD, borderColor: `${GOLD}35`, background: `${GOLD}08` }}>
                      EDIT
                    </button>
                    {deleteId === acc.id ? (
                      <>
                        <button onClick={() => handleDelete(acc.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-red-500 text-white transition-all hover:scale-105">
                          CONFIRM DELETE
                        </button>
                        <button onClick={() => setDeleteId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 border border-white/10 transition-all">
                          CANCEL
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteId(acc.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all hover:scale-105"
                        style={{ color: '#e94560', borderColor: 'rgba(233,69,96,0.25)', background: 'rgba(233,69,96,0.06)' }}>
                        DELETE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40 transition-colors" />
  );
}
