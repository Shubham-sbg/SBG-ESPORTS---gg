import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// ── Lazy PostgreSQL initialisation ────────────────────────────────────────────
// The database connection is created on first access, not at module load.
// This lets the server start and serve all JSON-store routes even when
// DATABASE_URL is not configured (e.g. Render Free without a Postgres add-on).
// The /api/matches-pg routes that actually use this will return a clear 500
// error if DATABASE_URL is absent, without crashing the entire process.
// ─────────────────────────────────────────────────────────────────────────────

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getPool(): pg.Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

// Export proxy objects so existing import syntax (`import { db, pool } from …`)
// continues to work everywhere, but the real connection is only opened when a
// property is first accessed (i.e. when a query is actually executed).
export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop: string | symbol) {
    const p = getPool();
    const val = (p as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as Function).bind(p) : val;
  },
});

export const db = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop: string | symbol) {
      const d = getDb();
      const val = (d as unknown as Record<string | symbol, unknown>)[prop];
      return typeof val === "function" ? (val as Function).bind(d) : val;
    },
  },
);

export * from "./schema";
