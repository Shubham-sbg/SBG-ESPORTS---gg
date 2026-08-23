import { Router } from "express";
import { db, adsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/ads", async (req, res) => {
  try {
    const { placement } = req.query as Record<string, string>;
    let rows = await db.select().from(adsTable).where(eq(adsTable.active, true));
    if (placement) rows = rows.filter(a => a.placement === placement);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    res.json([]);
  }
});

router.get("/ads/all", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(adsTable);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    res.json([]);
  }
});

router.post("/ads", requireAdmin, async (req, res) => {
  try {
    const [row] = await db.insert(adsTable).values(req.body).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    res.status(500).json({ error: "Failed to create ad" });
  }
});

router.patch("/ads/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid ad ID" });
    const [row] = await db.update(adsTable).set(req.body).where(eq(adsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    return res.status(500).json({ error: "Failed to update ad" });
  }
});

router.delete("/ads/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid ad ID" });
    await db.delete(adsTable).where(eq(adsTable.id, id));
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Failed to delete ad" });
  }
});

export default router;

