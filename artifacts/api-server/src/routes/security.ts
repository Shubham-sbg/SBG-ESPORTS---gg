import { Router } from "express";
import { db, loginAttemptsTable, lockedAccountsTable, auditLogsTable } from "@workspace/db";
import { desc, eq, gte } from "drizzle-orm";
import { requireAdmin, requireSuperAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/security/login-attempts", requireSuperAdmin, async (req, res) => {
  try {
    const { limit = "100" } = req.query as Record<string, string>;
    const parsedLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const rows = await db.select()
      .from(loginAttemptsTable)
      .orderBy(desc(loginAttemptsTable.createdAt))
      .limit(parsedLimit);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to load login attempts" });
  }
});

router.get("/security/locked-accounts", requireSuperAdmin, async (req, res) => {
  try {
    const now = new Date();
    const rows = await db.select()
      .from(lockedAccountsTable)
      .where(gte(lockedAccountsTable.lockedUntil, now));
    res.json(rows.map(r => ({ ...r, lockedUntil: r.lockedUntil.toISOString(), createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to load locked accounts" });
  }
});

router.delete("/security/locked-accounts/:identifier", requireSuperAdmin, async (req, res) => {
  try {
    const identifier = String(req.params.identifier).trim();
    if (!identifier) {
      return res.status(400).json({ error: "Identifier is required" });
    }
    await db.delete(lockedAccountsTable).where(eq(lockedAccountsTable.identifier, identifier));
    res.json({ success: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to unlock account" });
  }
});

router.get("/security/audit-logs", requireSuperAdmin, async (req, res) => {
  try {
    const { limit = "100", action, userId } = req.query as Record<string, string>;
    const parsedLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    let rows = await db.select()
      .from(auditLogsTable)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(parsedLimit);
    if (action) rows = rows.filter(r => r.action?.includes(action));
    if (userId) rows = rows.filter(r => r.userId === userId);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to load audit logs" });
  }
});

router.post("/security/audit-logs", requireAdmin, async (req, res) => {
  try {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const [row] = await db.insert(auditLogsTable).values({
      ...req.body,
      ip: req.body?.ip ?? ip,
      userAgent: req.body?.userAgent ?? req.headers["user-agent"],
    }).returning();
    res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to log audit event" });
  }
});

export default router;

