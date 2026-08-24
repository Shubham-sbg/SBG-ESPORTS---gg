import { useState, useEffect } from 'react';
import type { RecruitmentApplication, RecruitmentOpening, RecruitmentCustomQuestion, RecruitmentFormFieldConfig } from '@/lib/database';
import PlayerMatchIndicator from '@/components/PlayerMatchIndicator';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';
import { apiUrl } from '@/lib/api';

const GOLD = '#d4af37';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  new:         { label: 'New',         bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  reviewing:   { label: 'Reviewing',   bg: 'rgba(234,179,8,0.15)',   text: '#eab308', border: 'rgba(234,179,8,0.3)' },
  shortlisted: { label: 'Shortlisted', bg: 'rgba(168,85,247,0.15)', text: '#c084fc', border: 'rgba(168,85,247,0.3)' },
  interview:   { label: 'Interview',   bg: 'rgba(236,72,153,0.15)',  text: '#f472b6', border: 'rgba(236,72,153,0.3)' },
  selected:    { label: 'Selected',    bg: 'rgba(16,185,129,0.15)',  text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  signed:      { label: 'Hired/Signed',bg: 'rgba(212,175,55,0.2)',   text: '#d4af37', border: 'rgba(212,175,55,0.5)' },
  rejected:    { label: 'Rejected',    bg: 'rgba(239,68,68,0.15)',   text: '#f87171', border: 'rgba(239,68,68,0.3)' },
  archived:    { label: 'Archived',    bg: 'rgba(107,114,128,0.15)', text: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
  // legacy compatibility
  pending:     { label: 'Pending',     bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  reviewed:    { label: 'Reviewed',    bg: 'rgba(234,179,8,0.15)',   text: '#eab308', border: 'rgba(234,179,8,0.3)' },
  accepted:    { label: 'Accepted',    bg: 'rgba(16,185,129,0.15)',  text: '#34d399', border: 'rgba(16,185,129,0.3)' },
};

const POSITIONS = ['Player', 'Staff', 'Coach', 'Manager', 'Content Creator', 'Other'] as const;

export default function AdminRecruitment() {
  const [tab, setTab]           = useState<'applications' | 'openings' | 'dashboard'>('applications');
  const [apps, setApps]         = useState<RecruitmentApplication[]>([]);
  const [openings, setOpenings] = useState<RecruitmentOpening[]>([]);
  const [loading, setLoading]   = useState(true);

  // Application Filters & Search
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openingFilter, setOpeningFilter] = useState<string>('all');
  const [posFilter, setPosFilter]     = useState<string>('all');
  const [sortBy, setSortBy]           = useState<'date' | 'rating' | 'match'>('date');

  // Selected Application
  const [selectedApp, setSelectedApp] = useState<RecruitmentApplication | null>(null);
  const [updating, setUpdating]       = useState(false);
  const [noteText, setNoteText]       = useState('');
  const [newTag, setNewTag]           = useState('');

  // Bulk Selection & Actions
  const [selectedAppIds, setSelectedAppIds]           = useState<string[]>([]);
  const [bulkReviewerInput, setBulkReviewerInput]     = useState<string>('');
  const [bulkTagInput, setBulkTagInput]               = useState<string>('');
  const [bulkActionInProgress, setBulkActionInProgress] = useState<boolean>(false);

  // Opening Editor Modal
  const [editingOpening, setEditingOpening] = useState<Partial<RecruitmentOpening> | null>(null);
  const [savingOpening, setSavingOpening]   = useState(false);

  const getToken = () => {
    try { return '' ?? ''; } catch { return ''; }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [resApps, resOpenings] = await Promise.all([
        fetch(apiUrl('/api/db/recruitment'), { credentials: "include", headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(apiUrl('/api/db/recruitmentOpenings'), { credentials: "include", headers: { Authorization: `Bearer ${getToken()}` } })
      ]);

      if (resApps.ok) {
        const dataApps: RecruitmentApplication[] = await resApps.json();
        setApps(Array.isArray(dataApps) ? dataApps.sort((a, b) => b.createdAt - a.createdAt) : []);
      }
      if (resOpenings.ok) {
        const dataOpenings: RecruitmentOpening[] = await resOpenings.json();
        setOpenings(Array.isArray(dataOpenings) ? dataOpenings : []);
      }
    } catch (err) {
      console.error('Failed to load recruitment data:', err);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Save Applications to DB
  const persistApps = async (updated: RecruitmentApplication[]) => {
    setApps(updated);
    try {
      await fetch(apiUrl('/api/db/recruitment'), { credentials: "include",
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error('Failed saving applications:', e);
    }
  };

  // Save Openings to DB
  const persistOpenings = async (updated: RecruitmentOpening[]) => {
    setOpenings(updated);
    try {
      await fetch(apiUrl('/api/db/recruitmentOpenings'), { credentials: "include",
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error('Failed saving openings:', e);
    }
  };

  // Status Change with Audit Trail
  const updateAppStatus = async (appId: string, newStatus: RecruitmentApplication['status']) => {
    setUpdating(true);
    const now = Date.now();
    const updated = apps.map(a => {
      if (a.id !== appId) return a;
      const currentAudit = a.auditTrail || [];
      const newAuditItem = {
        id: `aud_${now}_${Math.random().toString(36).slice(2, 6)}`,
        action: `Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`,
        reviewer: 'Admin',
        timestamp: now,
      };
      return {
        ...a,
        status: newStatus,
        read: true,
        updatedAt: now,
        auditTrail: [newAuditItem, ...currentAudit],
      };
    });

    await persistApps(updated);
    if (selectedApp?.id === appId) {
      const match = updated.find(a => a.id === appId);
      if (match) setSelectedApp(match);
    }
    setUpdating(false);
  };

  // Rating Change
  const updateAppRating = async (appId: string, rating: number) => {
    const now = Date.now();
    const updated = apps.map(a => {
      if (a.id !== appId) return a;
      return { ...a, rating, updatedAt: now };
    });
    await persistApps(updated);
    if (selectedApp?.id === appId) {
      setSelectedApp(prev => prev ? { ...prev, rating } : null);
    }
  };

  // Add Tag
  const handleAddTag = async () => {
    if (!selectedApp || !newTag.trim()) return;
    const tag = newTag.trim();
    const currentTags = selectedApp.tags || [];
    if (currentTags.includes(tag)) return;

    const now = Date.now();
    const updatedTags = [...currentTags, tag];
    const updated = apps.map(a => a.id === selectedApp.id ? { ...a, tags: updatedTags, updatedAt: now } : a);

    await persistApps(updated);
    setSelectedApp(prev => prev ? { ...prev, tags: updatedTags } : null);
    setNewTag('');
  };

  // Remove Tag
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedApp) return;
    const updatedTags = (selectedApp.tags || []).filter(t => t !== tagToRemove);
    const now = Date.now();
    const updated = apps.map(a => a.id === selectedApp.id ? { ...a, tags: updatedTags, updatedAt: now } : a);

    await persistApps(updated);
    setSelectedApp(prev => prev ? { ...prev, tags: updatedTags } : null);
  };

  // Save Admin Note
  const saveNote = async () => {
    if (!selectedApp) return;
    setUpdating(true);
    const now = Date.now();
    const currentAudit = selectedApp.auditTrail || [];
    const newAuditItem = {
      id: `aud_${now}_${Math.random().toString(36).slice(2, 6)}`,
      action: 'Admin internal note updated',
      reviewer: 'Admin',
      timestamp: now,
    };

    const updated = apps.map(a => {
      if (a.id !== selectedApp.id) return a;
      return {
        ...a,
        adminNote: noteText,
        updatedAt: now,
        auditTrail: [newAuditItem, ...currentAudit],
      };
    });

    await persistApps(updated);
    setSelectedApp(prev => prev ? { ...prev, adminNote: noteText, auditTrail: [newAuditItem, ...currentAudit] } : null);
    setUpdating(false);
  };

  // Delete Application
  const deleteApp = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this application?')) return;
    const updated = apps.filter(a => a.id !== id);
    await persistApps(updated);
    if (selectedApp?.id === id) setSelectedApp(null);
  };

  // Mark Read
  const markRead = async (app: RecruitmentApplication) => {
    if (app.read) return;
    const updated = apps.map(a => a.id === app.id ? { ...a, read: true } : a);
    await persistApps(updated);
  };

  // Bulk Actions
  const toggleSelectApp = (id: string) => {
    setSelectedAppIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = (filtered: RecruitmentApplication[]) => {
    const filteredIds = filtered.map(a => a.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedAppIds.includes(id));

    if (allSelected) {
      setSelectedAppIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedAppIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBulkStatusChange = async (newStatus: RecruitmentApplication['status']) => {
    if (selectedAppIds.length === 0) return;
    const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus;
    if (!confirm(`Are you sure you want to change status to "${statusLabel}" for ${selectedAppIds.length} selected application(s)?`)) return;

    setBulkActionInProgress(true);
    const now = Date.now();
    const updated = apps.map(a => {
      if (!selectedAppIds.includes(a.id)) return a;
      const currentAudit = a.auditTrail || [];
      const newAuditItem = {
        id: `aud_${now}_${Math.random().toString(36).slice(2, 6)}`,
        action: `Bulk status updated to ${statusLabel}`,
        reviewer: 'Admin',
        timestamp: now,
      };
      return {
        ...a,
        status: newStatus,
        read: true,
        updatedAt: now,
        auditTrail: [newAuditItem, ...currentAudit],
      };
    });

    await persistApps(updated);
    if (selectedApp && selectedAppIds.includes(selectedApp.id)) {
      const refreshed = updated.find(a => a.id === selectedApp.id);
      if (refreshed) setSelectedApp(refreshed);
    }
    setBulkActionInProgress(false);
  };

  const handleBulkAssignReviewer = async (reviewerName: string) => {
    if (selectedAppIds.length === 0 || !reviewerName.trim()) return;
    const reviewer = reviewerName.trim();
    if (!confirm(`Assign ${selectedAppIds.length} application(s) to reviewer "${reviewer}"?`)) return;

    setBulkActionInProgress(true);
    const now = Date.now();
    const reviewerTag = `reviewer:${reviewer}`;

    const updated = apps.map(a => {
      if (!selectedAppIds.includes(a.id)) return a;
      const currentAudit = a.auditTrail || [];
      const currentTags = a.tags || [];
      const newTags = currentTags.filter(t => !t.startsWith('reviewer:')).concat(reviewerTag);

      const newAuditItem = {
        id: `aud_${now}_${Math.random().toString(36).slice(2, 6)}`,
        action: `Assigned reviewer: ${reviewer}`,
        reviewer: 'Admin',
        timestamp: now,
      };

      return {
        ...a,
        tags: newTags,
        adminNote: a.adminNote ? `${a.adminNote}\n[Assigned Reviewer: ${reviewer}]` : `Assigned Reviewer: ${reviewer}`,
        updatedAt: now,
        auditTrail: [newAuditItem, ...currentAudit],
      };
    });

    await persistApps(updated);
    if (selectedApp && selectedAppIds.includes(selectedApp.id)) {
      const refreshed = updated.find(a => a.id === selectedApp.id);
      if (refreshed) setSelectedApp(refreshed);
    }
    setBulkReviewerInput('');
    setBulkActionInProgress(false);
  };

  const handleBulkAddTag = async (tagName: string) => {
    if (selectedAppIds.length === 0 || !tagName.trim()) return;
    const tag = tagName.trim();

    setBulkActionInProgress(true);
    const now = Date.now();

    const updated = apps.map(a => {
      if (!selectedAppIds.includes(a.id)) return a;
      const currentTags = a.tags || [];
      if (currentTags.includes(tag)) return a;

      const newAuditItem = {
        id: `aud_${now}_${Math.random().toString(36).slice(2, 6)}`,
        action: `Added tag: #${tag}`,
        reviewer: 'Admin',
        timestamp: now,
      };

      return {
        ...a,
        tags: [...currentTags, tag],
        updatedAt: now,
        auditTrail: [newAuditItem, ...(a.auditTrail || [])],
      };
    });

    await persistApps(updated);
    if (selectedApp && selectedAppIds.includes(selectedApp.id)) {
      const refreshed = updated.find(a => a.id === selectedApp.id);
      if (refreshed) setSelectedApp(refreshed);
    }
    setBulkTagInput('');
    setBulkActionInProgress(false);
  };

  const handleBulkDelete = async () => {
    if (selectedAppIds.length === 0) return;
    if (!confirm(`⚠️ PERMANENT DELETE WARNING:\n\nAre you sure you want to permanently delete ${selectedAppIds.length} application(s)? This action cannot be undone.`)) return;

    setBulkActionInProgress(true);
    const updated = apps.filter(a => !selectedAppIds.includes(a.id));
    await persistApps(updated);

    if (selectedApp && selectedAppIds.includes(selectedApp.id)) {
      setSelectedApp(null);
    }
    setSelectedAppIds([]);
    setBulkActionInProgress(false);
  };

  // Save / Edit Opening
  const handleSaveOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpening || !editingOpening.title || !editingOpening.position) return;
    setSavingOpening(true);

    const now = Date.now();
    const isNew = !editingOpening.id;
    const openingId = editingOpening.id || `op_${now}_${Math.random().toString(36).slice(2, 6)}`;

    const fullOpening: RecruitmentOpening = {
      id: openingId,
      position: editingOpening.position || 'Player',
      title: editingOpening.title.trim(),
      description: editingOpening.description || '',
      requirements: Array.isArray(editingOpening.requirements) ? editingOpening.requirements : [],
      game: editingOpening.game || 'All Games',
      minExperienceYears: Number(editingOpening.minExperienceYears) || 0,
      minAge: Number(editingOpening.minAge) || 16,
      requiredSkills: Array.isArray(editingOpening.requiredSkills) ? editingOpening.requiredSkills : [],
      slotsAvailable: Number(editingOpening.slotsAvailable) || 1,
      deadline: editingOpening.deadline || 'Open until filled',
      status: editingOpening.status || 'Open',
      featured: editingOpening.featured !== undefined ? editingOpening.featured : true,
      formFields: editingOpening.formFields || [],
      customQuestions: editingOpening.customQuestions || [],
      createdAt: editingOpening.createdAt || now,
      updatedAt: now,
    };

    let updatedOpenings: RecruitmentOpening[];
    if (isNew) {
      updatedOpenings = [fullOpening, ...openings];
    } else {
      updatedOpenings = openings.map(o => o.id === openingId ? fullOpening : o);
    }

    await persistOpenings(updatedOpenings);
    setEditingOpening(null);
    setSavingOpening(false);
  };

  const deleteOpening = async (id: string) => {
    if (!confirm('Delete this recruitment opening?')) return;
    const updated = openings.filter(o => o.id !== id);
    await persistOpenings(updated);
  };

  // Calculate Requirement Match Percentage
  const calculateMatch = (app: RecruitmentApplication) => {
    const matchedOpening = openings.find(o => o.id === app.openingId || o.title.toLowerCase() === app.openingTitle?.toLowerCase());

    let matchPoints = 0;
    let totalPoints = 0;
    const matchingSkills: string[] = [];
    const missingRequirements: string[] = [];

    if (!matchedOpening) {
      return { score: 75, matchingSkills: ['General Application'], missingRequirements: [], matchedOpening: null };
    }

    // Game Match (20 pts)
    totalPoints += 20;
    if (app.game && matchedOpening.game && (matchedOpening.game === 'All Games' || app.game.toLowerCase().includes(matchedOpening.game.toLowerCase()) || matchedOpening.game.toLowerCase().includes(app.game.toLowerCase()))) {
      matchPoints += 20;
      matchingSkills.push(`Game: ${app.game}`);
    } else {
      missingRequirements.push(`Game mismatch (Required: ${matchedOpening.game})`);
    }

    // Age Match (15 pts)
    totalPoints += 15;
    const appAge = Number(app.age) || 0;
    const minAge = matchedOpening.minAge || 16;
    if (appAge >= minAge) {
      matchPoints += 15;
      matchingSkills.push(`Age ${appAge}+ (Min ${minAge})`);
    } else if (appAge > 0) {
      missingRequirements.push(`Age ${appAge} below required minimum (${minAge})`);
    } else {
      matchPoints += 10;
    }

    // Experience Match (25 pts)
    totalPoints += 25;
    const appExp = app.experienceYears || (app.experience ? (parseInt(app.experience) || 1) : 0);
    const minExp = matchedOpening.minExperienceYears || 0;
    if (appExp >= minExp) {
      matchPoints += 25;
      matchingSkills.push(`Experience: ${appExp} years`);
    } else {
      missingRequirements.push(`Experience ${appExp} yrs below min ${minExp} yrs`);
    }

    // Skills Match (40 pts)
    totalPoints += 40;
    const reqSkills = matchedOpening.requiredSkills || [];
    if (reqSkills.length > 0) {
      const appText = `${app.role} ${app.about || ''} ${app.achievements || ''} ${app.experience || ''} ${Object.values(app.customAnswers || {}).join(' ')}`.toLowerCase();
      let matchedCount = 0;

      reqSkills.forEach(skill => {
        if (appText.includes(skill.toLowerCase())) {
          matchedCount++;
          matchingSkills.push(`Skill: ${skill}`);
        } else {
          missingRequirements.push(`Missing skill: ${skill}`);
        }
      });

      matchPoints += Math.round((matchedCount / reqSkills.length) * 40);
    } else {
      matchPoints += 40;
    }

    const score = Math.min(100, Math.max(10, Math.round((matchPoints / totalPoints) * 100)));
    return { score, matchingSkills, missingRequirements, matchedOpening };
  };

  // Filtered Applications
  const filteredApps = apps.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (openingFilter !== 'all' && app.openingId !== openingFilter) return false;
    if (posFilter !== 'all' && app.role !== posFilter && !app.role?.toLowerCase().includes(posFilter.toLowerCase())) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = app.name.toLowerCase().includes(q);
      const matchIgn  = app.ign?.toLowerCase().includes(q);
      const matchEmail = app.email.toLowerCase().includes(q);
      const matchGame  = app.game.toLowerCase().includes(q);
      const matchRole  = app.role.toLowerCase().includes(q);
      if (!matchName && !matchIgn && !matchEmail && !matchGame && !matchRole) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'match')  return calculateMatch(b).score - calculateMatch(a).score;
    return b.createdAt - a.createdAt;
  });

  // Metrics
  const metrics = {
    total: apps.length,
    new: apps.filter(a => a.status === 'new' || a.status === 'pending').length,
    reviewing: apps.filter(a => a.status === 'reviewing' || a.status === 'reviewed').length,
    shortlisted: apps.filter(a => a.status === 'shortlisted').length,
    interview: apps.filter(a => a.status === 'interview').length,
    selected: apps.filter(a => a.status === 'selected' || a.status === 'accepted').length,
    signed: apps.filter(a => a.status === 'signed').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
    openPositions: openings.filter(o => o.status === 'Open').length,
  };

  const unreadCount = apps.filter(a => !a.read).length;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white/3 border border-white/8 p-4 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white tracking-widest uppercase">RECRUITMENT & APPLICATIONS SYSTEM</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white animate-pulse">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Manage openings, applicant profiles, requirement matching & hiring workflows.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setTab('applications')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${tab === 'applications' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'}`}>
              📋 Applications ({apps.length})
            </button>
            <button
              onClick={() => setTab('openings')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${tab === 'openings' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'}`}>
              🎯 Openings ({openings.length})
            </button>
            <button
              onClick={() => setTab('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${tab === 'dashboard' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'}`}>
              📊 Analytics
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 bg-white/5 border border-white/10 hover:border-amber-500/30 text-gray-300 rounded-xl text-xs font-bold transition-all disabled:opacity-40">
            {loading ? '↻ Syncing...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: APPLICATIONS MANAGER
         ───────────────────────────────────────────────────────────── */}
      {tab === 'applications' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white/3 border border-white/8 p-4 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, IGN, email, game, role..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-xs text-gray-500 hover:text-white">✕</button>
                )}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50">
                <option value="all" className="bg-gray-900">All Statuses ({apps.length})</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k} className="bg-gray-900">
                    {v.label} ({apps.filter(a => a.status === k).length})
                  </option>
                ))}
              </select>

              {/* Opening Filter */}
              <select
                value={openingFilter}
                onChange={e => setOpeningFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50">
                <option value="all" className="bg-gray-900">All Openings</option>
                {openings.map(o => (
                  <option key={o.id} value={o.id} className="bg-gray-900">{o.title}</option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50">
                <option value="date" className="bg-gray-900">Sort: Newest First</option>
                <option value="match" className="bg-gray-900">Sort: Best Requirement Match</option>
                <option value="rating" className="bg-gray-900">Sort: Highest Rating</option>
              </select>
            </div>
          </div>

          {/* Bulk Selection Header */}
          {!loading && filteredApps.length > 0 && (
            <div className="flex items-center justify-between bg-white/3 border border-white/8 rounded-2xl px-4 py-2.5 text-xs text-gray-300">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filteredApps.length > 0 && filteredApps.every(a => selectedAppIds.includes(a.id))}
                  onChange={() => toggleSelectAllFiltered(filteredApps)}
                  className="w-4 h-4 rounded border-gray-600 text-amber-500 focus:ring-amber-500 bg-black/40 cursor-pointer"
                />
                <span className="font-extrabold text-white">
                  Select All Filtered ({filteredApps.length})
                </span>
              </label>

              {selectedAppIds.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black text-[11px] uppercase tracking-wider">
                    {selectedAppIds.length} Selected
                  </span>
                  <button
                    onClick={() => setSelectedAppIds([])}
                    className="text-[11px] text-gray-400 hover:text-white underline">
                    Deselect All
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bulk Action Controls Bar */}
          {selectedAppIds.length > 0 && (
            <div className="bg-[#0e1017] border-2 border-amber-500/50 rounded-2xl p-4 space-y-3.5 shadow-2xl shadow-amber-500/10">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="font-black text-amber-400 text-xs uppercase tracking-widest">
                    ⚡ BULK MANAGEMENT MENU ({selectedAppIds.length} APPLICATIONS SELECTED)
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAppIds([])}
                  className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg transition-all font-bold">
                  Clear Selection ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Column 1: Status Transitions */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    1. Transition Statuses
                  </label>
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleBulkStatusChange(e.target.value as any);
                        e.target.value = '';
                      }
                    }}
                    disabled={bulkActionInProgress}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                    <option value="" className="bg-gray-900">Select Target Status...</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k} className="bg-gray-900">
                        Set status to: {v.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <button
                      onClick={() => handleBulkStatusChange('shortlisted')}
                      disabled={bulkActionInProgress}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold hover:bg-purple-500/30 transition-all">
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('interview')}
                      disabled={bulkActionInProgress}
                      className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-bold hover:bg-pink-500/30 transition-all">
                      Interview
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('selected')}
                      disabled={bulkActionInProgress}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold hover:bg-emerald-500/30 transition-all">
                      Select
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('rejected')}
                      disabled={bulkActionInProgress}
                      className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold hover:bg-red-500/30 transition-all">
                      Reject All
                    </button>
                  </div>
                </div>

                {/* Column 2: Assign Reviewer */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    2. Assign Reviewer
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={bulkReviewerInput}
                      onChange={e => setBulkReviewerInput(e.target.value)}
                      placeholder="Reviewer name / role..."
                      className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => handleBulkAssignReviewer(bulkReviewerInput)}
                      disabled={!bulkReviewerInput.trim() || bulkActionInProgress}
                      className="px-3 py-2 bg-amber-500 text-black font-black text-xs rounded-xl hover:bg-amber-400 transition-all disabled:opacity-40 flex-shrink-0">
                      Assign
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {['Head Scout', 'IGL Analyst', 'Manager', 'Esports Director'].map(rev => (
                      <button
                        key={rev}
                        onClick={() => handleBulkAssignReviewer(rev)}
                        disabled={bulkActionInProgress}
                        className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[10px] hover:border-amber-500/50 hover:text-amber-400 transition-all">
                        +{rev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 3: Add Tag & Delete */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    3. Tags & Actions
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={bulkTagInput}
                      onChange={e => setBulkTagInput(e.target.value)}
                      placeholder="Add #tag..."
                      className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => handleBulkAddTag(bulkTagInput)}
                      disabled={!bulkTagInput.trim() || bulkActionInProgress}
                      className="px-3 py-2 bg-white/10 text-white font-bold text-xs rounded-xl hover:bg-white/20 transition-all disabled:opacity-40 flex-shrink-0">
                      +Tag
                    </button>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkActionInProgress}
                      className="w-full py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
                      <span>🗑</span> Delete All Selected ({selectedAppIds.length})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Grid: List + Detail Drawer */}
          <div className="grid lg:grid-cols-12 gap-5">
            {/* List (7 cols) */}
            <div className="lg:col-span-7 space-y-2.5">
              {loading ? (
                <div className="text-center py-16 bg-white/2 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 rounded-full animate-spin mx-auto mb-3" style={{ border: '2px solid #d4af37', borderTopColor: 'transparent' }} />
                  <p className="text-xs text-gray-500 font-medium">Loading application database...</p>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="text-center py-20 bg-white/2 border border-white/5 rounded-2xl p-6">
                  <div className="text-4xl mb-3">🎮</div>
                  <h3 className="text-white font-bold text-sm">No applications found</h3>
                  <p className="text-gray-500 text-xs mt-1 max-w-sm mx-auto">
                    {search || statusFilter !== 'all' ? 'Try adjusting your search query or status filter.' : 'When players apply via the public website, their submissions will appear here in real-time.'}
                  </p>
                </div>
              ) : (
                filteredApps.map(app => {
                  const match = calculateMatch(app);
                  const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.new;

                  return (
                    <div
                      key={app.id}
                      onClick={() => { setSelectedApp(app); setNoteText(app.adminNote || ''); markRead(app); }}
                      className={`cursor-pointer bg-white/3 border rounded-2xl p-4 transition-all hover:border-amber-500/40 ${selectedApp?.id === app.id ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10' : 'border-white/8 hover:bg-white/5'} ${selectedAppIds.includes(app.id) ? 'ring-1 ring-amber-500/60 bg-amber-500/5' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Checkbox */}
                          <div className="pt-1.5" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedAppIds.includes(app.id)}
                              onChange={() => toggleSelectApp(app.id)}
                              className="w-4 h-4 rounded border-gray-600 text-amber-500 focus:ring-amber-500 bg-black/50 cursor-pointer"
                            />
                          </div>

                          {/* Photo / Avatar */}
                          {app.photoUrl ? (
                            <img src={app.photoUrl} alt={app.name} className="w-11 h-11 rounded-xl object-cover border border-white/10 flex-shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-sm flex-shrink-0">
                              {app.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {!app.read && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-ping" />}
                              <span className="font-bold text-white text-sm truncate">{app.name}</span>
                              {app.ign && <span className="text-xs text-amber-400 font-mono">"{app.ign}"</span>}
                              {app.age && <span className="text-[10px] text-gray-500 font-bold">{app.age}y</span>}
                            </div>

                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-300">{app.game}</span>
                              <span>•</span>
                              <span className="text-gray-400">{app.role}</span>
                              {app.rank && <span className="text-gray-500">({app.rank})</span>}
                            </div>

                            {/* Tags & Opening Title */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <span
                                className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase border"
                                style={{ background: statusInfo.bg, color: statusInfo.text, borderColor: statusInfo.border }}>
                                {statusInfo.label}
                              </span>

                              <PlayerMatchIndicator match={match} compact={true} />

                              {app.rating ? (
                                <span className="text-amber-400 text-[10px] font-bold">
                                  {'★'.repeat(app.rating)}
                                </span>
                              ) : null}

                              {(app.tags || []).map(t => (
                                <span key={t} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-400">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-[10px] font-mono text-gray-500">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Detail Drawer (5 cols) */}
            <div className="lg:col-span-5">
              {selectedApp ? (
                <div className="bg-white/3 border border-amber-500/20 rounded-2xl p-5 sticky top-4 space-y-5 max-h-[85vh] overflow-y-auto">
                  {/* Title Bar */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/8">
                    <div className="flex items-center gap-3">
                      {selectedApp.photoUrl ? (
                        <img src={selectedApp.photoUrl} alt={selectedApp.name} className="w-12 h-12 rounded-xl object-cover border border-amber-500/30" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-lg">
                          {selectedApp.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-black text-white text-base">{selectedApp.name}</h3>
                        <p className="text-xs text-amber-400 font-mono">{selectedApp.ign ? `IGN: ${selectedApp.ign}` : selectedApp.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteApp(selectedApp.id)}
                      className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/20 transition-all">
                      🗑 Delete
                    </button>
                  </div>

                  {/* Rating & Tags Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Candidate Rating</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => updateAppRating(selectedApp.id, star)}
                            className={`text-base transition-transform hover:scale-125 ${star <= (selectedApp.rating || 0) ? 'text-amber-400' : 'text-gray-600'}`}>
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {(selectedApp.tags || []).map(t => (
                        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                          #{t}
                          <button onClick={() => handleRemoveTag(t)} className="hover:text-red-400">✕</button>
                        </span>
                      ))}

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newTag}
                          onChange={e => setNewTag(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                          placeholder="+ Tag"
                          className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-amber-500"
                        />
                        <button onClick={handleAddTag} className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 bg-white/5 rounded border border-white/10">+</button>
                      </div>
                    </div>
                  </div>

                  {/* ──────────────────────────────────────────────────
                      REQUIREMENT MATCH ENGINE & VISUAL INDICATOR
                     ────────────────────────────────────────────────── */}
                  {(() => {
                    const match = calculateMatch(selectedApp);
                    return (
                      <PlayerMatchIndicator
                        match={{
                          score: match.score,
                          matchingSkills: match.matchingSkills,
                          missingRequirements: match.missingRequirements,
                          openingTitle: selectedApp.openingTitle || match.matchedOpening?.title,
                        }}
                      />
                    );
                  })()}

                  {/* Status Pipeline Buttons */}
                  <div className="space-y-2 border-t border-white/8 pt-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Update Application Pipeline Stage</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { k: 'reviewing', label: 'Reviewing' },
                        { k: 'shortlisted', label: 'Shortlist' },
                        { k: 'interview', label: 'Interview' },
                        { k: 'selected', label: 'Select' },
                        { k: 'signed', label: 'Sign/Hire' },
                        { k: 'rejected', label: 'Reject' },
                        { k: 'archived', label: 'Archive' },
                      ].map(st => {
                        const isCurrent = selectedApp.status === st.k;
                        const cfg = STATUS_CONFIG[st.k];
                        return (
                          <button
                            key={st.k}
                            disabled={updating || isCurrent}
                            onClick={() => updateAppStatus(selectedApp.id, st.k as any)}
                            className="py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                            style={isCurrent ? { background: cfg?.bg, color: cfg?.text, border: `1px solid ${cfg?.border}` } : { background: 'rgba(255,255,255,0.04)', color: 'rgba(209,213,219,1)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {st.label} {isCurrent && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed Information Accordion / View */}
                  <div className="space-y-3 border-t border-white/8 pt-3 text-xs">
                    <div className="grid grid-cols-2 gap-3 bg-white/2 p-3 rounded-xl border border-white/5">
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Game</div>
                        <div className="text-white font-semibold">{selectedApp.game}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Role</div>
                        <div className="text-white font-semibold">{selectedApp.role}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Age</div>
                        <div className="text-white font-semibold">{selectedApp.age || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Experience (Years)</div>
                        <div className="text-white font-semibold">{selectedApp.experienceYears || '0'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">In-Game UID</div>
                        <div className="text-amber-400 font-mono font-bold">{selectedApp.uid || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Current Rank</div>
                        <div className="text-white">{selectedApp.rank || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Current Org</div>
                        <div className="text-white">{selectedApp.currentOrg || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Availability</div>
                        <div className="text-white">{selectedApp.availability || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Phone / WhatsApp</div>
                        <div className="text-white">{selectedApp.whatsapp || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Country</div>
                        <div className="text-white">{selectedApp.country || 'India'}</div>
                      </div>
                    </div>

                    {/* Links & Attachments */}
                    {(selectedApp.resumeUrl || selectedApp.socials?.portfolioUrl || selectedApp.socials?.discord || selectedApp.youtube || selectedApp.instagram) && (
                      <div className="bg-white/2 p-3 rounded-xl border border-white/5 space-y-2">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attachments & Links</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedApp.resumeUrl && (
                            <a href={selectedApp.resumeUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-bold text-xs hover:bg-amber-500/30 transition-all flex items-center gap-1">
                              📄 View Resume / File
                            </a>
                          )}
                          {selectedApp.socials?.portfolioUrl && (
                            <a href={selectedApp.socials.portfolioUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg font-bold text-xs hover:bg-blue-500/30 transition-all">
                              🔗 Portfolio
                            </a>
                          )}
                          {selectedApp.socials?.discord && (
                            <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg font-bold text-xs">
                              💬 Discord: {selectedApp.socials.discord}
                            </span>
                          )}
                          {selectedApp.youtube && (
                            <a href={selectedApp.youtube.startsWith('http') ? selectedApp.youtube : `https://${selectedApp.youtube}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg font-bold text-xs">
                              ▶ YouTube
                            </a>
                          )}
                          {selectedApp.instagram && (
                            <a href={selectedApp.instagram.startsWith('http') ? selectedApp.instagram : `https://instagram.com/${selectedApp.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-lg font-bold text-xs">
                              📷 Instagram
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Written Details */}
                    {selectedApp.experience && (
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Competitive Experience</div>
                        <div className="text-gray-300 bg-white/2 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">{selectedApp.experience}</div>
                      </div>
                    )}

                    {selectedApp.achievements && (
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Achievements & Tournament Placements</div>
                        <div className="text-gray-300 bg-white/2 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">{selectedApp.achievements}</div>
                      </div>
                    )}

                    {selectedApp.about && (
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Motivation & Bio</div>
                        <div className="text-gray-300 bg-white/2 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">{selectedApp.about}</div>
                      </div>
                    )}

                    {/* Custom Answers */}
                    {selectedApp.customAnswers && Object.keys(selectedApp.customAnswers).length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Custom Form Answers</div>
                        <div className="space-y-1.5">
                          {Object.entries(selectedApp.customAnswers).map(([q, ans]) => (
                            <div key={q} className="bg-white/2 p-2 rounded-lg border border-white/5">
                              <span className="text-[10px] font-bold text-gray-400 block">{q}</span>
                              <span className="text-xs text-white">{ans}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin Notes */}
                  <div className="space-y-2 border-t border-white/8 pt-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Internal Admin Notes</span>
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      rows={3}
                      placeholder="Add private scout feedback or interview notes..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 resize-none"
                    />
                    <button
                      onClick={saveNote}
                      disabled={updating}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all disabled:opacity-40 shadow-lg shadow-amber-500/20">
                      {updating ? 'Saving Note...' : 'Save Internal Note'}
                    </button>
                  </div>

                  {/* Audit Trail */}
                  <div className="space-y-2 border-t border-white/8 pt-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Application Audit Trail</span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {(selectedApp.auditTrail || []).map(aud => (
                        <div key={aud.id} className="text-[10px] bg-white/2 border border-white/5 p-2 rounded-lg flex justify-between items-center text-gray-400">
                          <span>{aud.action} {aud.reviewer ? `(${aud.reviewer})` : ''}</span>
                          <span className="font-mono text-gray-600">{new Date(aud.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/2 border border-white/5 rounded-2xl p-12 text-center text-gray-500 space-y-2 sticky top-4">
                  <div className="text-4xl">📋</div>
                  <h4 className="text-white font-bold text-sm">Select an Applicant</h4>
                  <p className="text-xs">Click on any application record to review details, test requirement matching, write notes, and update hiring stage.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: RECRUITMENT OPENINGS MANAGER
         ───────────────────────────────────────────────────────────── */}
      {tab === 'openings' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">ACTIVE RECRUITMENT OPENINGS</h3>
            <button
              onClick={() => setEditingOpening({
                position: 'Player',
                title: '',
                description: '',
                game: 'BGMI',
                minExperienceYears: 1,
                minAge: 16,
                slotsAvailable: 1,
                deadline: 'Open until filled',
                status: 'Open',
                featured: true,
                requirements: ['Age 16+', 'Competitive Ranked Experience', 'Good Microphone & Discord'],
                requiredSkills: ['Communication', 'Aim Discipline'],
                customQuestions: [],
              })}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2">
              <span>+</span> Create New Opening
            </button>
          </div>

          {/* Openings List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openings.map(opening => (
              <div key={opening.id} className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4 hover:border-amber-500/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {opening.position}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${opening.status === 'Open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {opening.status}
                      </span>
                      {opening.featured && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          ★ FEATURED
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-white mt-1.5">{opening.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">{opening.description}</p>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setEditingOpening(opening)}
                      className="p-2 bg-white/5 border border-white/10 hover:border-amber-500/40 text-xs text-amber-400 rounded-lg transition-all">
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteOpening(opening.id)}
                      className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs text-red-400 rounded-lg transition-all">
                      🗑
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] bg-white/2 p-2.5 rounded-xl border border-white/5 text-gray-300">
                  <div><span className="text-gray-500 block text-[9px] uppercase font-bold">Game</span>{opening.game}</div>
                  <div><span className="text-gray-500 block text-[9px] uppercase font-bold">Min Exp</span>{opening.minExperienceYears || 0} Years</div>
                  <div><span className="text-gray-500 block text-[9px] uppercase font-bold">Slots</span>{opening.slotsAvailable || 1} Available</div>
                </div>

                {/* Requirements & Skills */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Requirements:</span>
                    <ul className="list-disc list-inside text-gray-300 space-y-0.5 mt-0.5 text-[11px]">
                      {(opening.requirements || []).map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  {(opening.requiredSkills || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {opening.requiredSkills.map(sk => (
                        <span key={sk} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-amber-300 font-mono">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal / Form Editor for Opening */}
          {editingOpening && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-[#12131a] border border-amber-500/30 rounded-2xl p-6 max-w-2xl w-full my-8 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    {editingOpening.id ? 'Edit Recruitment Opening' : 'Create New Recruitment Opening'}
                  </h3>
                  <button onClick={() => setEditingOpening(null)} className="text-gray-400 hover:text-white font-bold text-lg">✕</button>
                </div>

                <form onSubmit={handleSaveOpening} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Opening Title *</label>
                      <input
                        required
                        type="text"
                        value={editingOpening.title || ''}
                        onChange={e => setEditingOpening(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. BGMI Tier 1 Roster - Assaulter"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Position Category *</label>
                      <select
                        value={editingOpening.position || 'Player'}
                        onChange={e => setEditingOpening(prev => ({ ...prev, position: e.target.value as any }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500">
                        {POSITIONS.map(p => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Game / Title</label>
                      <input
                        type="text"
                        value={editingOpening.game || ''}
                        onChange={e => setEditingOpening(prev => ({ ...prev, game: e.target.value }))}
                        placeholder="e.g. BGMI, Valorant, Free Fire..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Status & Featured</label>
                      <div className="flex gap-2">
                        <select
                          value={editingOpening.status || 'Open'}
                          onChange={e => setEditingOpening(prev => ({ ...prev, status: e.target.value as any }))}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none">
                          <option value="Open" className="bg-gray-900">Status: Open</option>
                          <option value="Closed" className="bg-gray-900">Status: Closed</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setEditingOpening(prev => ({ ...prev, featured: !prev?.featured }))}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${editingOpening.featured ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                          {editingOpening.featured ? '★ Featured' : '☆ Normal'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Min Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingOpening.minExperienceYears ?? 1}
                        onChange={e => setEditingOpening(prev => ({ ...prev, minExperienceYears: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Min Age Requirement</label>
                      <input
                        type="number"
                        min="12"
                        value={editingOpening.minAge ?? 16}
                        onChange={e => setEditingOpening(prev => ({ ...prev, minAge: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Slots Available</label>
                      <input
                        type="number"
                        min="1"
                        value={editingOpening.slotsAvailable ?? 1}
                        onChange={e => setEditingOpening(prev => ({ ...prev, slotsAvailable: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Deadline Date / Text</label>
                      <input
                        type="text"
                        value={editingOpening.deadline || ''}
                        onChange={e => setEditingOpening(prev => ({ ...prev, deadline: e.target.value }))}
                        placeholder="e.g. 2026-12-31 or Open until filled"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editingOpening.description || ''}
                      onChange={e => setEditingOpening(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed overview of what ${ADMIN_BRAND_NAME} is looking for in this position..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Requirements (One per line)</label>
                    <textarea
                      rows={4}
                      value={(editingOpening.requirements || []).join('\n')}
                      onChange={e => setEditingOpening(prev => ({ ...prev, requirements: e.target.value.split('\n').filter(Boolean) }))}
                      placeholder="e.g.&#10;Age 18+&#10;Min 2 Years Competitive Experience&#10;Conqueror Rank"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Required Skills (Comma separated)</label>
                    <input
                      type="text"
                      value={(editingOpening.requiredSkills || []).join(', ')}
                      onChange={e => setEditingOpening(prev => ({ ...prev, requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                      placeholder="e.g. IGL, Entry Frag, Zone Rotation, Communication"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingOpening(null)}
                      className="flex-1 py-2.5 border border-white/10 text-gray-400 hover:text-white font-bold rounded-xl transition-all">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingOpening}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all disabled:opacity-40 shadow-lg shadow-amber-500/20">
                      {savingOpening ? 'Saving...' : 'Save Opening'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: RECRUITMENT DASHBOARD & METRICS
         ───────────────────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'Total Apps', count: metrics.total, color: '#3b82f6' },
              { label: 'New', count: metrics.new, color: '#60a5fa' },
              { label: 'Reviewing', count: metrics.reviewing, color: '#eab308' },
              { label: 'Shortlisted', count: metrics.shortlisted, color: '#c084fc' },
              { label: 'Interview', count: metrics.interview, color: '#f472b6' },
              { label: 'Selected', count: metrics.selected, color: '#34d399' },
              { label: 'Signed/Hired', count: metrics.signed, color: '#d4af37' },
              { label: 'Rejected', count: metrics.rejected, color: '#f87171' },
            ].map(s => (
              <div key={s.label} className="bg-white/3 border border-white/8 rounded-2xl p-3.5 text-center">
                <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.count}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Applications Per Position Breakdown */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">APPLICATIONS BY RECRUITMENT OPENING</h3>

            <div className="space-y-3">
              {openings.map(op => {
                const count = apps.filter(a => a.openingId === op.id || a.openingTitle === op.title || a.role === op.position).length;
                const percentage = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;

                return (
                  <div key={op.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white">{op.title} <span className="text-gray-500">({op.game})</span></span>
                      <span className="text-amber-400">{count} Applications ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
