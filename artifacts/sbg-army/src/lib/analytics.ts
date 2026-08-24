import { apiUrl } from './api';

/**
 * Client-side analytics — sends page visit data to the public server endpoint.
 * No auth required. Falls back silently on any error.
 */

const DEVICE_ID_KEY  = 'sbg_device_id';
const LAST_VISIT_KEY = 'sbg_last_visit';
const THROTTLE_MS    = 5 * 60 * 1000; // 5 min per-device cooldown

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `d_anon_${Date.now()}`;
  }
}

/**
 * Track a page visit. Throttled per device (5 min). Fire-and-forget.
 * Uses the public /api/analytics/track endpoint — no admin token needed.
 */
export function trackPageVisit(page: string = '/') {
  try {
    const now = Date.now();
    const lastVisit = Number(localStorage.getItem(LAST_VISIT_KEY) ?? 0);

    // Throttle: don't log the same device within 5 minutes
    if (now - lastVisit < THROTTLE_MS) return;
    localStorage.setItem(LAST_VISIT_KEY, String(now));

    const deviceId   = getOrCreateDeviceId();
    const deviceType = getDeviceType();
    const date       = new Date().toISOString().split('T')[0];
    const id         = `v_${now}_${deviceId.slice(-4)}`;

    // Fire-and-forget — never block the page, never throw
    fetch(apiUrl('/api/analytics/track'), {
      credentials: "include",
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, deviceType, date, id }),
    }).catch(() => {/* silent */});
  } catch {
    // Never crash on analytics failure
  }
}
