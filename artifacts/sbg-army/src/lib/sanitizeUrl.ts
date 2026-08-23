/**
 * Sanitize a URL to prevent XSS via javascript: URIs.
 * Only allows http:, https:, mailto:, tel:, discord: and relative paths.
 * Returns '#' if the URL is invalid or potentially dangerous.
 */
const SAFE_SCHEMES = /^(https?|mailto|tel|discord):/i;

export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (!trimmed) return '#';

  // Allow relative paths (start with /, #, or .)
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('.')) {
    return trimmed;
  }

  // Allow only safe absolute URL schemes
  if (SAFE_SCHEMES.test(trimmed)) {
    return trimmed;
  }

  // Reject everything else (javascript:, vbscript:, data:, etc.)
  return '#';
}

/** Returns true if the URL is a valid external (http/https) link */
export function isExternalUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return /^https?:/i.test(url.trim());
}
