import { useEffect, useRef, useState, useCallback } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { verifyPlayerSession, logoutPlayer } from '@/lib/playerAuth';
type SupabaseProfile = any;
const uploadFile = async (f) => f.name;


interface SupabaseOrder {
  id: string;
  product_name: string;
  size?: string;
  color?: string;
  custom_name?: string;
  custom_number?: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  payment_screenshot_url?: string;
}

interface SupabaseTournamentReg {
  id: string;
  team_name: string;
  status: string;
  created_at: string;
  tournaments: { name: string; game: string } | null;
}

export default function PlayerDashboardPage() {
  const { db, loading } = useDatabase();
  const tracked = useRef(false);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [registrations, setRegistrations] = useState<SupabaseTournamentReg[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', uid: '', game: '', whatsapp: '', country: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'registrations' | 'matches'>('orders');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const session = await verifyPlayerSession();
    if (!session) { window.location.href = '/player-login'; return; }

    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (profileData) {
      setProfile(profileData as SupabaseProfile);
      setEditForm({
        username: profileData.username || '',
        uid: profileData.uid || '',
        game: profileData.game || '',
        whatsapp: profileData.whatsapp || '',
        country: profileData.country || '',
      });
    }

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (ordersData) setOrders(ordersData as SupabaseOrder[]);

    const { data: regsData } = await supabase
      .from('tournament_registrations')
      .select('id, team_name, status, created_at, tournaments(name, game)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (regsData) setRegistrations(regsData as unknown as SupabaseTournamentReg[]);

    setPageLoading(false);
  }, []);

  useEffect(() => {
    applyTheme(db.settings);
    if (!tracked.current) { tracked.current = true; }
    if (!loading) loadData();
  }, [loading, db.settings, loadData]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase.channel('orders-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
        filter: `user_id=eq.${profile.id}`,
      }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, loadData]);

  const handleLogout = async () => {
    await logoutPlayer();
    window.location.href = '/player-login';
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('users').update({
      username: editForm.username.trim(),
      uid: editForm.uid.trim(),
      game: editForm.game,
      whatsapp: editForm.whatsapp.trim(),
      country: editForm.country.trim(),
    }).eq('id', profile.id);
    setSaving(false);
    if (!error) {
      setProfile(p => p ? { ...p, ...editForm } : null);
      setEditMode(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); return; }
    setAvatarUploading(true);
    const path = `avatars/${profile.id}/${Date.now()}.${file.name.split('.').pop()}`;
    const url = await uploadFile('avatars', path, file);
    if (url) {
      await supabase.from('users').update({ avatar_url: url }).eq('id', profile.id);
      setProfile(p => p ? { ...p, avatar_url: url } : null);
    }
    setAvatarUploading(false);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const approvedOrders = orders.filter(o => o.status === 'approved').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const rejectedOrders = orders.filter(o => o.status === 'rejected').length;
  const approvedRegs = registrations.filter(r => r.status === 'approved').length;
  const upcomingMatches = (db.matches || []).filter(m => m.status === 'upcoming').slice(0, 3);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      registered: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return map[status] || 'bg-white/10 text-gray-400 border-white/20';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />

      <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Player Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back, <span className="text-orange-400 font-bold">{profile.username || profile.email}</span></p>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-bold border border-red-500/20 hover:bg-red-500/20 transition-all">
            Logout
          </button>
        </div>

        {saved && <div className="mb-4 p-3 rounded-lg bg-green-500/20 text-green-400 text-sm font-bold border border-green-500/30">✅ Profile saved successfully!</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-white">My Profile</h2>
                {!editMode && (
                  <button onClick={() => setEditMode(true)} className="text-xs text-orange-400 hover:text-orange-300 border border-orange-400/30 px-3 py-1 rounded-lg transition-all">
                    Edit
                  </button>
                )}
              </div>

              <div className="relative w-20 h-20 group">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-orange-500/30">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl font-black text-white">
                      {(profile.username || profile.email || 'P').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {avatarUploading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-white text-xs font-bold">📷</span>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>

              {editMode ? (
                <div className="space-y-3">
                  {[
                    { key: 'username', label: 'Username' },
                    { key: 'uid', label: 'Game UID' },
                    { key: 'game', label: 'Game' },
                    { key: 'whatsapp', label: 'WhatsApp' },
                    { key: 'country', label: 'Country' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="label">{label}</label>
                      <input className="inp text-sm" value={editForm[key as keyof typeof editForm]}
                        onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveProfile} disabled={saving}
                      className="flex-1 py-2 rounded-lg bg-orange-500 text-black text-xs font-black disabled:opacity-50 transition-all">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditMode(false)}
                      className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/15 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <Row label="Email" value={profile.email} />
                  <Row label="Username" value={profile.username || '—'} accent />
                  <Row label="Game UID" value={profile.uid || '—'} mono />
                  <Row label="Game" value={profile.game || '—'} />
                  <Row label="WhatsApp" value={profile.whatsapp || '—'} />
                  <Row label="Country" value={profile.country || '—'} />
                  <div className="pt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${profile.role === 'admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {profile.role === 'admin' ? '👑 Admin' : '🎮 Player'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <h3 className="font-bold text-white text-sm mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Orders" value={orders.length} color="text-white" />
                <Stat label="Approved" value={approvedOrders} color="text-green-400" />
                <Stat label="Pending" value={pendingOrders} color="text-yellow-400" />
                <Stat label="Rejected" value={rejectedOrders} color="text-red-400" />
                <Stat label="Tournaments" value={registrations.length} color="text-blue-400" />
                <Stat label="Qualified" value={approvedRegs} color="text-orange-400" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="flex gap-2">
              {(['orders', 'registrations', 'matches'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>
                  {tab === 'orders' ? `Orders (${orders.length})` : tab === 'registrations' ? `Tournaments (${registrations.length})` : 'Matches'}
                </button>
              ))}
            </div>

            {activeTab === 'orders' && (
              <div className="rounded-2xl border border-white/10 bg-white/3 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-white">My Orders</h2>
                  <a href="/shop" className="text-xs text-orange-400 hover:underline">Visit Shop →</a>
                </div>
                {orders.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">🛍️</div>
                    <p className="text-gray-500 text-sm">No orders placed yet.</p>
                    <a href="/shop" className="mt-3 inline-block text-xs text-orange-400 hover:underline">Browse Shop</a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(o => (
                      <div key={o.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm truncate">{o.product_name}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {o.size && <span className="text-xs text-gray-500">Size: {o.size}</span>}
                              {o.color && <span className="text-xs text-gray-500">Color: {o.color}</span>}
                              {o.custom_name && <span className="text-xs text-gray-500">Name: {o.custom_name}</span>}
                              {o.custom_number && <span className="text-xs text-gray-500">No: #{o.custom_number}</span>}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{new Date(o.created_at).toLocaleDateString('en-IN')}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusBadge(o.status)}`}>
                              {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                            </span>
                            <span className="text-xs text-orange-400 font-bold">₹{o.total_amount}</span>
                          </div>
                        </div>
                        {o.payment_screenshot_url && (
                          <button onClick={() => setLightboxImg(o.payment_screenshot_url!)}
                            className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:underline">
                            <span>📸</span> View payment proof
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'registrations' && (
              <div className="rounded-2xl border border-white/10 bg-white/3 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-white">My Registrations</h2>
                  <a href="/tournaments" className="text-xs text-orange-400 hover:underline">View Tournaments →</a>
                </div>
                {registrations.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">🏆</div>
                    <p className="text-gray-500 text-sm">No tournament registrations yet.</p>
                    <a href="/tournaments" className="mt-3 inline-block text-xs text-orange-400 hover:underline">Browse Tournaments</a>
                  </div>
                ) : (
                  <div className="relative pl-5 border-l border-white/10 space-y-4">
                    {registrations.map((r, i) => (
                      <div key={r.id} className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-orange-500 bg-[#0a0a0f]" />
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-white text-sm">{r.tournaments?.name || 'Tournament'}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{r.tournaments?.game} · Team: {r.team_name}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border flex-shrink-0 ${statusBadge(r.status)}`}>
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        {i < registrations.length - 1 && <div className="h-4" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'matches' && (
              <div className="rounded-2xl border border-white/10 bg-white/3 p-6">
                <h2 className="font-black text-white mb-4">Upcoming Matches</h2>
                {upcomingMatches.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">No upcoming matches scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingMatches.map(m => (
                      <div key={m.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">{m.title}</p>
                          <p className="text-xs text-gray-500">vs {m.opponent} · {m.date} {m.time}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">{m.game}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer settings={db.settings} navigation={db.navigation} />

      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-orange-400 transition-colors">✕</button>
          <img src={lightboxImg} alt="Payment proof" className="max-w-full max-h-[90vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-gray-500 text-xs flex-shrink-0">{label}:</span>
      <span className={`text-xs text-right truncate ${accent ? 'text-orange-400 font-semibold' : mono ? 'text-orange-300 font-mono font-bold' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
      <div className={`font-black text-xl ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
