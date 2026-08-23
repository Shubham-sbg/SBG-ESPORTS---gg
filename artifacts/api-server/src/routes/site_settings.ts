import { Router } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin, requireSuperAdmin } from "../middleware/requireAdmin.js";
import { 
  projectToFirestore, 
  syncAllSettingsToFirestore, 
  firestoreHealth 
} from "../lib/firebaseProjection.js";

const router = Router();

// Helper to push a complete section dynamically to Firestore
async function syncSectionToFirestore(sectionName: string) {
  try {
    const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.section, sectionName));
    const obj: Record<string, string | null> = {};
    for (const row of rows) {
      const k = row.key.includes(".") ? row.key.split(".").slice(1).join(".") : row.key;
      obj[k] = row.value;
    }
    await projectToFirestore("site_settings", sectionName, obj);
  } catch (err: any) {
    console.error(`[Firestore Projection] Failed to sync section "${sectionName}":`, err.message);
  }
}

// Admin health check route
router.get("/admin/firestore-health", requireAdmin, async (_req, res) => {
  res.json({
    ...firestoreHealth,
    dbConnected: true, // Express/Postgres is healthy as verified by middleware/route execution
  });
});

// Admin manual full sync route
router.post("/admin/firestore-sync-all", requireAdmin, async (_req, res) => {
  const success = await syncAllSettingsToFirestore();
  if (success) {
    res.json({ ok: true, message: "Manual synchronization completed successfully." });
  } else {
    res.status(500).json({ error: "Failed to perform manual database synchronization." });
  }
});

router.get("/settings", async (_req, res) => {
  try {
    const rows = await db.select().from(siteSettingsTable);
    const grouped: Record<string, Record<string, string | null>> = {};
    for (const row of rows) {
      if (!grouped[row.section]) grouped[row.section] = {};
      grouped[row.section][row.key.split(".")[1] || row.key] = row.value;
    }
    res.json({ settings: rows, grouped });
  } catch (e) {
    res.json({ settings: [], grouped: {} });
  }
});

router.get("/settings/theme", async (_req, res) => {
  try {
    const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "theme.activeTheme"));
    const activeTheme = rows.length > 0 && rows[0].value ? rows[0].value : "classic";
    res.json({ activeTheme });
  } catch (e) {
    res.json({ activeTheme: "classic" });
  }
});

router.post("/settings/theme", requireAdmin, async (req, res) => {
  try {
    const { activeTheme } = req.body;
    if (!activeTheme || typeof activeTheme !== "string") {
      return res.status(400).json({ error: "Invalid theme" });
    }
    
    const key = "theme.activeTheme";
    const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
    if (existing.length > 0) {
      await db.update(siteSettingsTable).set({ value: activeTheme, updatedAt: new Date() }).where(eq(siteSettingsTable.key, key));
    } else {
      await db.insert(siteSettingsTable).values({ key, value: activeTheme, section: "theme", label: "Active Theme", type: "string" });
    }
    
    // Async background sync to Firestore
    syncSectionToFirestore("theme");
    
    res.json({ ok: true, activeTheme });
  } catch (e) {
    res.status(500).json({ error: "Failed to save theme" });
  }
});

router.get("/settings/:section", async (req, res) => {
  try {
    const sectionName = String(req.params.section);
    const rows = await db.select().from(siteSettingsTable);
    const section = rows.filter(r => r.section === sectionName);
    const obj: Record<string, string | null> = {};
    for (const row of section) {
      const k = row.key.includes(".") ? row.key.split(".").slice(1).join(".") : row.key;
      obj[k] = row.value;
    }
    res.json(obj);
  } catch (e) {
    res.json({});
  }
});

router.put("/settings/:key", requireAdmin, async (req, res) => {
  try {
    const key = String(req.params.key);
    const user = (req as any).user;

    // Theme or critical settings require Super Admin
    if ((key.startsWith("theme.") || key === "security") && user?.role !== "super_admin") {
      return res.status(403).json({ error: "Super Admin privileges required to modify this setting." });
    }

    const { value, section, label, type } = req.body;
    const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
    const targetSection = existing.length > 0 ? existing[0].section : (section || "general");

    if (existing.length > 0) {
      const [row] = await db.update(siteSettingsTable).set({ value, updatedAt: new Date() }).where(eq(siteSettingsTable.key, key)).returning();
      // Async background sync to Firestore
      syncSectionToFirestore(targetSection);
      res.json(row);
    } else {
      const [row] = await db.insert(siteSettingsTable).values({ key, value, section: section || "general", label: label || key, type: type || "text" }).returning();
      // Async background sync to Firestore
      syncSectionToFirestore(targetSection);
      res.json(row);
    }
  } catch (e) {
    res.status(500).json({ error: "Failed to update setting" });
  }
});

router.post("/settings/bulk", requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body as { settings: Array<{ key: string; value: string; section?: string; label?: string; type?: string }> };
    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: "Invalid settings format" });
    }

    const user = (req as any).user;
    const results = [];
    const affectedSections = new Set<string>();

    for (const s of settings) {
      if (!s.key) continue;
      if (s.key.startsWith("theme.") && user?.role !== "super_admin") {
        continue; // Skip theme change if not super admin
      }
      const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, s.key));
      const sectionName = existing.length > 0 ? existing[0].section : (s.section || "general");
      affectedSections.add(sectionName);

      if (existing.length > 0) {
        const [row] = await db.update(siteSettingsTable).set({ value: s.value, updatedAt: new Date() }).where(eq(siteSettingsTable.key, s.key)).returning();
        results.push(row);
      } else {
        const [row] = await db.insert(siteSettingsTable).values({ key: s.key, value: s.value, section: s.section || "general", label: s.label || s.key, type: s.type || "text" }).returning();
        results.push(row);
      }
    }

    // Async background sync of all unique affected sections to Firestore
    for (const sec of affectedSections) {
      syncSectionToFirestore(sec);
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: "Failed to update bulk settings" });
  }
});

export default router;

