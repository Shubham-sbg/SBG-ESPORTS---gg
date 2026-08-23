import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import path, { join, dirname, extname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin, requireSuperAdmin } from '../middleware/requireAdmin.js';
import { randomUUID } from 'crypto';
import {
  saveUploadedFile,
  getUploadedFile,
  deleteUploadedFile,
  saveMediaRecord,
  getAllMediaRecords,
  getMediaRecordById,
  deleteMediaRecord,
  getDatabaseDir,
  type MediaRecord,
} from '../lib/store.js';
import { broadcast } from '../lib/wsServer.js';

const UPLOAD_DIR = join(getDatabaseDir(), 'uploads');

try {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
} catch {}

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'image/x-icon', 'image/vnd.microsoft.icon', 'image/avif', 'image/apng', 'image/bmp'
];
const ALLOWED_ALL_TYPES = [...ALLOWED_IMAGE_TYPES, 'video/mp4', 'video/webm', 'video/ogg', 'application/octet-stream'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname) || '.png';
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 35 * 1024 * 1024 }, // 35MB max
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const isAllowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.mp4', '.webm', '.ogg', '.avif', '.bmp'].includes(ext);
    if (ALLOWED_ALL_TYPES.includes(file.mimetype) || isAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a valid image (JPEG, PNG, GIF, WEBP, SVG, ICO) or video.'));
    }
  },
});

const router = Router();

// Middleware to safely handle single image upload with clean JSON errors
const handleSingleUpload = (req: Request, res: Response, next: any) => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 35MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    next();
  });
};

// POST /api/upload — upload a single image/video file (for general admin forms)
router.post('/upload', requireAdmin, handleSingleUpload, async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image or video file provided' });
    return;
  }
  try {
    const filename = req.file.filename;
    const filePath = join(UPLOAD_DIR, filename);
    const buffer = readFileSync(filePath);
    await saveUploadedFile(filename, req.file.mimetype, buffer);
    const url = `/api/uploads/${filename}`;

    // Auto-create media metadata record if it's an image
    if (ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      const now = new Date().toISOString();
      await saveMediaRecord({
        id: randomUUID(),
        url,
        storageKey: `uploads/${filename}`,
        filename: req.file.originalname || filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        ratio: (req.body?.ratio as string) || 'Original',
        module: (req.body?.module as string) || 'General',
        title: (req.body?.title as string) || req.file.originalname || filename,
        altText: (req.body?.altText as string) || '',
        caption: (req.body?.caption as string) || '',
        enabled: true,
        position: Date.now(),
        createdAt: now,
        updatedAt: now,
      });
    }

    broadcast({ type: 'db_update', collection: 'media_library', timestamp: Date.now() });
    res.json({ ok: true, url, filename });
  } catch (err) {
    console.error('Failed to save uploaded file to persistent DB:', err);
    res.status(500).json({ error: 'Failed to persist uploaded file' });
  }
});

// GET /api/media — fetch all media records
router.get('/media', requireAdmin,  async (_req: Request, res: Response) => {
  try {
    const records = await getAllMediaRecords();
    res.json({ ok: true, media: records });
  } catch (err) {
    console.error('Failed to fetch media records:', err);
    res.status(500).json({ error: 'Failed to retrieve media library' });
  }
});

// POST /api/media/batch — batch upload multiple images
router.post('/media/batch', requireAdmin, upload.array('images', 50),  async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    res.status(400).json({ error: 'No image files uploaded' });
    return;
  }

  const results: Array<{ filename: string; originalName: string; success: boolean; url?: string; error?: string; record?: MediaRecord }> = [];
  const baseTimestamp = Date.now();
  const now = new Date().toISOString();

  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    try {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw new Error(`Unsupported file format: ${file.mimetype}`);
      }

      const filename = file.filename;
      const filePath = join(UPLOAD_DIR, filename);
      const buffer = readFileSync(filePath);

      // Save binary blob to SQLite persistent storage
      await saveUploadedFile(filename, file.mimetype, buffer);
      const url = `/api/uploads/${filename}`;

      const record: MediaRecord = {
        id: randomUUID(),
        url,
        storageKey: `uploads/${filename}`,
        filename: file.originalname || filename,
        mimeType: file.mimetype,
        size: file.size,
        width: req.body?.width ? parseInt(String(req.body.width), 10) : undefined,
        height: req.body?.height ? parseInt(String(req.body.height), 10) : undefined,
        ratio: (req.body?.ratio as string) || 'Original',
        module: (req.body?.module as string) || 'General',
        title: file.originalname.replace(/\.[^/.]+$/, '') || filename,
        altText: (req.body?.altText as string) || file.originalname || '',
        caption: (req.body?.caption as string) || '',
        enabled: true,
        position: baseTimestamp + idx,
        createdAt: now,
        updatedAt: now,
      };

      await saveMediaRecord(record);

      results.push({
        filename,
        originalName: file.originalname,
        success: true,
        url,
        record,
      });
    } catch (err: any) {
      results.push({
        filename: file.filename || file.originalname,
        originalName: file.originalname,
        success: false,
        error: err?.message || 'Failed to process file',
      });
    }
  }

  broadcast({ type: 'db_update', collection: 'media_library', timestamp: Date.now() });
  res.json({ ok: true, results });
});

