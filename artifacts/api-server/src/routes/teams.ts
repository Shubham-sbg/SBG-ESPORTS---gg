import { Router } from "express";
import { db, teamsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/teams", async (req, res) => {
  try {
    const rows = await db.select().from(teamsTable);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to load teams" });
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
    const [row] = await db.select().from(teamsTable).where(eq(teamsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    return res.status(500).json({ error: "Failed to load team" });
  }
});

export default router;

