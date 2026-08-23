import { Router } from 'express';
import { readCol, writeCol, readAll } from '../lib/store.js';
import { broadcast, getClientCount } from '../lib/wsServer.js';
import { requireAdmin, requireSuperAdmin, optionalAdminAuth } from '../middleware/requireAdmin.js';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'sbg_army_admin_jwt_secret_key_2026';

// Collections that must never expose sensitive fields publicly
const SENSITIVE_FIELDS: Record<string, string[]> = {
  staffAccounts: ['password'],
  playerUsers: ['passwordHash', 'resetToken'],
};

// Collections completely private from unauthenticated visitors
const PRIVATE_COLLECTIONS = [
  'staffAccounts',
  'recruitment',
  'contact_messages',
  'feedback',
  'fan_messages',
  'collab_requests',
  'orders',
  'audit_logs',
  'security_logs',
  'login_attempts',
  'locked_accounts',
];

// Collections that strictly require SUPER_ADMIN role for write operations
const SUPER_ADMIN_WRITE_COLLECTIONS = [
  'staffAccounts',
  'security',
  'audit_logs',
  'security_logs',
];

function scrub(collection: string, data: unknown): unknown {
  if (PRIVATE_COLLECTIONS.includes(collection)) return [];
  const fields = SENSITIVE_FIELDS[collection];
  if (!fields || !Array.isArray(data)) return data;
  return (data as Record<string, unknown>[]).map(item => {
    const copy = { ...item };
    for (const f of fields) delete copy[f];
    return copy;
  });
}

function adminScrub(collection: string, data: unknown): unknown {
  const fields = SENSITIVE_FIELDS[collection];
  if (!fields || !Array.isArray(data)) return data;
  return (data as Record<string, unknown>[]).map(item => {
    const copy = { ...item };
    for (const f of fields) delete copy[f];
    return copy;
  });
}

/**
 * When writing back a collection that has sensitive fields, preserve the
 * existing sensitive values from disk for any record whose incoming data
 * is missing those fields (e.g. because the client received a scrubbed view).
 */
async function mergeSensitive(collection: string, data: unknown): Promise<unknown> {
  const fields = SENSITIVE_FIELDS[collection];
  if (!fields || !Array.isArray(data)) return data;
  const existing = ((await readCol(collection)) as Record<string, unknown>[]) ?? [];
  return (data as Record<string, unknown>[]).map(item => {
    const found = existing.find(e => e['id'] === item['id']);
    if (!found) return item;
    const merged = { ...item };
    for (const f of fields) {
      if (!merged[f] && found[f]) merged[f] = found[f];
    }
    return merged;
  });
}

router.get('/db', optionalAdminAuth, async (req, res) => {
  const user = (req as any).user;
  const isAdmin = Boolean(user && user.role);

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const all = (await readAll()) as Record<string, unknown>;
  const safe: Record<string, unknown> = {};

  for (const [col, data] of Object.entries(all)) {
    if (isAdmin) {
      // Super admin gets full access (except raw password hashes are scrubbed for safety)
      // Staff accounts get access if within their allowed scope or general collections
      if (user.role === 'super_admin') {
        safe[col] = adminScrub(col, data);
      } else if (PRIVATE_COLLECTIONS.includes(col)) {
        // Staff only see private collections if relevant
        if (user.allowedModules?.includes('*') || user.allowedModules?.includes(col)) {
          safe[col] = adminScrub(col, data);
        } else {
          safe[col] = [];
        }
      } else {
        safe[col] = adminScrub(col, data);
      }
    } else {
      safe[col] = scrub(col, data);
    }
  }
  res.json(safe);
});

router.get('/db/ws-status', async (_req, res) => {
  res.json({ connectedClients: getClientCount() });
});

router.get('/db/:collection', optionalAdminAuth, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const collection = String(req.params['collection']);
  // Prevent prototype pollution or key injection
  if (['__proto__', 'constructor', 'prototype'].includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection name' });
  }

  const user = (req as any).user;
  const isAdmin = Boolean(user && user.role);
  const rawData = await readCol(collection);

  if (isAdmin) {
    if (user.role === 'super_admin') {
      return res.json(adminScrub(collection, rawData));
    }
    if (PRIVATE_COLLECTIONS.includes(collection)) {
      if (user.allowedModules?.includes('*') || user.allowedModules?.includes(collection)) {
        return res.json(adminScrub(collection, rawData));
      }
      return res.json([]);
    }
    return res.json(adminScrub(collection, rawData));
  } else {
    return res.json(scrub(collection, rawData));
  }
});

function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '#';
  const trimmed = rawUrl.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return '#';
  }
  return trimmed;
}

