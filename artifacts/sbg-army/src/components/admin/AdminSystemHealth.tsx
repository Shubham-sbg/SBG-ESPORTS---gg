import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  healthMonitor,
  ErrorLog, ErrorSeverity, ErrorStatus, ErrorPriority,
  HealthScores, SecurityIssue, DbIssue, ServiceStatus,
  AiAnalysis, ScheduledCheck, PerformanceSnapshot,
} from '@/lib/healthMonitor';
import { useDatabase } from '@/hooks/useDatabase';
import Combobox from '@/components/shared/Combobox';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<ErrorSeverity, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', dot: '#ef4444' },
  high:     { label: 'HIGH',     color: '#f97316', bg: 'rgba(249,115,22,0.12)', dot: '#f97316' },
  medium:   { label: 'MEDIUM',   color: '#eab308', bg: 'rgba(234,179,8,0.12)',  dot: '#eab308' },
  low:      { label: 'LOW',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', dot: '#3b82f6' },
  info:     { label: 'INFO',     color: '#6b7280', bg: 'rgba(107,114,128,0.1)', dot: '#6b7280' },
};

const STATUS_CONFIG: Record<ServiceStatus['status'], { label: string; color: string; bg: string }> = {
  online:   { label: 'Online',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  degraded: { label: 'Degraded', color: '#eab308', bg: 'rgba(234,179,8,0.12)'  },
  offline:  { label: 'Offline',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  unknown:  { label: 'Unknown',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

const TYPE_ICONS: Record<string, string> = {
  javascript: '⚡', network: '🌐', console: '🖥️', promise: '🔄',
  image: '🖼️', performance: '📊', security: '🔒', api: '🔌', database: '🗄️',
};

function scoreColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#eab308';
  if (score >= 50) return '#f97316';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Critical';
}

function relativeTime(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-black text-white" style={{ fontSize: size * 0.22 }}>{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">{label}</span>
      <span className="text-[9px] font-black" style={{ color }}>{scoreLabel(score)}</span>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: ErrorSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }: { status: ServiceStatus['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: cfg.color }} />
      <span className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
    </span>
  );
}

function Btn({ onClick, children, variant = 'default', disabled }: {
  onClick?: () => void; children: React.ReactNode; variant?: 'default' | 'danger' | 'gold' | 'green'; disabled?: boolean;
}) {
  const styles: Record<string, string> = {
    default: 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
    gold: 'text-black font-black hover:opacity-90',
    green: 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${styles[variant]}`}
      style={variant === 'gold' ? { background: 'linear-gradient(135deg, #d4af37, #b8960c)' } : {}}>
      {children}
    </button>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'errors' | 'performance' | 'security' | 'database' | 'ai' | 'reports' | 'recovery';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview',     label: 'Overview',     icon: '🏠' },
  { id: 'errors',       label: 'Error Log',    icon: '🐛' },
  { id: 'performance',  label: 'Performance',  icon: '⚡' },
  { id: 'security',     label: 'Security',     icon: '🔒' },
  { id: 'database',     label: 'DB Integrity', icon: '🗄️' },
  { id: 'ai',           label: 'AI Analyzer',  icon: '🤖' },
  { id: 'reports',      label: 'Reports',      icon: '📄' },
  { id: 'recovery',     label: 'Recovery',     icon: '🔧' },
];

// ─── Backend Infrastructure Health ────────────────────────────────────────────

interface BackendInfraHealth {
  status: string;
  timestamp: number;
  uptime: number;
  services: Record<string, { status: string; latency?: number; details: string }>;
  lastBackup: number | null;
  lastSync: number | null;
  memoryMb: { used: number; total: number };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSystemHealth() {
  const { db } = useDatabase();
  const [tab, setTab] = useState<Tab>('overview');
  const [, forceUpdate] = useState(0);
  const [scores, setScores] = useState<HealthScores>({ overall: 100, performance: 100, security: 100, seo: 100, accessibility: 100, errorHealth: 100 });
  const [healResult, setHealResult] = useState<{ success: boolean; message: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [backendHealth, setBackendHealth] = useState<BackendInfraHealth | null>(null);
  const mounted = useRef(true);

  // Poll backend health endpoint every 30 s
  useEffect(() => {
    const poll = async () => {
      try {
        const token = '' || '' || '';
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const r = await fetch('/api/health/detailed', { credentials: "include", headers });
        if (r.ok) setBackendHealth(await r.json() as BackendInfraHealth);
      } catch {}
    };
    poll();
    const t = setInterval(poll, 30_000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(() => {
    if (!mounted.current) return;
    forceUpdate(n => n + 1);
    setScores(healthMonitor.calculateHealthScores());
  }, []);

  useEffect(() => {
    mounted.current = true;
    healthMonitor.init();
    // Run initial scans after a short delay to let the page settle
    const initTimer = setTimeout(() => {
      if (!mounted.current) return;
      healthMonitor.runSecurityScan();
      healthMonitor.checkDbIntegrity(db as unknown as Record<string, unknown>);
      setScores(healthMonitor.calculateHealthScores());
    }, 1000);
    const unsub = healthMonitor.subscribe(refresh);
    return () => {
      mounted.current = false;
      clearTimeout(initTimer);
      unsub();
    };
  }, [refresh]);

  useEffect(() => {
    healthMonitor.checkDbIntegrity(db as unknown as Record<string, unknown>);
  }, [db]);

  const errors = healthMonitor.getErrors();
  const services = healthMonitor.getServices();
  const security = healthMonitor.getSecurityResults();
  const dbIssues = healthMonitor.getDbIssues();
  const metrics = healthMonitor.getMetrics();
  const scheduledChecks = healthMonitor.getScheduledChecks();
  const newErrors = errors.filter(e => e.status === 'new').length;

  const handleHeal = async (action: string) => {
    setHealResult(null);
    const result = await healthMonitor.heal(action);
    setHealResult(result);
    refresh();
    setTimeout(() => setHealResult(null), 4000);
  };

  const runScan = async () => {
    setScanning(true);
    await new Promise(r => setTimeout(r, 500));
    healthMonitor.runSecurityScan();
    healthMonitor.checkDbIntegrity(db as unknown as Record<string, unknown>);
    await healthMonitor.checkServices();
    setScores(healthMonitor.calculateHealthScores());
    setScanning(false);
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-black text-xl text-white tracking-widest">🛡️ SYSTEM HEALTH</h2>
          <p className="text-xs text-gray-500 mt-0.5">Auto-monitoring · Error detection · Self-healing diagnostics</p>
        </div>
        <div className="flex items-center gap-3">
          {newErrors > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg animate-pulse"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-black text-red-400">{newErrors} NEW {newErrors === 1 ? 'ERROR' : 'ERRORS'}</span>
            </div>
          )}
          <Btn onClick={runScan} disabled={scanning} variant="gold">
            {scanning ? '⟳ SCANNING...' : '▶ RUN SCAN'}
          </Btn>
        </div>
      </div>

      {/* Heal result toast */}
      <AnimatePresence>
        {healResult && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl text-sm font-bold border"
            style={healResult.success
              ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }
              : { background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
            {healResult.success ? '✅' : '❌'} {healResult.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-white/5 pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1.5 ${tab === t.id ? 'text-white border-b-2' : 'text-gray-500 hover:text-gray-300'}`}
            style={tab === t.id ? { borderBottomColor: '#d4af37' } : {}}>
            <span>{t.icon}</span>{t.label}
            {t.id === 'errors' && newErrors > 0 && (
              <span className="px-1 rounded-full text-[9px] font-black text-black" style={{ background: '#ef4444', minWidth: 16, textAlign: 'center' }}>{newErrors}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {tab === 'overview'    && <OverviewTab scores={scores} services={services} errors={errors} scheduledChecks={scheduledChecks} metrics={metrics} onHeal={handleHeal} onTabChange={setTab} backendHealth={backendHealth} />}
          {tab === 'errors'      && <ErrorsTab errors={errors} />}
          {tab === 'performance' && <PerformanceTab metrics={metrics} />}
          {tab === 'security'    && <SecurityTab issues={security} onScan={() => { healthMonitor.runSecurityScan(); refresh(); }} />}
          {tab === 'database'    && <DatabaseTab issues={dbIssues} onScan={() => { healthMonitor.checkDbIntegrity(db as unknown as Record<string, unknown>); refresh(); }} />}
          {tab === 'ai'          && <AiTab errors={errors} />}
          {tab === 'reports'     && <ReportsTab scores={scores} errors={errors} metrics={metrics} services={services} />}
          {tab === 'recovery'    && <RecoveryTab onHeal={handleHeal} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ scores, services, errors, scheduledChecks, metrics, onHeal, onTabChange, backendHealth }: {
  scores: HealthScores; services: ServiceStatus[]; errors: ErrorLog[];
  scheduledChecks: ScheduledCheck[]; metrics: PerformanceSnapshot;
  onHeal: (a: string) => void; onTabChange: (t: Tab) => void;
  backendHealth?: BackendInfraHealth | null;
}) {
  const criticalErrors = errors.filter(e => e.severity === 'critical' && e.status === 'new');
  const highErrors = errors.filter(e => e.severity === 'high' && e.status === 'new');

  return (
    <div className="space-y-6">
      {/* Score Cards */}
      <div className="p-6 rounded-2xl border border-white/8" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.04), rgba(0,0,0,0))' }}>
        <div className="flex flex-wrap items-center justify-around gap-6">
          <ScoreRing score={scores.overall} label="Overall Health" size={100} />
          <div className="h-16 w-px bg-white/5 hidden lg:block" />
          <ScoreRing score={scores.performance} label="Performance" />
          <ScoreRing score={scores.security} label="Security" />
          <ScoreRing score={scores.seo} label="SEO" />
          <ScoreRing score={scores.accessibility} label="Accessibility" />
          <ScoreRing score={scores.errorHealth} label="Error Health" />
        </div>
      </div>

      {/* Backend Infrastructure (live from /health/detailed) */}
      {backendHealth && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase">🖥️ BACKEND INFRASTRUCTURE</h3>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${backendHealth.status === 'healthy' ? 'text-green-400 bg-green-400/10' : backendHealth.status === 'degraded' ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10'}`}>
              {backendHealth.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(backendHealth.services).map(([name, svc]) => {
              const s = svc.status as ServiceStatus['status'];
              const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG.unknown;
              return (
                <div key={name} className="p-3 rounded-xl border text-center"
                  style={{ borderColor: `${cfg.color}30`, background: cfg.bg }}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: cfg.color }} />
                    <span className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold capitalize">{name}</p>
                  {svc.latency !== undefined && <p className="text-[9px] text-gray-600 mt-0.5">{svc.latency}ms</p>}
                  <p className="text-[9px] text-gray-700 mt-0.5 truncate" title={svc.details}>{svc.details}</p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-gray-600">
            <span>Uptime: {backendHealth.uptime < 60 ? `${Math.round(backendHealth.uptime)}s` : backendHealth.uptime < 3600 ? `${Math.floor(backendHealth.uptime / 60)}m` : `${Math.floor(backendHealth.uptime / 3600)}h ${Math.floor((backendHealth.uptime % 3600) / 60)}m`}</span>
            <span>Memory: {backendHealth.memoryMb.used}/{backendHealth.memoryMb.total} MB</span>
            {backendHealth.lastSync ? <span>Last Sync: {relativeTime(backendHealth.lastSync)}</span> : <span className="text-gray-700">Last Sync: —</span>}
            {backendHealth.lastBackup ? <span>Last Backup: {relativeTime(backendHealth.lastBackup)}</span> : <span className="text-gray-700">Last Backup: Never</span>}
          </div>
        </div>
      )}

      {/* Client Service Status */}
      <div>
        <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-3">CLIENT SERVICE STATUS</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {services.map(svc => {
            const cfg = STATUS_CONFIG[svc.status];
            return (
              <div key={svc.name} className="p-3 rounded-xl border text-center"
                style={{ borderColor: `${cfg.color}30`, background: cfg.bg }}>
                <StatusDot status={svc.status} />
                <p className="text-[10px] text-gray-400 mt-1.5 font-semibold leading-tight">{svc.name}</p>
                {svc.latency !== undefined && (
                  <p className="text-[9px] text-gray-600 mt-0.5">{svc.latency}ms</p>
                )}
                {svc.lastChecked && (
                  <p className="text-[9px] text-gray-700 mt-0.5">{relativeTime(svc.lastChecked)}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Alerts */}
      {(criticalErrors.length > 0 || highErrors.length > 0) && (
        <div className="space-y-2">
          <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-3">🚨 ACTIVE ALERTS</h3>
          {[...criticalErrors.slice(0, 3), ...highErrors.slice(0, 3)].map(e => (
            <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl border"
              style={{ borderColor: SEVERITY_CONFIG[e.severity].color + '30', background: SEVERITY_CONFIG[e.severity].bg }}>
              <span className="text-lg flex-shrink-0">{TYPE_ICONS[e.type] || '⚠️'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <SeverityBadge severity={e.severity} />
                  <span className="text-[10px] text-gray-500">{relativeTime(e.timestamp)}</span>
                  {e.count > 1 && <span className="text-[10px] text-gray-600">×{e.count}</span>}
                </div>
                <p className="text-xs text-white font-semibold truncate">{e.message}</p>
                <p className="text-[10px] text-gray-600 truncate">{e.url}</p>
              </div>
              <Btn onClick={() => healthMonitor.resolveError(e.id)} variant="green">Resolve</Btn>
            </div>
          ))}
          <button onClick={() => onTabChange('errors')} className="text-xs text-gold hover:text-white transition-colors">
            View all errors →
          </button>
        </div>
      )}

      {criticalErrors.length === 0 && highErrors.length === 0 && (
        <div className="p-5 rounded-xl border border-green-500/20 bg-green-500/5 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-black text-green-400">No critical or high errors active</p>
            <p className="text-xs text-gray-500">All systems operating normally</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Errors', value: errors.length, color: '#f97316', icon: '🐛' },
          { label: 'New / Unresolved', value: errors.filter(e => e.status === 'new').length, color: '#ef4444', icon: '🚨' },
          { label: 'Resolved', value: errors.filter(e => e.status === 'resolved').length, color: '#10b981', icon: '✅' },
          { label: 'FPS', value: `${metrics.fps}`, color: metrics.fps >= 55 ? '#10b981' : metrics.fps >= 30 ? '#eab308' : '#ef4444', icon: '🎯' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-white/3 text-center">
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Scheduled Checks */}
      {scheduledChecks.length > 0 && (
        <div>
          <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-3">⏱️ SCHEDULED CHECKS</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduledChecks.map(chk => {
              const statusColors: Record<ScheduledCheck['status'], string> = {
                ok: '#10b981', warning: '#eab308', error: '#ef4444', running: '#3b82f6', pending: '#6b7280',
              };
              return (
                <div key={chk.id} className="p-3 rounded-xl border border-white/5 bg-white/3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{chk.name}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ color: statusColors[chk.status], background: statusColors[chk.status] + '20' }}>
                      {chk.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600">{chk.description}</p>
                  {chk.lastRun && <p className="text-[9px] text-gray-700 mt-1">Last: {relativeTime(chk.lastRun)}</p>}
                  {chk.nextRun && <p className="text-[9px] text-gray-700">Next: {relativeTime(chk.nextRun)}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-3">⚡ QUICK ACTIONS</h3>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => onHeal('clear-cache')} variant="default">🧹 Clear Cache</Btn>
          <Btn onClick={() => onHeal('retry-api')} variant="default">🔄 Retry API</Btn>
          <Btn onClick={() => onHeal('reconnect-ws')} variant="default">🔌 Reconnect WS</Btn>
          <Btn onClick={() => onHeal('resolve-all')} variant="green">✅ Resolve All Errors</Btn>
          <Btn onClick={() => onTabChange('recovery')} variant="gold">🔧 Recovery Tools</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Error Log Tab ────────────────────────────────────────────────────────────

function ErrorsTab({ errors }: { errors: ErrorLog[] }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSev, setFilterSev] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'severity' | 'count'>('time');
  const [selected, setSelected] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const refresh = () => forceUpdate(n => n + 1);

  const severities: ErrorSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

  const filtered = errors
    .filter(e => filterType === 'all' || e.type === filterType)
    .filter(e => filterSev === 'all' || e.severity === filterSev)
    .filter(e => filterStatus === 'all' || e.status === filterStatus)
    .filter(e => !search || e.message.toLowerCase().includes(search.toLowerCase()) || e.url.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'severity') return sevOrder[a.severity] - sevOrder[b.severity];
      if (sortBy === 'count') return b.count - a.count;
      return b.timestamp - a.timestamp;
    });

  const types = [...new Set(errors.map(e => e.type))];
  const selectedError = selected ? errors.find(e => e.id === selected) : null;

  const setPriority = (id: string, p: ErrorPriority) => { healthMonitor.updatePriority(id, p); refresh(); };
  const setStatus = (id: string, s: ErrorStatus) => { healthMonitor.updateStatus(id, s); refresh(); };
  const del = (id: string) => { healthMonitor.deleteError(id); if (selected === id) setSelected(null); refresh(); };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search errors..."
          className="flex-1 min-w-[160px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/40" />
        <Combobox value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 focus:outline-none">
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </Combobox>
        <Combobox value={filterSev} onChange={e => setFilterSev(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 focus:outline-none">
          <option value="all">All Severities</option>
          {severities.map(s => <option key={s} value={s}>{s}</option>)}
        </Combobox>
        <Combobox value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
        </Combobox>
        <Combobox value={sortBy} onChange={e => setSortBy(e.target.value as 'time' | 'severity' | 'count')}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 focus:outline-none">
          <option value="time">Sort: Newest</option>
          <option value="severity">Sort: Severity</option>
          <option value="count">Sort: Frequency</option>
        </Combobox>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500">{filtered.length} of {errors.length} errors</span>
        <div className="flex gap-2">
          <Btn onClick={() => { healthMonitor.exportCsv(filtered); }}>⬇ CSV</Btn>
          <Btn onClick={() => { healthMonitor.exportJson(filtered); }}>⬇ JSON</Btn>
          <Btn onClick={() => { filtered.forEach(e => healthMonitor.resolveError(e.id)); refresh(); }} variant="green">✅ Resolve Filtered</Btn>
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="flex gap-4" style={{ minHeight: 400 }}>
        {/* Error list */}
        <div className="flex-1 min-w-0 space-y-1 max-h-[60vh] overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-600">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-sm font-bold">No errors match your filter</p>
            </div>
          )}
          {filtered.map(err => (
            <button key={err.id} onClick={() => setSelected(selected === err.id ? null : err.id)}
              className="w-full text-left p-3 rounded-xl border transition-all group"
              style={{
                borderColor: selected === err.id ? SEVERITY_CONFIG[err.severity].color + '60' : 'rgba(255,255,255,0.05)',
                background: selected === err.id ? SEVERITY_CONFIG[err.severity].bg : 'rgba(255,255,255,0.02)',
              }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{TYPE_ICONS[err.type] || '⚠️'}</span>
                <SeverityBadge severity={err.severity} />
                <span className="text-[10px] text-gray-600 capitalize">{err.type}</span>
                {err.count > 1 && <span className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded bg-white/5">×{err.count}</span>}
                <span className="ml-auto text-[10px] text-gray-600">{relativeTime(err.timestamp)}</span>
              </div>
              <p className="text-xs text-white font-semibold truncate">{err.message}</p>
              <p className="text-[10px] text-gray-600 truncate">{err.url}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded border capitalize"
                  style={{ color: err.status === 'resolved' ? '#10b981' : err.status === 'new' ? '#ef4444' : '#eab308', borderColor: 'rgba(255,255,255,0.1)' }}>
                  {err.status}
                </span>
                <span className="text-[9px] text-gray-700">P{err.priority}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail pane */}
        {selectedError && (
          <div className="w-80 flex-shrink-0 p-4 rounded-2xl border border-white/8 bg-white/3 overflow-y-auto max-h-[60vh] space-y-4">
            <div className="flex items-center justify-between">
              <SeverityBadge severity={selectedError.severity} />
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
            </div>
            <div>
              <p className="text-xs font-black text-white mb-1">Error Message</p>
              <p className="text-xs text-gray-400 break-words">{selectedError.message}</p>
            </div>
            {selectedError.stack && (
              <div>
                <p className="text-xs font-black text-white mb-1">Stack Trace</p>
                <pre className="text-[9px] text-gray-600 overflow-x-auto whitespace-pre-wrap break-all bg-black/30 p-2 rounded-lg max-h-32">{selectedError.stack}</pre>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {[
                ['URL', selectedError.url],
                ['File', selectedError.filename || '—'],
                ['Line', selectedError.lineno ? `${selectedError.lineno}:${selectedError.colno}` : '—'],
                ['Screen', selectedError.screen],
                ['Time', new Date(selectedError.timestamp).toLocaleString()],
                ['Count', String(selectedError.count)],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-600 font-bold">{k}</p>
                  <p className="text-gray-400 truncate" title={v}>{v}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 mb-1">Priority</p>
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as ErrorPriority[]).map(p => (
                  <button key={p} onClick={() => setPriority(selectedError.id, p)}
                    className="w-7 h-7 rounded-lg text-xs font-black transition-all"
                    style={selectedError.priority === p ? { background: '#d4af37', color: '#000' } : { background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 mb-1">Status</p>
              <div className="flex flex-wrap gap-1">
                {(['new', 'in_progress', 'resolved', 'ignored'] as ErrorStatus[]).map(s => (
                  <button key={s} onClick={() => { setStatus(selectedError.id, s); refresh(); }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold capitalize transition-all"
                    style={selectedError.status === s ? { background: '#d4af37', color: '#000' } : { background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Btn onClick={() => { del(selectedError.id); }} variant="danger">🗑 Delete</Btn>
              <Btn onClick={() => { healthMonitor.resolveError(selectedError.id); refresh(); }} variant="green">✅ Resolve</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Performance Tab ──────────────────────────────────────────────────────────

function PerformanceTab({ metrics }: { metrics: PerformanceSnapshot }) {
  const { vitals, fps, memoryUsedMB, memoryLimitMB } = metrics;

  const vitalConfig = [
    { key: 'lcp', label: 'Largest Contentful Paint', unit: 'ms', good: 2500, poor: 4000, value: vitals.lcp, desc: 'Time until largest visible element renders' },
    { key: 'fcp', label: 'First Contentful Paint',   unit: 'ms', good: 1800, poor: 3000, value: vitals.fcp, desc: 'Time until first content is painted' },
    { key: 'cls', label: 'Cumulative Layout Shift',  unit: '',   good: 0.1,  poor: 0.25, value: vitals.cls, desc: 'Visual stability — how much elements move', isScore: true },
    { key: 'ttfb', label: 'Time to First Byte',      unit: 'ms', good: 800,  poor: 1800, value: vitals.ttfb, desc: 'Server response time' },
    { key: 'inp',  label: 'Interaction to Next Paint', unit: 'ms', good: 200, poor: 500, value: vitals.inp, desc: 'Responsiveness to user interactions' },
    { key: 'pageLoad', label: 'Page Load Time',       unit: 'ms', good: 3000, poor: 6000, value: vitals.pageLoad, desc: 'Total page load time' },
  ];

  const getVitalColor = (val: number | undefined, good: number, poor: number) => {
    if (val === undefined) return '#6b7280';
    return val <= good ? '#10b981' : val <= poor ? '#eab308' : '#ef4444';
  };

  const getVitalLabel = (val: number | undefined, good: number, poor: number) => {
    if (val === undefined) return 'Not measured';
    return val <= good ? '✅ Good' : val <= poor ? '⚠️ Needs Work' : '❌ Poor';
  };

  return (
    <div className="space-y-6">
      {/* Live metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-white/8 bg-white/3 text-center">
          <div className="text-3xl font-black mb-1" style={{ color: fps >= 55 ? '#10b981' : fps >= 30 ? '#eab308' : '#ef4444' }}>{fps}</div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Frames / sec</div>
          <div className="text-[10px] text-gray-600 mt-1">{fps >= 55 ? 'Smooth' : fps >= 30 ? 'Moderate' : 'Janky'}</div>
        </div>
        {memoryUsedMB !== undefined && (
          <div className="p-5 rounded-xl border border-white/8 bg-white/3 text-center">
            <div className="text-3xl font-black mb-1 text-blue-400">{memoryUsedMB}</div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Memory (MB)</div>
            {memoryLimitMB && <div className="text-[10px] text-gray-600 mt-1">of {memoryLimitMB}MB limit</div>}
          </div>
        )}
        <div className="p-5 rounded-xl border border-white/8 bg-white/3 text-center">
          <div className="text-3xl font-black mb-1 text-gold">{vitals.pageLoad ? formatMs(vitals.pageLoad) : '—'}</div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Page Load</div>
        </div>
        <div className="p-5 rounded-xl border border-white/8 bg-white/3 text-center">
          <div className="text-3xl font-black mb-1 text-purple-400">{vitals.ttfb ? formatMs(vitals.ttfb) : '—'}</div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">TTFB</div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div>
        <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-4">CORE WEB VITALS</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vitalConfig.map(v => {
            const color = getVitalColor(v.value, v.good, v.poor);
            const pct = v.value !== undefined
              ? Math.min(100, v.isScore
                ? (v.value / v.poor) * 100
                : (v.value / v.poor) * 100)
              : 0;
            return (
              <div key={v.key} className="p-4 rounded-xl border border-white/8 bg-white/3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{v.label}</span>
                  <span className="text-xs font-black" style={{ color }}>
                    {v.value !== undefined ? (v.isScore ? v.value : formatMs(v.value)) : '—'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 mb-2">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600">{v.desc}</span>
                  <span className="text-[9px]">{getVitalLabel(v.value, v.good, v.poor)}</span>
                </div>
                <div className="flex gap-3 mt-2 text-[9px] text-gray-600">
                  <span>Good: {v.isScore ? `< ${v.good}` : `< ${formatMs(v.good)}`}</span>
                  <span>Poor: {v.isScore ? `> ${v.poor}` : `> ${formatMs(v.poor)}`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Memory bar */}
      {memoryUsedMB !== undefined && memoryLimitMB !== undefined && (
        <div className="p-4 rounded-xl border border-white/8 bg-white/3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white">JS Heap Memory</span>
            <span className="text-xs text-blue-400 font-black">{memoryUsedMB}MB / {memoryLimitMB}MB</span>
          </div>
          <div className="h-2 rounded-full bg-white/5">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(memoryUsedMB / memoryLimitMB) * 100}%`, background: memoryUsedMB / memoryLimitMB > 0.8 ? '#ef4444' : '#3b82f6' }} />
          </div>
          <p className="text-[10px] text-gray-600 mt-1">{((memoryUsedMB / memoryLimitMB) * 100).toFixed(0)}% heap usage{memoryUsedMB / memoryLimitMB > 0.8 ? ' — High! Check for memory leaks' : ''}</p>
        </div>
      )}

      <div className="p-4 rounded-xl border border-white/8 bg-white/3">
        <p className="text-xs text-gray-500">
          💡 <span className="text-gray-400 font-semibold">Tip:</span> Web Vitals are measured once on page load. Navigate to the public site and open System Health to see live measurements from that session.
          Use Chrome DevTools → Lighthouse for a comprehensive audit.
        </p>
      </div>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab({ issues, onScan }: { issues: SecurityIssue[]; onScan: () => void }) {
  const [scanning, setScanning] = useState(false);
  const critical = issues.filter(i => i.found && i.severity === 'critical').length;
  const high = issues.filter(i => i.found && i.severity === 'high').length;
  const medium = issues.filter(i => i.found && i.severity === 'medium').length;

  const scan = async () => { setScanning(true); await new Promise(r => setTimeout(r, 800)); onScan(); setScanning(false); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {critical > 0 && <span className="px-3 py-1 rounded-lg text-xs font-black" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>🔴 {critical} Critical</span>}
          {high > 0 && <span className="px-3 py-1 rounded-lg text-xs font-black" style={{ color: '#f97316', background: 'rgba(249,115,22,0.1)' }}>🟠 {high} High</span>}
          {medium > 0 && <span className="px-3 py-1 rounded-lg text-xs font-black" style={{ color: '#eab308', background: 'rgba(234,179,8,0.1)' }}>🟡 {medium} Medium</span>}
          {critical === 0 && high === 0 && medium === 0 && issues.length > 0 && (
            <span className="px-3 py-1 rounded-lg text-xs font-black text-green-400 bg-green-500/10">✅ No issues found</span>
          )}
        </div>
        <Btn onClick={scan} disabled={scanning} variant="gold">{scanning ? '⟳ Scanning...' : '🔍 Re-scan'}</Btn>
      </div>

      {issues.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">🔒</div>
          <p>Click Re-scan to run a security check</p>
        </div>
      )}

      <div className="space-y-3">
        {issues.map(issue => {
          const cfg = SEVERITY_CONFIG[issue.severity];
          return (
            <div key={issue.id} className="p-4 rounded-xl border transition-all"
              style={{ borderColor: issue.found ? cfg.color + '40' : 'rgba(255,255,255,0.05)', background: issue.found ? cfg.bg : 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{issue.found ? (issue.severity === 'critical' ? '🚨' : issue.severity === 'high' ? '⚠️' : '⚡') : '✅'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-white">{issue.type}</span>
                    {issue.found && <SeverityBadge severity={issue.severity} />}
                    {!issue.found && <span className="text-[10px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">CLEAR</span>}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{issue.description}</p>
                  {issue.found && (
                    <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                      <p className="text-[10px] font-bold text-gray-500 mb-0.5">RECOMMENDATION</p>
                      <p className="text-[11px] text-gray-400">{issue.recommendation}</p>
                    </div>
                  )}
                  {issue.details && (
                    <p className="text-[10px] text-gray-600 mt-1 font-mono truncate">{issue.details}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Database Tab ─────────────────────────────────────────────────────────────

function DatabaseTab({ issues, onScan }: { issues: DbIssue[]; onScan: () => void }) {
  const [scanning, setScanning] = useState(false);
  const critCount = issues.filter(i => i.severity === 'critical' && i.count > 0).length;
  const highCount = issues.filter(i => i.severity === 'high' && i.count > 0).length;

  const scan = async () => { setScanning(true); await new Promise(r => setTimeout(r, 600)); onScan(); setScanning(false); };

  const sevColors: Record<ErrorSeverity, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6', info: '#10b981' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {critCount > 0 && <span className="px-3 py-1 rounded-lg text-xs font-black text-red-400 bg-red-500/10">🔴 {critCount} Critical</span>}
          {highCount > 0 && <span className="px-3 py-1 rounded-lg text-xs font-black text-orange-400 bg-orange-500/10">🟠 {highCount} High</span>}
          {critCount === 0 && highCount === 0 && issues.length > 0 && (
            <span className="px-3 py-1 rounded-lg text-xs font-black text-green-400 bg-green-500/10">✅ Database healthy</span>
          )}
        </div>
        <Btn onClick={scan} disabled={scanning} variant="gold">{scanning ? '⟳ Scanning...' : '🔍 Re-scan'}</Btn>
      </div>

      <div className="space-y-3">
        {issues.map(issue => {
          const color = sevColors[issue.severity];
          const isOk = issue.id === 'all-ok';
          return (
            <div key={issue.id} className="p-4 rounded-xl border border-white/8 bg-white/3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{isOk ? '✅' : issue.severity === 'critical' ? '🚨' : issue.severity === 'high' ? '⚠️' : issue.severity === 'medium' ? '⚡' : 'ℹ️'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-black text-white">{issue.type}</span>
                    {!isOk && <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase" style={{ color, background: color + '20' }}>{issue.severity}</span>}
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">· {issue.collection}</span>
                  </div>
                  <p className="text-xs text-gray-400">{issue.description}</p>
                </div>
                {issue.count > 0 && (
                  <span className="text-2xl font-black flex-shrink-0" style={{ color }}>{issue.count}</span>
                )}
              </div>
            </div>
          );
        })}

        {issues.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <div className="text-4xl mb-3">🗄️</div>
            <p>Click Re-scan to check database integrity</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI Analyzer Tab ──────────────────────────────────────────────────────────

function AiTab({ errors }: { errors: ErrorLog[] }) {
  const [selectedId, setSelectedId] = useState<string>(errors[0]?.id || '');
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const selectedError = errors.find(e => e.id === selectedId);

  const analyze = async () => {
    if (!selectedError) return;
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 1200)); // Simulated analysis time
    setAnalysis(healthMonitor.analyzeError(selectedError));
    setAnalyzing(false);
  };

  useEffect(() => {
    if (selectedId && selectedError) { setAnalysis(null); }
  }, [selectedId]);

  const riskColors: Record<ErrorSeverity, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6', info: '#10b981' };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl border border-gold/20 bg-gold/5 flex items-start gap-3">
        <span className="text-2xl">🤖</span>
        <div>
          <p className="text-sm font-black text-white">AI Bug Analyzer</p>
          <p className="text-xs text-gray-400">Select an error from the log and analyze it to get a detailed diagnosis, root cause, suggested fix, and estimated resolution time.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Error selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase">SELECT ERROR TO ANALYZE</h3>
          {errors.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-sm">No errors to analyze</p>
            </div>
          )}
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {errors.slice(0, 50).map(err => (
              <button key={err.id} onClick={() => setSelectedId(err.id)}
                className="w-full text-left p-3 rounded-xl border transition-all"
                style={{
                  borderColor: selectedId === err.id ? '#d4af37' : 'rgba(255,255,255,0.05)',
                  background: selectedId === err.id ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">{TYPE_ICONS[err.type] || '⚠️'}</span>
                  <SeverityBadge severity={err.severity} />
                  <span className="text-[10px] text-gray-600 ml-auto">{relativeTime(err.timestamp)}</span>
                </div>
                <p className="text-xs text-white truncate">{err.message}</p>
              </button>
            ))}
          </div>
          {selectedId && (
            <Btn onClick={analyze} disabled={analyzing} variant="gold">
              {analyzing ? '🤖 Analyzing...' : '🤖 Analyze This Error'}
            </Btn>
          )}
        </div>

        {/* Analysis result */}
        <div>
          <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-3">ANALYSIS REPORT</h3>
          {analyzing && (
            <div className="space-y-3">
              {['Identifying cause...', 'Checking affected areas...', 'Generating fix...', 'Calculating confidence...'].map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                  <div className="w-4 h-4 rounded-full border-2 border-gold/40 border-t-gold animate-spin flex-shrink-0" />
                  <span className="text-xs text-gray-400">{step}</span>
                </div>
              ))}
            </div>
          )}
          {!analyzing && !analysis && (
            <div className="text-center py-16 text-gray-600">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-sm">Select an error and click Analyze</p>
            </div>
          )}
          {!analyzing && analysis && (
            <div className="space-y-4">
              {/* Confidence meter */}
              <div className="p-4 rounded-xl border border-white/8 bg-white/3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-white">Analysis Confidence</span>
                  <span className="text-xl font-black" style={{ color: analysis.confidence >= 80 ? '#10b981' : analysis.confidence >= 60 ? '#eab308' : '#f97316' }}>
                    {analysis.confidence}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${analysis.confidence}%`, background: analysis.confidence >= 80 ? '#10b981' : '#eab308' }} />
                </div>
              </div>

              {/* Risk level */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/3">
                <span className="text-2xl">{analysis.riskLevel === 'critical' ? '🚨' : analysis.riskLevel === 'high' ? '⚠️' : '⚡'}</span>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold">RISK LEVEL</p>
                  <p className="text-sm font-black capitalize" style={{ color: riskColors[analysis.riskLevel] }}>{analysis.riskLevel}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-gray-500 font-bold">EST. FIX TIME</p>
                  <p className="text-sm font-black text-white">{analysis.estimatedFixTime}</p>
                </div>
              </div>

              {/* Cause */}
              <div className="p-3 rounded-xl border border-white/8 bg-white/3">
                <p className="text-[10px] text-gold font-black uppercase tracking-widest mb-1">Root Cause</p>
                <p className="text-sm font-bold text-white">{analysis.cause}</p>
              </div>

              {/* Why */}
              <div className="p-3 rounded-xl border border-white/8 bg-white/3">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Why It Happened</p>
                <p className="text-xs text-gray-400">{analysis.whyItHappened}</p>
              </div>

              {/* Suggested fix */}
              <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/5">
                <p className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-1">Suggested Fix</p>
                <p className="text-xs text-gray-300 whitespace-pre-wrap">{analysis.suggestedFix}</p>
              </div>

              {/* Affected areas */}
              <div className="p-3 rounded-xl border border-white/8 bg-white/3">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Affected Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.affectedAreas.map(a => (
                    <span key={a} className="px-2 py-0.5 rounded-full text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20">{a}</span>
                  ))}
                </div>
              </div>

              {/* Side effects */}
              {analysis.sideEffects.length > 0 && (
                <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                  <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest mb-2">Possible Side Effects</p>
                  <ul className="space-y-1">
                    {analysis.sideEffects.map(s => (
                      <li key={s} className="text-xs text-gray-400 flex items-start gap-1.5"><span className="text-yellow-500 mt-0.5">⚠</span>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.autoFixable && (
                <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center gap-2">
                  <span>🔧</span>
                  <p className="text-xs text-blue-400 font-bold">This error type supports auto-recovery. Go to the Recovery tab to attempt automatic fixes.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab({ scores, errors, metrics, services }: {
  scores: HealthScores; errors: ErrorLog[]; metrics: PerformanceSnapshot; services: ServiceStatus[];
}) {
  const [generating, setGenerating] = useState<string | null>(null);

  const generate = async (type: string, fn: () => void) => {
    setGenerating(type);
    await new Promise(r => setTimeout(r, 600));
    fn();
    setGenerating(null);
  };

  const reports = [
    {
      id: 'health',
      title: 'Full Health Report',
      desc: 'Overall health scores, service status, and summary',
      icon: '🏥',
      formats: [
        { label: 'JSON', fn: () => healthMonitor.exportHealthReport(scores) },
        { label: 'CSV (Errors)', fn: () => healthMonitor.exportCsv(errors) },
      ],
    },
    {
      id: 'errors',
      title: 'Error Log Export',
      desc: 'All logged errors with full details',
      icon: '🐛',
      formats: [
        { label: 'CSV', fn: () => healthMonitor.exportCsv(errors) },
        { label: 'JSON', fn: () => healthMonitor.exportJson(errors) },
      ],
    },
    {
      id: 'performance',
      title: 'Performance Report',
      desc: 'Core Web Vitals and performance metrics',
      icon: '⚡',
      formats: [
        {
          label: 'JSON', fn: () => {
            const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), metrics, scores: { performance: scores.performance } }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'sbg-army-performance.json'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        },
      ],
    },
    {
      id: 'security',
      title: 'Security Scan Report',
      desc: 'Security findings and recommendations',
      icon: '🔒',
      formats: [
        {
          label: 'JSON', fn: () => {
            const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), security: healthMonitor.getSecurityResults(), score: scores.security }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sbg-army-security.json'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        },
      ],
    },
    {
      id: 'critical',
      title: 'Critical Errors Only',
      desc: 'Filtered to critical and high severity errors',
      icon: '🚨',
      formats: [
        { label: 'CSV', fn: () => healthMonitor.exportCsv(errors.filter(e => ['critical', 'high'].includes(e.severity))) },
        { label: 'JSON', fn: () => healthMonitor.exportJson(errors.filter(e => ['critical', 'high'].includes(e.severity))) },
      ],
    },
    {
      id: 'services',
      title: 'Service Status Report',
      desc: 'All service health and latency measurements',
      icon: '🌐',
      formats: [
        {
          label: 'JSON', fn: () => {
            const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), services }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sbg-army-services.json'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl border border-white/8 bg-white/3 flex items-start gap-3">
        <span className="text-2xl">📊</span>
        <div>
          <p className="text-sm font-black text-white">Report Generation</p>
          <p className="text-xs text-gray-400">Download structured reports in JSON or CSV format. PDF export requires a dedicated PDF library — use JSON with a viewer for now.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => (
          <div key={r.id} className="p-5 rounded-xl border border-white/8 bg-white/3 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{r.icon}</span>
              <div>
                <p className="text-sm font-black text-white">{r.title}</p>
                <p className="text-[10px] text-gray-500">{r.desc}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {r.formats.map(f => (
                <Btn key={f.label} onClick={() => generate(`${r.id}-${f.label}`, f.fn)} disabled={generating !== null} variant="default">
                  {generating === `${r.id}-${f.label}` ? '⟳ ...' : `⬇ ${f.label}`}
                </Btn>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="p-5 rounded-xl border border-white/8 bg-white/3">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">CURRENT SNAPSHOT</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Total Errors', value: errors.length, color: '#f97316' },
            { label: 'Critical', value: errors.filter(e => e.severity === 'critical').length, color: '#ef4444' },
            { label: 'Resolved', value: errors.filter(e => e.status === 'resolved').length, color: '#10b981' },
            { label: 'Health Score', value: `${scores.overall}/100`, color: scoreColor(scores.overall) },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Recovery Tab ─────────────────────────────────────────────────────────────

function RecoveryTab({ onHeal }: { onHeal: (a: string) => Promise<void> }) {
  const [running, setRunning] = useState<string | null>(null);

  const run = async (action: string) => {
    setRunning(action);
    await onHeal(action);
    setRunning(null);
  };

  const tools = [
    {
      id: 'clear-cache',
      title: 'Clear Cache',
      desc: 'Clears health error log cache and session storage. The DB and user data are untouched.',
      icon: '🧹',
      severity: 'safe',
      steps: ['Clears localStorage health log', 'Clears sessionStorage', 'Resets error monitor state'],
    },
    {
      id: 'retry-api',
      title: 'Retry API Connection',
      desc: 'Re-checks all service endpoints and updates their status.',
      icon: '🔄',
      severity: 'safe',
      steps: ['Pings /api/db', 'Checks WebSocket state', 'Tests Supabase connectivity'],
    },
    {
      id: 'reconnect-ws',
      title: 'Reconnect WebSocket',
      desc: 'Attempts to re-establish the real-time sync connection.',
      icon: '🔌',
      severity: 'safe',
      steps: ['Calls __sbgWsConnect()', 'Restarts real-time listener'],
    },
    {
      id: 'resolve-all',
      title: 'Resolve All Errors',
      desc: 'Marks every open error as resolved. Does not delete logs.',
      icon: '✅',
      severity: 'safe',
      steps: ['Sets all error statuses to resolved', 'Preserves error log for audit'],
    },
    {
      id: 'clear-errors',
      title: 'Delete All Error Logs',
      desc: 'Permanently deletes all error log entries from storage.',
      icon: '🗑️',
      severity: 'destructive',
      steps: ['Removes all entries from localStorage', 'Cannot be undone'],
    },
    {
      id: 'reload-assets',
      title: 'Reload & Refresh Assets',
      desc: 'Reloads the current page to pull fresh assets and clear browser cache.',
      icon: '🔃',
      severity: 'moderate',
      steps: ['Triggers window.location.reload()', 'Forces fresh asset fetch'],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl border border-gold/20 bg-gold/5 flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="text-sm font-black text-white">Recovery Tools</p>
          <p className="text-xs text-gray-400">
            These tools attempt safe automatic recovery. <span className="text-red-400 font-bold">User data and database records are never modified automatically.</span> Destructive actions are clearly labeled.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map(tool => {
          const isDestructive = tool.severity === 'destructive';
          const isMod = tool.severity === 'moderate';
          const isRunning = running === tool.id;
          return (
            <div key={tool.id} className="p-5 rounded-xl border flex flex-col gap-3"
              style={{ borderColor: isDestructive ? 'rgba(239,68,68,0.25)' : isMod ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.08)', background: isDestructive ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-white">{tool.title}</p>
                    {isDestructive && <span className="text-[9px] font-black text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">DESTRUCTIVE</span>}
                    {isMod && <span className="text-[9px] font-black text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded">RELOADS</span>}
                  </div>
                  <p className="text-[11px] text-gray-500">{tool.desc}</p>
                </div>
              </div>
              <ul className="space-y-1">
                {tool.steps.map(step => (
                  <li key={step} className="text-[10px] text-gray-600 flex items-start gap-1.5">
                    <span className="text-gray-700 mt-0.5">›</span>{step}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => run(tool.id)}
                disabled={running !== null}
                className="w-full py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40"
                style={{
                  background: isDestructive ? 'rgba(239,68,68,0.15)' : isMod ? 'rgba(234,179,8,0.15)' : 'rgba(212,175,55,0.1)',
                  color: isDestructive ? '#ef4444' : isMod ? '#eab308' : '#d4af37',
                  border: `1px solid ${isDestructive ? 'rgba(239,68,68,0.3)' : isMod ? 'rgba(234,179,8,0.3)' : 'rgba(212,175,55,0.2)'}`,
                }}>
                {isRunning ? '⟳ Running...' : `Run: ${tool.title}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
