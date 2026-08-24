import { apiUrl } from './api';

export type AdminRole = 'super_admin' | 'admin' | 'staff';
export type AdminModule = string;

const OWNER_EMAILS: string[] = [];
export const STAFF_ASSIGNABLE_MODULES: AdminModule[] = ['*'];
export const OWNER_MODULES: AdminModule[] = ['*'];
export const ADMIN_MODULES: AdminModule[] = ['*'];

export function isOwnerEmail(email: string): boolean {
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
}

export function isEmailWhitelisted(email: string): boolean {
  return isOwnerEmail(email);
}

export function verifyPassword(password: string): boolean {
  return false; // Deprecated client-side check
}

export function createSession(email: string): void {}
export function destroySession(): void {}

export function isAuthenticated(): boolean {
  return !!(typeof window !== 'undefined' && (window as any).__sbgAdminSession);
}

export function getSessionEmail(): string {
  return (typeof window !== 'undefined' && (window as any).__sbgAdminSession?.email) || '';
}

export function getSessionRole(): AdminRole {
  return (typeof window !== 'undefined' && (window as any).__sbgAdminSession?.role) || 'owner';
}

export function getOwnerModules(): AdminModule[] {
  return OWNER_MODULES;
}

export function createStaffSession(email: string, role: 'admin' | 'staff', modules: AdminModule[], name: string): void {}
export function destroyStaffSession(): void {
  fetch(apiUrl('/api/admin/logout'), { credentials: 'include' }).catch(() => {});
}

export function isStaffAuthenticated(): boolean {
  return !!(typeof window !== 'undefined' && ((window as any).__sbgStaffSession || (window as any).__sbgAdminSession));
}

export function getStaffEmail(): string {
  return (typeof window !== 'undefined' && ((window as any).__sbgStaffSession?.email || (window as any).__sbgAdminSession?.email)) || '';
}

export function getStaffRole(): 'admin' | 'staff' {
  return (typeof window !== 'undefined' && ((window as any).__sbgStaffSession?.role || (window as any).__sbgAdminSession?.role)) || 'staff';
}

export function getStaffAllowedModules(): AdminModule[] {
  return (typeof window !== 'undefined' && ((window as any).__sbgStaffSession?.allowedModules || (window as any).__sbgAdminSession?.allowedModules)) || [];
}

export function getStaffName(): string {
  return (typeof window !== 'undefined' && ((window as any).__sbgStaffSession?.name || (window as any).__sbgAdminSession?.name)) || '';
}

export function getAdminToken(): string {
  return '';
}

export function saveAdminToken(token: string): void {}
export function clearAdminToken(): void {}
