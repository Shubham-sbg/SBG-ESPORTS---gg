import { Router } from "express";
import { readCol, writeCol } from "../lib/store.js";
import { broadcast } from "../lib/wsServer.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

const VALID_THEMES = [
  "classic",
  "classic-sbg-army",
  "classic-sbg-esports",
  "motion",
  "cyberpunk",
  "royal",
  "luxury_gold",
  "elite",
  "new-esports",
  "pro-arena",
  "champions"
];

router.get("/theme", async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  try {
    const themeSettings = (await readCol("themeSettings") as Record<string, any>) || {};
    const settings = (await readCol("settings") as Record<string, any>) || {};
    let activeTheme = themeSettings.activeTheme || settings.activeTheme || "classic";
    if (activeTheme === "luxury_gold") activeTheme = "royal";
    if (activeTheme === "elite") activeTheme = "new-esports";
    return res.status(200).json({ ok: true, activeTheme });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || "Failed to fetch active theme" });
  }
});

router.post("/theme", requireAdmin, async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const { activeTheme } = req.body || {};
    
    if (!activeTheme || typeof activeTheme !== "string" || !VALID_THEMES.includes(activeTheme)) {
      return res.status(400).json({ ok: false, error: "Invalid theme value." });
    }

    let normalizedTheme = activeTheme === "luxury_gold" ? "royal" : activeTheme;
    if (normalizedTheme === "elite") normalizedTheme = "new-esports";

    // Atomic update to themeSettings collection
    const themeData = { activeTheme: normalizedTheme, updatedAt: Date.now() };
    await writeCol("themeSettings", themeData);

    // Sync settings collection
    const settings = (await readCol("settings") as Record<string, any>) || {};
    settings.activeTheme = normalizedTheme;
    await writeCol("settings", settings);

    // Broadcast updates to all connected clients
    broadcast({ type: "db_update", collection: "themeSettings", data: themeData, timestamp: Date.now() });
    broadcast({ type: "db_update", collection: "settings", data: settings, timestamp: Date.now() });

    return res.json({ ok: true, activeTheme: normalizedTheme });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || "Failed to update active theme" });
  }
});

export default router;
