import { Router } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/events", async (req, res) => {
  try {
    const { status, type, game } = req.query as Record<string, string>;
    let rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt));
    if (status) rows = rows.filter(r => r.status === status);
    if (type) rows = rows.filter(r => r.type === type);
    if (game) rows = rows.filter(r => r.game === game);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to load events" });
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid event ID" });
    const [row] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    return res.status(500).json({ error: "Failed to load event" });
  }
});

router.post("/events", requireAdmin, async (req, res) => {
  try {
    const [row] = await db.insert(eventsTable).values(req.body).returning();
    res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.patch("/events/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid event ID" });
    const [row] = await db.update(eventsTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(eventsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    return res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/events/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid event ID" });
    await db.delete(eventsTable).where(eq(eventsTable.id, id));
    res.json({ success: true });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;

