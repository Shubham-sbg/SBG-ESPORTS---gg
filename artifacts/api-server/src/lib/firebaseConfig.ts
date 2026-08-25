import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface FirebaseAppletConfig {
  projectId?: string;
  firestoreDatabaseId?: string;
  apiKey?: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  appId?: string;
}

export function loadFirebaseAppletConfig(): FirebaseAppletConfig {
  const possiblePaths = [
    join(process.cwd(), 'firebase-applet-config.json'),
    join(process.cwd(), '..', 'firebase-applet-config.json'),
    join(process.cwd(), '..', '..', 'firebase-applet-config.json'),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      try {
        const content = readFileSync(p, 'utf8');
        return JSON.parse(content);
      } catch (err: any) {
        console.warn(`[Firebase] Could not parse config at ${p}:`, err.message);
      }
    }
  }

  return {
    projectId: 'sbg-army-web',
    firestoreDatabaseId: 'ai-studio-sbgarmygg-50d61416-99c8-4021-beb1-783af9dce49c',
  };
}

export function parseFirebaseServiceAccount(raw: string | undefined | null): Record<string, any> | null {
  if (!raw || typeof raw !== 'string') return null;
  let str = raw.trim();
  if (!str || str === '{}' || str === '[]') return null;

  // 1. Check if it points to a secret file on disk (e.g. Render Secret File /etc/secrets/...)
  if ((str.startsWith('/') || str.startsWith('./') || str.endsWith('.json')) && existsSync(str)) {
    try {
      str = readFileSync(str, 'utf8').trim();
    } catch {}
  }

  // 2. Decode Base64 if passed as base64 string
  if (!str.startsWith('{') && !str.startsWith('"') && !str.startsWith("'")) {
    try {
      const decoded = Buffer.from(str, 'base64').toString('utf8').trim();
      if (decoded.startsWith('{') && (decoded.endsWith('}') || decoded.includes('project_id') || decoded.includes('type'))) {
        str = decoded;
      }
    } catch {}
  }

  // 3. First attempt: direct JSON.parse
  try {
    let parsed = JSON.parse(str);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed); // Double-stringified JSON
    }
    if (parsed && typeof parsed === 'object') {
      return normalizeServiceAccount(parsed);
    }
  } catch {}

  // 4. Second attempt: clean quotes & add missing outer braces if truncated
  let cleaned = str;

  // Strip wrapping single quotes
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // If missing outer braces (e.g. starts with "project_id": ... without { and })
  if (!cleaned.startsWith('{') && (cleaned.includes('project_id') || cleaned.includes('client_email') || cleaned.includes('type'))) {
    cleaned = '{' + cleaned;
  }
  if (!cleaned.endsWith('}') && cleaned.startsWith('{')) {
    cleaned = cleaned + '}';
  }

  try {
    let parsed = JSON.parse(cleaned);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    if (parsed && typeof parsed === 'object') {
      return normalizeServiceAccount(parsed);
    }
  } catch {}

  // 5. Third attempt: handle unescaped literal newlines in multiline private keys
  try {
    const sanitized = cleaned.replace(/([^\\])\r?\n/g, '$1\\n');
    let parsed = JSON.parse(sanitized);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    if (parsed && typeof parsed === 'object') {
      return normalizeServiceAccount(parsed);
    }
  } catch (err: any) {
    throw new Error(
      `Invalid FIREBASE_SERVICE_ACCOUNT_JSON format (${err.message}). Please ensure you paste the full, valid JSON object from Google Cloud Console into Render environment variables.`
    );
  }

  return null;
}

function normalizeServiceAccount(sa: any): Record<string, any> | null {
  if (!sa || typeof sa !== 'object') return null;
  // Normalize Google Admin SDK private key newlines
  if (typeof sa.private_key === 'string' && sa.private_key.includes('\\n')) {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  }
  return sa;
}
