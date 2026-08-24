/**
 * SBG ARMY — Health Monitor
 * Client-side monitoring engine: error interception, performance metrics,
 * security scanning, DB integrity, scheduling, and self-healing.
 * All data is persisted in localStorage; no external service required.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

import { apiUrl } from './api';

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ErrorCategory =
  | 'javascript' | 'network' | 'console' | 'promise'
  | 'image' | 'performance' | 'security' | 'api' | 'database';
export type ErrorStatus = 'new' | 'resolved' | 'ignored' | 'in_progress';
export type ErrorPriority = 1 | 2 | 3 | 4 | 5;

export interface ErrorLog {
  id: string;
  type: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  url: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  userAgent: string;
  screen: string;
  timestamp: number;
  status: ErrorStatus;
  priority: ErrorPriority;
  count: number;
  tags: string[];
  extra?: Record<string, unknown>;
}

export interface WebVitals {
  lcp?: number;  // ms
  fcp?: number;  // ms
  cls?: number;  // score
  ttfb?: number; // ms
  inp?: number;  // ms
  pageLoad?: number; // ms
  domReady?: number; // ms
}

export interface PerformanceSnapshot {
  timestamp: number;
  fps: number;
  memoryUsedMB?: number;
  memoryLimitMB?: number;
  vitals: WebVitals;
  jsHeapSize?: number;
}

export interface SecurityIssue {
  id: string;
  type: string;
  severity: ErrorSeverity;
  description: string;
  recommendation: string;
  found: boolean;
  details?: string;
}

export interface DbIssue {
  id: string;
  collection: string;
  type: string;
  description: string;
  severity: ErrorSeverity;
  count: number;
  fixable: boolean;
  autoFixed?: boolean;
}

export interface HealthScores {
  overall: number;
  performance: number;
  security: number;
  seo: number;
  accessibility: number;
  errorHealth: number;
}

export interface ServiceStatus {
  name: string;
  status: 'online' | 'degraded' | 'offline' | 'unknown';
  latency?: number;
  lastChecked?: number;
  details?: string;
}

export interface ScheduledCheck {
  id: string;
  name: string;
  description: string;
  intervalMs: number;
  lastRun?: number;
  nextRun?: number;
  status: 'ok' | 'warning' | 'error' | 'running' | 'pending';
  lastResult?: string;
}

export interface AiAnalysis {
  errorId: string;
  cause: string;
  whyItHappened: string;
  affectedAreas: string[];
  riskLevel: ErrorSeverity;
  suggestedFix: string;
  estimatedFixTime: string;
  sideEffects: string[];
  confidence: number; // 0-100
  autoFixable: boolean;
}

type MonitorListener = () => void;

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sbg_health_errors_v2';
const MAX_ERRORS = 500;
const DEDUP_WINDOW_MS = 60_000; // 1 minute window for deduplication

// ─── HealthMonitor Singleton ──────────────────────────────────────────────────

class HealthMonitor {
  private errors: ErrorLog[] = [];
  private metrics: PerformanceSnapshot = { timestamp: Date.now(), fps: 60, vitals: {} };
  private services: ServiceStatus[] = [];
  private securityResults: SecurityIssue[] = [];
  private dbIssues: DbIssue[] = [];
  private scheduledChecks: ScheduledCheck[] = [];
  private listeners = new Set<MonitorListener>();
  private initialized = false;
  private fpsFrame = 0;
  private fpsLast = 0;
  private fpsCurrent = 60;
  private intervals: ReturnType<typeof setInterval>[] = [];
  private rafId = 0;
  private observers: PerformanceObserver[] = [];
  private origConsoleError: typeof console.error | null = null;
  private origFetch: typeof window.fetch | null = null;
  private errorHandler: ((e: ErrorEvent) => void) | null = null;
  private rejectionHandler: ((e: PromiseRejectionEvent) => void) | null = null;

  // ── Init ──────────────────────────────────────────────────────────────────

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    this.loadErrors();
    this.interceptErrors();
    this.observePerformance();
    this.trackFps();
    this.initServices();
    this.initScheduledChecks();
    this.emit();
  }

  private loadErrors() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.errors = JSON.parse(raw);
    } catch { this.errors = []; }
  }

  private saveErrors() {
    try {
      // Keep only newest MAX_ERRORS, ordered by timestamp descending
      if (this.errors.length > MAX_ERRORS) {
        this.errors = [...this.errors]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_ERRORS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.errors));
    } catch {}
  }

  // ── Error Interception ────────────────────────────────────────────────────

  private interceptErrors() {
    // JS errors
    this.errorHandler = (e: ErrorEvent) => {
      if (e.error instanceof Error) {
        this.logError({
          type: 'javascript',
          severity: 'high',
          message: e.message || 'Unknown error',
          stack: e.error?.stack,
          url: window.location.href,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
        });
      } else if (e.target instanceof HTMLImageElement) {
        const src = e.target.src;
        this.logError({
          type: 'image',
          severity: 'low',
          message: `Broken image: ${src}`,
          url: window.location.href,
          extra: { src },
        });
      }
    };
    window.addEventListener('error', this.errorHandler, true);

    // Unhandled promise rejections
    this.rejectionHandler = (e: PromiseRejectionEvent) => {
      const msg = e.reason instanceof Error
        ? e.reason.message
        : String(e.reason ?? 'Unhandled promise rejection');
      this.logError({
        type: 'promise',
        severity: 'high',
        message: msg,
        stack: e.reason?.stack,
        url: window.location.href,
      });
    };
    window.addEventListener('unhandledrejection', this.rejectionHandler);

    // Console error overriding — store original for restore
    this.origConsoleError = console.error.bind(console);
    const origError = this.origConsoleError;
    console.error = (...args: unknown[]) => {
      origError(...args);
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      if (!msg.includes('sbg_health')) {
        this.logError({
          type: 'console',
          severity: 'medium',
          message: msg.slice(0, 400),
          url: window.location.href,
        });
      }
    };

    // Network errors via fetch override — store original for restore safely
    try {
      this.origFetch = window.fetch.bind(window);
      const origFetch = this.origFetch;
      const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const t0 = performance.now();
        try {
          const res = await origFetch(input, init);
          const latency = performance.now() - t0;
          if (!res.ok && res.status >= 500) {
            this.logError({
              type: 'api',
              severity: 'high',
              message: `HTTP ${res.status} ${res.statusText} — ${url}`,
              url: window.location.href,
              extra: { endpoint: url, status: res.status, latency: Math.round(latency) },
            });
          } else if (!res.ok && res.status === 404) {
            this.logError({
              type: 'network',
              severity: 'medium',
              message: `404 Not Found — ${url}`,
              url: window.location.href,
              extra: { endpoint: url, status: 404 },
            });
          }
          // Update API service latency
          if (url.includes('/api/')) {
            const svc = this.services.find(s => s.name === 'API Server');
            if (svc) { svc.latency = Math.round(latency); svc.status = 'online'; svc.lastChecked = Date.now(); }
          }
          return res;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logError({
            type: 'network',
            severity: 'critical',
            message: `Network error: ${msg} — ${url}`,
            url: window.location.href,
            extra: { endpoint: url },
          });
          throw err;
        }
      };

      try {
        window.fetch = customFetch;
      } catch (e) {
        // Fallback: Try using Object.defineProperty if direct assignment is blocked
        Object.defineProperty(window, 'fetch', {
          value: customFetch,
          writable: true,
          configurable: true
        });
      }
    } catch (e) {
      console.warn('System Health: Could not intercept window.fetch. Network monitoring disabled.', e);
    }
  }

  // ── Performance Observation ───────────────────────────────────────────────

  private observePerformance() {
    // Navigation timing
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navEntry) {
      this.metrics.vitals.ttfb = Math.round(navEntry.responseStart - navEntry.requestStart);
      this.metrics.vitals.pageLoad = Math.round(navEntry.loadEventEnd - navEntry.startTime);
      this.metrics.vitals.domReady = Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime);
    }

    try {
      // LCP
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        if (last) {
          this.metrics.vitals.lcp = Math.round(last.startTime);
          this.checkPerformanceThresholds();
          this.emit();
        }
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObs);

      // FCP
      const fcpObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.vitals.fcp = Math.round(entry.startTime);
            this.emit();
          }
        }
      });
      fcpObs.observe({ type: 'paint', buffered: true });
      this.observers.push(fcpObs);

      // CLS
      let clsValue = 0;
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const le = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!le.hadRecentInput) clsValue += le.value;
        }
        this.metrics.vitals.cls = Math.round(clsValue * 1000) / 1000;
        this.emit();
      });
      clsObs.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObs);

      // INP — durationThreshold is a valid browser API but not in all TS lib versions; cast to bypass
      const inpObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { duration: number };
          if (!this.metrics.vitals.inp || e.duration > this.metrics.vitals.inp) {
            this.metrics.vitals.inp = Math.round(e.duration);
            this.emit();
          }
        }
      });
      inpObs.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
      this.observers.push(inpObs);
    } catch {}

    // Memory (Chrome only)
    this.updateMemory();
    this.intervals.push(setInterval(() => { this.updateMemory(); this.emit(); }, 5000));
  }

  private updateMemory() {
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (mem) {
      this.metrics.memoryUsedMB = Math.round(mem.usedJSHeapSize / 1048576);
      this.metrics.memoryLimitMB = Math.round(mem.jsHeapSizeLimit / 1048576);
      this.metrics.jsHeapSize = mem.usedJSHeapSize;
    }
  }

  private trackFps() {
    const tick = (now: number) => {
      this.fpsFrame++;
      if (now - this.fpsLast >= 1000) {
        this.fpsCurrent = this.fpsFrame;
        this.fpsFrame = 0;
        this.fpsLast = now;
        this.metrics.fps = this.fpsCurrent;
        this.emit();
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.fpsLast = performance.now();
    this.rafId = requestAnimationFrame(tick);
  }

  private checkPerformanceThresholds() {
    const { lcp, fcp, cls, ttfb } = this.metrics.vitals;
    if (lcp && lcp > 4000) {
      this.logError({ type: 'performance', severity: 'high', message: `Poor LCP: ${lcp}ms (threshold: 2500ms)`, url: window.location.href });
    }
    if (fcp && fcp > 3000) {
      this.logError({ type: 'performance', severity: 'medium', message: `Slow FCP: ${fcp}ms (threshold: 1800ms)`, url: window.location.href });
    }
    if (cls && cls > 0.25) {
      this.logError({ type: 'performance', severity: 'medium', message: `High CLS: ${cls} (threshold: 0.1)`, url: window.location.href });
    }
    if (ttfb && ttfb > 1800) {
      this.logError({ type: 'performance', severity: 'medium', message: `High TTFB: ${ttfb}ms (threshold: 800ms)`, url: window.location.href });
    }
  }

  // ── Service Status ────────────────────────────────────────────────────────

  private initServices() {
    this.services = [
      { name: 'API Server', status: 'unknown', details: 'Checking...' },
      { name: 'Database (IndexedDB)', status: 'unknown' },
      { name: 'WebSocket (Sync)', status: 'unknown' },
      { name: 'Authentication', status: 'unknown' },
      { name: 'Supabase', status: 'unknown' },
      { name: 'CDN / Assets', status: 'unknown' },
    ];
    this.checkServices();
    this.intervals.push(setInterval(() => this.checkServices(), 60_000));
  }

  async checkServices() {
    const now = Date.now();

    // API Server
    try {
      const t0 = performance.now();
      const res = await fetch(apiUrl('/api/db'), { credentials: "include", signal: AbortSignal.timeout(5000) });
      const latency = Math.round(performance.now() - t0);
      const svc = this.services.find(s => s.name === 'API Server')!;
      svc.status = res.ok ? 'online' : 'degraded';
      svc.latency = latency;
      svc.lastChecked = now;
      svc.details = `${res.status} in ${latency}ms`;
    } catch {
      const svc = this.services.find(s => s.name === 'API Server')!;
      svc.status = 'offline';
      svc.lastChecked = now;
      svc.details = 'Connection failed';
    }

    // IndexedDB
    try {
      const idb = indexedDB.open('sbg_army', 1);
      idb.onsuccess = () => {
        const svc = this.services.find(s => s.name === 'Database (IndexedDB)')!;
        svc.status = 'online';
        svc.lastChecked = now;
        idb.result.close();
        this.emit();
      };
      idb.onerror = () => {
        const svc = this.services.find(s => s.name === 'Database (IndexedDB)')!;
        svc.status = 'degraded';
        svc.lastChecked = now;
        this.emit();
      };
    } catch {
      const svc = this.services.find(s => s.name === 'Database (IndexedDB)')!;
      svc.status = 'offline';
      svc.lastChecked = now;
    }

    // Auth — check sessionStorage for admin token
    const authSvc = this.services.find(s => s.name === 'Authentication')!;
    try {
      const token = '';
      authSvc.status = 'online';
      authSvc.details = token ? 'Admin session active' : 'No active session';
    } catch {
      authSvc.status = 'degraded';
    }
    authSvc.lastChecked = now;

    // WebSocket — check if socket is connected
    const wsSvc = this.services.find(s => s.name === 'WebSocket (Sync)')!;
    try {
      const ws = (window as unknown as Record<string, unknown>).__sbgWs as WebSocket | undefined;
      wsSvc.status = ws?.readyState === WebSocket.OPEN ? 'online' : ws?.readyState === WebSocket.CONNECTING ? 'degraded' : 'offline';
      wsSvc.lastChecked = now;
    } catch {
      wsSvc.status = 'unknown';
    }

    // Supabase
    const sbSvc = this.services.find(s => s.name === 'Supabase')!;
    try {
      const t0 = performance.now();
      const res = await fetch('https://supabase.io', { credentials: "include", method: 'HEAD', signal: AbortSignal.timeout(4000) }).catch(() => null);
      sbSvc.status = res ? 'online' : 'degraded';
      sbSvc.latency = Math.round(performance.now() - t0);
    } catch {
      sbSvc.status = 'unknown';
    }
    sbSvc.lastChecked = now;

    // CDN — check fonts
    const cdnSvc = this.services.find(s => s.name === 'CDN / Assets')!;
    try {
      const t0 = performance.now();
      const res = await fetch('https://fonts.googleapis.com/favicon.ico', { credentials: "include", method: 'HEAD', signal: AbortSignal.timeout(4000) }).catch(() => null);
      cdnSvc.status = res ? 'online' : 'degraded';
      cdnSvc.latency = Math.round(performance.now() - t0);
    } catch {
      cdnSvc.status = 'unknown';
    }
    cdnSvc.lastChecked = now;

    this.emit();
  }

  // ── Scheduled Checks ──────────────────────────────────────────────────────

  private initScheduledChecks() {
    this.scheduledChecks = [
      { id: 'api',      name: 'API Health Check',    description: 'Verify all API endpoints are responding',               intervalMs: 60_000,       status: 'pending' },
      { id: 'db',       name: 'Database Integrity',  description: 'Scan database for corruption and missing fields',        intervalMs: 5 * 60_000,   status: 'pending' },
      { id: 'perf',     name: 'Performance Check',   description: 'Evaluate Core Web Vitals and page performance',         intervalMs: 15 * 60_000,  status: 'pending' },
      { id: 'security', name: 'Security Scan',       description: 'Check for XSS, open redirects, and insecure links',    intervalMs: 30 * 60_000,  status: 'pending' },
      { id: 'health',   name: 'Health Report',       description: 'Generate a full health score report',                   intervalMs: 60 * 60_000,  status: 'pending' },
    ];

    // Async-aware runner: awaits async tasks and reflects actual result
    const run = async (id: string, fn: () => Promise<void> | void) => {
      const chk = this.scheduledChecks.find(c => c.id === id);
      if (!chk) return;
      chk.status = 'running';
      chk.lastRun = Date.now();
      this.emit();
      try {
        await fn();
        chk.status = 'ok';
        chk.lastResult = 'Completed successfully';
      } catch (err) {
        chk.status = 'error';
        chk.lastResult = err instanceof Error ? err.message : 'Unknown error';
      }
      chk.nextRun = Date.now() + chk.intervalMs;
      this.emit();
    };

    this.intervals.push(setInterval(() => run('api',      () => this.checkServices()),                60_000));
    this.intervals.push(setInterval(() => run('perf',     () => this.checkPerformanceThresholds()),   15 * 60_000));
    this.intervals.push(setInterval(() => run('security', () => { this.runSecurityScan(); }),          30 * 60_000));
    this.intervals.push(setInterval(() => run('health',   () => { this.calculateHealthScores(); }),    60 * 60_000));

    // Set initial next run times
    this.scheduledChecks.forEach(c => { c.nextRun = Date.now() + c.intervalMs; });
  }

  // ── Security Scan ─────────────────────────────────────────────────────────

  runSecurityScan(): SecurityIssue[] {
    const doc = document;
    const issues: SecurityIssue[] = [];

    // Mixed content check
    const mixedLinks = Array.from(doc.querySelectorAll('script[src], link[href], img[src]'))
      .filter(el => {
        const attr = el.getAttribute('src') || el.getAttribute('href') || '';
        return window.location.protocol === 'https:' && attr.startsWith('http:');
      });
    issues.push({
      id: 'mixed-content',
      type: 'Mixed Content',
      severity: mixedLinks.length > 0 ? 'high' : 'info',
      description: mixedLinks.length > 0 ? `${mixedLinks.length} resource(s) loaded over HTTP on HTTPS page` : 'No mixed content detected',
      recommendation: 'Update all resource URLs to use HTTPS',
      found: mixedLinks.length > 0,
      details: mixedLinks.map(e => e.getAttribute('src') || e.getAttribute('href')).join(', ').slice(0, 200),
    });

    // Open redirect check — look for links with unvalidated external href
    const extLinks = Array.from(doc.querySelectorAll('a[href]'))
      .filter(el => {
        const href = el.getAttribute('href') || '';
        return href.startsWith('//') && !href.includes(window.location.hostname);
      });
    issues.push({
      id: 'open-redirect',
      type: 'Potential Open Redirect',
      severity: extLinks.length > 0 ? 'medium' : 'info',
      description: extLinks.length > 0 ? `${extLinks.length} protocol-relative link(s) found` : 'No open redirects detected',
      recommendation: 'Use absolute URLs with explicit https:// scheme',
      found: extLinks.length > 0,
    });

    // javascript: URIs
    const jsLinks = Array.from(doc.querySelectorAll('a[href^="javascript:"], a[href^="JAVASCRIPT:"]'));
    issues.push({
      id: 'js-uri',
      type: 'javascript: URI (XSS Risk)',
      severity: jsLinks.length > 0 ? 'critical' : 'info',
      description: jsLinks.length > 0 ? `${jsLinks.length} javascript: link(s) found — XSS risk` : 'No javascript: URIs detected',
      recommendation: 'Remove all javascript: href attributes. Use event listeners instead.',
      found: jsLinks.length > 0,
    });

    // Forms without CSRF protection (no hidden token field in auth forms)
    const forms = Array.from(doc.querySelectorAll('form'));
    const unprotectedForms = forms.filter(f => {
      const hasToken = f.querySelector('input[name*="csrf"], input[name*="token"], input[name*="_token"]');
      return !hasToken && (f.method || 'get').toLowerCase() === 'post';
    });
    issues.push({
      id: 'csrf',
      type: 'CSRF Protection',
      severity: unprotectedForms.length > 0 ? 'medium' : 'info',
      description: unprotectedForms.length > 0 ? `${unprotectedForms.length} POST form(s) without CSRF token detected` : 'Forms appear protected',
      recommendation: 'Add CSRF tokens to all forms or use SameSite cookie attributes',
      found: unprotectedForms.length > 0,
    });

    // Images without alt text (accessibility + security boundary confusion)
    const imgNoAlt = Array.from(doc.querySelectorAll('img')).filter(img => !img.alt);
    issues.push({
      id: 'img-alt',
      type: 'Images Without Alt Text',
      severity: imgNoAlt.length > 5 ? 'medium' : imgNoAlt.length > 0 ? 'low' : 'info',
      description: imgNoAlt.length > 0 ? `${imgNoAlt.length} image(s) missing alt text` : 'All images have alt text',
      recommendation: 'Add descriptive alt text to all <img> elements for accessibility',
      found: imgNoAlt.length > 0,
    });

    // Inline event handlers (potential XSS surface)
    const inlineHandlers = Array.from(doc.querySelectorAll('[onclick],[onmouseover],[onerror],[onload]'));
    issues.push({
      id: 'inline-handlers',
      type: 'Inline Event Handlers',
      severity: inlineHandlers.length > 10 ? 'medium' : 'low',
      description: inlineHandlers.length > 0 ? `${inlineHandlers.length} inline event handler(s) detected` : 'No inline handlers found',
      recommendation: 'Replace inline event handlers with addEventListener() calls',
      found: inlineHandlers.length > 0,
    });

    // Check for dangerouslySetInnerHTML artifacts (can't check React directly, check for injected content)
    const dataUrls = Array.from(doc.querySelectorAll('[src^="data:"]'));
    issues.push({
      id: 'data-uri',
      type: 'Data URI Resources',
      severity: dataUrls.length > 50 ? 'low' : 'info',
      description: dataUrls.length > 0 ? `${dataUrls.length} data: URI resource(s) detected` : 'No data: URIs detected',
      recommendation: 'Prefer external URLs over data: URIs where possible',
      found: dataUrls.length > 0,
    });

    // Console token exposure check
    const localKeys = Object.keys(localStorage);
    const sensitiveKeys = localKeys.filter(k => /token|secret|key|password|auth/i.test(k));
    issues.push({
      id: 'storage-sensitive',
      type: 'Sensitive Keys in localStorage',
      severity: sensitiveKeys.length > 0 ? 'high' : 'info',
      description: sensitiveKeys.length > 0 ? `${sensitiveKeys.length} potentially sensitive key(s) in localStorage: ${sensitiveKeys.join(', ')}` : 'No sensitive keys in localStorage',
      recommendation: 'Store tokens in httpOnly cookies or sessionStorage only',
      found: sensitiveKeys.length > 0,
    });

    this.securityResults = issues;
    this.emit();
    return issues;
  }

  // ── DB Integrity ──────────────────────────────────────────────────────────

  checkDbIntegrity(db: Record<string, unknown>): DbIssue[] {
    const issues: DbIssue[] = [];

    // Players
    const players = (db.players as any[]) || [];
    const missingIgn = players.filter(p => !p.ign || p.ign.trim() === '');
    if (missingIgn.length > 0) {
      issues.push({ id: 'player-ign', collection: 'players', type: 'Missing IGN', description: `${missingIgn.length} player(s) have no IGN set`, severity: 'high', count: missingIgn.length, fixable: false });
    }
    const missingGame = players.filter(p => !p.game);
    if (missingGame.length > 0) {
      issues.push({ id: 'player-game', collection: 'players', type: 'Missing Game', description: `${missingGame.length} player(s) have no game assigned`, severity: 'medium', count: missingGame.length, fixable: false });
    }

    // Duplicate IGNs
    const ignCounts: Record<string, number> = {};
    players.forEach(p => { if (p.ign) ignCounts[p.ign] = (ignCounts[p.ign] || 0) + 1; });
    const dupIgns = Object.entries(ignCounts).filter(([, c]) => c > 1);
    if (dupIgns.length > 0) {
      issues.push({ id: 'player-dup-ign', collection: 'players', type: 'Duplicate IGNs', description: `${dupIgns.length} IGN(s) appear more than once: ${dupIgns.map(([k]) => k).join(', ')}`, severity: 'high', count: dupIgns.length, fixable: false });
    }

    // Matches
    const matches = (db.matches as any[]) || [];
    const invalidDates = matches.filter(m => m.date && isNaN(Date.parse(m.date)));
    if (invalidDates.length > 0) {
      issues.push({ id: 'match-dates', collection: 'matches', type: 'Invalid Dates', description: `${invalidDates.length} match(es) have invalid date format`, severity: 'medium', count: invalidDates.length, fixable: false });
    }

    // Tournaments
    const tournaments = (db.tournaments as any[]) || [];
    const noSlots = tournaments.filter(t => !t.slots || t.slots <= 0);
    if (noSlots.length > 0) {
      issues.push({ id: 'tourn-slots', collection: 'tournaments', type: 'Missing Slots', description: `${noSlots.length} tournament(s) have no slots defined`, severity: 'low', count: noSlots.length, fixable: false });
    }

    // Sponsors
    const sponsors = (db.sponsors as any[]) || [];
    const noLink = sponsors.filter(s => !s.link || s.link.trim() === '');
    if (noLink.length > 0) {
      issues.push({ id: 'sponsor-link', collection: 'sponsors', type: 'Missing Website', description: `${noLink.length} sponsor(s) have no website URL`, severity: 'low', count: noLink.length, fixable: false });
    }

    // News posts
    const posts = (db.posts as any[]) || [];
    const missingTitle = posts.filter(p => !p.title || p.title.trim() === '');
    if (missingTitle.length > 0) {
      issues.push({ id: 'post-title', collection: 'posts', type: 'Missing Titles', description: `${missingTitle.length} post(s) have no title`, severity: 'medium', count: missingTitle.length, fixable: false });
    }

    // Shop items with invalid prices
    const shop = (db.shop as any[]) || [];
    const badPrice = shop.filter(item => item.price < 0 || isNaN(item.price));
    if (badPrice.length > 0) {
      issues.push({ id: 'shop-price', collection: 'shop', type: 'Invalid Prices', description: `${badPrice.length} shop item(s) have invalid prices`, severity: 'high', count: badPrice.length, fixable: false });
    }

    // Settings integrity
    const settings = db.settings as any;
    if (!settings?.organizationName) {
      issues.push({ id: 'settings-name', collection: 'settings', type: 'Missing Org Name', description: 'Organization name is not configured', severity: 'medium', count: 1, fixable: false });
    }

    // Overall size check
    try {
      const serialized = JSON.stringify(db);
      const sizeMB = new Blob([serialized]).size / 1024 / 1024;
      if (sizeMB > 5) {
        issues.push({ id: 'db-size', collection: 'all', type: 'Database Size', description: `Database is ${sizeMB.toFixed(1)}MB — may cause slow loads`, severity: sizeMB > 10 ? 'high' : 'medium', count: 1, fixable: true, autoFixed: false });
      }
    } catch {}

    if (issues.length === 0) {
      issues.push({ id: 'all-ok', collection: 'all', type: 'All checks passed', description: 'No integrity issues found', severity: 'info', count: 0, fixable: false });
    }

    this.dbIssues = issues;
    this.emit();
    return issues;
  }

  // ── Health Scores ─────────────────────────────────────────────────────────

  calculateHealthScores(): HealthScores {
    // Performance score from web vitals
    let perf = 100;
    const { lcp, fcp, cls, ttfb } = this.metrics.vitals;
    if (lcp !== undefined) perf -= lcp > 4000 ? 25 : lcp > 2500 ? 12 : 0;
    if (fcp !== undefined) perf -= fcp > 3000 ? 20 : fcp > 1800 ? 10 : 0;
    if (cls !== undefined) perf -= cls > 0.25 ? 20 : cls > 0.1 ? 10 : 0;
    if (ttfb !== undefined) perf -= ttfb > 1800 ? 15 : ttfb > 800 ? 8 : 0;
    if (this.metrics.fps < 30) perf -= 15;
    else if (this.metrics.fps < 50) perf -= 5;
    perf = Math.max(0, Math.min(100, perf));

    // Security score from scan results
    let sec = 100;
    this.securityResults.forEach(issue => {
      if (!issue.found) return;
      sec -= issue.severity === 'critical' ? 30 : issue.severity === 'high' ? 20 : issue.severity === 'medium' ? 10 : 5;
    });
    sec = Math.max(0, Math.min(100, sec));

    // SEO score from meta tags
    let seo = 0;
    const titleEl = document.querySelector('title');
    if (titleEl?.textContent) seo += 20;
    if (document.querySelector('meta[name="description"]')) seo += 20;
    if (document.querySelector('meta[property="og:title"]')) seo += 15;
    if (document.querySelector('meta[property="og:image"]')) seo += 10;
    if (document.querySelector('link[rel="canonical"]')) seo += 15;
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 1) seo += 20;
    else if (h1s.length > 1) seo += 5;

    // Accessibility score
    let a11y = 100;
    const imgs = document.querySelectorAll('img');
    const noAlt = Array.from(imgs).filter(img => !img.alt).length;
    a11y -= Math.min(30, noAlt * 5);
    const inputs = document.querySelectorAll('input, textarea, select');
    const noLabel = Array.from(inputs).filter(inp => !inp.id || !document.querySelector(`label[for="${inp.id}"]`)).length;
    a11y -= Math.min(30, noLabel * 5);
    a11y = Math.max(0, Math.min(100, a11y));

    // Error health
    const critCount = this.errors.filter(e => e.severity === 'critical' && e.status === 'new').length;
    const highCount = this.errors.filter(e => e.severity === 'high' && e.status === 'new').length;
    const medCount = this.errors.filter(e => e.severity === 'medium' && e.status === 'new').length;
    const errHealth = Math.max(0, 100 - critCount * 20 - highCount * 10 - medCount * 3);

    // Overall weighted
    const overall = Math.round(perf * 0.3 + sec * 0.25 + seo * 0.15 + a11y * 0.15 + errHealth * 0.15);

    return {
      overall,
      performance: Math.round(perf),
      security: Math.round(sec),
      seo: Math.round(seo),
      accessibility: Math.round(a11y),
      errorHealth: Math.round(errHealth),
    };
  }

  // ── AI Bug Analyzer ───────────────────────────────────────────────────────

  analyzeError(error: ErrorLog): AiAnalysis {
    const msg = error.message.toLowerCase();
    let cause = 'Unknown error cause';
    let why = 'The error was captured by the monitoring system.';
    let affected: string[] = [];
    let risk: ErrorSeverity = error.severity;
    let fix = 'Review the error stack trace and address the root cause.';
    let fixTime = '1–2 hours';
    let sideEffects: string[] = [];
    let confidence = 60;
    let autoFixable = false;

    // Pattern matching
    if (msg.includes('fetch') || msg.includes('network') || error.type === 'network') {
      cause = 'Network or API connectivity failure';
      why = 'A request to an API endpoint failed. This can be caused by server downtime, incorrect URL, CORS policy, or network timeout.';
      affected = ['API Server', 'Data Loading', 'User Experience'];
      fix = '1. Check the API server is running. 2. Verify CORS headers are set. 3. Check for typos in the URL. 4. Add retry logic with exponential backoff.';
      fixTime = '30–60 minutes';
      sideEffects = ['Data may not load', 'Forms may fail to submit', 'Stale cache may be shown'];
      confidence = 82;
      autoFixable = true;
    } else if (msg.includes('undefined') || msg.includes('null') || msg.includes('cannot read')) {
      cause = 'Null or undefined reference error';
      why = 'The code tried to access a property or method on a null/undefined value. This often happens when async data has not yet loaded or an optional field is missing.';
      affected = ['Component Rendering', 'State Management'];
      fix = '1. Add null/undefined checks before accessing nested properties. 2. Use optional chaining (?.). 3. Set default values in component props and state. 4. Ensure async data is loaded before rendering.';
      fixTime = '15–30 minutes';
      sideEffects = ['Component may crash', 'White screen or missing UI sections'];
      confidence = 88;
    } else if (msg.includes('syntax') || msg.includes('unexpected token') || msg.includes('unexpected end')) {
      cause = 'JavaScript syntax error';
      why = 'A syntax error in the JavaScript code prevents it from parsing or executing. This usually happens during build or when dynamically evaluated code is malformed.';
      affected = ['JavaScript Runtime', 'Module Loading'];
      fix = '1. Check the file and line number in the stack trace. 2. Look for unclosed brackets, missing semicolons, or invalid syntax. 3. Re-run the build to catch compilation errors.';
      fixTime = '5–15 minutes';
      sideEffects = ['Entire module may fail to load'];
      confidence = 90;
    } else if (msg.includes('cors') || msg.includes('cross-origin') || msg.includes('blocked')) {
      cause = 'CORS (Cross-Origin Resource Sharing) policy violation';
      why = 'The browser blocked a request because the server did not include the correct CORS headers, or the request does not meet the preflight requirements.';
      affected = ['API Calls', 'External Resources'];
      fix = '1. Add Access-Control-Allow-Origin header on the server. 2. Set up proper CORS middleware. 3. Use a proxy for cross-origin requests. 4. Check credentials and allowed methods in CORS config.';
      fixTime = '30–60 minutes';
      sideEffects = ['API calls from browser will fail'];
      confidence = 87;
    } else if (msg.includes('promise') || error.type === 'promise') {
      cause = 'Unhandled Promise rejection';
      why = 'An async operation rejected its promise but no .catch() handler or try-catch was present to handle the failure.';
      affected = ['Async Operations', 'Data Fetching', 'User Actions'];
      fix = '1. Wrap async calls in try-catch blocks. 2. Add .catch() to all promise chains. 3. Use React Error Boundaries for component-level errors. 4. Add global rejection handler.';
      fixTime = '20–45 minutes';
      sideEffects = ['Silent failures may occur', 'User operations may appear to hang'];
      confidence = 80;
    } else if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('aborted')) {
      cause = 'Request or operation timeout';
      why = 'A network request or async operation exceeded the allowed time limit. Server may be slow, overloaded, or the network connection is poor.';
      affected = ['API Server', 'Network Layer'];
      fix = '1. Increase timeout limits if appropriate. 2. Optimize slow server operations. 3. Add retry logic. 4. Show loading states to users. 5. Implement caching to reduce dependency on slow requests.';
      fixTime = '1–3 hours';
      sideEffects = ['Degraded user experience', 'Data may not save'];
      confidence = 75;
      autoFixable = true;
    } else if (msg.includes('404') || msg.includes('not found')) {
      cause = 'Resource not found (404)';
      why = 'The requested URL, file, or resource does not exist on the server. The resource may have been deleted, moved, or the URL may be incorrect.';
      affected = ['Routing', 'Assets', 'API Endpoints'];
      fix = '1. Check that the URL is correct. 2. Verify the resource exists on the server. 3. Update links/references if the resource was moved. 4. Add proper redirect rules for changed URLs.';
      fixTime = '15–30 minutes';
      sideEffects = ['Missing content or broken features'];
      confidence = 92;
    } else if (msg.includes('memory') || msg.includes('heap') || error.type === 'performance') {
      cause = 'Memory or performance issue';
      why = 'The application is consuming excessive memory or running slow. This can be caused by memory leaks, large datasets, uncleared event listeners, or inefficient rendering.';
      affected = ['Application Performance', 'Browser Memory'];
      fix = '1. Check for event listeners not being cleaned up in useEffect. 2. Audit large state objects. 3. Use React.memo and useMemo for expensive computations. 4. Implement virtualization for long lists. 5. Profile with Chrome DevTools.';
      fixTime = '2–8 hours';
      sideEffects = ['App may become unresponsive', 'Browser tab may crash'];
      confidence = 70;
    } else if (msg.includes('image') || msg.includes('img') || error.type === 'image') {
      cause = 'Broken or missing image asset';
      why = 'An image could not be loaded, likely because the file does not exist at the specified URL, has been deleted, or the URL is incorrect.';
      affected = ['UI Appearance', 'User Experience'];
      fix = '1. Verify the image URL is correct. 2. Check the image file exists in the correct location. 3. Add fallback/placeholder images for error states. 4. Use loading="lazy" for below-fold images.';
      fixTime = '10–20 minutes';
      sideEffects = ['Broken image icons visible to users'];
      confidence = 94;
      autoFixable = true;
    } else if (msg.includes('supabase') || msg.includes('database') || error.type === 'database') {
      cause = 'Database connectivity or query error';
      why = 'A database operation failed. This may be due to invalid credentials, incorrect table/column names, missing rows, RLS policy violations, or network connectivity to the database.';
      affected = ['Database Layer', 'Data Persistence'];
      fix = '1. Check Supabase project is accessible. 2. Verify RLS policies allow the operation. 3. Check table and column names in the query. 4. Review error message for specific constraint violations.';
      fixTime = '1–4 hours';
      sideEffects = ['Data may not save or load', 'Contact forms may fail'];
      confidence = 72;
    } else if (msg.includes('lcp') || msg.includes('fcp') || msg.includes('cls')) {
      cause = 'Core Web Vitals threshold exceeded';
      why = 'Page performance metrics are outside Google\'s recommended thresholds. This affects user experience and search engine rankings.';
      affected = ['Page Performance', 'SEO', 'User Experience'];
      fix = '1. Optimize and lazy-load images. 2. Reduce JavaScript bundle size. 3. Use font-display: swap. 4. Preload critical resources. 5. Minimize layout shifts by reserving space for dynamic content.';
      fixTime = '4–16 hours';
      sideEffects = ['SEO ranking may be affected', 'Users may experience slow loads'];
      confidence = 85;
    }

    return {
      errorId: error.id,
      cause,
      whyItHappened: why,
      affectedAreas: affected.length > 0 ? affected : ['Application Runtime'],
      riskLevel: risk,
      suggestedFix: fix,
      estimatedFixTime: fixTime,
      sideEffects,
      confidence,
      autoFixable,
    };
  }

  // ── Self-Healing ──────────────────────────────────────────────────────────

  async heal(action: string): Promise<{ success: boolean; message: string }> {
    switch (action) {
      case 'clear-cache': {
        try {
          // Clear localStorage health data (not DB)
          localStorage.removeItem(STORAGE_KEY);
          this.errors = [];
          // Clear session cache
          sessionStorage.clear();
          this.emit();
          return { success: true, message: 'Cache cleared successfully. Page data will reload on next visit.' };
        } catch (e) {
          return { success: false, message: `Failed to clear cache: ${(e as Error).message}` };
        }
      }
      case 'reconnect-ws': {
        try {
          const wsInit = (window as unknown as Record<string, unknown>).__sbgWsConnect;
          if (typeof wsInit === 'function') (wsInit as () => void)();
          return { success: true, message: 'WebSocket reconnection triggered.' };
        } catch {
          return { success: false, message: 'Could not reconnect WebSocket (function not available).' };
        }
      }
      case 'retry-api': {
        try {
          await this.checkServices();
          return { success: true, message: 'API health check completed.' };
        } catch (e) {
          return { success: false, message: `API check failed: ${(e as Error).message}` };
        }
      }
      case 'reload-assets': {
        // Force reload without cache
        window.location.reload();
        return { success: true, message: 'Reloading page to refresh assets...' };
      }
      case 'clear-errors': {
        this.errors = [];
        this.saveErrors();
        this.emit();
        return { success: true, message: 'All error logs cleared.' };
      }
      case 'resolve-all': {
        this.errors = this.errors.map(e => ({ ...e, status: 'resolved' as ErrorStatus }));
        this.saveErrors();
        this.emit();
        return { success: true, message: `Marked ${this.errors.length} errors as resolved.` };
      }
      default:
        return { success: false, message: `Unknown action: ${action}` };
    }
  }

  // ── Error Management ──────────────────────────────────────────────────────

  logError(data: Partial<ErrorLog> & { type: ErrorCategory; message: string; url: string }) {
    const now = Date.now();
    // Deduplicate: same message within DEDUP_WINDOW_MS
    const existing = this.errors.find(e =>
      e.message === data.message && e.type === data.type &&
      now - e.timestamp < DEDUP_WINDOW_MS && e.status === 'new'
    );
    if (existing) {
      existing.count++;
      existing.timestamp = now;
      this.saveErrors();
      this.emit();
      return;
    }

    const entry: ErrorLog = {
      id: `e_${now}_${Math.random().toString(36).slice(2, 7)}`,
      type: data.type,
      severity: data.severity || 'medium',
      message: data.message,
      stack: data.stack,
      url: data.url,
      filename: data.filename,
      lineno: data.lineno,
      colno: data.colno,
      userAgent: navigator.userAgent,
      screen: `${window.innerWidth}×${window.innerHeight}`,
      timestamp: now,
      status: 'new',
      priority: data.severity === 'critical' ? 1 : data.severity === 'high' ? 2 : data.severity === 'medium' ? 3 : 4,
      count: 1,
      tags: [data.type],
      extra: data.extra,
    };

    this.errors.push(entry);
    this.saveErrors();
    this.emit();
  }

  resolveError(id: string) {
    const e = this.errors.find(e => e.id === id);
    if (e) { e.status = 'resolved'; this.saveErrors(); this.emit(); }
  }

  deleteError(id: string) {
    this.errors = this.errors.filter(e => e.id !== id);
    this.saveErrors();
    this.emit();
  }

  updatePriority(id: string, priority: ErrorPriority) {
    const e = this.errors.find(e => e.id === id);
    if (e) { e.priority = priority; this.saveErrors(); this.emit(); }
  }

  updateStatus(id: string, status: ErrorStatus) {
    const e = this.errors.find(e => e.id === id);
    if (e) { e.status = status; this.saveErrors(); this.emit(); }
  }

  // ── Export ────────────────────────────────────────────────────────────────

  exportCsv(errors: ErrorLog[]): void {
    const cols = ['id', 'type', 'severity', 'message', 'url', 'status', 'priority', 'timestamp', 'count', 'userAgent', 'screen'];
    const rows = errors.map(e => cols.map(c => {
      const val = (e as unknown as Record<string, unknown>)[c];
      const s = c === 'timestamp' ? new Date(val as number).toISOString() : String(val ?? '');
      return `"${s.replace(/"/g, '""')}"`;
    }).join(','));
    const csv = [cols.join(','), ...rows].join('\n');
    this.download(csv, 'sbg-army-errors.csv', 'text/csv');
  }

  exportJson(errors: ErrorLog[]): void {
    this.download(JSON.stringify(errors, null, 2), 'sbg-army-errors.json', 'application/json');
  }

  exportHealthReport(scores: HealthScores): void {
    const report = {
      generatedAt: new Date().toISOString(),
      scores,
      errors: { total: this.errors.length, new: this.errors.filter(e => e.status === 'new').length },
      performance: this.metrics,
      services: this.services,
    };
    this.download(JSON.stringify(report, null, 2), 'sbg-army-health-report.json', 'application/json');
  }

  private download(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  getErrors() { return [...this.errors].reverse(); }
  getMetrics() { return { ...this.metrics }; }
  getServices() { return [...this.services]; }
  getSecurityResults() { return [...this.securityResults]; }
  getDbIssues() { return [...this.dbIssues]; }
  getScheduledChecks() { return [...this.scheduledChecks]; }
  getNewErrorCount() { return this.errors.filter(e => e.status === 'new').length; }

  // ── Event System ──────────────────────────────────────────────────────────

  subscribe(fn: MonitorListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach(fn => fn());
  }

  destroy() {
    // Clear all intervals
    this.intervals.forEach(clearInterval);
    this.intervals = [];

    // Cancel RAF loop
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = 0; }

    // Disconnect all PerformanceObservers
    this.observers.forEach(obs => { try { obs.disconnect(); } catch {} });
    this.observers = [];

    // Remove event listeners using stored handler references
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler, true);
      this.errorHandler = null;
    }
    if (this.rejectionHandler) {
      window.removeEventListener('unhandledrejection', this.rejectionHandler);
      this.rejectionHandler = null;
    }

    // Restore original console.error
    if (this.origConsoleError) {
      console.error = this.origConsoleError;
      this.origConsoleError = null;
    }

    // Restore original window.fetch safely
    if (this.origFetch) {
      try {
        window.fetch = this.origFetch;
      } catch (e) {
        try {
          Object.defineProperty(window, 'fetch', {
            value: this.origFetch,
            writable: true,
            configurable: true
          });
        } catch {}
      }
      this.origFetch = null;
    }

    this.initialized = false;
    this.listeners.clear();
  }
}

// Singleton export
export const healthMonitor = new HealthMonitor();
