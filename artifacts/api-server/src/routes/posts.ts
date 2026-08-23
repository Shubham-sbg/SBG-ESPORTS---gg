import { Router } from "express";
import { db, postsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { readCol } from "../lib/store.js";

const router = Router();

router.get("/posts", async (req, res) => {
  try {
    const { category, featured, limit } = req.query as Record<string, string>;
    let rows: any[] = [];
    try {
      rows = await db.select().from(postsTable).orderBy(desc(postsTable.createdAt));
      rows = rows.filter(p => p.published);
      if (category) rows = rows.filter(p => p.category === category);
      if (featured === 'true') rows = rows.filter(p => p.featured);
      if (limit) rows = rows.slice(0, Math.min(Number(limit) || 50, 100));
      return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(), updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString() })));
    } catch {
      const fallback = ((await readCol("posts")) as any[]) || [];
      rows = Array.isArray(fallback) ? fallback : [];
      rows = rows.filter(p => p.published !== false);
      if (category) rows = rows.filter(p => p.category === category);
      if (featured === 'true') rows = rows.filter(p => p.featured);
      if (limit) rows = rows.slice(0, Math.min(Number(limit) || 50, 100));
      return res.json(rows);
    }
  } catch (e) {
    req.log?.error?.(e);
    res.json([]);
  }
});

router.post("/posts", requireAdmin, async (req, res) => {
  try {
    const slug = req.body.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || null;
    const [row] = await db.insert(postsTable).values({ ...req.body, slug }).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to create post" });
  }
});

router.get("/posts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid post ID" });
    try {
      const [row] = await db.select().from(postsTable).where(eq(postsTable.id, id));
      if (!row) return res.status(404).json({ error: "Not found" });
      await db.update(postsTable).set({ views: (row.views || 0) + 1 }).where(eq(postsTable.id, id)).catch(() => {});
      return res.json({ ...row, views: (row.views || 0) + 1, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
    } catch {
      const fallback = ((await readCol("posts")) as any[]) || [];
      const found = Array.isArray(fallback) ? fallback.find(p => String(p.id) === String(id)) : null;
      if (!found) return res.status(404).json({ error: "Not found" });
      return res.json(found);
    }
  } catch (e) {
    req.log?.error?.(e);
    return res.status(404).json({ error: "Not found" });
  }
});

router.patch("/posts/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid post ID" });
    const [row] = await db.update(postsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(postsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    return res.status(500).json({ error: "Failed to update post" });
  }
});

router.delete("/posts/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid post ID" });
    await db.delete(postsTable).where(eq(postsTable.id, id));
    res.status(204).send();
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;

