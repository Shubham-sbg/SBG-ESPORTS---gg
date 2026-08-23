/**
 * Derived from permissions.ts — display metadata for roles and modules.
 * Add new entries to permissions.ts; this file re-exports convenient lookups.
 */
import { MODULE_META, ROLE_META } from './permissions';
import type { ModuleId } from './permissions';

// Re-export so callers that already import from roles.ts keep working
export { ROLE_META, MODULE_META };

// Flat label + icon maps (backward-compat with AdminStaffManager / AdminPage)
export const MODULE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_META).map(([id, m]) => [id, m.label])
);

export const MODULE_ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_META).map(([id, m]) => [id, m.icon])
);

export const ROLE_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_META).map(([r, m]) => [r, m.color])
);

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_META).map(([r, m]) => [r, m.label])
);

/** @deprecated Use canAccess() from permissions.ts instead. */
export function canAccessModule(role: string, moduleId: ModuleId, allowedModules?: string[]): boolean {
  const { canAccess } = require('./permissions') as typeof import('./permissions');
  return canAccess(role, allowedModules ?? [], moduleId);
}
