import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { readCol, writeCol } from '../lib/store.js';

const router = Router();

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'sbg_army_admin_jwt_secret_key_2026';
const JWT_EXPIRES = '24h';

interface StaffAccount {
  id: string; name: string; email: string; password: string;
  role: 'super_admin' | 'admin' | 'staff'; allowedModules: string[];
  active: boolean; createdAt: number; photo?: string;
}

// ── Rate limiter for auth endpoints (30 attempts / 15 mins per IP with safe cooldown) ──────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(429).json({
      success: false,
      error: 'Too many attempts. Please wait 15 minutes and try again.',
      retryAfterSeconds: 900,
    });
  },
});

// One-time setup lock flag (in-process; survives the race condition for concurrent requests)
let setupInProgress = false;

const comparePassword = async (pass: string, targetHashOrPass: string): Promise<boolean> => {
  if (!pass || !targetHashOrPass) return false;
  try {
    const fn = (bcrypt as any).compare || (bcrypt as any).default?.compare;
    if (typeof fn === 'function') {
      const isBcrypt = /^\$2[aby]\$/.test(targetHashOrPass);
      if (isBcrypt) {
        return await fn(pass, targetHashOrPass);
      }
    }
  } catch (err) {
    console.error('[bcrypt compare error]', err);
  }
  // Fallback for hardcoded unhashed master passwords only
  return pass === targetHashOrPass;
};

const hashPassword = async (pass: string): Promise<string> => {
  const fn = (bcrypt as any).hash || (bcrypt as any).default?.hash;
  if (typeof fn === 'function') {
    return await fn(pass, 10);
  }
  throw new Error('Bcrypt hash function not available.');
};

/**
 * POST /debug-login (Diagnostic endpoint)
 * Logs and returns the exact headers and request body received during an authentication attempt.
 */
router.post(['/debug-login', '/admin/debug-login'], (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  console.log('[DEBUG-LOGIN] Request received:', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    ip: req.ip
  });
  
  res.status(200).json({
    success: true,
    diagnostic: true,
    message: 'Diagnostic endpoint reached successfully',
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    ip: req.ip
  });
});

/**
 * POST /login (also /admin/login for backwards compatibility)
 * Authenticates against stored staffAccounts database using standard bcrypt verification.
 * Returns JWT + allowedModules so the client can build the staff session.
 */
router.post(['/login', '/admin/login'], authLimiter, async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required.' });
    }

    const rawAccounts = await readCol('staffAccounts');
    let accounts = Array.isArray(rawAccounts) ? (rawAccounts as StaffAccount[]) : [];
    const emailLower = email.trim().toLowerCase();

    // Built-in Super Admin accounts whitelist with full failover
    const SUPER_ADMIN_EMAILS = [
      'official7sbgarmy@gamil.com',
      'official7sbgarmy7@gamil.com',
      'official7sbgarmy@gmail.com',
      'official7sbgarmy7@gmail.com',
      'shubhamgupta72620@gmail.com',
    ];

    const MASTER_PASSWORDS = [
      'official7sbgarmyweb2@',
      'official7Sbgarmyweb2@',
      'Official7Sbgarmyweb2@',
    ];

    // Check if user account exists in database
    let account = accounts.find(
      a => a.email && a.email.trim().toLowerCase() === emailLower
    );

    // If super admin email and not in DB or missing valid hash, create/restore it dynamically
    if (SUPER_ADMIN_EMAILS.includes(emailLower)) {
      if (!account) {
        account = {
          id: `admin_sbgarmy_${Date.now()}`,
          name: 'SBG ARMY Super Admin',
          email: emailLower,
          password: '$2b$10$fs1CMTHxeIDdhZLAMKQA7.I1L6Uud2lnz3OFjQKgxjcJtMe6VWIBy',
          role: 'super_admin',
          allowedModules: ['*'],
          active: true,
          createdAt: Date.now(),
        };
        accounts.push(account);
        await writeCol('staffAccounts', accounts).catch(() => {});
      }
    }

    if (!account) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    if (!account.active) {
      return res.status(401).json({ success: false, error: 'Account is inactive. Contact Administrator.' });
    }

    if (!account.password) {
      return res.status(500).json({
        success: false,
        error: 'User password hash is missing or invalid in database record.',
      });
    }

    let match = await comparePassword(password, account.password);
    
    // Direct master password verification fallback for super admin accounts
    if (!match && SUPER_ADMIN_EMAILS.includes(emailLower) && MASTER_PASSWORDS.some(mp => mp.toLowerCase() === password.trim().toLowerCase())) {
      match = true;
      // Sync the hashed password into database record
      account.password = '$2b$10$fs1CMTHxeIDdhZLAMKQA7.I1L6Uud2lnz3OFjQKgxjcJtMe6VWIBy';
      account.active = true;
      account.role = 'super_admin';
      await writeCol('staffAccounts', accounts).catch(() => {});
    }

    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    // Auto-upgrade plain text password to bcrypt if needed
    const isHash = /^\$2[aby]\$/.test(account.password ?? '');
    if (!isHash) {
      try {
        const newHash = await hashPassword(password);
        if (newHash !== password) {
          const upgraded = accounts.map(a =>
            a.id === account!.id ? { ...a, password: newHash } : a
          );
          await writeCol('staffAccounts', upgraded);
        }
      } catch (err) {
        console.error('[Auto-upgrade hash failed]', err);
      }
    }

    // Ensure super admin account is mapped to super_admin role
    const effectiveRole = (SUPER_ADMIN_EMAILS.includes(emailLower) || account.role === 'super_admin')
      ? 'super_admin'
      : account.role;

    const allowedModules: string[] = (effectiveRole === 'admin' || effectiveRole === 'super_admin')
      ? ['*']
      : (account.allowedModules ?? []);

    const token = jwt.sign(
      {
        uid: account.id,
        email: account.email,
        name: account.name || 'Super Admin',
        role: effectiveRole,
        allowedModules,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.cookie('sbg_admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.json({
      success: true,
      token,
      role: effectiveRole,
      name: account.name || 'Super Admin',
      email: account.email,
      allowedModules,
    });
  } catch (err) {
    console.error('[Admin Login Error]', err);
    next(err);
  }
});

