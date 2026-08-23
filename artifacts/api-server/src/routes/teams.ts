import { Router } from "express";
import { db, teamsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { readCol } from "../lib/store.js";

const router = Router();

router.get("/teams", async (req, res) => {
  try {
    try {
      const rows = await db.select().from(teamsTable);
      return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString() })));
    } catch {
      const fallback = ((await readCol("teams")) as any[]) || [];
      return res.json(Array.isArray(fallback) ? fallback : []);
    }
  } catch (e) {
    req.log?.error?.(e);
    res.json([]);
  }
});

router.post("/teams", requireAdmin, async (req, res) => {
  try {
    const [row] = await db.insert(teamsTable).values(req.body).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to create team" });
  }
});

router.get("/teams/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid team ID" });
    try {
      const [row] = await db.select().from(teamsTable).where(eq(teamsTable.id, id));
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json({ ...row, createdAt: row.createdAt.toISOString() });
    } catch {
      const fallback = ((await readCol("teams")) as any[]) || [];
      const found = Array.isArray(fallback) ? fallback.find(t => String(t.id) === String(id)) : null;
      if (!found) return res.status(404).json({ error: "Not found" });
      return res.json(found);
    }
  } catch (e) {
    req.log?.error?.(e);
    return res.status(404).json({ error: "Not found" });
  }
});

export default router;

