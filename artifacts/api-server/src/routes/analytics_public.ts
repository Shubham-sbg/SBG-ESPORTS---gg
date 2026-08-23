/**
 * Public analytics endpoint — no auth required.
 * Accepts page visit data from any visitor.
 */
import { Router } from 'express';
import { readCol, writeCol } from '../lib/store.js';
import { broadcast } from '../lib/wsServer.js';

const router = Router();

interface VisitRecord {
  id: string; timestamp: number; date: string; page: string; deviceType: string;
}

interface Analytics {
  totalVisits: number; todayVisits: number; weeklyVisits: number;
  lastVisitDate: string; visitHistory: { date: string; count: number }[];
  visitRecords: VisitRecord[];
}

function getDefaultAnalytics(): Analytics {
  return {
    totalVisits: 0, todayVisits: 0, weeklyVisits: 0,
    lastVisitDate: '', visitHistory: [], visitRecords: [],
  };
}

/** POST /analytics/track — record a page visit (no auth required) */
router.post('/analytics/track',  async (req, res) => {
  try {
    const { page, deviceType, date, id } = req.body as {
      page?: string; deviceType?: string; date?: string; id?: string;
    };

    const today = date ?? new Date().toISOString().split('T')[0];
    const raw = await readCol('analytics');
    const analytics: Analytics = (raw && typeof raw === 'object' && !Array.isArray(raw))
      ? (raw as Analytics)
      : getDefaultAnalytics();

    if (!Array.isArray(analytics.visitRecords)) analytics.visitRecords = [];
    if (!Array.isArray(analytics.visitHistory)) analytics.visitHistory = [];

    const record: VisitRecord = {
      id: id ?? `v_${Date.now()}`,
      timestamp: Date.now(),
      date: today,
      page: page ?? '/',
      deviceType: deviceType ?? 'desktop',
    };

    analytics.visitRecords = [record, ...analytics.visitRecords].slice(0, 500);
    analytics.totalVisits = (analytics.totalVisits ?? 0) + 1;

    if (analytics.lastVisitDate !== today) {
      analytics.todayVisits = 1;
      analytics.lastVisitDate = today;
    } else {
      analytics.todayVisits = (analytics.todayVisits ?? 0) + 1;
    }

    const existing = analytics.visitHistory.find(v => v.date === today);
    if (existing) {
      existing.count += 1;
    } else {
      analytics.visitHistory.push({ date: today, count: 1 });
      if (analytics.visitHistory.length > 90) analytics.visitHistory.shift();
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    analytics.weeklyVisits = analytics.visitHistory
      .filter(v => new Date(v.date) >= weekAgo)
      .reduce((sum, v) => sum + v.count, 0);

    await writeCol('analytics', analytics);
    broadcast({ type: 'db_update', collection: 'analytics', data: analytics, timestamp: Date.now() });

    res.json({ ok: true, totalVisits: analytics.totalVisits });
  } catch (err) {
    // Never fail a visitor — silently ignore errors
    res.json({ ok: false });
  }
});

export default router;
