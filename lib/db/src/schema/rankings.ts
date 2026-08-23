import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rankingsTable = pgTable("rankings", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id"),
  teamId: integer("team_id"),
  game: text("game").notNull(),
  category: text("category").notNull().default("overall"),
  rank: integer("rank").notNull().default(0),
  points: integer("points").notNull().default(0),
  kills: integer("kills").default(0),
  deaths: integer("deaths").default(0),
  wins: integer("wins").default(0),
  matches: integer("matches").default(0),
  kd: real("kd").default(0),
  winRate: real("win_rate").default(0),
  damage: integer("damage").default(0),
  mvpCount: integer("mvp_count").default(0),
  season: text("season").default("2026"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRankingSchema = createInsertSchema(rankingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRanking = z.infer<typeof insertRankingSchema>;
export type Ranking = typeof rankingsTable.$inferSelect;
