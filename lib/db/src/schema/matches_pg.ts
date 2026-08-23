import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchesTable = pgTable("matches_pg", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id"),
  title: text("title").notNull(),
  teamAId: integer("team_a_id"),
  teamBId: integer("team_b_id"),
  teamAName: text("team_a_name"),
  teamBName: text("team_b_name"),
  game: text("game").notNull(),
  round: text("round"),
  stage: text("stage"),
  status: text("status").notNull().default("scheduled"),
  scoreA: integer("score_a").default(0),
  scoreB: integer("score_b").default(0),
  winnerId: integer("winner_id"),
  winnerName: text("winner_name"),
  scheduledAt: text("scheduled_at"),
  streamUrl: text("stream_url"),
  mapName: text("map_name"),
  notes: text("notes"),
  isFeatured: boolean("is_featured").default(false),
  bracketPosition: integer("bracket_position"),
  bracketRound: integer("bracket_round"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;
