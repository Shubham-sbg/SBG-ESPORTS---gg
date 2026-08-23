import { Router } from "express";
import { db, playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { readCol } from "../lib/store.js";

const router = Router();

router.get("/players", async (req, res) => {
  try {
    const { game, status } = req.query as Record<string, string>;
    let rows: any[] = [];
    try {
      rows = await db.select().from(playersTable).orderBy(playersTable.createdAt);
      if (game) rows = rows.filter(p => p.game?.toLowerCase() === game.toLowerCase());
      if (status) rows = rows.filter(p => p.status === status);
      return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(), updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString() })));
    } catch {
      const fallback = ((await readCol("players")) as any[]) || [];
      rows = Array.isArray(fallback) ? fallback : [];
      if (game) rows = rows.filter(p => p.game?.toLowerCase() === game.toLowerCase());
      if (status) rows = rows.filter(p => p.status === status);
      return res.json(rows);
    }
  } catch (e) {
    req.log?.error?.(e);
    res.json([]);
  }
});

router.post("/players", requireAdmin, async (req, res) => {
  try {
    const [row] = await db.insert(playersTable).values(req.body).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to create player" });
  }
});

router.get("/players/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid player ID" });
    try {
      const [row] = await db.select().from(playersTable).where(eq(playersTable.id, id));
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
    } catch {
      const fallback = ((await readCol("players")) as any[]) || [];
      const found = Array.isArray(fallback) ? fallback.find(p => String(p.id) === String(id)) : null;
      if (!found) return res.status(404).json({ error: "Not found" });
      return res.json(found);
    }
  } catch (e) {
    req.log?.error?.(e);
    return res.status(404).json({ error: "Not found" });
  }
});

router.patch("/players/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid player ID" });
    const [row] = await db.update(playersTable).set({ ...req.body, updatedAt: new Date() }).where(eq(playersTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Failed to update player" });
  }
});

router.delete("/players/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid player ID" });
    await db.delete(playersTable).where(eq(playersTable.id, id));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to delete player" });
  }
});

export default router;

