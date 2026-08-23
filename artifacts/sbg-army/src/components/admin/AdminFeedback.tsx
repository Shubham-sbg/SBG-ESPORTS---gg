import { useState, useMemo } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { FeedbackReport } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';

interface Props { onRefresh: () => void; }

const GOLD = '#d4af37';
const GOLD_DARK = '#b8960c';

type StatusTab = 'all' | FeedbackReport['status'];

const CATEGORY_ICONS: Record<FeedbackReport['category'], string> = {
  'Bug Report':          '🐛',
  'UI Problem':          '🎨',
  'Feature Request':     '✨',
  'Performance Issue':   '⚡',
  'Security Report':     '🔒',
  'Tournament Feedback': '🏆',
  'General Feedback':    '💬',
};

const PRIORITY_COLORS: Record<FeedbackReport['priority'], string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#6b7280',
};

const STATUS_COLORS: Record<FeedbackReport['status'], string> = {
  open:        '#ef4444',
  in_progress: '#3b82f6',
  resolved:    '#10b981',
  closed:      '#6b7280',
};

const STATUS_LABELS: Record<FeedbackReport['status'], string> = {
  open:        'Open',
  in_progress: 'In Progress',
  resolved:    'Resolved',
  closed:      'Closed',
};

const ALL_STATUSES: FeedbackReport['status'][] = ['open', 'in_progress', 'resolved', 'closed'];
const ALL_CATEGORIES: FeedbackReport['category'][] = [
  'Bug Report','UI Problem','Feature Request','Performance Issue',
  'Security Report','Tournament Feedback','General Feedback',
];
const ALL_PRIORITIES: FeedbackReport['priority'][] = ['low','medium','high','critical'];

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function exportCSV(reports: FeedbackReport[]) {
  const header = ['id','category','priority','status','title','name','email','device','browser','date'];
  const rows = reports.map(r => [
    r.id, r.category, r.priority, r.status,
    `"${(r.title || '').replace(/"/g, '""')}"`,
    `"${(r.name || '').replace(/"/g, '""')}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    `"${(r.device || '').replace(/"/g, '""')}"`,
    `"${(r.browser || '').replace(/"/g, '""')}"`,
    fmtDate(r.createdAt),
  ].join(','));
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `feedback_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '8px 14px',
  color: '#fff',
  fontSize: 13,
  width: '100%',
  outline: 'none',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  resize: 'none',
  minHeight: 80,
};

export default function AdminFeedback({ onRefresh }: Props) {
  const [selected, setSelected]         = useState<FeedbackReport | null>(null);
  const [activeTab, setActiveTab]       = useState<StatusTab>('all');
  const [search, setSearch]             = useState('');
  const [filterCat, setFilterCat]       = useState<FeedbackReport['category'] | ''>('');
  const [filterPri, setFilterPri]       = useState<FeedbackReport['priority'] | ''>('');

  // Detail panel state
  const [detailStatus, setDetailStatus]   = useState<FeedbackReport['status']>('open');
  const [detailAssign, setDetailAssign]   = useState('');
  const [detailNote, setDetailNote]       = useState('');
  const [replyText, setReplyText]         = useState('');
  const [internalText, setInternalText]   = useState('');
  const [saving, setSaving]               = useState(false);

  const db       = getDB();
  const allReports: FeedbackReport[] = [...(db.feedback || [])].sort((a, b) => b.createdAt - a.createdAt);

  // Stats
  const total      = allReports.length;
  const openCount  = allReports.filter(r => r.status === 'open').length;
  const ipCount    = allReports.filter(r => r.status === 'in_progress').length;
  const resCount   = allReports.filter(r => r.status === 'resolved').length;
  const critCount  = allReports.filter(r => r.priority === 'critical').length;

  const tabCounts: Record<StatusTab, number> = {
    all:         total,
    open:        openCount,
    in_progress: ipCount,
    resolved:    resCount,
    closed:      allReports.filter(r => r.status === 'closed').length,
  };

  const filtered = useMemo(() => {
    let list = allReports;
    if (activeTab !== 'all') list = list.filter(r => r.status === activeTab);
    if (filterCat) list = list.filter(r => r.category === filterCat);
    if (filterPri) list = list.filter(r => r.priority === filterPri);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.name  || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allReports, activeTab, filterCat, filterPri, search]);

  function openDetail(r: FeedbackReport) {
    setSelected(r);
    setDetailStatus(r.status);
    setDetailAssign(r.assignedTo || '');
    setDetailNote(r.adminNote || '');
    setReplyText('');
    setInternalText('');
  }

  function saveField(patch: Partial<FeedbackReport>) {
    setSaving(true);
    const current = getDB();
    current.feedback = (current.feedback || []).map(r =>
      r.id === selected!.id ? { ...r, ...patch, updatedAt: Date.now() } : r
    );
    saveDB(current);
    const updated = current.feedback.find(r => r.id === selected!.id) || null;
    setSelected(updated);
    onRefresh();
    setSaving(false);
  }

  function markRead() {
    saveField({ read: true });
  }

  function sendReply() {
    if (!replyText.trim() || !selected) return;
    const entry = { text: replyText.trim(), by: 'Admin', at: Date.now(), isAdmin: true };
    saveField({ replies: [...(selected.replies || []), entry] });
    setReplyText('');
  }

  function addInternalNote() {
    if (!internalText.trim() || !selected) return;
    const entry = { text: internalText.trim(), by: 'Admin', at: Date.now() };
    saveField({ internalNotes: [...(selected.internalNotes || []), entry] });
    setInternalText('');
  }

  function deleteReport(id: string) {
    if (!confirm('Delete this feedback report? This cannot be undone.')) return;
    const current = getDB();
    current.feedback = (current.feedback || []).filter(r => r.id !== id);
    saveDB(current);
    if (selected?.id === id) setSelected(null);
    onRefresh();
  }

  // ── DETAIL PANEL ──────────────────────────────────────────────────────────
  if (selected) {
    const cat = selected;
    return (
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setSelected(null)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-300 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >← Back</button>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-lg text-white truncate">{cat.title}</h2>
            <p className="text-xs text-gray-500">{cat.id}</p>
          </div>
          {!cat.read && (
            <button onClick={markRead}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}
            >Mark as Read</button>
          )}
        </div>

        {/* Meta card */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-wrap gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: PRIORITY_COLORS[cat.priority] + '22', color: PRIORITY_COLORS[cat.priority] }}>
              {cat.priority.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: STATUS_COLORS[cat.status] + '22', color: STATUS_COLORS[cat.status] }}>
              {STATUS_LABELS[cat.status]}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-gray-300"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              {CATEGORY_ICONS[cat.category]} {cat.category}
            </span>
            {!cat.read && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>● Unread</span>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Description</p>
            <p className="text-sm text-gray-200 whitespace-pre-wrap">{cat.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {cat.name     && <div><p className="text-xs text-gray-500">Name</p>   <p className="text-white">{cat.name}</p></div>}
            {cat.email    && <div><p className="text-xs text-gray-500">Email</p>  <p className="text-white break-all">{cat.email}</p></div>}
            {cat.username && <div><p className="text-xs text-gray-500">Username</p><p className="text-white">{cat.username}</p></div>}
            {cat.discord  && <div><p className="text-xs text-gray-500">Discord</p><p className="text-white">{cat.discord}</p></div>}
            {cat.device   && <div><p className="text-xs text-gray-500">Device</p> <p className="text-white">{cat.device}</p></div>}
            {cat.browser  && <div><p className="text-xs text-gray-500">Browser</p><p className="text-white">{cat.browser}</p></div>}
            <div><p className="text-xs text-gray-500">Date</p><p className="text-white">{fmtDate(cat.createdAt)}</p></div>
          </div>

          {cat.screenshotUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Screenshot</p>
              <a href={cat.screenshotUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm underline break-all" style={{ color: GOLD }}>{cat.screenshotUrl}</a>
            </div>
          )}
        </div>

        {/* Admin controls */}
        <div className="rounded-2xl p-5 space-y-5" style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Admin Controls</h3>

          {/* Status */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_STATUSES.map(s => (
                <button key={s} type="button"
                  onClick={() => { setDetailStatus(s); saveField({ status: s }); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: detailStatus === s ? STATUS_COLORS[s] + '33' : 'rgba(255,255,255,0.05)',
                    color:      detailStatus === s ? STATUS_COLORS[s] : '#9ca3af',
                    border:     `1px solid ${detailStatus === s ? STATUS_COLORS[s] + '60' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >{STATUS_LABELS[s]}</button>
              ))}
            </div>
          </div>

          {/* Assign to */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1.5">Assign To</label>
            <div className="flex gap-2">
              <input type="text" value={detailAssign} onChange={e => setDetailAssign(e.target.value)}
                placeholder="Staff member name or handle"
                style={{ ...INPUT_STYLE, flex: 1 }} />
              <button onClick={() => saveField({ assignedTo: detailAssign })} disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: '#000' }}>
                Save
              </button>
            </div>
          </div>

          {/* Admin Note */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1.5">Admin Note</label>
            <textarea rows={3} value={detailNote} onChange={e => setDetailNote(e.target.value)}
              placeholder="Internal note about this report…"
              style={TEXTAREA_STYLE} />
            <button onClick={() => saveField({ adminNote: detailNote })} disabled={saving}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: '#000' }}>
              Save Note
            </button>
          </div>
        </div>

        {/* Replies */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Replies</h3>
          {(cat.replies || []).length === 0 ? (
            <p className="text-xs text-gray-600">No replies yet.</p>
          ) : (
            <div className="space-y-2">
              {(cat.replies || []).map((r, i) => (
                <div key={i}
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: r.isAdmin ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${r.isAdmin ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    marginLeft: r.isAdmin ? 'auto' : 0,
                    maxWidth: '90%',
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold" style={{ color: r.isAdmin ? GOLD : '#9ca3af' }}>{r.by}</span>
                    <span className="text-xs text-gray-600">{fmtDate(r.at)}</span>
                  </div>
                  <p className="text-sm text-gray-200">{r.text}</p>
                </div>
              ))}
            </div>
          )}
          <div>
            <textarea rows={3} value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              style={TEXTAREA_STYLE} />
            <button onClick={sendReply} disabled={!replyText.trim()}
              className="mt-2 px-5 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: '#000' }}>
              Send Reply
            </button>
          </div>
        </div>

        {/* Internal Notes */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Internal Notes</h3>
          {(cat.internalNotes || []).length === 0 ? (
            <p className="text-xs text-gray-600">No internal notes.</p>
          ) : (
            <div className="space-y-2">
              {(cat.internalNotes || []).map((n, i) => (
                <div key={i} className="rounded-xl px-4 py-3"
                  style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-blue-400">{n.by}</span>
                    <span className="text-xs text-gray-600">{fmtDate(n.at)}</span>
                  </div>
                  <p className="text-sm text-gray-200">{n.text}</p>
                </div>
              ))}
            </div>
          )}
          <div>
            <textarea rows={3} value={internalText} onChange={e => setInternalText(e.target.value)}
              placeholder="Add an internal note (not visible to submitter)…"
              style={TEXTAREA_STYLE} />
            <button onClick={addInternalNote} disabled={!internalText.trim()}
              className="mt-2 px-5 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
              Add Note
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-xl text-white">Feedback & Reports</h2>
          <p className="text-xs text-gray-500 mt-0.5">{total} total submissions</p>
        </div>
        <button onClick={() => exportCSV(allReports)}
          className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-opacity hover:opacity-90"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db' }}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',       value: total,     color: GOLD },
          { label: 'Open',        value: openCount, color: '#ef4444' },
          { label: 'In Progress', value: ipCount,   color: '#3b82f6' },
          { label: 'Resolved',    value: resCount,  color: '#10b981' },
          { label: 'Critical',    value: critCount, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center"
            style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'open', 'in_progress', 'resolved', 'closed'] as StatusTab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: activeTab === tab ? `${GOLD}22` : 'rgba(255,255,255,0.04)',
              color:      activeTab === tab ? GOLD : '#9ca3af',
              border:     `1px solid ${activeTab === tab ? GOLD + '50' : 'rgba(255,255,255,0.06)'}`,
            }}>
            {tab === 'all' ? 'All' : STATUS_LABELS[tab as FeedbackReport['status']]} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search title, name, email…"
          style={{ ...INPUT_STYLE, flex: '1 1 200px', minWidth: 160 }} />
        <Combobox value={filterCat} onChange={e => setFilterCat(e.target.value as FeedbackReport['category'] | '')}
          style={{ ...INPUT_STYLE, width: 'auto', minWidth: 160, flex: '0 0 auto' }}>
          <option value="">All Categories</option>
          {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
        </Combobox>
        <Combobox value={filterPri} onChange={e => setFilterPri(e.target.value as FeedbackReport['priority'] | '')}
          style={{ ...INPUT_STYLE, width: 'auto', minWidth: 130, flex: '0 0 auto' }}>
          <option value="">All Priorities</option>
          {ALL_PRIORITIES.map(p => <option key={p} value={p} style={{ color: PRIORITY_COLORS[p] }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </Combobox>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl" style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400 font-bold">No reports found</p>
          <p className="text-gray-600 text-sm mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id}
              className="rounded-2xl p-4 flex items-center gap-4 transition-all"
              style={{
                background: '#111114',
                border: `1px solid ${r.read ? 'rgba(255,255,255,0.06)' : 'rgba(249,115,22,0.2)'}`,
              }}>

              {/* Priority badge */}
              <div className="flex-shrink-0 w-16 text-center">
                <span className="inline-block px-2 py-1 rounded-lg text-xs font-black uppercase"
                  style={{ background: PRIORITY_COLORS[r.priority] + '22', color: PRIORITY_COLORS[r.priority] }}>
                  {r.priority}
                </span>
              </div>

              {/* Category icon */}
              <div className="flex-shrink-0 text-xl">{CATEGORY_ICONS[r.category]}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {!r.read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#f97316' }} title="Unread" />}
                  <p className="font-bold text-white text-sm truncate">{r.title}</p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {r.category}
                  {r.name  ? ` · ${r.name}`  : ''}
                  {r.email ? ` · ${r.email}` : ''}
                </p>
              </div>

              {/* Date */}
              <div className="flex-shrink-0 text-xs text-gray-500 hidden sm:block">{fmtDate(r.createdAt)}</div>

              {/* Status badge */}
              <div className="flex-shrink-0">
                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{ background: STATUS_COLORS[r.status] + '22', color: STATUS_COLORS[r.status] }}>
                  {STATUS_LABELS[r.status]}
                </span>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex gap-2">
                <button onClick={() => openDetail(r)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-80"
                  style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: '#000' }}>
                  View
                </button>
                <button onClick={() => deleteReport(r.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
