import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tournamentsTable = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  game: text("game").notNull(),
  status: text("status").notNull().default("upcoming"),
  prizePool: text("prize_pool"),
  maxTeams: integer("max_teams"),
  registeredTeams: integer("registered_teams").default(0),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  banner: text("banner"),
  description: text("description"),
  format: text("format"),
  rules: text("rules"),
  streamUrl: text("stream_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTournamentSchema = createInsertSchema(tournamentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournamentsTable.$inferSelect;
