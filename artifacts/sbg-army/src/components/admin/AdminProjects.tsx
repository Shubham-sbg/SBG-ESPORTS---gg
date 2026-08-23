import { useState } from 'react';
import { getDB, saveDB, type Project } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';

const STATUS_COLORS: Record<string, string> = {
  planning: '#00d4ff',
  active: '#10b981',
  review: '#ffd700',
  completed: '#a855f7',
  on_hold: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#ffd700',
  high: '#ff6b00',
  urgent: '#e94560',
};

const EMPTY: Project = {
  id: '', title: '', description: '', status: 'planning', priority: 'medium',
  assignedTo: [], startDate: '', deadline: '', progress: 0, tags: [], createdAt: Date.now(),
};

interface Props { onRefresh: () => void; }

export default function AdminProjects({ onRefresh }: Props) {
  const db = getDB();
  const projects: Project[] = (db as any).projects ?? [];

  const [editing, setEditing] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Project>(EMPTY);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const saveProjects = async (updated: Project[]) => {
    setSaving(true);
    setSaveError('');
    try {
      const newDb = { ...db, projects: updated } as any;
      await saveDB(newDb, 'projects');
      onRefresh();
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY);
    } catch (e: any) {
      console.error('Projects save error:', e);
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        onRefresh();
        setShowForm(false);
        setEditing(null);
        setForm(EMPTY);
      } else {
        setSaveError(msg || 'Failed to save project. Please check connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    let updated: Project[];
    if (editing) {
      updated = projects.map(p => p.id === editing.id ? { ...form, id: editing.id } : p);
    } else {
      updated = [...projects, { ...form, id: `proj_${Date.now()}`, createdAt: Date.now() }];
    }
    await saveProjects(updated);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await saveProjects(projects.filter(p => p.id !== id));
  };

  const startEdit = (proj: Project) => {
    setEditing(proj);
    setForm(proj);
    setShowForm(true);
  };

  const filtered = projects
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => filterPriority === 'all' || p.priority === filterPriority);

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    urgent: projects.filter(p => p.priority === 'urgent').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: stats.total, color: '#ff6b00', icon: '📋' },
          { label: 'Active', value: stats.active, color: '#10b981', icon: '⚡' },
          { label: 'Completed', value: stats.completed, color: '#a855f7', icon: '✅' },
          { label: 'Urgent', value: stats.urgent, color: '#e94560', icon: '🚨' },
        ].map(s => (
          <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span>{s.icon}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">{s.label}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'planning', 'active', 'review', 'completed', 'on_hold'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${filterStatus === s ? 'text-black bg-orange-500' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
              {s === 'all' ? 'ALL' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }}
          className="px-4 py-2 bg-orange-500 text-black rounded-xl text-xs font-black uppercase hover:bg-orange-400 transition-colors">
          + NEW PROJECT
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="font-black text-white">{editing ? 'Edit Project' : 'New Project'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Project Title *</label>
              <input className="inp" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Project name..." />
            </div>
            <div>
              <label className="label">Status</label>
              <Combobox className="inp" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Project['status'] })}>
                {['planning', 'active', 'review', 'completed', 'on_hold'].map(s => (
                  <option key={s} value={s} className="bg-black">{s.replace('_', ' ').toUpperCase()}</option>
                ))}
              </Combobox>
            </div>
            <div>
              <label className="label">Priority</label>
              <Combobox className="inp" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Project['priority'] })}>
                {['low', 'medium', 'high', 'urgent'].map(p => (
                  <option key={p} value={p} className="bg-black">{p.toUpperCase()}</option>
                ))}
              </Combobox>
            </div>
            <div>
              <label className="label">Progress ({form.progress}%)</label>
              <input type="range" min="0" max="100" value={form.progress}
                onChange={e => setForm({ ...form, progress: Number(e.target.value) })}
                className="w-full accent-orange-500" />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="inp" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Deadline</label>
              <input type="date" className="inp" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="inp" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Project description..." />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Assigned To (comma-separated)</label>
              <input className="inp" value={form.assignedTo.join(', ')} onChange={e => setForm({ ...form, assignedTo: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Member1, Member2..." />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tags (comma-separated)</label>
              <input className="inp" value={form.tags.join(', ')} onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="design, backend, urgent..." />
            </div>
          </div>
          {saveError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              ⚠️ {saveError}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={saving || !form.title.trim()}
              className="px-5 py-2 bg-orange-500 text-black rounded-xl text-xs font-black uppercase hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? '⏳ SAVING...' : editing ? 'SAVE CHANGES' : 'CREATE PROJECT'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }}
              className="px-5 py-2 bg-white/5 text-gray-400 rounded-xl text-xs font-black uppercase hover:text-white transition-colors">
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Project Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map(proj => (
          <div key={proj.id} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all group">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-black text-white text-base leading-tight mb-1">{proj.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-black"
                    style={{ background: `${STATUS_COLORS[proj.status] ?? '#666'}22`, color: STATUS_COLORS[proj.status] ?? '#666' }}>
                    {proj.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-black"
                    style={{ background: `${PRIORITY_COLORS[proj.priority] ?? '#666'}22`, color: PRIORITY_COLORS[proj.priority] ?? '#666' }}>
                    {proj.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(proj)} className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-orange-400 transition-colors text-xs">✏️</button>
                <button onClick={() => handleDelete(proj.id)} className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-red-400 transition-colors text-xs">🗑️</button>
              </div>
            </div>

            {proj.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{proj.description}</p>}

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span className="font-black text-white">{proj.progress}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${proj.progress}%`, background: proj.progress === 100 ? '#10b981' : 'linear-gradient(90deg, #ff6b00, #e94560)' }} />
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              {proj.deadline && <span>📅 Due: {proj.deadline}</span>}
              {proj.assignedTo.length > 0 && <span>👥 {proj.assignedTo.slice(0, 2).join(', ')}{proj.assignedTo.length > 2 ? ` +${proj.assignedTo.length - 2}` : ''}</span>}
            </div>

            {proj.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {proj.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-white/5 text-gray-500 rounded-lg text-xs">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-600">
            <div className="text-4xl mb-3">📋</div>
            <p>No projects found. Create your first project!</p>
          </div>
        )}
      </div>
    </div>
  );
}
