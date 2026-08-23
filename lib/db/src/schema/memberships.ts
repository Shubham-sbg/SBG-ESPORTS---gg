import { pgTable, serial, text, real, boolean, timestamp } from "drizzle-orm/pg-core";

export const membershipPlansTable = pgTable("membership_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull().default(0),
  durationDays: text("duration_days"),
  features: text("features"),
  badge: text("badge"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userMembershipsTable = pgTable("user_memberships", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: text("plan_id").notNull(),
  status: text("status").notNull().default("active"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MembershipPlan = typeof membershipPlansTable.$inferSelect;
export type UserMembership = typeof userMembershipsTable.$inferSelect;
