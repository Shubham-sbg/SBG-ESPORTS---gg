/**
 * Central permission system — SINGLE SOURCE OF TRUTH.
 *
 * To add a new admin module:
 *   1. Add an entry to ALL_MODULES below (that's it for super_admin/admin).
 *   2. If staff should access it, ensure the id is not in SUPER_ADMIN_ONLY or ADMIN_ONLY.
 *   3. Map its DB collection in COLLECTION_MODULE inside requireAdmin.ts.
 *
 * No other code changes required — sidebar filtering, staff assignment
 * checkboxes, and backend collection enforcement all derive from this list.
 */

export const ALL_MODULES = [
  // ── Top-level (ungrouped) ─────────────────────────────────────────────
  { id: 'dashboard',         label: 'Dashboard',          icon: '📊' },
  { id: 'analytics',         label: 'Analytics',           icon: '📈' },
  { id: 'settings',          label: 'Site Settings',       icon: '⚙️' },
  // ── TEAM ─────────────────────────────────────────────────────────────
  { id: 'roster',            label: 'Player Management',   icon: '👥',  group: 'TEAM' },
  { id: 'founders',          label: 'Founders & Mgmt',     icon: '🏆',  group: 'TEAM' },
  { id: 'creators',          label: 'Content Creators',    icon: '🎥',  group: 'TEAM' },
  { id: 'recruitment',       label: 'Recruitment',         icon: '🎯',  group: 'TEAM' },
  // ── ESPORTS ──────────────────────────────────────────────────────────
  { id: 'matches',           label: 'Match Management',    icon: '🎮',  group: 'ESPORTS' },
  { id: 'schedule',          label: 'Schedule',            icon: '📅',  group: 'ESPORTS' },
  { id: 'tournaments',       label: 'Tournaments',         icon: '🏆',  group: 'ESPORTS' },
  { id: 'achievements',      label: 'Achievements',        icon: '🎖️', group: 'ESPORTS' },
  { id: 'hof_timeline',      label: 'Hall of Fame',        icon: '👑',  group: 'ESPORTS' },
  { id: 'events_admin',      label: 'Events',              icon: '🗓️', group: 'ESPORTS' },
  { id: 'rankings_admin',    label: 'Rankings',            icon: '📊',  group: 'ESPORTS' },
  { id: 'trophy_room',       label: 'Trophy Room',         icon: '🥇',  group: 'ESPORTS' },
  { id: 'team_records',      label: 'Team Records',        icon: '📈',  group: 'ESPORTS' },
  { id: 'team_history',      label: 'Team History',        icon: '📅',  group: 'ESPORTS' },
  // ── CONTENT ──────────────────────────────────────────────────────────
  { id: 'live_stream',       label: 'Live Stream',         icon: '🔴',  group: 'CONTENT' },
  { id: 'hero_cms',          label: 'Hero Section CMS',    icon: '🚀',  group: 'CONTENT' },
  { id: 'countdown_mgr',    label: 'Countdown Manager',   icon: '⏱️', group: 'CONTENT' },
  { id: 'bg_manager',       label: 'Background Manager',  icon: '✨',  group: 'CONTENT' },
  { id: 'footer_cms',       label: 'Footer CMS',          icon: '🦶',  group: 'CONTENT' },
  { id: 'news',              label: 'News CMS',            icon: '📰',  group: 'CONTENT' },
  { id: 'about_cms',         label: 'About Page CMS',      icon: '📖',  group: 'CONTENT' },
  { id: 'gallery',           label: 'Gallery Manager',     icon: '🖼️', group: 'CONTENT' },
  { id: 'videos',            label: 'Videos',              icon: '🎬',  group: 'CONTENT' },
  { id: 'games',             label: 'Games',               icon: '🕹️', group: 'CONTENT' },
  { id: 'shop',              label: 'Shop Products',       icon: '🛒',  group: 'CONTENT' },
  { id: 'orders',            label: 'Shop Orders',         icon: '🛍️', group: 'CONTENT' },
  { id: 'sponsors',          label: 'Sponsor Manager',     icon: '🤝',  group: 'CONTENT' },
  { id: 'ads',               label: 'Ads Manager',         icon: '📢',  group: 'CONTENT' },
  { id: 'facility',          label: 'Facility Section',    icon: '🏢',  group: 'CONTENT' },
  // ── COMMUNITY ────────────────────────────────────────────────────────
  { id: 'contact_messages',  label: 'Contact Messages',    icon: '📬',  group: 'COMMUNITY' },
  { id: 'feedback',          label: 'Feedback Reports',    icon: '💬',  group: 'COMMUNITY' },
  { id: 'fan_messages',      label: 'Fan Connect',         icon: '⭐',  group: 'COMMUNITY' },
  { id: 'giveaways',         label: 'Giveaways',           icon: '🎁',  group: 'COMMUNITY' },
  { id: 'collabs',           label: 'Collaborations',      icon: '🤝',  group: 'COMMUNITY' },
  { id: 'player_users',      label: 'Player Accounts',     icon: '👤',  group: 'COMMUNITY' },
  // ── ENTERPRISE ───────────────────────────────────────────────────────
  { id: 'projects',          label: 'Projects',            icon: '📋',  group: 'ENTERPRISE' },
  { id: 'tasks',             label: 'Task Board',          icon: '✅',  group: 'ENTERPRISE' },
  { id: 'enterprise',        label: 'Enterprise Hub',      icon: '💼',  group: 'ENTERPRISE' },
  // ── SYSTEM (admin+ only) ─────────────────────────────────────────────
  { id: 'features',          label: 'Feature Controls',    icon: '🎛️', group: 'SYSTEM' },
  { id: 'legal_pages',       label: 'Legal Pages',         icon: '⚖️',  group: 'SYSTEM' },
  { id: 'custom_code',       label: 'Custom Code',         icon: '🧩',  group: 'SYSTEM' },
  { id: 'media_manager',    label: 'Global Media Library',icon: '🖼️', group: 'SYSTEM' },
  { id: 'design_manager',   label: 'Theme Manager',       icon: '🎨',  group: 'SYSTEM' },
  { id: 'staff_manager',     label: 'Staff Manager',       icon: '👔',  group: 'SYSTEM' },
  { id: 'firebase_settings', label: 'Auth Settings',       icon: '🔒',  group: 'SYSTEM' },
  { id: 'security_logs',     label: 'System Logs',         icon: '🔐',  group: 'SYSTEM' },
  { id: 'navigation',        label: 'Navigation',          icon: '🧭',  group: 'SYSTEM' },
  { id: 'quick_access',      label: 'Quick Access',        icon: '⚡',  group: 'SYSTEM' },
  { id: 'system_health',     label: 'System Health',       icon: '🛡️', group: 'SYSTEM' },
] as const;

