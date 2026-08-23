import { Router } from "express";
import { db, navigationItemsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/navigation", async (_req, res) => {
  try {
    const rows = await db.select().from(navigationItemsTable).where(eq(navigationItemsTable.visible, true)).orderBy(asc(navigationItemsTable.sortOrder));
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    res.json([]);
  }
});

router.post("/navigation", requireAdmin, async (req, res) => {
  try {
    const [row] = await db.insert(navigationItemsTable).values(req.body).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    res.status(500).json({ error: "Failed to create navigation item" });
  }
});

router.patch("/navigation/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid navigation ID" });
    const [row] = await db.update(navigationItemsTable).set(req.body).where(eq(navigationItemsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    return res.status(500).json({ error: "Failed to update navigation item" });
  }
});

router.delete("/navigation/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid navigation ID" });
    await db.delete(navigationItemsTable).where(eq(navigationItemsTable.id, id));
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Failed to delete navigation item" });
  }
});

export default router;

