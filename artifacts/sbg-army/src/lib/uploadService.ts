import { getDB, saveDB } from './database';
import { getApiBase } from './wsClient';

export interface FileValidationOptions {
  maxSizeMB?: number; // default 20MB
  allowedTypes?: string[]; // e.g. ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  allowVideo?: boolean;
}

export interface UploadOptions extends FileValidationOptions {
  endpoint?: string; // default '/api/upload'
  filename?: string;
  fieldName?: string; // default 'image'
}

export interface DbSyncConfig {
  collection: string;
  fieldName: string;
  itemId?: string;
}

export interface UploadResult {
  url: string;
  filename?: string;
  size?: number;
  mimeType?: string;
}

const DEFAULT_MAX_SIZE_MB = 20;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/avif',
  'image/bmp',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-matroska',
];

/**
 * Validates file type and size before uploading
 */
export function validateFile(
  file: File | Blob,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided for validation.' };
  }

  const maxSize = (options.maxSizeMB ?? DEFAULT_MAX_SIZE_MB) * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed limit of ${options.maxSizeMB ?? DEFAULT_MAX_SIZE_MB}MB.`,
    };
  }

  const allowedTypes = options.allowedTypes || [
    ...ALLOWED_IMAGE_TYPES,
    ...(options.allowVideo ? ALLOWED_VIDEO_TYPES : []),
  ];

  if (file.type && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some(t => {
      if (t.endsWith('/*')) {
        const prefix = t.split('/')[0];
        return file.type.startsWith(`${prefix}/`);
      }
      return file.type === t;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `Invalid file type (${file.type}). Allowed types: ${options.allowVideo ? 'Images and Videos' : 'Images'}.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Helper to convert a Base64 or DataURL string into a File object
 */
export function dataUrlToFile(dataUrl: string, filename = 'upload.png'): File {
  if (!dataUrl.startsWith('data:')) {
    throw new Error('Invalid DataURL format');
  }

  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });
  return new File([blob], filename, { type: mime });
}

/**
 * Secure authorization header getter
 */
export function getAdminAuthToken(): string {
  try {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sbg_admin_token') || localStorage.getItem('sbg_admin_token') || '';
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Core secure upload function to server storage endpoint
 */
export async function uploadFileToServer(
  fileInput: File | Blob | string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  let fileToUpload: File;

  if (typeof fileInput === 'string') {
    if (fileInput.startsWith('data:')) {
      fileToUpload = dataUrlToFile(fileInput, options.filename || 'upload.png');
    } else if (fileInput.startsWith('http://') || fileInput.startsWith('https://') || fileInput.startsWith('/') || fileInput.startsWith('blob:')) {
      // Already a URL or Blob URL, return directly
      return { url: fileInput };
    } else {
      throw new Error('Invalid file input provided');
    }
  } else if (fileInput instanceof File) {
    fileToUpload = fileInput;
  } else if (fileInput instanceof Blob) {
    fileToUpload = new File([fileInput], options.filename || 'upload.png', {
      type: fileInput.type || 'image/png',
    });
  } else {
    throw new Error('Unsupported file input type');
  }

  // File Validation
  const validation = validateFile(fileToUpload, options);
  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed');
  }

  const rawEndpoint = options.endpoint || '/api/upload';
  const apiBase = getApiBase();
  let endpoint = rawEndpoint;
  if (rawEndpoint.startsWith('/api') && apiBase && apiBase !== '/api') {
    endpoint = apiBase + rawEndpoint.substring(4);
  }

  const fieldName = options.fieldName || 'image';

  const formData = new FormData();
  formData.append(fieldName, fileToUpload);

  const token = getAdminAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(endpoint, {
      credentials: "include",
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error('Authentication required for server file upload.');
      }
      throw new Error(errData?.error || `Upload failed with status code ${res.status}`);
    }

    const data = await res.json();
    if (!data || !data.url) {
      throw new Error('Server upload response did not include a valid URL');
    }

    return {
      url: data.url,
      filename: data.filename,
      size: data.size,
      mimeType: data.mimeType,
    };
  } catch (err: any) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error('Server upload unreachable. Image saved locally.');
    }
    throw err;
  }
}

/**
 * Uploads a file and automatically updates a database record/collection with the returned URL
 */
export async function uploadAndSyncDbUrl(
  fileInput: File | Blob | string,
  syncConfig: DbSyncConfig,
  uploadOptions: UploadOptions = {}
): Promise<UploadResult> {
  const result = await uploadFileToServer(fileInput, uploadOptions);

  if (syncConfig.collection && syncConfig.fieldName) {
    const db = getDB();
    const { collection, fieldName, itemId } = syncConfig;

    if (itemId && Array.isArray((db as any)[collection])) {
      const list = (db as any)[collection];
      const index = list.findIndex((item: any) => item && item.id === itemId);
      if (index !== -1) {
        list[index] = { ...list[index], [fieldName]: result.url };
        await saveDB(db, collection);
      }
    } else if ((db as any)[collection] && typeof (db as any)[collection] === 'object') {
      (db as any)[collection] = { ...(db as any)[collection], [fieldName]: result.url };
      await saveDB(db, collection);
    }
  }

  return result;
}
