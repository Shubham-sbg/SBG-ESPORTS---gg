/**
 * AdminWebsiteManager — Multi-website control panel.
 * Allows Super Admin to switch context between SBG ARMY, SBG PRO, and future sites.
 * Auth is shared: the same JWT works on all sites.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';
import { apiUrl } from '@/lib/api';

const GOLD = '#d4af37';

interface Website {
  id: string;
  name: string;
  description: string;
  url: string;
  adminPath: string;
  logo: string;
  color: string;
  badge?: string;
  status: 'live' | 'maintenance' | 'offline';
  isCurrentSite?: boolean;
}

const WEBSITES: Website[] = [
  {
    id: 'sbg-army',
    name: ADMIN_BRAND_NAME,
    description: 'Main esports platform — players, tournaments, news, community',
    url: '/',
    adminPath: '/sbg-admin',
    logo: 'SBG',
    color: '#d4af37',
    badge: 'MAIN',
    status: 'live',
    isCurrentSite: true,
  },
  {
    id: 'sbg-pro',
    name: 'SBG PRO',
    description: 'Enterprise platform — advanced roster, analytics, premium features',
    url: '/sbg-pro/',
    adminPath: '/sbg-pro/admin',
    logo: 'PRO',
    color: '#ff6b00',
    badge: 'ENTERPRISE',
    status: 'live',
  },
];

interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  superAdmins: number;
  admins: number;
}

export default function AdminWebsiteManager() {
  const [staffStats, setStaffStats] = useState<StaffStats>({ totalStaff: 0, activeStaff: 0, superAdmins: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'websites' | 'access' | 'auth'>('websites');
  const [copyMsg, setCopyMsg] = useState('');
  const adminToken = typeof sessionStorage !== 'undefined' ? '' : '';

  useEffect(() => {
    loadStaffStats();
  }, []);

  const loadStaffStats = async () => {
    try {
      const token = '' || '' || '';
      const r = await fetch(apiUrl('/api/db/staffAccounts'), { credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (r.ok) {
        const accounts = await r.json() as any[];
        if (Array.isArray(accounts)) {
          setStaffStats({
            totalStaff: accounts.length,
            activeStaff: accounts.filter(a => a.active).length,
            superAdmins: accounts.filter(a => a.role === 'super_admin').length,
            admins: accounts.filter(a => a.role === 'admin' || a.role === 'super_admin').length,
          });
        }
      }
    } catch {}
    setLoading(false);
  };

  const copyToken = () => {
    if (!adminToken) return;
    navigator.clipboard.writeText(adminToken).then(() => {
      setCopyMsg('Copied!');
      setTimeout(() => setCopyMsg(''), 2000);
    }).catch(() => setCopyMsg('Error'));
  };

  const TABS = [
    { id: 'websites' as const, label: 'All Websites', icon: '🌐' },
    { id: 'access' as const, label: 'Access Control', icon: '🔐' },
    { id: 'auth' as const, label: 'Auth Info', icon: '🔑' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl text-white tracking-widest">🌐 WEBSITE MANAGER</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage all websites from one panel · Shared authentication</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-black text-green-400">UNIFIED AUTH ACTIVE</span>
        </div>
      </div>

      {/* Auth Banner */}
      <div className="p-4 rounded-2xl border"
        style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.02))', borderColor: 'rgba(212,175,55,0.15)' }}>
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">🔒</span>
          <div>
            <p className="text-xs font-black text-white mb-1 tracking-wide">SINGLE SIGN-ON ACTIVE</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your admin JWT works across <strong className="text-gold">all websites</strong>. Log in once on ${ADMIN_BRAND_NAME} admin,
              then access SBG PRO admin directly — no re-authentication needed. The same staff accounts,
              roles, and permissions apply everywhere.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === t.id ? 'text-white border-b-2' : 'text-gray-500 hover:text-gray-300'}`}
            style={activeTab === t.id ? { borderBottomColor: GOLD } : {}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {/* ── Websites Tab ── */}
          {activeTab === 'websites' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">All websites in the SBG ecosystem. Click a site's admin link to manage it with your current JWT.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {WEBSITES.map(site => (
                  <div key={site.id}
                    className="relative p-5 rounded-2xl border transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${site.color}08, transparent)`,
                      borderColor: `${site.color}25`,
                    }}>
                    {site.isCurrentSite && (
                      <div className="absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                        CURRENT SITE
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm text-black flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${site.color}, ${site.color}99)` }}>
                        {site.logo}
                      </div>
                      <div>
                        <div className="font-black text-white text-sm tracking-wide">{site.name}</div>
                        {site.badge && (
                          <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded"
                            style={{ background: `${site.color}20`, color: site.color }}>
                            {site.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">{site.description}</p>
                    <div className="flex gap-2">
                      <a href={site.url} target="_blank"
                        className="flex-1 py-2 rounded-lg text-xs font-bold text-center transition-all text-gray-400 border border-white/8 hover:text-white hover:border-white/20">
                        🌐 View Site
                      </a>
                      <a href={site.adminPath} target={site.isCurrentSite ? '_self' : '_blank'}
                        className="flex-1 py-2 rounded-lg text-xs font-black text-center text-black transition-all"
                        style={{ background: `linear-gradient(135deg, ${site.color}, ${site.color}cc)` }}>
                        ⚙ Manage
                      </a>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                      <span className={`w-1.5 h-1.5 rounded-full ${site.status === 'live' ? 'bg-green-400 animate-pulse' : site.status === 'maintenance' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${site.status === 'live' ? 'text-green-400' : site.status === 'maintenance' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {site.status}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Future site placeholder */}
                <div className="p-5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]"
                  style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div className="text-3xl opacity-30">➕</div>
                  <div>
                    <p className="text-xs font-black text-gray-600 tracking-widest uppercase">Future Website</p>
                    <p className="text-[10px] text-gray-700 mt-1">Add new sites to the ecosystem</p>
                  </div>
                  <div className="px-4 py-2 rounded-lg text-[10px] font-black text-gray-700 border border-white/5">
                    Coming Soon
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Access Control Tab ── */}
          {activeTab === 'access' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Staff accounts and role assignments are shared across all websites.</p>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Staff', value: loading ? '—' : staffStats.totalStaff, color: GOLD, icon: '👥' },
                  { label: 'Active', value: loading ? '—' : staffStats.activeStaff, color: '#10b981', icon: '✅' },
                  { label: 'Super Admins', value: loading ? '—' : staffStats.superAdmins, color: '#ff6b00', icon: '👑' },
                  { label: 'Admins', value: loading ? '—' : staffStats.admins, color: '#60a5fa', icon: '🔐' },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-white/3 text-center">
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Role matrix */}
              <div className="p-5 rounded-2xl border border-white/8 bg-white/2">
                <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase mb-4">ROLE PERMISSIONS MATRIX</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/8">
                        <th className="text-left text-gray-500 py-2 font-bold">Role</th>
                        <th className="text-center text-gray-500 py-2 font-bold">{ADMIN_BRAND_NAME}</th>
                        <th className="text-center text-gray-500 py-2 font-bold">SBG PRO</th>
                        <th className="text-center text-gray-500 py-2 font-bold">Future Sites</th>
                        <th className="text-left text-gray-500 py-2 font-bold">Scope</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[
                        { role: '👑 Super Admin', army: '✅ Full', pro: '✅ Full', future: '✅ Full', scope: 'All modules, all sites' },
                        { role: '🔐 Admin', army: '✅ Full', pro: '✅ Full', future: '✅ Full', scope: 'All modules (no role management)' },
                        { role: '⚔ Tournament Admin', army: '⚽ Tournaments', pro: '⚽ Tournaments', future: '—', scope: 'Tournaments & registrations' },
                        { role: '📸 Media Admin', army: '📸 Media', pro: '📸 Media', future: '—', scope: 'Gallery, videos, news' },
                        { role: '✍ Content Editor', army: '✍ Content', pro: '✍ Content', future: '—', scope: 'News, pages, CMS' },
                        { role: '🛡 Moderator', army: '🛡 Community', pro: '🛡 Community', future: '—', scope: 'Messages, reports, fan connect' },
                        { role: '👁 Viewer', army: '👁 Read-only', pro: '👁 Read-only', future: '—', scope: 'Dashboard & analytics only' },
                      ].map(r => (
                        <tr key={r.role} className="hover:bg-white/2 transition-colors">
                          <td className="py-2.5 text-white font-semibold">{r.role}</td>
                          <td className="py-2.5 text-center text-gray-400">{r.army}</td>
                          <td className="py-2.5 text-center text-gray-400">{r.pro}</td>
                          <td className="py-2.5 text-center text-gray-600">{r.future}</td>
                          <td className="py-2.5 text-gray-600">{r.scope}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <p className="text-xs text-blue-400">
                  <strong>Note:</strong> To manage staff accounts, go to{' '}
                  <button className="underline hover:text-white" onClick={() => (window as any).__sbgSetModule?.('staff_manager')}>
                    Staff Manager
                  </button>.
                  Changes apply instantly to all websites.
                </p>
              </div>
            </div>
          )}

          {/* ── Auth Info Tab ── */}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">JWT-based authentication shared across all SBG websites.</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-white/8 bg-white/2 space-y-3">
                  <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase">AUTH DETAILS</h3>
                  {[
                    ['Type', 'JWT (JSON Web Token)'],
                    ['Algorithm', 'HS256 (HMAC-SHA256)'],
                    ['Token TTL', '8 hours'],
                    ['Refresh Interval', '6 hours'],
                    ['Storage', 'sessionStorage (tab-scoped)'],
                    ['Rate Limit', '8 attempts / minute'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-bold">{k}</span>
                      <span className="text-xs text-gray-300 font-mono">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-2xl border border-white/8 bg-white/2 space-y-3">
                  <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase">ENDPOINTS</h3>
                  {[
                    ['Login', 'POST /api/admin/login'],
                    ['Verify', 'GET /api/admin/verify'],
                    ['Refresh', 'POST /api/admin/refresh'],
                    ['Setup', 'POST /api/admin/setup'],
                    ['Add Staff', 'POST /api/admin/staff'],
                    ['Delete Staff', 'DELETE /api/admin/staff/:id'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-bold">{k}</span>
                      <span className="text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {adminToken && (
                <div className="p-4 rounded-xl border border-white/8 bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase">CURRENT SESSION TOKEN</h3>
                    <button onClick={copyToken}
                      className="px-3 py-1 rounded-lg text-[10px] font-black text-black transition-all"
                      style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)' }}>
                      {copyMsg || '📋 COPY JWT'}
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-700 font-mono break-all leading-relaxed">
                    {adminToken.slice(0, 60)}…
                  </p>
                  <p className="text-[10px] text-gray-600 mt-2">
                    This token works on all SBG sites. Use it in the Authorization: Bearer header for API calls.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                <p className="text-xs text-yellow-400">
                  <strong>Cross-site admin access:</strong> To open SBG PRO's admin with your current session,
                  use the "Manage" button on the SBG PRO card in the Websites tab.
                  Your JWT is automatically recognized.
                </p>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
