import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { readCol, writeCol } from '../lib/store.js';

const router = Router();

function isValidExternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeText(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

router.get('/ctas', async (req, res) => {
  try {
    const ctas = (await readCol('ctas')) as Array<any> || [];
    const authHeader = req.headers.authorization;
    const hasToken = authHeader && authHeader.startsWith('Bearer ');
    if (!hasToken) {
      const enabledCtas = ctas
        .filter(c => c.enabled !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return res.json(enabledCtas);
    }
    res.json(ctas);
  } catch (e) {
    res.json([]);
  }
});

router.post('/ctas', requireAdmin, async (req, res) => {
  try {
    const { title, buttonText, url, enabled, openInNewTab, order } = req.body;
    
    if (!title || !buttonText || !url) {
      return res.status(400).json({ error: 'Title, buttonText, and url are required' });
    }

    const cleanTitle = sanitizeText(String(title));
    const cleanButtonText = sanitizeText(String(buttonText));
    const cleanUrl = String(url).trim();

    if (!cleanTitle || !cleanButtonText || !cleanUrl) {
      return res.status(400).json({ error: 'All fields must contain valid non-empty text' });
    }

    if (!isValidExternalUrl(cleanUrl)) {
      return res.status(400).json({ error: 'Invalid URL. Must be a secure http:// or https:// URL.' });
    }

    const ctas = (await readCol('ctas')) as Array<any> || [];
    const newItem = {
      id: `cta_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: cleanTitle,
      buttonText: cleanButtonText,
      url: cleanUrl,
      enabled: enabled !== false,
      openInNewTab: Boolean(openInNewTab),
      order: typeof order === 'number' ? order : ctas.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    ctas.push(newItem);
    await writeCol('ctas', ctas);
    res.status(201).json(newItem);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to create CTA' });
  }
});

router.put('/ctas/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, buttonText, url, enabled, openInNewTab, order } = req.body;

    const ctas = (await readCol('ctas')) as Array<any> || [];
    const index = ctas.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'CTA not found' });
    }

    const current = ctas[index];

    let cleanTitle = current.title;
    if (title !== undefined) {
      cleanTitle = sanitizeText(String(title));
      if (!cleanTitle) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
    }

    let cleanButtonText = current.buttonText;
    if (buttonText !== undefined) {
      cleanButtonText = sanitizeText(String(buttonText));
      if (!cleanButtonText) {
        return res.status(400).json({ error: 'Button text cannot be empty' });
      }
    }

    let cleanUrl = current.url;
    if (url !== undefined) {
      cleanUrl = String(url).trim();
      if (!isValidExternalUrl(cleanUrl)) {
        return res.status(400).json({ error: 'Invalid URL. Must be a secure http:// or https:// URL.' });
      }
    }

    const updated = {
      ...current,
      title: cleanTitle,
      buttonText: cleanButtonText,
      url: cleanUrl,
      enabled: enabled !== undefined ? Boolean(enabled) : current.enabled,
      openInNewTab: openInNewTab !== undefined ? Boolean(openInNewTab) : current.openInNewTab,
      order: order !== undefined ? Number(order) : current.order,
      updatedAt: Date.now(),
    };

    ctas[index] = updated;
    await writeCol('ctas', ctas);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to update CTA' });
  }
});

router.delete('/ctas/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    let ctas = (await readCol('ctas')) as Array<any> || [];
    const filtered = ctas.filter(c => c.id !== id);
    if (filtered.length === ctas.length) {
      return res.status(404).json({ error: 'CTA not found' });
    }
    await writeCol('ctas', filtered);
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to delete CTA' });
  }
});

export default router;
