import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(),
  key: text("key").notNull().unique(),
  value: text("value"),
  type: text("type").notNull().default("text"),
  label: text("label"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SiteSetting = typeof siteSettingsTable.$inferSelect;