// PUT /api/media/:id — update image metadata
router.put('/media/:id', requireAdmin,  async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const existing = await getMediaRecordById(id);
  if (!existing) {
    res.status(404).json({ error: 'Media record not found' });
    return;
  }

  try {
    const updated: MediaRecord = {
      ...existing,
      title: req.body.title !== undefined ? String(req.body.title) : existing.title,
      altText: req.body.altText !== undefined ? String(req.body.altText) : existing.altText,
      caption: req.body.caption !== undefined ? String(req.body.caption) : existing.caption,
      ratio: req.body.ratio !== undefined ? String(req.body.ratio) : existing.ratio,
      module: req.body.module !== undefined ? String(req.body.module) : existing.module,
      enabled: req.body.enabled !== undefined ? Boolean(req.body.enabled) : existing.enabled,
      position: req.body.position !== undefined ? Number(req.body.position) : existing.position,
      updatedAt: new Date().toISOString(),
    };

    await saveMediaRecord(updated);
    broadcast({ type: 'db_update', collection: 'media_library', timestamp: Date.now() });
    res.json({ ok: true, media: updated });
  } catch (err) {
    console.error('Failed to update media record:', err);
    res.status(500).json({ error: 'Failed to update image details' });
  }
});

// POST /api/media/replace/:id — Safe 2-phase image replacement
router.post('/media/replace/:id', requireAdmin, upload.single('image'),  async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const existing = await getMediaRecordById(id);
  if (!existing) {
    res.status(404).json({ error: 'Original image record not found' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'No replacement image provided' });
    return;
  }

  const oldFilename = existing.filename;
  try {
    // Step 1: Upload and verify new file
    const newFilename = req.file.filename;
    const newFilePath = join(UPLOAD_DIR, newFilename);
    const buffer = readFileSync(newFilePath);

    // Save new file to persistent SQLite store first
    await saveUploadedFile(newFilename, req.file.mimetype, buffer);
    const newUrl = `/api/uploads/${newFilename}`;

    // Step 2: Update database reference to point to new image
    const updatedRecord: MediaRecord = {
      ...existing,
      url: newUrl,
      storageKey: `uploads/${newFilename}`,
      filename: newFilename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      updatedAt: new Date().toISOString(),
    };

    await saveMediaRecord(updatedRecord);

    // Step 3: Only after DB & new upload succeed, safely remove old file
    if (oldFilename && oldFilename !== newFilename) {
      try {
        await deleteUploadedFile(oldFilename);
        const oldPath = join(UPLOAD_DIR, oldFilename);
        if (existsSync(oldPath)) unlinkSync(oldPath);
      } catch (cleanupErr) {
        console.warn('Could not remove old file during replacement:', cleanupErr);
      }
    }

    broadcast({ type: 'db_update', collection: 'media_library', timestamp: Date.now() });
    res.json({ ok: true, media: updatedRecord });
  } catch (err) {
    console.error('Replacement failed — keeping old image active:', err);
    res.status(500).json({ error: 'Failed to replace image. Original image preserved.' });
  }
});

// DELETE /api/media/:id — Safe deletion
router.delete('/media/:id', requireAdmin,  async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const existing = await getMediaRecordById(id);
  if (!existing) {
    res.status(404).json({ error: 'Media record not found' });
    return;
  }

  try {
    // Delete database record first
    await deleteMediaRecord(id);

    // Delete storage file after DB record deletion succeeds
    const filename = existing.filename;
    if (filename) {
      await deleteUploadedFile(filename);
      const filePath = join(UPLOAD_DIR, filename);
      if (existsSync(filePath)) unlinkSync(filePath);
    }

    broadcast({ type: 'db_update', collection: 'media_library', timestamp: Date.now() });
    res.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('Failed to delete media record:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// POST /api/media/reorder — Reorder images
router.post('/media/reorder', requireAdmin,  async (req: Request, res: Response) => {
  const { order } = req.body as { order: Array<{ id: string; position: number }> };
  if (!Array.isArray(order)) {
    res.status(400).json({ error: 'Order must be an array of { id, position }' });
    return;
  }

  try {
    for (const item of order) {
      const existing = await getMediaRecordById(item.id);
      if (existing) {
        await saveMediaRecord({ ...existing, position: item.position, updatedAt: new Date().toISOString() });
      }
    }
    broadcast({ type: 'db_update', collection: 'media_library', timestamp: Date.now() });
    res.json({ ok: true });
  } catch (err) {
    console.error('Reorder failed:', err);
    res.status(500).json({ error: 'Failed to reorder images' });
  }
});

// GET /api/uploads/:filename — serve uploaded images with DB fallback
router.get('/uploads/:filename', async (req: Request, res: Response) => {
  const filename = String(req.params.filename || '').trim();

  // Prevent path traversal
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\') || req.url.includes('..')) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  const resolvedPath = path.resolve(UPLOAD_DIR, filename);
  if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  const filePath = join(UPLOAD_DIR, filename);
  const ext = extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
  };
  const mimeType = mimeMap[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  if (existsSync(filePath)) {
    res.sendFile(filePath);
    return;
  }
  // Persistent DB fallback (survives disk reset / container redeploy)
  const dbFile = await getUploadedFile(filename);
  if (dbFile) {
    try {
      mkdirSync(UPLOAD_DIR, { recursive: true });
      writeFileSync(filePath, dbFile.data);
    } catch {}
    res.setHeader('Content-Type', dbFile.mime_type || mimeType);
    res.send(dbFile.data);
    return;
  }
  res.status(404).json({ error: 'File not found' });
});

export default router;

