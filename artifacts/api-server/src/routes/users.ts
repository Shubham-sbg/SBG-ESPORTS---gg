import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin, optionalAdminAuth } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/users", optionalAdminAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const isAdmin = Boolean(user && user.role);
    const { role, limit } = req.query as Record<string, string>;

    let rows = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      avatar: usersTable.avatar,
      displayName: usersTable.displayName,
      bio: usersTable.bio,
      country: usersTable.country,
      createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt));

    if (role) rows = rows.filter(u => u.role === role);
    if (limit) rows = rows.slice(0, Math.min(Number(limit) || 50, 200));

    // For non-admin callers, mask email addresses to protect privacy
    const safeRows = rows.map(r => ({
      ...r,
      email: isAdmin ? r.email : `${r.email?.split("@")[0]?.slice(0, 3)}***@***.com`,
      createdAt: r.createdAt.toISOString(),
    }));

    res.json(safeRows);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.get("/users/me", async (req, res) => {
  return res.status(401).json({ error: "Use /api/auth/session for authenticated session info." });
});

router.get("/users/:id", optionalAdminAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const isAdmin = Boolean(user && user.role);
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid user ID" });

    const [row] = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      avatar: usersTable.avatar,
      displayName: usersTable.displayName,
      bio: usersTable.bio,
      country: usersTable.country,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.id, id));

    if (!row) return res.status(404).json({ error: "User not found" });

    return res.json({
      ...row,
      email: isAdmin ? row.email : `${row.email?.split("@")[0]?.slice(0, 3)}***@***.com`,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Failed to load user" });
  }
});

router.patch("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid user ID" });

    const currentUser = (req as any).user;
    const { passwordHash, role, ...safeData } = req.body;

    const updatePayload: Record<string, any> = { ...safeData, updatedAt: new Date() };

    // Only Super Admin can change user roles
    if (role !== undefined) {
      if (currentUser?.role === "super_admin") {
        updatePayload.role = role;
      }
    }

    const [row] = await db.update(usersTable)
      .set(updatePayload)
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        role: usersTable.role,
        avatar: usersTable.avatar,
        displayName: usersTable.displayName,
        bio: usersTable.bio,
        country: usersTable.country,
        createdAt: usersTable.createdAt,
      });

    if (!row) return res.status(404).json({ error: "User not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;

