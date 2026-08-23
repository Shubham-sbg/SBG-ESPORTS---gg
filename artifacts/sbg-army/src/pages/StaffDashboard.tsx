import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { destroyStaffSession, getStaffEmail, getStaffRole, getStaffAllowedModules, getStaffName, ADMIN_MODULES } from '@/lib/auth';
import type { AdminModule } from '@/lib/auth';
import { MODULE_LABELS, MODULE_ICONS, ROLE_COLORS, ROLE_LABELS } from '@/lib/roles';
import AdminRoster from '@/components/admin/AdminRoster';
import AdminMatches from '@/components/admin/AdminMatches';
import AdminSponsors from '@/components/admin/AdminSponsors';
import AdminNews from '@/components/admin/AdminNews';
import AdminGames from '@/components/admin/AdminGames';
import AdminSchedule from '@/components/admin/AdminSchedule';
import AdminCreators from '@/components/admin/AdminCreators';
import AdminFounders from '@/components/admin/AdminFounders';
import AdminShop from '@/components/admin/AdminShop';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

export default function StaffDashboard() {
  const { db, refresh, loading } = useDatabase();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const staffName = getStaffName();
  const staffEmail = getStaffEmail();
  const staffRole = getStaffRole();
  const rawModules = staffRole === 'admin' ? ADMIN_MODULES : getStaffAllowedModules();
  const allowedModules = rawModules as AdminModule[];

  const [activeModule, setActiveModule] = useState<AdminModule>(
    allowedModules.length > 0 ? allowedModules[0] : 'roster'
  );

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [db.settings, loading]);

  const handleLogout = () => {
    destroyStaffSession();
    navigate('/staff');
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'roster': return <AdminRoster players={db.players} games={db.games} onRefresh={refresh} />;
      case 'matches': return <AdminMatches matches={db.matches} games={db.games} onRefresh={refresh} />;
      case 'schedule': return <AdminSchedule schedule={db.schedule ?? []} games={db.games} onRefresh={refresh} />;
      case 'sponsors': return <AdminSponsors sponsors={db.sponsors} onRefresh={refresh} />;
      case 'news': return <AdminNews posts={db.posts} onRefresh={refresh} />;
      case 'games': return <AdminGames games={db.games} onRefresh={refresh} />;
      case 'creators': return <AdminCreators creators={db.creators ?? []} onRefresh={refresh} />;
      case 'founders': return <AdminFounders founders={db.founders ?? []} onRefresh={refresh} />;
      case 'shop': return <AdminShop shop={db.shop ?? []} onRefresh={refresh} />;
      default: return (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
          <p style={{ margin: 0 }}>Module not available for your role.</p>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#00d4ff', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  if (allowedModules.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <p style={{ color: '#fff', fontSize: '18px', margin: 0 }}>No modules assigned to your account.</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>Contact your admin to enable access.</p>
        <button onClick={handleLogout} style={{ padding: '10px 24px', borderRadius: '8px', background: '#e94560', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}>
          LOGOUT
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Rajdhani', sans-serif" }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
      )}

      <aside style={{
        width: '240px', background: '#111122', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#00d4ff', fontSize: '18px', fontWeight: 700, letterSpacing: '2px', marginBottom: '4px' }}>{db.settings.organizationName || ADMIN_BRAND_NAME}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', background: `${ROLE_COLORS[staffRole]}22`, color: ROLE_COLORS[staffRole], border: `1px solid ${ROLE_COLORS[staffRole]}44` }}>
              {ROLE_LABELS[staffRole]}
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '4px' }}>{staffName || staffEmail}</div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {allowedModules.map(mod => (
            <button key={mod} onClick={() => { setActiveModule(mod); setSidebarOpen(false); }} style={{
              width: '100%', padding: '10px 14px', borderRadius: '8px', border: 'none',
              background: activeModule === mod ? 'rgba(0,212,255,0.15)' : 'transparent',
              color: activeModule === mod ? '#00d4ff' : 'rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              fontSize: '14px', fontWeight: activeModule === mod ? 600 : 400,
              textAlign: 'left', marginBottom: '2px',
              borderLeft: activeModule === mod ? '3px solid #00d4ff' : '3px solid transparent',
            }}>
              <span>{MODULE_ICONS[mod]}</span>
              <span>{MODULE_LABELS[mod]}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.1)', color: '#e94560', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
            LOGOUT
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#111122', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(s => !s)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>☰</button>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
              {MODULE_ICONS[activeModule]} {MODULE_LABELS[activeModule]}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', display: 'none' }}>{staffEmail}</span>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: `${ROLE_COLORS[staffRole]}22`, color: ROLE_COLORS[staffRole], border: `1px solid ${ROLE_COLORS[staffRole]}44` }}>
              {ROLE_LABELS[staffRole]}
            </span>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto', color: '#fff' }}>
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
