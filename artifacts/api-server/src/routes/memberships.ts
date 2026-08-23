import { Router } from "express";
import { db, membershipPlansTable, couponsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";
import rateLimit from "express-rate-limit";

const router = Router();

const couponValidateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(429).json({ valid: false, message: "Too many coupon validation attempts. Please try again later." });
  },
});

router.get("/memberships", async (_req, res) => {
  try {
    const rows = await db.select().from(membershipPlansTable).where(eq(membershipPlansTable.active, true));
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    res.json([]);
  }
});

router.get("/memberships/all", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(membershipPlansTable);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    res.json([]);
  }
});

router.post("/memberships", requireAdmin, async (req, res) => {
  try {
    const [row] = await db.insert(membershipPlansTable).values(req.body).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to create membership plan" });
  }
});

router.patch("/memberships/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid membership ID" });
    const [row] = await db.update(membershipPlansTable).set(req.body).where(eq(membershipPlansTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    return res.status(500).json({ error: "Failed to update membership plan" });
  }
});

router.get("/coupons", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(couponsTable);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), expiresAt: r.expiresAt?.toISOString() || null })));
  } catch (e) {
    res.json([]);
  }
});

router.post("/coupons", requireAdmin, async (req, res) => {
  try {
    const { code, discountType, discountValue } = req.body || {};
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ error: "Code, discountType and discountValue are required." });
    }
    const [row] = await db.insert(couponsTable).values({
      ...req.body,
      code: String(code).trim().toUpperCase(),
    }).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: "Failed to create coupon" });
  }
});

router.post("/coupons/validate", couponValidateLimiter, async (req, res) => {
  try {
    const { code, amount } = req.body || {};
    if (!code || typeof code !== "string") {
      return res.json({ valid: false, message: "Invalid coupon code" });
    }
    const numAmount = Number(amount) || 0;
    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code.trim().toUpperCase()));
    if (!coupon || !coupon.active) return res.json({ valid: false, message: "Invalid coupon code" });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.json({ valid: false, message: "Coupon has expired" });
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return res.json({ valid: false, message: "Coupon usage limit reached" });
    if (coupon.minOrderAmount && numAmount < coupon.minOrderAmount) return res.json({ valid: false, message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    const discount = coupon.discountType === "percentage" ? (numAmount * coupon.discountValue) / 100 : coupon.discountValue;
    return res.json({ valid: true, discount, couponId: coupon.id, discountType: coupon.discountType, discountValue: coupon.discountValue });
  } catch (e) {
    return res.status(500).json({ error: "Failed to validate coupon" });
  }
});

export default router;

