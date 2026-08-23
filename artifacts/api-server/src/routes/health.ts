import { Router } from 'express';
import os from 'os';
import { readCol, getDatabaseDir, getDbConnectionStatus, testDatabaseQuery } from '../lib/store.js';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { requireAdmin } from '../middleware/requireAdmin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();

/** GET /healthz — simple liveness check */
router.get('/healthz', async (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/** GET /health/deep — deep liveness and database diagnostics (public for probes) */
router.get('/health/deep', async (_req, res) => {
  const ts = Date.now();
  const connStatus = getDbConnectionStatus();
  const queryResult = await testDatabaseQuery();

  const status = queryResult.success ? 'healthy' : 'unhealthy';

  res.status(queryResult.success ? 200 : 500).json({
    status,
    timestamp: ts,
    database: {
      connected: connStatus.isPgConnected,
      engine: connStatus.type,
      configured: connStatus.databaseUrlConfigured,
      ping: {
        success: queryResult.success,
        latencyMs: queryResult.latency,
        error: queryResult.error || null,
      }
    },
    system: {
      uptime: process.uptime(),
      memory: {
        free: os.freemem(),
        total: os.totalmem(),
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
      },
      loadavg: os.loadavg(),
    }
  });
});

/** GET /health/detailed — full infrastructure status (restricted to admin) */
router.get('/health/detailed', requireAdmin, async (_req, res) => {
  const ts = Date.now();
  const DATA_DIR = process.env.DATA_DIR
    ? resolve(process.env.DATA_DIR)
    : getDatabaseDir();

  /* ── 1. Database ── */
  let dbStatus: 'online' | 'degraded' | 'offline' = 'online';
  let dbDetails = '';
  let dbLatency = 0;
  let lastSync: number | null = null;
  let lastBackup: number | null = null;

  const connStatus = getDbConnectionStatus();
  const queryResult = await testDatabaseQuery();

  try {
    dbLatency = queryResult.latency;

    if (!queryResult.success) {
      dbStatus = 'offline';
      dbDetails = `Database query failed (${connStatus.type}): ${queryResult.error || 'Unknown error'}`;
    } else {
      const settings = await readCol('settings');
      if (!settings) {
        dbStatus = 'degraded';
        dbDetails = `Connected to ${connStatus.type} but settings collection is empty`;
      } else {
        dbStatus = 'online';
        dbDetails = `Connected to ${connStatus.type} successfully · Ping query executed in ${queryResult.latency}ms`;
      }
    }

    // Find latest write time across all JSON files
    if (existsSync(DATA_DIR)) {
      const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
      let latest = 0;
      for (const f of files) {
        try {
          const mtime = statSync(join(DATA_DIR, f)).mtimeMs;
          if (mtime > latest) latest = mtime;
        } catch {}
      }
      if (latest > 0) lastSync = latest;
    }
  } catch (err) {
    dbStatus = 'offline';
    dbDetails = `Store error: ${String(err).slice(0, 80)}`;
  }

  /* ── 2. Authentication ── */
  let authStatus: 'online' | 'degraded' | 'offline' = 'online';
  let authDetails = 'JWT auth operational';
  if (!process.env.SESSION_SECRET) {
    authStatus = 'offline';
    authDetails = 'SESSION_SECRET not configured — admin auth disabled';
  } else {
    try {
      const accounts = await readCol('staffAccounts') as unknown[];
      if (!Array.isArray(accounts)) {
        authStatus = 'degraded';
        authDetails = 'Staff accounts collection invalid';
      } else {
        authDetails = `JWT auth active · ${accounts.length} account(s)`;
      }
    } catch {
      authStatus = 'degraded';
      authDetails = 'Cannot read staff accounts';
    }
  }

  /* ── 3. Storage ── */
  let storageStatus: 'online' | 'degraded' | 'offline' = 'online';
  let storageDetails = 'File system operational';
  let fileCount = 0;
  if (!existsSync(DATA_DIR)) {
    storageStatus = 'offline';
    storageDetails = `Data directory missing: ${DATA_DIR}`;
  } else {
    try {
      const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
      fileCount = files.length;
      storageDetails = `${fileCount} collections on disk`;
    } catch (err) {
      storageStatus = 'degraded';
      storageDetails = `Directory read error: ${String(err).slice(0, 60)}`;
    }
  }

  /* ── 4. Cache ── */
  const heapUsed = Math.round(process.memoryUsage().heapUsed / 1e6);
  const heapTotal = Math.round(process.memoryUsage().heapTotal / 1e6);
  const cacheStatus: 'online' = 'online';
  const cacheDetails = `In-memory cache active · Heap ${heapUsed}/${heapTotal} MB`;

  /* ── 5. Server ── */
  const serverStatus: 'online' = 'online';
  const uptimeSec = Math.round(process.uptime());
  const uptimeStr = uptimeSec < 60
    ? `${uptimeSec}s`
    : uptimeSec < 3600
    ? `${Math.floor(uptimeSec / 60)}m ${uptimeSec % 60}s`
    : `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`;
  const serverDetails = `Uptime ${uptimeStr} · Node ${process.version}`;

  /* ── 6. API ── */
  const apiStatus: 'online' = 'online';
  const apiLatency = Date.now() - ts;
  const apiDetails = `Response ${apiLatency}ms · ${new Date().toISOString()}`;

  /* ── Overall ── */
  const statuses = [dbStatus, authStatus, storageStatus, cacheStatus, serverStatus, apiStatus];
  const overallStatus = statuses.some(s => s === 'offline')
    ? 'critical'
    : statuses.some(s => s === 'degraded')
    ? 'degraded'
    : 'healthy';

  return res.json({
    status: overallStatus,
    timestamp: ts,
    uptime: process.uptime(),
    services: {
      database:       { 
        status: dbStatus,       
        latency: dbLatency,  
        details: dbDetails,
        diagnostics: {
          activeEngine: connStatus.type,
          isPostgresConnected: connStatus.isPgConnected,
          databaseUrlConfigured: connStatus.databaseUrlConfigured,
          pingSuccess: queryResult.success,
          pingError: queryResult.error || null
        }
      },
      api:            { status: apiStatus,       latency: apiLatency, details: apiDetails },
      storage:        { status: storageStatus,   details: storageDetails },
      authentication: { status: authStatus,      details: authDetails },
      cache:          { status: cacheStatus,     details: cacheDetails },
      server:         { status: serverStatus,    details: serverDetails },
    },
    lastBackup,
    lastSync,
    memoryMb: { used: heapUsed, total: heapTotal },
    nodeVersion: process.version,
    platform: process.platform,
  });
});

export default router;