function sanitizeExternalLinksInSettings(collection: string, data: any): any {
  if (collection !== 'settings' || !data || typeof data !== 'object') return data;
  if (Array.isArray(data.externalLinks)) {
    data.externalLinks = data.externalLinks.map((link: any) => ({
      ...link,
      id: String(link.id || `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
      name: String(link.name || '').trim(),
      url: sanitizeUrl(link.url),
      enabled: Boolean(link.enabled),
      order: typeof link.order === 'number' ? link.order : 0,
    }));
  }
  return data;
}

async function enforceThemePermission(req: any, collection: string, data: any): Promise<any> {
  if (collection !== 'settings' || !data || typeof data !== 'object') return data;
  const existing = ((await readCol('settings')) as Record<string, any>) || {};
  if (data.activeTheme !== undefined && data.activeTheme !== existing.activeTheme) {
    const userRole = req.user?.role;
    if (userRole !== 'super_admin') {
      return { ...data, activeTheme: existing.activeTheme };
    }
  }
  return data;
}

router.post('/db/:collection', requireAdmin, async (req, res) => {
  const collection = String(req.params['collection']);
  if (['__proto__', 'constructor', 'prototype'].includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection name' });
  }

  const user = (req as any).user;

  // Protect Super Admin only collections
  if (SUPER_ADMIN_WRITE_COLLECTIONS.includes(collection) && user?.role !== 'super_admin') {
    return res.status(403).json({ ok: false, error: 'Insufficient permissions. Super Admin required for this module.' });
  }

  // Scoped module permission check for regular staff
  if (user?.role !== 'super_admin' && Array.isArray(user?.allowedModules) && !user.allowedModules.includes('*')) {
    if (!user.allowedModules.includes(collection)) {
      return res.status(403).json({ ok: false, error: `Access denied. You do not have permission to manage ${collection}.` });
    }
  }

  let data = await mergeSensitive(collection, req.body);
  data = await enforceThemePermission(req, collection, data);
  data = sanitizeExternalLinksInSettings(collection, data);
  await writeCol(collection, data);

  // Broadcast scrubbed data to WebSocket clients (never leak sensitive fields)
  broadcast({ type: 'db_update', collection, data: scrub(collection, data), timestamp: Date.now() });
  res.json({ ok: true });
});

router.post('/db', requireAdmin, async (req, res) => {
  const updates = req.body as Record<string, unknown>;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ ok: false, error: 'Invalid update payload' });
  }

  const user = (req as any).user;
  const safeUpdates: Record<string, unknown> = {};

  for (const [col, rawData] of Object.entries(updates)) {
    if (['__proto__', 'constructor', 'prototype'].includes(col)) continue;

    if (SUPER_ADMIN_WRITE_COLLECTIONS.includes(col) && user?.role !== 'super_admin') {
      continue; // Skip restricted collections for non-super admins
    }

    if (user?.role !== 'super_admin' && Array.isArray(user?.allowedModules) && !user.allowedModules.includes('*')) {
      if (!user.allowedModules.includes(col)) continue;
    }

    let merged = await mergeSensitive(col, rawData);
    merged = await enforceThemePermission(req, col, merged);
    merged = sanitizeExternalLinksInSettings(col, merged);
    await writeCol(col, merged);
    safeUpdates[col] = scrub(col, merged);
  }

  broadcast({ type: 'db_update_bulk', updates: safeUpdates, timestamp: Date.now() });
  res.json({ ok: true });
});

router.get('/backup', requireSuperAdmin, async (_req, res) => {
  try {
    const all = await readAll();
    const payload = JSON.stringify(all, null, 2);
    const filename = `sbg-army-backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(payload);
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Backup failed' });
  }
});

router.post('/restore', requireSuperAdmin, async (req, res) => {
  try {
    const data = req.body as Record<string, unknown>;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ ok: false, error: 'Invalid backup format' });
    }
    for (const [col, value] of Object.entries(data)) {
      if (['__proto__', 'constructor', 'prototype'].includes(col)) continue;
      await writeCol(col, await mergeSensitive(col, value));
    }
    broadcast({ type: 'db_update_bulk', updates: data, timestamp: Date.now() });
    return res.json({ ok: true, restored: Object.keys(data).length });
  } catch {
    return res.status(500).json({ ok: false, error: 'Restore failed' });
  }
});

router.get('/source-export', requireSuperAdmin, async (_req, res) => {
  try {
    const workspace = path.resolve('.');
    const filename = `sbg-army-source-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.tar.gz`;
    const tmpFile = path.join('/tmp', `sbg-export-${Date.now()}.tar.gz`);

    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    await execFileAsync('tar', [
      "--exclude=*/node_modules",
      "--exclude=*/.git",
      "--exclude=*/dist",
      "-czf",
      tmpFile,
      "-C",
      workspace,
      "artifacts/sbg-army/src",
      "artifacts/sbg-army/public",
      "artifacts/sbg-army/package.json",
      "artifacts/api-server/src",
      "artifacts/api-server/package.json",
    ], { timeout: 30000 });

    if (fs.existsSync(tmpFile)) {
      const fileBuffer = fs.readFileSync(tmpFile);
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(fileBuffer);
      try { fs.unlinkSync(tmpFile); } catch {}
    } else {
      res.status(500).json({ ok: false, error: 'Export package creation failed' });
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Source export failed' });
  }
});

export default router;

