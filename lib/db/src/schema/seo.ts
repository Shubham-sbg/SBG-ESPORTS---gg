import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const seoTable = pgTable("seo_pages", {
  id: serial("id").primaryKey(),
  path: text("path").notNull().unique(),
  title: text("title"),
  description: text("description"),
  ogImage: text("og_image"),
  keywords: text("keywords"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SeoPage = typeof seoTable.$inferSelect;