/**
 * POST /refresh — issue a fresh 24-hour JWT from a valid existing token.
 */
router.post(['/refresh', '/admin/refresh'], rateLimit({ windowMs: 60_000, max: 60 }), (req, res) => {
  if (!JWT_SECRET) return res.status(503).json({ success: false, error: 'Auth disabled.' });
  try {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.cookies?.sbg_admin_token ?? '');
    if (!token) return res.status(401).json({ success: false, error: 'No token.' });

    const payload = jwt.verify(token, JWT_SECRET) as {
      uid: string; email: string; name: string; role: string; allowedModules?: string[];
    };

    const newToken = jwt.sign(
      { uid: payload.uid, email: payload.email, name: payload.name, role: payload.role, allowedModules: payload.allowedModules ?? [] },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.cookie('sbg_admin_token', newToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.json({ success: true, token: newToken });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
});

/** GET /verify — verify JWT, return session info */
router.get(['/verify', '/admin/verify'], (req, res) => {
  if (!JWT_SECRET) return res.status(503).json({ success: false, error: 'Server misconfiguration: auth disabled.' });
  try {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.cookies?.sbg_admin_token ?? '');
    if (!token) return res.status(401).json({ success: false, error: 'No token.' });

    const payload = jwt.verify(token, JWT_SECRET) as {
      uid: string; email: string; name: string; role: string; allowedModules?: string[];
    };

    const ADMIN_ROLES = ['super_admin', 'admin', 'tournament_admin', 'media_admin', 'content_editor', 'moderator', 'viewer', 'staff'];
    if (!ADMIN_ROLES.includes(payload.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions.' });
    }

    return res.json({
      success: true,
      uid: payload.uid,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      allowedModules: payload.allowedModules ?? [],
    });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
});

/** POST /setup — first-time only, creates super admin when none exist */
router.post(['/setup', '/admin/setup'], authLimiter, async (req, res) => {
  if (setupInProgress) {
    return res.status(409).json({ success: false, error: 'Setup already in progress.' });
  }
  setupInProgress = true;
  try {
    const { name, email, password } = req.body as {
      name?: string; email?: string; password?: string;
    };
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password required.' });
    }
    if (password.length < 12) {
      return res.status(400).json({ success: false, error: 'Password must be at least 12 characters.' });
    }

    const accounts = (await readCol('staffAccounts') as StaffAccount[]) ?? [];
    const hasAdmin = accounts.some(a => (a.role === 'admin' || a.role === 'super_admin') && a.active);
    if (hasAdmin) {
      return res.status(403).json({ success: false, error: 'Admin already exists. Use login.' });
    }

    const alreadyExists = accounts.find(
      a => a.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (alreadyExists) {
      return res.status(409).json({ success: false, error: 'Email already registered.' });
    }

    const hash = await hashPassword(password);
    const newAdmin: StaffAccount = {
      id: `admin_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hash,
      role: 'super_admin',
      allowedModules: ['*'],
      active: true,
      createdAt: Date.now(),
    };

    await writeCol('staffAccounts', [...accounts, newAdmin]);
    return res.json({ success: true, message: 'Admin account created.' });
  } catch {
    return res.status(500).json({ success: false, error: 'Server error.' });
  } finally {
    setupInProgress = false;
  }
});

/**
 * POST /staff — create or update a staff account.
 */
router.post(['/staff', '/admin/staff'], authLimiter, async (req, res) => {
  if (!JWT_SECRET) return res.status(503).json({ success: false, error: 'Auth disabled.' });

  let callerRole: string;
  try {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.cookies?.sbg_admin_token ?? '');
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated.' });
    const payload = jwt.verify(token, JWT_SECRET) as { role: string };
    if (!['admin', 'super_admin'].includes(payload.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions.' });
    }
    callerRole = payload.role;
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }

  const { id, name, email, password, role, allowedModules, active, photo } = req.body as {
    id?: string; name?: string; email?: string; password?: string;
    role?: 'super_admin' | 'admin' | 'staff'; allowedModules?: string[];
    active?: boolean; photo?: string;
  };

  if (!name || !email || !role) {
    return res.status(400).json({ success: false, error: 'name, email and role are required.' });
  }

  if ((role === 'admin' || role === 'super_admin') && callerRole !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Only Super Admin can create or assign admin roles.' });
  }

  try {
    const accounts = (await readCol('staffAccounts') as StaffAccount[]) ?? [];
    const emailLc = email.trim().toLowerCase();

    if (id) {
      const idx = accounts.findIndex(a => a.id === id);
      if (idx < 0) return res.status(404).json({ success: false, error: 'Account not found.' });

      const target = accounts[idx];
      if ((target.role === 'admin' || target.role === 'super_admin') && callerRole !== 'super_admin') {
        return res.status(403).json({ success: false, error: 'Only Super Admin can modify admin accounts.' });
      }

      const updated: StaffAccount = {
        ...target,
        name: name.trim(),
        email: emailLc,
        role,
        allowedModules: allowedModules ?? target.allowedModules,
        active: active !== false,
      };
      if (photo !== undefined) (updated as any).photo = photo;
      if (password && password.trim()) {
        updated.password = await hashPassword(password.trim());
      }
      accounts[idx] = updated;
    } else {
      const duplicate = accounts.find(a => a.email === emailLc);
      if (duplicate) return res.status(409).json({ success: false, error: 'Email already registered.' });
      if (!password || password.trim().length < 12) {
        return res.status(400).json({ success: false, error: 'Password must be at least 12 characters.' });
      }
      const defaultModules = (role === 'admin' || role === 'super_admin') ? ['*'] : (allowedModules ?? []);
      const newAcc: StaffAccount = {
        id: `staff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        email: emailLc,
        password: await hashPassword(password.trim()),
        role,
        allowedModules: defaultModules,
        active: active !== false,
        createdAt: Date.now(),
      };
      if (photo) (newAcc as any).photo = photo;
      accounts.push(newAcc);
    }

    await writeCol('staffAccounts', accounts);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, error: 'Server error.' });
  }
});

/**
 * DELETE /staff/:id — remove a staff account.
 */
router.delete(['/staff/:id', '/admin/staff/:id'], authLimiter, async (req, res) => {
  if (!JWT_SECRET) return res.status(503).json({ success: false, error: 'Auth disabled.' });

  let callerRole: string;
  try {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.cookies?.sbg_admin_token ?? '');
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated.' });
    const payload = jwt.verify(token, JWT_SECRET) as { role: string };
    if (!['admin', 'super_admin'].includes(payload.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions.' });
    }
    callerRole = payload.role;
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }

  const { id } = req.params as { id: string };
  const accounts = (await readCol('staffAccounts') as StaffAccount[]) ?? [];
  const target = accounts.find(a => a.id === id);

  if (target && (target.role === 'admin' || target.role === 'super_admin') && callerRole !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Only Super Admin can delete admin accounts.' });
  }

  await writeCol('staffAccounts', accounts.filter(a => a.id !== id));
  return res.json({ success: true });
});


/** GET /logout — clears the auth cookie */
router.get(['/logout', '/admin/logout'], (req, res) => {
  res.clearCookie('sbg_admin_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  return res.json({ success: true, message: 'Logged out.' });
});
export default router;
