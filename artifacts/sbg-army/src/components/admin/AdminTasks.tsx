import { useState } from 'react';
import { getDB, saveDB, type Task } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';

const STATUS_COLORS: Record<string, string> = {
  todo: '#6b7280',
  in_progress: '#00d4ff',
  review: '#ffd700',
  done: '#10b981',
};

const PRIORITY_ICONS: Record<string, string> = {
  low: '🟢',
  medium: '🟡',
  high: '🟠',
  urgent: '🔴',
};

const EMPTY: Task = {
  id: '', title: '', description: '', projectId: '', status: 'todo',
  priority: 'medium', assignedTo: [], dueDate: '', tags: [], createdAt: Date.now(),
};

interface Props { onRefresh: () => void; }

export default function AdminTasks({ onRefresh }: Props) {
  const db = getDB();
  const tasks: Task[] = (db as any).tasks ?? [];
  const projects: { id: string; title: string }[] = (db as any).projects ?? [];

  const [editing, setEditing] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Task>(EMPTY);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const saveTasks = async (updated: Task[]) => {
    setSaving(true);
    setSaveError('');
    try {
      const newDb = { ...db, tasks: updated } as any;
      await saveDB(newDb, 'tasks');
      onRefresh();
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY);
    } catch (e: any) {
      console.error('Tasks save error:', e);
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        onRefresh();
        setShowForm(false);
        setEditing(null);
        setForm(EMPTY);
      } else {
        setSaveError(msg || 'Failed to save task. Please check connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    let updated: Task[];
    if (editing) {
      updated = tasks.map(t => t.id === editing.id ? { ...form, id: editing.id } : t);
    } else {
      updated = [...tasks, { ...form, id: `task_${Date.now()}`, createdAt: Date.now() }];
    }
    await saveTasks(updated);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await saveTasks(tasks.filter(t => t.id !== id));
  };

  const moveStatus = async (id: string, newStatus: Task['status']) => {
    await saveTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const startEdit = (task: Task) => {
    setEditing(task);
    setForm(task);
    setShowForm(true);
  };

  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  const columns: { id: Task['status']; label: string; icon: string }[] = [
    { id: 'todo', label: 'TO DO', icon: '📋' },
    { id: 'in_progress', label: 'IN PROGRESS', icon: '⚡' },
    { id: 'review', label: 'REVIEW', icon: '👁️' },
    { id: 'done', label: 'DONE', icon: '✅' },
  ];

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-black/40 border border-white/8 rounded-xl p-4 mb-3 hover:border-orange-500/25 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs">{PRIORITY_ICONS[task.priority]}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => startEdit(task)} className="text-xs p-1 text-gray-500 hover:text-orange-400">✏️</button>
          <button onClick={() => handleDelete(task.id)} className="text-xs p-1 text-gray-500 hover:text-red-400">🗑️</button>
        </div>
      </div>
      <div className="font-black text-sm text-white mb-1 leading-tight">{task.title}</div>
      {task.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {task.assignedTo && task.assignedTo.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-4 h-4 rounded-full bg-orange-500/30 flex items-center justify-center text-[9px] font-black text-orange-400">
              {(Array.isArray(task.assignedTo) ? task.assignedTo[0] : task.assignedTo as unknown as string).charAt(0).toUpperCase()}
            </span>
            {Array.isArray(task.assignedTo) ? task.assignedTo.join(', ') : task.assignedTo as unknown as string}
          </span>
        )}
        {task.dueDate && <span className="text-xs text-gray-600">📅 {task.dueDate}</span>}
      </div>
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 bg-white/5 text-gray-600 rounded text-xs">{tag}</span>
          ))}
        </div>
      )}
      <div className="flex gap-1 mt-3 flex-wrap">
        {columns.filter(c => c.id !== task.status).map(c => (
          <button key={c.id} onClick={() => moveStatus(task.id, c.id)}
            className="text-[10px] px-2 py-0.5 rounded bg-white/3 text-gray-600 hover:text-white hover:bg-white/10 transition-colors font-bold">
            → {c.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: stats.total, color: '#ff6b00' },
          { label: 'To Do', value: stats.todo, color: '#6b7280' },
          { label: 'In Progress', value: stats.inProgress, color: '#00d4ff' },
          { label: 'Done', value: stats.done, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-4 text-center">
            <div className="text-xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-600 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['board', 'list'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${viewMode === m ? 'bg-white/10 text-white' : 'bg-white/3 text-gray-500 hover:text-gray-300'}`}>
              {m === 'board' ? '⬛ BOARD' : '☰ LIST'}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }}
          className="px-4 py-2 bg-orange-500 text-black rounded-xl text-xs font-black uppercase hover:bg-orange-400 transition-colors">
          + ADD TASK
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="font-black text-white">{editing ? 'Edit Task' : 'New Task'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Task Title *</label>
              <input className="inp" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task name..." />
            </div>
            <div>
              <label className="label">Status</label>
              <Combobox className="inp" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Task['status'] })}>
                {columns.map(c => <option key={c.id} value={c.id} className="bg-black">{c.label}</option>)}
              </Combobox>
            </div>
            <div>
              <label className="label">Priority</label>
              <Combobox className="inp" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Task['priority'] })}>
                {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p} className="bg-black">{p.toUpperCase()}</option>)}
              </Combobox>
            </div>
            {projects.length > 0 && (
              <div>
                <label className="label">Project</label>
                <Combobox className="inp" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
                  <option value="" className="bg-black">None</option>
                  {projects.map(p => <option key={p.id} value={p.id} className="bg-black">{p.title}</option>)}
                </Combobox>
              </div>
            )}
            <div>
              <label className="label">Assigned To</label>
              <input className="inp" value={Array.isArray(form.assignedTo) ? form.assignedTo.join(', ') : ''} onChange={e => setForm({ ...form, assignedTo: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Member names (comma-separated)..." />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="inp" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="inp" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task description..." />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tags (comma-separated)</label>
              <input className="inp" value={form.tags.join(', ')} onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="bug, feature, ui..." />
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
              {saving ? '⏳ SAVING...' : editing ? 'SAVE' : 'ADD TASK'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }}
              className="px-5 py-2 bg-white/5 text-gray-400 rounded-xl text-xs font-black uppercase hover:text-white transition-colors">
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span>{col.icon}</span>
                    <span className="text-xs font-black tracking-widest uppercase" style={{ color: STATUS_COLORS[col.id] }}>{col.label}</span>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-white/5 text-center text-xs font-black text-gray-500 flex items-center justify-center">
                    {colTasks.length}
                  </span>
                </div>
                <div>
                  {colTasks.map(task => <TaskCard key={task.id} task={task} />)}
                  {colTasks.length === 0 && <div className="text-center py-6 text-gray-700 text-xs">Empty</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <div className="text-4xl mb-3">✅</div>
              <p>No tasks found.</p>
            </div>
          )}
          {filtered.map(task => (
            <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 hover:bg-white/3 transition-colors group">
              <span className="text-sm">{PRIORITY_ICONS[task.priority]}</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm text-white">{task.title}</div>
                {task.description && <div className="text-xs text-gray-600 truncate">{task.description}</div>}
              </div>
              {task.assignedTo && <span className="text-xs text-gray-600 hidden sm:block">{task.assignedTo}</span>}
              {task.dueDate && <span className="text-xs text-gray-600 hidden md:block">{task.dueDate}</span>}
              <span className="px-2 py-1 rounded-lg text-xs font-black whitespace-nowrap"
                style={{ background: `${STATUS_COLORS[task.status]}22`, color: STATUS_COLORS[task.status] }}>
                {task.status.replace('_', ' ').toUpperCase()}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => startEdit(task)} className="text-xs p-1 text-gray-500 hover:text-orange-400">✏️</button>
                <button onClick={() => handleDelete(task.id)} className="text-xs p-1 text-gray-500 hover:text-red-400">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