export type ModuleId = typeof ALL_MODULES[number]['id'];

/** Modules only super_admin can access — hidden from admin and staff. */
export const SUPER_ADMIN_ONLY: readonly ModuleId[] = [
  'staff_manager', 'firebase_settings', 'security_logs', 'custom_code', 'design_manager',
] as const;

/** Modules admin+ can access — not assignable to staff. */
export const ADMIN_ONLY: readonly ModuleId[] = [
  'settings', 'analytics', 'navigation', 'features',
  'legal_pages', 'system_health', 'quick_access', 'media_manager',
] as const;

/** Full list of module IDs staff members can be granted access to. */
export const ASSIGNABLE_TO_STAFF: ModuleId[] = (ALL_MODULES as unknown as { id: ModuleId }[])
  .map(m => m.id)
  .filter(id =>
    !(SUPER_ADMIN_ONLY as readonly string[]).includes(id) &&
    !(ADMIN_ONLY as readonly string[]).includes(id)
  );

/**
 * Returns true if a user with the given role + allowedModules can access moduleId.
 * This is the authoritative check — use it everywhere instead of ad-hoc comparisons.
 */
export function canAccess(role: string, allowedModules: string[], moduleId: string): boolean {
  if (role === 'super_admin') return true;
  if ((SUPER_ADMIN_ONLY as readonly string[]).includes(moduleId)) return false;
  if (role === 'admin') return true;
  // staff ↓
  if ((ADMIN_ONLY as readonly string[]).includes(moduleId)) return false;
  if (allowedModules.includes('*')) return true;
  return allowedModules.includes(moduleId);
}

/** Role display metadata. */
export const ROLE_META: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'SUPER ADMIN', color: '#ffd700' },
  admin:       { label: 'ADMIN',       color: '#ff6b00' },
  staff:       { label: 'STAFF',       color: '#00d4ff' },
};

/** Quick-access lookup built from ALL_MODULES. */
export const MODULE_META = Object.fromEntries(
  ALL_MODULES.map(m => [m.id, { label: m.label, icon: m.icon, group: (m as { group?: string }).group }])
) as Record<ModuleId, { label: string; icon: string; group?: string }>;
