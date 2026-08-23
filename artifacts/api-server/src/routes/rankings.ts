import { Router } from "express";
import { db, rankingsTable, playersTable } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { readCol } from "../lib/store.js";

const router = Router();

router.get("/rankings", async (req, res) => {
  try {
    const { game, category, season, limit } = req.query as Record<string, string>;
    let rows: any[] = [];
    try {
      rows = await db.select({
        id: rankingsTable.id,
        playerId: rankingsTable.playerId,
        teamId: rankingsTable.teamId,
        game: rankingsTable.game,
        category: rankingsTable.category,
        rank: rankingsTable.rank,
        points: rankingsTable.points,
        kills: rankingsTable.kills,
        wins: rankingsTable.wins,
        matches: rankingsTable.matches,
        kd: rankingsTable.kd,
        winRate: rankingsTable.winRate,
        mvpCount: rankingsTable.mvpCount,
        season: rankingsTable.season,
        updatedAt: rankingsTable.updatedAt,
      })
        .from(rankingsTable)
        .orderBy(asc(rankingsTable.rank));

      if (game) rows = rows.filter(r => r.game === game);
      if (category) rows = rows.filter(r => r.category === category);
      if (season) rows = rows.filter(r => r.season === season);
      if (limit) rows = rows.slice(0, Math.min(Number(limit) || 50, 100));

      const enriched = await Promise.all(rows.map(async (r) => {
        if (!r.playerId) return r;
        try {
          const [player] = await db.select({
            playerName: playersTable.playerName,
            image: playersTable.image,
            country: playersTable.country,
          }).from(playersTable).where(eq(playersTable.id, r.playerId));
          return { ...r, player: player ?? null, updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString() };
        } catch {
          return { ...r, player: null, updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString() };
        }
      }));

      return res.json(enriched);
    } catch {
      const fallback = ((await readCol("rankings")) as any[]) || [];
      rows = Array.isArray(fallback) ? fallback : [];
      if (game) rows = rows.filter(r => r.game === game);
      if (category) rows = rows.filter(r => r.category === category);
      if (season) rows = rows.filter(r => r.season === season);
      if (limit) rows = rows.slice(0, Math.min(Number(limit) || 50, 100));
      return res.json(rows);
    }
  } catch (e) {
    req.log?.error?.(e);
    res.json([]);
  }
});

router.get("/rankings/leaderboard/:game", async (req, res) => {
  try {
    const { game } = req.params;
    const rows = await db.select()
      .from(rankingsTable)
      .where(eq(rankingsTable.game, game))
      .orderBy(asc(rankingsTable.rank))
      .limit(50);
    res.json(rows.map(r => ({ ...r, updatedAt: r.updatedAt.toISOString(), createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

router.post("/rankings", requireAdmin, async (req, res) => {
  try {
    const [row] = await db.insert(rankingsTable).values(req.body).returning();
    res.json({ ...row, updatedAt: row.updatedAt.toISOString(), createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to create ranking" });
  }
});

router.patch("/rankings/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid ranking ID" });
    const [row] = await db.update(rankingsTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(rankingsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ...row, updatedAt: row.updatedAt.toISOString(), createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    return res.status(500).json({ error: "Failed to update ranking" });
  }
});

router.delete("/rankings/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid ranking ID" });
    await db.delete(rankingsTable).where(eq(rankingsTable.id, id));
    res.json({ success: true });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to delete ranking" });
  }
});

export default router;

