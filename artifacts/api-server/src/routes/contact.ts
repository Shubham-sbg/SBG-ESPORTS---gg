import { Router } from "express";
import { db, contactMessagesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";
import rateLimit from "express-rate-limit";

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(429).json({ ok: false, error: "Too many messages sent. Please wait before trying again." });
  },
});

router.post("/contact", contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email address is required." });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message content is required." });
    }

    const [row] = await db.insert(contactMessagesTable).values({
      name: name.trim().slice(0, 150),
      email: email.trim().slice(0, 200),
      subject: (subject ? String(subject).trim() : "General Inquiry").slice(0, 250),
      message: message.trim().slice(0, 5000),
    }).returning();

    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to submit contact message" });
  }
});

router.get("/contact", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(contactMessagesTable).orderBy(desc(contactMessagesTable.createdAt));
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    res.json([]);
  }
});

export default router;

