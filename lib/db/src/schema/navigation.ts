import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const navigationItemsTable = pgTable("navigation_items", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  openInNewTab: boolean("open_in_new_tab").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type NavigationItem = typeof navigationItemsTable.$inferSelect;
