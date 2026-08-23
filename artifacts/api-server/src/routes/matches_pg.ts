import { Router } from "express";
import { db, matchesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/matches-pg", async (req, res) => {
  try {
    const { status, game, tournamentId, featured } = req.query as Record<string, string>;
    let rows = await db.select().from(matchesTable).orderBy(desc(matchesTable.createdAt));
    if (status) rows = rows.filter(r => r.status === status);
    if (game) rows = rows.filter(r => r.game === game);
    if (tournamentId) rows = rows.filter(r => r.tournamentId === Number(tournamentId));
    if (featured === "true") rows = rows.filter(r => r.isFeatured);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to load matches" });
  }
});

router.get("/matches-pg/bracket/:tournamentId", async (req, res) => {
  try {
    const tourneyId = Number(req.params.tournamentId);
    if (!tourneyId || isNaN(tourneyId)) return res.status(400).json({ error: "Invalid tournament ID" });
    const rows = await db.select().from(matchesTable)
      .where(eq(matchesTable.tournamentId, tourneyId))
      .orderBy(matchesTable.bracketRound, matchesTable.bracketPosition);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to load bracket" });
  }
});

router.get("/matches-pg/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid match ID" });
    const [row] = await db.select().from(matchesTable).where(eq(matchesTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    return res.status(500).json({ error: "Failed to load match" });
  }
});

router.post("/matches-pg", requireAdmin, async (req, res) => {
  try {
    const [row] = await db.insert(matchesTable).values(req.body).returning();
    res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to create match" });
  }
});

router.patch("/matches-pg/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid match ID" });
    const [row] = await db.update(matchesTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(matchesTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    return res.status(500).json({ error: "Failed to update match" });
  }
});

router.delete("/matches-pg/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid match ID" });
    await db.delete(matchesTable).where(eq(matchesTable.id, id));
    res.json({ success: true });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to delete match" });
  }
});

export default router;

