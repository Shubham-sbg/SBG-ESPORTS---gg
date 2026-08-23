import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const loginAttemptsTable = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull().default(false),
  failReason: text("fail_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lockedAccountsTable = pgTable("locked_accounts", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  ip: text("ip"),
  lockedUntil: timestamp("locked_until").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LoginAttempt = typeof loginAttemptsTable.$inferSelect;
export type LockedAccount = typeof lockedAccountsTable.$inferSelect;
