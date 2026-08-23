import { pgTable, serial, text, real, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  originalPrice: real("original_price"),
  category: text("category").notNull().default("apparel"),
  image: text("image"),
  images: text("images"),
  inStock: boolean("in_stock").notNull().default(true),
  stockCount: integer("stock_count"),
  sizes: text("sizes"),
  colors: text("colors"),
  featured: boolean("featured").notNull().default(false),
  badge: text("badge"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
