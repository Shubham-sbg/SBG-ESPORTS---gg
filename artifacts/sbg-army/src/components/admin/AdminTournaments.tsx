import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useState } from 'react';
import { Tournament, getDB, saveDB } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';
import { uploadFileToServer } from '@/lib/uploadService';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

interface Props { tournaments: Tournament[]; onRefresh: () => void; }

const BLANK: Omit<Tournament, 'id' | 'createdAt'> = {
  title: '', logo: '', game: '', type: '',
  slots: 100, prizePool: '', entryFee: 0, entryType: 'free',
  upiId: '', upiQr: '', registrationDeadline: '', matchDate: '', matchTime: '',
  registrationStatus: 'open', roomId: '', roomPassword: '',
  roomIdReleased: false, roomIdScheduled: '', rules: '', description: '', visible: true,
};

export default function AdminTournaments({ tournaments, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Tournament, 'id' | 'createdAt'>>(BLANK);
  const [viewRegs, setViewRegs] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const openCreate = () => { setEditId(null); setForm(BLANK); setSaveError(''); setShowForm(true); };
  const openEdit = (t: Tournament) => {
    setEditId(t.id);
    setForm({ title: t.title, logo: t.logo, game: t.game, type: t.type, slots: t.slots,
      prizePool: t.prizePool, entryFee: t.entryFee, entryType: t.entryType,
      upiId: t.upiId || '', upiQr: t.upiQr || '', registrationDeadline: t.registrationDeadline,
      matchDate: t.matchDate, matchTime: t.matchTime, registrationStatus: t.registrationStatus,
      roomId: t.roomId || '', roomPassword: t.roomPassword || '', roomIdReleased: t.roomIdReleased || false,
      roomIdScheduled: t.roomIdScheduled || '', rules: t.rules || '', description: t.description || '',
      visible: t.visible });
    setSaveError('');
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      let logoUrl = form.logo;
      if (logoUrl && logoUrl.startsWith('data:')) {
        try {
          const res = await uploadFileToServer(logoUrl, { filename: 'tournament-logo.png' });
          logoUrl = res.url;
        } catch (uploadErr) {
          console.warn('Server upload failed for tournament logo, using local DataURL:', uploadErr);
        }
      }
      let qrUrl = form.upiQr;
      if (qrUrl && qrUrl.startsWith('data:')) {
        try {
          const res = await uploadFileToServer(qrUrl, { filename: 'tournament-qr.png' });
          qrUrl = res.url;
        } catch (uploadErr) {
          console.warn('Server upload failed for tournament QR, using local DataURL:', uploadErr);
        }
      }

      const db = getDB();
      if (!db.tournaments) db.tournaments = [];
      const updatedForm = { ...form, logo: logoUrl, upiQr: qrUrl };

      if (editId) {
        const idx = db.tournaments.findIndex(t => t.id === editId);
        if (idx !== -1) db.tournaments[idx] = { ...db.tournaments[idx], ...updatedForm };
      } else {
        db.tournaments.push({ id: `t_${Date.now()}`, createdAt: Date.now(), ...updatedForm });
      }
      await saveDB(db, 'tournaments');
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      console.error('Tournament save error:', e);
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        setShowForm(false);
        onRefresh();
      } else {
        setSaveError(msg || 'Failed to save tournament. Check connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this tournament?')) return;
    try {
      const db = getDB();
      db.tournaments = db.tournaments.filter(t => t.id !== id);
      await saveDB(db, 'tournaments');
      onRefresh();
    } catch (e: any) {
      console.error('Failed to delete tournament:', e);
      onRefresh();
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      const db = getDB();
      const t = db.tournaments.find(t => t.id === id);
      if (t) t.registrationStatus = status;
      await saveDB(db, 'tournaments');
      onRefresh();
    } catch (e: any) {
      console.error('Failed to update tournament status:', e);
      onRefresh();
    }
  };

  const releaseRoom = async (id: string) => {
    try {
      const db = getDB();
      const t = db.tournaments.find(t => t.id === id);
      if (t) t.roomIdReleased = true;
      await saveDB(db, 'tournaments');
      onRefresh();
    } catch (e: any) {
      console.error('Failed to release room info:', e);
      onRefresh();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const res = await uploadFileToServer(file);
      setForm(f => ({ ...f, logo: res.url }));
    } catch (err: any) {
      console.warn('Server logo upload failed, converting file to local DataURL preview:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setForm(f => ({ ...f, logo: event.target!.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const res = await uploadFileToServer(file);
      setForm(f => ({ ...f, upiQr: res.url }));
    } catch (err: any) {
      console.warn('Server QR upload failed, converting file to local DataURL preview:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setForm(f => ({ ...f, upiQr: event.target!.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const db = getDB();
  const regs = viewRegs ? (db.registrations || []).filter(r => r.tournamentId === viewRegs) : [];
  const viewingTournament = viewRegs ? tournaments.find(t => t.id === viewRegs) : null;

  const exportCSV = (tournamentId: string) => {
    const db2 = getDB();
    const rows = (db2.registrations || []).filter(r => r.tournamentId === tournamentId);
    const header = 'Team Name,Leader Name,WhatsApp,Player2 UID,Player3 UID,Player4 UID,Substitute UID,Payment Status,Status';
    const lines = rows.map(r =>
      [r.teamName, r.leaderName, r.leaderWhatsApp, r.player2Uid || '', r.player3Uid || '',
       r.player4Uid || '', r.substituteUid || '', r.paymentStatus, r.status].join(',')
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `registrations-${tournamentId}.csv`; a.click();
  };

  const approveReg = async (regId: string, action: 'approved' | 'rejected' | 'correction_required') => {
    try {
      const db2 = getDB();
      const reg = (db2.registrations || []).find(r => r.id === regId);
      if (reg) { reg.status = action; if (action === 'approved') reg.paymentStatus = 'verified'; }
      await saveDB(db2, 'registrations');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to update registration status');
    }
  };

  if (viewRegs) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewRegs(null)} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20">← Back</button>
          <h2 className="font-black text-xl text-white">Registrations — {viewingTournament?.title}</h2>
          <button onClick={() => exportCSV(viewRegs)} className="ml-auto px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/30 border border-green-500/30">📥 Export CSV</button>
        </div>
        {regs.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No registrations yet.</div>
        ) : regs.map(r => (
          <div key={r.id} className="p-4 rounded-xl border border-white/5 bg-white/3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white">{r.teamName}</span>
                <span className="ml-2 text-xs text-gray-500">Leader: {r.leaderName} · {r.leaderWhatsApp}</span>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.status === 'approved' ? 'bg-green-500/20 text-green-400' : r.status === 'rejected' ? 'bg-red-500/20 text-red-400' : r.status === 'correction_required' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-gray-400'}`}>{r.status}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 space-x-4">
              <span>P2: {r.player2Uid || '—'}</span><span>P3: {r.player3Uid || '—'}</span>
              <span>P4: {r.player4Uid || '—'}</span><span>Sub: {r.substituteUid || '—'}</span>
            </div>
            {r.paymentScreenshot && (
              <div><a href={r.paymentScreenshot} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 underline">View Payment Screenshot</a></div>
            )}
            {r.status === 'pending' && (
              <div className="flex gap-2 pt-1">
                <button onClick={() => approveReg(r.id, 'approved')} className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/30">Approve</button>
                <button onClick={() => approveReg(r.id, 'rejected')} className="px-3 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30">Reject</button>
                <button onClick={() => approveReg(r.id, 'correction_required')} className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/30">Request Correction</button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl text-white">Tournament Manager</h2>
          <p className="text-xs text-gray-500 mt-0.5">Create, edit and manage all tournaments. Control registrations and room IDs.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">+ New Tournament</button>
      </div>

      {tournaments.length === 0 && !showForm && (
        <div className="p-10 rounded-xl border border-white/5 bg-white/3 text-center text-gray-500 text-sm">No tournaments yet. Click <strong className="text-orange-400">+ New Tournament</strong> to create one.</div>
      )}

      <div className="space-y-3">
        {tournaments.map(t => {
          const regCount = (getDB().registrations || []).filter(r => r.tournamentId === t.id).length;
          return (
            <div key={t.id} className="p-5 rounded-xl border border-white/5 bg-white/3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {t.logo ? <Image src={t.logo} alt="" objectFit="cover" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center text-xl">🏆</div>}
                  <div>
                    <h3 className="font-bold text-white">{t.title}</h3>
                    <p className="text-xs text-gray-500">{t.game} · {t.type} · {t.slots} slots · {t.entryType === 'free' ? 'Free' : `₹${t.entryFee}`}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Match: {t.matchDate} {t.matchTime} · Deadline: {t.registrationDeadline}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.registrationStatus === 'open' ? 'bg-green-500/20 text-green-400' : t.registrationStatus === 'paused' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{t.registrationStatus}</span>
                  <span className="text-xs text-gray-500">{regCount} registrations</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={() => openEdit(t)} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20">Edit</button>
                <button onClick={() => setViewRegs(t.id)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/30">Registrations ({regCount})</button>
                <button onClick={() => exportCSV(t.id)} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/30">Export CSV</button>
                {t.registrationStatus !== 'open' && <button onClick={() => setStatus(t.id, 'open')} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold">Open Reg</button>}
                {t.registrationStatus !== 'paused' && <button onClick={() => setStatus(t.id, 'paused')} className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-semibold">Pause</button>}
                {t.registrationStatus !== 'closed' && <button onClick={() => setStatus(t.id, 'closed')} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold">Close</button>}
                {!t.roomIdReleased && t.roomId && <button onClick={() => releaseRoom(t.id)} className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-semibold hover:bg-orange-500/30">Release Room ID</button>}
                {t.roomIdReleased && <span className="px-3 py-1.5 text-xs text-green-400 font-semibold">✓ Room ID Released</span>}
                <button onClick={() => del(t.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20">Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-white">{editId ? 'Edit Tournament' : 'Create Tournament'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xl font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Tournament Title</label><input className="inp" placeholder="e.g. ${ADMIN_BRAND_NAME} Free Fire Cup" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div>
                <label className="label">Game <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
                <input className="inp" list="tourn-games-list" placeholder="e.g. Free Fire, BGMI..." value={form.game} onChange={e => setForm(f => ({ ...f, game: e.target.value }))} />
                <datalist id="tourn-games-list">
                  {['Free Fire','BGMI','PUBG KR','COD Mobile','Valorant','Apex Legends'].map(g => <option key={g} value={g} />)}
                </datalist>
              </div>
              <div>
                <label className="label">Format <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
                <input className="inp" list="tourn-types-list" placeholder="e.g. Solo, Squad, Duo..." value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
                <datalist id="tourn-types-list">
                  {['Solo','Duo','Squad','Custom Lobby','Trio','4-Man','5-Man'].map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div><label className="label">Total Slots</label><input className="inp" type="number" value={form.slots} onChange={e => setForm(f => ({ ...f, slots: Number(e.target.value) }))} /></div>
              <div><label className="label">Prize Pool</label><input className="inp" placeholder="₹10,000" value={form.prizePool} onChange={e => setForm(f => ({ ...f, prizePool: e.target.value }))} /></div>
              <div><label className="label">Entry Type</label><Combobox className="inp" value={form.entryType} onChange={e => setForm(f => ({ ...f, entryType: e.target.value as 'free' | 'paid' }))}><option value="free">Free</option><option value="paid">Paid</option></Combobox></div>
              {form.entryType === 'paid' && <div><label className="label">Entry Fee (₹)</label><input className="inp" type="number" value={form.entryFee} onChange={e => setForm(f => ({ ...f, entryFee: Number(e.target.value) }))} /></div>}
              {form.entryType === 'paid' && <div className="col-span-2"><label className="label">UPI ID</label><input className="inp" placeholder="yourname@upi" value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} /></div>}
              {form.entryType === 'paid' && (
                <div className="col-span-2">
                  <label className="label">UPI QR Code</label>
                  <div className="flex items-center gap-3 mt-1">{form.upiQr && <Image src={form.upiQr} alt="QR" objectFit="contain" className="h-16 rounded object-contain" />}<label className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold hover:bg-white/20">Upload QR<input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" /></label></div>
                </div>
              )}
              <div><label className="label">Registration Deadline</label><input className="inp" type="date" value={form.registrationDeadline} onChange={e => setForm(f => ({ ...f, registrationDeadline: e.target.value }))} /></div>
              <div><label className="label">Match Date</label><input className="inp" type="date" value={form.matchDate} onChange={e => setForm(f => ({ ...f, matchDate: e.target.value }))} /></div>
              <div><label className="label">Match Time</label><input className="inp" type="time" value={form.matchTime} onChange={e => setForm(f => ({ ...f, matchTime: e.target.value }))} /></div>
              <div>
                <label className="label">Registration Status <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
                <input
                  className="inp"
                  list="tourn-reg-status-list"
                  value={form.registrationStatus}
                  onChange={e => setForm(f => ({ ...f, registrationStatus: e.target.value }))}
                  placeholder="e.g. open, paused, closed..."
                />
                <datalist id="tourn-reg-status-list">
                  {['open', 'paused', 'closed'].map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div><label className="label">Room ID</label><input className="inp" placeholder="Room ID here" value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))} /></div>
              <div><label className="label">Room Password</label><input className="inp" placeholder="Password" value={form.roomPassword} onChange={e => setForm(f => ({ ...f, roomPassword: e.target.value }))} /></div>
              <div className="col-span-2"><label className="label">Tournament Logo</label><div className="flex items-center gap-3 mt-1">{form.logo && <Image src={form.logo} alt="" objectFit="contain" className="h-12 rounded object-contain" />}<label className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold hover:bg-white/20">Upload Logo<input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /></label></div></div>
              <div className="col-span-2"><label className="label">Rules</label><textarea className="inp min-h-[80px]" placeholder="Tournament rules..." value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} /></div>
              <div className="col-span-2"><label className="label">Description</label><textarea className="inp min-h-[60px]" placeholder="Short description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5"><span className="text-sm text-white font-semibold">Visible on website</span><button onClick={() => setForm(f => ({ ...f, visible: !f.visible }))} className={`relative w-10 h-5 rounded-full transition-all ${form.visible ? 'bg-orange-500' : 'bg-gray-700'}`}><div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? 'left-5' : 'left-0.5'}`} /></button></div>

            {saveError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                ⚠️ {saveError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? '⏳ SAVING...' : editId ? 'Save Changes' : 'Create Tournament'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold hover:bg-white/20">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
