import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug"),
  category: text("category").notNull().default("announcement"),
  content: text("content"),
  excerpt: text("excerpt"),
  image: text("image"),
  published: boolean("published").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  views: integer("views").notNull().default(0),
  authorName: text("author_name").default("SBG ARMY"),
  tags: text("tags"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true, views: true, createdAt: true, updatedAt: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
