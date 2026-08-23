import { Router } from "express";
import { db, productsTable, ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { readCol } from "../lib/store.js";
import rateLimit from "express-rate-limit";

const router = Router();

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(429).json({ ok: false, error: "Too many order attempts. Please try again later." });
  },
});

router.get("/products", async (req, res) => {
  try {
    const { category, inStock } = req.query as Record<string, string>;
    let rows: any[] = [];
    try {
      rows = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
      if (category) rows = rows.filter(p => p.category === category);
      if (inStock === 'true') rows = rows.filter(p => p.inStock);
      return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString() })));
    } catch {
      const fallback = ((await readCol("products")) as any[]) || [];
      rows = Array.isArray(fallback) ? fallback : [];
      if (category) rows = rows.filter(p => p.category === category);
      if (inStock === 'true') rows = rows.filter(p => p.inStock);
      return res.json(rows);
    }
  } catch (e) {
    req.log.error(e);
    res.json([]);
  }
});

router.post("/products", requireAdmin, async (req, res) => {
  try {
    const [row] = await db.insert(productsTable).values(req.body).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid product ID" });
    const [row] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!row) return res.status(404).json({ error: "Product not found" });
    return res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Failed to load product" });
  }
});

router.post("/orders", orderLimiter, async (req, res) => {
  try {
    const { productId, quantity = 1, customerName, customerEmail, shippingAddress } = req.body || {};
    const parsedProductId = Number(productId);
    const parsedQty = Math.max(1, Math.min(Number(quantity) || 1, 50));

    if (!parsedProductId || isNaN(parsedProductId)) {
      return res.status(400).json({ error: "Valid productId is required" });
    }

    const product = await db.select().from(productsTable).where(eq(productsTable.id, parsedProductId));
    const p = product[0];
    if (!p) {
      return res.status(404).json({ error: "Product not found" });
    }

    const totalAmount = (p.price || 0) * parsedQty;
    const [row] = await db.insert(ordersTable).values({
      ...req.body,
      productId: parsedProductId,
      quantity: parsedQty,
      totalAmount,
      productName: p.name || '',
      customerName: customerName ? String(customerName).slice(0, 150) : undefined,
      customerEmail: customerEmail ? String(customerEmail).slice(0, 200) : undefined,
      shippingAddress: shippingAddress ? String(shippingAddress).slice(0, 500) : undefined,
    }).returning();

    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to place order" });
  }
});

router.get("/orders", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
  } catch (e) {
    res.json([]);
  }
});

export default router;

