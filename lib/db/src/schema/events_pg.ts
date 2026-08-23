import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("general"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  startTime: text("start_time"),
  location: text("location"),
  banner: text("banner"),
  registrationUrl: text("registration_url"),
  isPublic: boolean("is_public").notNull().default(true),
  status: text("status").notNull().default("upcoming"),
  game: text("game"),
  prizePool: text("prize_pool"),
  maxParticipants: text("max_participants"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
