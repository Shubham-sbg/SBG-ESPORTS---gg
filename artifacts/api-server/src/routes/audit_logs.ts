import { Router } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/audit-logs", requireAdmin, async (req, res) => {
  try {
    const { limit = "50" } = req.query as Record<string, string>;
    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const rows = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(parsedLimit);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    res.json([]);
  }
});

router.post("/audit-logs", requireAdmin, async (req, res) => {
  try {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";
    const [row] = await db.insert(auditLogsTable).values({ ...req.body, ip, userAgent }).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    res.status(500).json({ error: "Failed to record audit log" });
  }
});

export default router;

