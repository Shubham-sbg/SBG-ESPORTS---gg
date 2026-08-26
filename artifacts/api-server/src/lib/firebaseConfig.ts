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

export function parseJsonRobust(jsonText: string): any {
  if (!jsonText || typeof jsonText !== 'string') {
    throw new Error('Input is empty or not a string');
  }
  let cleaned = jsonText.trim();
  if (cleaned.charCodeAt(0) === 0xFEFF) cleaned = cleaned.slice(1).trim();

  // Attempt 1: Direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e1: any) {
    // Attempt 2: Remove comments, trailing commas, normalize newlines
    try {
      let sanitized = cleaned
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\/\/.*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(sanitized);
    } catch (e2: any) {
      // Attempt 3: Fix unescaped newlines in string literals
      try {
        const lineSanitized = cleaned
          .replace(/\r\n/g, '\n')
          .replace(/([^\\])\n/g, '$1\\n');
        return JSON.parse(lineSanitized);
      } catch (e3: any) {
        // Attempt 4: Extract JSON substring if embedded in other text
        try {
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          const firstBracket = cleaned.indexOf('[');
          const lastBracket = cleaned.lastIndexOf(']');

          let start = -1;
          let end = -1;

          if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            start = firstBrace;
            end = lastBrace;
          } else if (firstBracket !== -1) {
            start = firstBracket;
            end = lastBracket;
          }

          if (start !== -1 && end !== -1 && end > start) {
            const extracted = cleaned.substring(start, end + 1);
            return JSON.parse(extracted);
          }
        } catch (e4: any) {
          // Ignore
        }

        console.error(`[Firebase Config Error] JSON Parse failed: ${e1.message}. Input length: ${cleaned.length}. Snippet: ${cleaned.substring(0, 150)}`);
        throw e1;
      }
    }
  }
}

export function loadFirebaseAppletConfig(): FirebaseAppletConfig {
  const possiblePaths = [
    join(process.cwd(), 'firebase-applet-config.json'),
    join(process.cwd(), '..', 'firebase-applet-config.json'),
    join(process.cwd(), '..', '..', 'firebase-applet-config.json'),
    '/app/applet/firebase-applet-config.json',
  ];
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      try {
        let content = readFileSync(p, 'utf8');
        const parsed = parseJsonRobust(content);
        console.log(`[Firebase] Successfully loaded applet config from ${p} (project: ${parsed.projectId || 'unknown'}, databaseId: ${parsed.firestoreDatabaseId || 'default'})`);
        return parsed;
      } catch (err: any) {
        console.error(`[Firebase Config Error] Could not parse config at ${p} due to syntax error:`, err.message);
      }
    }
  }
  console.log('[Firebase] No valid firebase-applet-config.json found; using default fallback config.');
  return {
    projectId: 'sbg-army-web',
    firestoreDatabaseId: 'ai-studio-sbgarmygg-50d61416-99c8-4021-beb1-783af9dce49c',
  };
}

export function parseFirebaseServiceAccount(raw: string | undefined | null): Record<string, any> | null {
  if (!raw || typeof raw !== 'string') return null;
  let str = raw.trim();
  if (!str || str === '{}' || str === '[]') return null;

  // Strip BOM if present
  if (str.charCodeAt(0) === 0xFEFF) {
    str = str.slice(1).trim();
  }

  // 1. Check if it points to a secret file on disk
  if ((str.startsWith('/') || str.startsWith('./') || str.endsWith('.json') || existsSync(str))) {
    if (existsSync(str)) {
      try {
        let fileContent = readFileSync(str, 'utf8').trim();
        str = fileContent;
        console.log(`[Firebase] Successfully read service account file from path: ${raw}`);
      } catch (fileErr: any) {
        console.warn(`[Firebase] Failed to read service account file at ${str}:`, fileErr.message);
      }
    }
  }

  // 2. Decode Base64 if passed as base64 string
  if (!str.startsWith('{') && !str.startsWith('"') && !str.startsWith("'")) {
    try {
      const decoded = Buffer.from(str, 'base64').toString('utf8').trim();
      if (decoded.startsWith('{') && (decoded.endsWith('}') || decoded.includes('project_id') || decoded.includes('type'))) {
        str = decoded;
        console.log('[Firebase] Successfully decoded service account from Base64 string.');
      }
    } catch (b64Err: any) {
      console.warn('[Firebase] Base64 decode attempt skipped/failed:', b64Err.message);
    }
  }

  // 3. First attempt
  try {
    let parsed = parseJsonRobust(str);
    if (typeof parsed === 'string') {
      parsed = parseJsonRobust(parsed);
    }
    if (parsed && typeof parsed === 'object' && parsed.project_id) {
      console.log(`[Firebase] Service account verified for project: ${parsed.project_id}, client_email: ${parsed.client_email ? parsed.client_email.substring(0, 5) + '...' : 'none'}`);
      return normalizeServiceAccount(parsed);
    }
  } catch (parseErr: any) {
    console.warn('[Firebase] Primary service account JSON parse warning:', parseErr.message);
  }

  // 4. Second attempt: cleanup quotes / braces
  let cleaned = str;
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (!cleaned.startsWith('{') && (cleaned.includes('project_id') || cleaned.includes('client_email') || cleaned.includes('type'))) {
    cleaned = '{' + cleaned;
  }
  if (!cleaned.endsWith('}') && cleaned.startsWith('{')) {
    cleaned = cleaned + '}';
  }

  try {
    let parsed = parseJsonRobust(cleaned);
    if (typeof parsed === 'string') {
      parsed = parseJsonRobust(parsed);
    }
    if (parsed && typeof parsed === 'object' && parsed.project_id) {
      console.log(`[Firebase] Service account verified on secondary parse for project: ${parsed.project_id}`);
      return normalizeServiceAccount(parsed);
    }
  } catch (fallbackErr: any) {
    console.error('[Firebase Config Error] Service account JSON parsing failed with non-whitespace or malformed token error:', fallbackErr.message);
    throw new Error(
      `Invalid FIREBASE_SERVICE_ACCOUNT_JSON format (${fallbackErr.message}). Please ensure the configuration JSON is properly formatted without hidden BOM characters, unescaped quotes, or corrupted multiline private keys.`
    );
  }

  return null;
}

function normalizeServiceAccount(sa: any): Record<string, any> | null {
  if (!sa || typeof sa !== 'object') return null;
  if (typeof sa.private_key === 'string' && sa.private_key.includes('\\n')) {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  }
  return sa;
}
