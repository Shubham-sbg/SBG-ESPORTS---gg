import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'sbg_army_admin_jwt_secret_key_2026';

// Roles allowed to perform write operations on the database
const WRITE_ROLES = ['super_admin', 'admin', 'staff', 'tournament_admin', 'media_admin', 'content_editor'];

export interface AdminJWTPayload {
  uid: string;
  email: string;
  name: string;
  role: string;
  allowedModules?: string[];
  iat?: number;
  exp?: number;
}

export function optionalAdminAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.cookies?.sbg_admin_token ?? '');
    if (token && JWT_SECRET) {
      const payload = jwt.verify(token, JWT_SECRET) as AdminJWTPayload;
      if (payload && payload.role) {
        (req as any).user = payload;
      }
    }
  } catch {}
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Content-Type', 'application/json');
  if (!JWT_SECRET) {
    return res.status(503).json({ ok: false, error: 'Server misconfiguration: SESSION_SECRET not set.' });
  }
  try {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.cookies?.sbg_admin_token ?? '');
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Authentication required.' });
    }
    const payload = jwt.verify(token, JWT_SECRET) as AdminJWTPayload;
    const roleLower = (payload.role ?? '').toLowerCase();
    if (!payload.role || !WRITE_ROLES.includes(roleLower)) {
      return res.status(403).json({ ok: false, error: 'Insufficient permissions.' });
    }
    (req as any).user = payload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token.' });
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Content-Type', 'application/json');
  if (!JWT_SECRET) {
    return res.status(503).json({ ok: false, error: 'Server misconfiguration: SESSION_SECRET not set.' });
  }
  try {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.cookies?.sbg_admin_token ?? '');
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Authentication required.' });
    }
    const payload = jwt.verify(token, JWT_SECRET) as AdminJWTPayload;
    const roleLower = (payload.role ?? '').toLowerCase();
    if (roleLower !== 'super_admin') {
      return res.status(403).json({ ok: false, error: 'Insufficient permissions. Super Admin required.' });
    }
    (req as any).user = payload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token.' });
  }
}


