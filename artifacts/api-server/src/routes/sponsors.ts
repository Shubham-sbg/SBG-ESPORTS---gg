import { Router } from "express";
import { db, sponsorsTable } from "@workspace/db";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/sponsors", async (_req, res) => {
  try {
    const rows = await db.select().from(sponsorsTable);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    res.json([]);
  }
});

router.post("/sponsors", requireAdmin, async (req, res) => {
  try {
    const [row] = await db.insert(sponsorsTable).values(req.body).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    res.status(500).json({ error: "Failed to create sponsor" });
  }
});

export default router;

