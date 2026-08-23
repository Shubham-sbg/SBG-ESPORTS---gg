import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  realName: text("real_name"),
  game: text("game").notNull(),
  role: text("role").notNull(),
  uid: text("uid"),
  rank: text("rank"),
  image: text("image"),
  country: text("country").default("India"),
  status: text("status").notNull().default("active"),
  kills: integer("kills").default(0),
  wins: integer("wins").default(0),
  matches: integer("matches").default(0),
  kd: real("kd").default(0),
  winRate: real("win_rate").default(0),
  bio: text("bio"),
  instagram: text("instagram"),
  youtube: text("youtube"),
  teamId: integer("team_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;
