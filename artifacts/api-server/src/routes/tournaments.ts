import { Router } from "express";
import { db, tournamentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/tournaments", async (req, res) => {
  try {
    const { status, game } = req.query as Record<string, string>;
    let rows = await db.select().from(tournamentsTable).orderBy(desc(tournamentsTable.createdAt));
    if (status) rows = rows.filter(t => t.status === status);
    if (game) rows = rows.filter(t => t.game.toLowerCase() === game.toLowerCase());
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to load tournaments" });
  }
});

router.post("/tournaments", requireAdmin, async (req, res) => {
  try {
    const [row] = await db.insert(tournamentsTable).values(req.body).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to create tournament" });
  }
});

router.get("/tournaments/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid tournament ID" });
    const [row] = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, id));
    if (!row) return res.status(404).json({ error: "Tournament not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    return res.status(500).json({ error: "Failed to load tournament" });
  }
});

router.patch("/tournaments/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid tournament ID" });
    const [row] = await db.update(tournamentsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(tournamentsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Tournament not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    return res.status(500).json({ error: "Failed to update tournament" });
  }
});

export default router;

