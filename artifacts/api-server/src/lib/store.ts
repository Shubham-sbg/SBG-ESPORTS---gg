import pg from 'pg';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let DatabaseSyncClass: any = null;
try {
  const sqliteModule = await import('node:sqlite');
  DatabaseSyncClass = sqliteModule.DatabaseSync || null;
} catch {
  DatabaseSyncClass = null;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourceDB_DIR = join(__dirname, '..', '..', 'database');
let DB_DIR = sourceDB_DIR;

try {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }
  const testFile = join(DB_DIR, '.write-test');
  writeFileSync(testFile, 'ok');
  unlinkSync(testFile);
} catch {
  DB_DIR = '/tmp/database';
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }
  try {
    if (existsSync(sourceDB_DIR)) {
      const files = ['settings.json', 'staffAccounts.json', 'features.json', 'ads.json', 'about.json', 'achievements.json', 'analytics.json', 'creators.json', 'facility.json', 'facilityStats.json', 'faq.json', 'founders.json', 'gallery.json', 'hofMilestones.json', 'matches.json', 'navigation.json', 'platforms.json', 'players.json', 'posts.json', 'schedule.json', 'shop.json', 'teamRecords.json', 'trophies.json', 'weeklyEvents.json'];
      for (const f of files) {
        const srcFile = join(sourceDB_DIR, f);
        const destFile = join(DB_DIR, f);
        if (existsSync(srcFile) && !existsSync(destFile)) {
          try {
            copyFileSync(srcFile, destFile);
          } catch {}
        }
      }
    }
  } catch {}
}

const SQLITE_FILE = join(DB_DIR, 'store.db');

export function getDatabaseDir(): string {
  return DB_DIR;
}

export interface MediaRecord {
  id: string;
  url: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  ratio: string;
  module: string;
  title: string;
  altText: string;
  caption: string;
  enabled: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

const COLLECTIONS = [
  'settings', 'themeSettings', 'players', 'games', 'matches', 'tournaments', 'registrations',
  'ads', 'sponsors', 'posts', 'analytics', 'shop', 'facility', 'facilityStats',
  'creators', 'navigation', 'founders', 'schedule', 'fan_messages', 'giveaways',
  'collab_requests', 'videos', 'staffAccounts', 'playerUsers', 'contact_messages',
  'orders', 'features', 'gallery', 'projects', 'tasks', 'achievements',
  'weeklyEvents', 'feedback', 'hofMilestones', 'trophies', 'teamRecords', 'teamSeasons',
  'about', 'faq', 'customCode', 'leaderboard',
  'tnmt_tournaments', 'tnmt_teams', 'tnmt_matches', 'tnmt_brackets', 'tnmt_settings',
  'recruitment', 'recruitmentOpenings', 'platforms', 'livestreams', 'media_library',
];

const DEFAULT_SUPER_ADMIN_PASSWORD_HASH = '$2b$10$fs1CMTHxeIDdhZLAMKQA7.I1L6Uud2lnz3OFjQKgxjcJtMe6VWIBy'; // official7Sbgarmyweb2@

const DEFAULTS: Record<string, unknown> = {
  staffAccounts: [
    {
      id: 'admin_sbgarmy_001',
      name: 'SBG ARMY Super Admin',
      email: 'official7sbgarmy@gamil.com',
      password: DEFAULT_SUPER_ADMIN_PASSWORD_HASH,
      role: 'super_admin',
      allowedModules: ['*'],
      active: true,
      createdAt: 1700000000000,
    },
    {
      id: 'admin_sbgarmy_002',
      name: 'SBG ARMY Super Admin',
      email: 'official7sbgarmy7@gamil.com',
      password: DEFAULT_SUPER_ADMIN_PASSWORD_HASH,
      role: 'super_admin',
      allowedModules: ['*'],
      active: true,
      createdAt: 1700000000000,
    },
    {
      id: 'admin_sbgarmy_003',
      name: 'SBG ARMY Super Admin',
      email: 'official7sbgarmy@gmail.com',
      password: DEFAULT_SUPER_ADMIN_PASSWORD_HASH,
      role: 'super_admin',
      allowedModules: ['*'],
      active: true,
      createdAt: 1700000000000,
    },
    {
      id: 'admin_sbgarmy_004',
      name: 'SBG ARMY Super Admin',
      email: 'official7sbgarmy7@gmail.com',
      password: DEFAULT_SUPER_ADMIN_PASSWORD_HASH,
      role: 'super_admin',
      allowedModules: ['*'],
      active: true,
      createdAt: 1700000000000,
    },
  ],
  features: {
    sections: {
      hero: true, heroStats: true, ads: true, roster: true, matches: true, schedule: true,
      games: true, creators: true, news: true, videos: true, founders: true,
      sponsors: true, facility: true, contact: true, announcement: true,
    },
    pages: {
      shop: true, tournaments: false, leaderboards: true, events: true,
      blog: true, hallOfFame: true, live: false, join: true,
      community: true, fanConnect: true, giveaways: true, collaborate: true,
      playerPortal: false, dashboard: false, records: true, stats: true,
      trophyRoom: true, teamHistory: true, gallery: true, achievements: true,
      schedule: true, feedback: true, hofTimeline: true,
    }
  },
  settings: {
    organizationName: 'SBG ESPORTS',
    logo: '',
    maintenanceMode: false,
  },
  themeSettings: {
    activeTheme: 'classic'
  }
};

let sqliteDb: any = null;
let pool: pg.Pool | null = null;
let isPgConnected = false;
const cache: Record<string, unknown> = {};

let firestoreClient: any = null;
let firestoreInitialized = false;

async function initFirestore(): Promise<any> {
  if (firestoreInitialized) return firestoreClient;
  try {
    const configPath = join(process.cwd(), 'firebase-applet-config.json');
    let config: any = {};
    if (existsSync(configPath)) {
      config = JSON.parse(readFileSync(configPath, 'utf8'));
    }
    const projectId = config.projectId || 'sbg-army-web';
    const databaseId = config.firestoreDatabaseId || 'ai-studio-sbgarmygg-50d61416-99c8-4021-beb1-783af9dce49c';

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId,
        });
      }
    } else {
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: projectId,
        });
      }
    }

    firestoreClient = getFirestore(admin.apps[0]!, databaseId);
    firestoreInitialized = true;
    console.log(`[Store] Firestore connected to database ${databaseId} on project ${projectId}.`);
    return firestoreClient;
  } catch (err: any) {
    console.warn('[Store] Firestore initialization skipped/failed:', err.message);
    firestoreInitialized = true; // prevent infinite retries
    return null;
  }
}

async function ensurePgPool(): Promise<pg.Pool | null> {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pool.on('error', (err) => {
      console.warn('[Postgres Pool Warning]', err.message);
    });
  }
  return pool;
}

function readJsonFile(col: string): unknown {
  const p = join(DB_DIR, `${col}.json`);
  if (existsSync(p)) {
    try {
      return JSON.parse(readFileSync(p, 'utf8'));
    } catch {}
  }
  return null;
}

function writeJsonFile(col: string, data: unknown): void {
  const p = join(DB_DIR, `${col}.json`);
  try {
    writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

function resetSqliteFiles(): void {
  try {
    if (sqliteDb) {
      try { sqliteDb.close?.(); } catch {}
      sqliteDb = null;
    }
    const files = [
      SQLITE_FILE,
      `${SQLITE_FILE}-wal`,
      `${SQLITE_FILE}-shm`,
      `${SQLITE_FILE}-journal`,
      join(DB_DIR, 'production.db'),
      join(DB_DIR, 'production.db-wal'),
      join(DB_DIR, 'production.db-shm'),
    ];
    for (const f of files) {
      if (existsSync(f)) {
        try { unlinkSync(f); } catch {}
      }
    }
  } catch (err: any) {
    console.warn('[SQLite] File reset warning:', err?.message || err);
  }
}

function initSqliteSchema(db: any): boolean {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS store_data (
        collection TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS uploaded_files (
        filename TEXT PRIMARY KEY,
        mime_type TEXT NOT NULL,
        data BLOB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS image_metadata (
        id TEXT PRIMARY KEY,
        url TEXT,
        storage_key TEXT,
        filename TEXT,
        mime_type TEXT,
        size INTEGER,
        width INTEGER,
        height INTEGER,
        ratio TEXT,
        module TEXT,
        title TEXT,
        alt_text TEXT,
        caption TEXT,
        enabled INTEGER,
        position INTEGER,
        created_at TEXT,
        updated_at TEXT
      );
    `);
    return true;
  } catch (err: any) {
    console.warn('[SQLite] Schema execution failed, clearing database file:', err?.message || err);
    return false;
  }
}

function getSqlite(): any {
  if (!DatabaseSyncClass) return null;
  if (sqliteDb) return sqliteDb;

  try {
    const db = new DatabaseSyncClass(SQLITE_FILE);
    if (initSqliteSchema(db)) {
      sqliteDb = db;
      return sqliteDb;
    }
  } catch (err: any) {
    console.warn('[SQLite] Initial connection failed:', err?.message || err);
  }

  // Attempt recovery by purging corrupt file and re-initializing
  try {
    resetSqliteFiles();
    const freshDb = new DatabaseSyncClass(SQLITE_FILE);
    if (initSqliteSchema(freshDb)) {
      sqliteDb = freshDb;
      return sqliteDb;
    }
  } catch (recoveryErr: any) {
    console.warn('[SQLite] Recovery failed, using file fallback:', recoveryErr?.message || recoveryErr);
  }

  sqliteDb = null;
  return null;
}

function readSqlite(col: string): unknown {
  try {
    const db = getSqlite();
    if (db) {
      const stmt = db.prepare('SELECT data FROM store_data WHERE collection = ?');
      const row = stmt.get(col) as { data: string } | undefined;
      if (row && row.data) {
        return JSON.parse(row.data);
      }
    }
  } catch (err: any) {
    console.warn(`[SQLite] Read error for collection ${col}:`, err.message);
  }
  return readJsonFile(col);
}

function writeSqlite(col: string, data: unknown): void {
  writeJsonFile(col, data);
  try {
    const db = getSqlite();
    if (db) {
      const jsonStr = JSON.stringify(data);
      const stmt = db.prepare(`
        INSERT INTO store_data (collection, data)
        VALUES (?, ?)
        ON CONFLICT(collection) DO UPDATE SET data = excluded.data
      `);
      stmt.run(col, jsonStr);
    }
  } catch (err: any) {
    console.warn(`[SQLite] Write error for collection ${col}:`, err.message);
  }
}

export async function initStore(): Promise<void> {
  // 1. Initialize SQLite storage first (ensures immediate local operation with zero crash risk)
  try {
    const db = getSqlite();
    if (db) {
      const countStmt = db.prepare('SELECT COUNT(*) as c FROM store_data');
      const countRow = countStmt.get() as { c: number };
      if (countRow.c === 0) {
        for (const col of COLLECTIONS) {
          const val = DEFAULTS[col] ?? [];
          writeSqlite(col, val);
        }
      }
    }
  } catch (err: any) {
    console.error('[Store] SQLite initialization warning:', err.message);
  }

  // 2. Hydrate from Firestore to ensure persistent data survives container restarts/redeployments
  try {
    const fs = await initFirestore();
    if (fs) {
      // Hydrate core collections
      for (const col of COLLECTIONS) {
        try {
          const docSnap = await fs.collection('store_data').doc(col).get();
          if (docSnap.exists) {
            const val = docSnap.data().data;
            if (val !== undefined) {
              writeSqlite(col, val);
              cache[col] = val;
              console.log(`[Store] Hydrated ${col} from Firestore on startup.`);
            }
          } else {
            // Firestore document does not exist, upload our default/local state
            const localVal = readSqlite(col);
            await fs.collection('store_data').doc(col).set({
              data: localVal,
              updatedAt: new Date().toISOString()
            });
            console.log(`[Store] Uploaded default ${col} to Firestore.`);
          }
        } catch (fsErr: any) {
          console.warn(`[Store] Error syncing ${col} with Firestore on startup:`, fsErr.message);
        }
      }

      // Hydrate uploaded files metadata
      try {
        const metaSnap = await fs.collection('image_metadata').get();
        if (!metaSnap.empty) {
          const db = getSqlite();
          if (db) {
            // Empty local table first to prevent duplicate/stale metadata
            try { db.prepare('DELETE FROM image_metadata').run(); } catch {}
            
            const stmt = db.prepare(`
              INSERT INTO image_metadata (
                id, url, storage_key, filename, mime_type, size, width, height, ratio, module, title, alt_text, caption, enabled, position, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const doc of metaSnap.docs) {
              const record = doc.data();
              stmt.run(
                doc.id, record.url, record.storageKey, record.filename, record.mimeType,
                Number(record.size), record.width ?? null, record.height ?? null, record.ratio ?? 'Original',
                record.module ?? 'General', record.title ?? record.filename, record.altText ?? '',
                record.caption ?? '', record.enabled ? 1 : 0, record.position ?? 0,
                record.createdAt, record.updatedAt
              );
            }
            console.log(`[Store] Hydrated ${metaSnap.size} media records from Firestore.`);
          }
        } else {
          // Sync existing SQLite media records to Firestore if Firestore is empty
          const localMedia = await getAllMediaRecords();
          for (const record of localMedia) {
            await fs.collection('image_metadata').doc(record.id).set({
              url: record.url, storageKey: record.storageKey, filename: record.filename, mimeType: record.mimeType,
              size: record.size, width: record.width ?? null, height: record.height ?? null, ratio: record.ratio ?? 'Original',
              module: record.module ?? 'General', title: record.title ?? record.filename, altText: record.altText ?? '',
              caption: record.caption ?? '', enabled: record.enabled, position: record.position ?? 0,
              createdAt: record.createdAt, updatedAt: record.updatedAt
            });
          }
        }
      } catch (fsErr: any) {
        console.warn('[Store] Error syncing media records with Firestore on startup:', fsErr.message);
      }
    }
  } catch (err: any) {
    console.error('[Store] Firestore synchronization warning:', err.message);
  }

  // 3. If DATABASE_URL is configured, test PostgreSQL connection gracefully
  if (process.env.DATABASE_URL) {
    try {
      const pgPool = await ensurePgPool();
      if (!pgPool) return;
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`
          CREATE TABLE IF NOT EXISTS store_data (
            collection TEXT PRIMARY KEY,
            data TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS uploaded_files (
            filename TEXT PRIMARY KEY,
            mime_type TEXT NOT NULL,
            data BYTEA NOT NULL
          );
          CREATE TABLE IF NOT EXISTS image_metadata (
            id TEXT PRIMARY KEY,
            url TEXT,
            storage_key TEXT,
            filename TEXT,
            mime_type TEXT,
            size BIGINT,
            width INTEGER,
            height INTEGER,
            ratio TEXT,
            module TEXT,
            title TEXT,
            alt_text TEXT,
            caption TEXT,
            enabled BOOLEAN,
            position BIGINT,
            created_at TEXT,
            updated_at TEXT
          );
        `);

        // Check if Postgres store_data is empty; if so, populate from defaults or SQLite
        const res = await client.query('SELECT COUNT(*) as c FROM store_data');
        if (parseInt(res.rows[0].c, 10) === 0) {
          for (const col of COLLECTIONS) {
            let val = readSqlite(col);
            if (!val || (Array.isArray(val) && val.length === 0 && DEFAULTS[col])) {
              val = DEFAULTS[col] ?? [];
            }
            await client.query(
              'INSERT INTO store_data (collection, data) VALUES ($1, $2)',
              [col, JSON.stringify(val)]
            );
          }
        }
        await client.query('COMMIT');
        isPgConnected = true;
        console.log('[Store] PostgreSQL connected and initialized.');
      } catch (innerErr) {
        await client.query('ROLLBACK');
        throw innerErr;
      } finally {
        client.release();
      }
    } catch (pgErr: any) {
      isPgConnected = false;
      console.warn(`[Store] PostgreSQL connection unavailable during startup (${pgErr.message}).`);
      if (process.env.NODE_ENV === 'production') {
        console.error('[Store] CRITICAL: Running in production but PostgreSQL is unreachable! Dynamic retry will be attempted on requests.');
      }
    }
  }
}

export async function readCol(col: string): Promise<unknown> {
  if (cache[col] !== undefined) return cache[col];

  // Try PostgreSQL if DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    try {
      const pgPool = await ensurePgPool();
      if (pgPool) {
        const res = await pgPool.query('SELECT data FROM store_data WHERE collection = $1', [col]);
        if (res.rows.length > 0) {
          const val = JSON.parse(res.rows[0].data);
          cache[col] = val;
          isPgConnected = true;
          return val;
        }
      }
    } catch (err: any) {
      console.warn(`[Store] PG read error for ${col}:`, err.message);
      
    }
  }

  // Try Firestore for durable persistence
  try {
    const fs = await initFirestore();
    if (fs) {
      const docSnap = await fs.collection('store_data').doc(col).get();
      if (docSnap.exists) {
        const val = docSnap.data().data;
        if (val !== undefined) {
          cache[col] = val;
          writeSqlite(col, val);
          return val;
        }
      }
    }
  } catch (err: any) {
    console.warn(`[Store] Firestore read error for ${col}:`, err.message);
  }

  // Fallback to SQLite (non-production only)
  if (true) {
    const localVal = readSqlite(col);
    if (localVal !== null && localVal !== undefined) {
      cache[col] = localVal;
      return localVal;
    }
  }

  const def = DEFAULTS[col] ?? [];
  cache[col] = def;
  return def;
}

export async function writeCol(col: string, data: unknown): Promise<void> {
  cache[col] = data;
  const jsonStr = JSON.stringify(data);

  // Write to local SQLite storage
  writeSqlite(col, data);

  // Write to PostgreSQL if DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    try {
      const pgPool = await ensurePgPool();
      if (pgPool) {
        await pgPool.query(
          'INSERT INTO store_data (collection, data) VALUES ($1, $2) ON CONFLICT (collection) DO UPDATE SET data = EXCLUDED.data',
          [col, jsonStr]
        );
        isPgConnected = true;
      }
    } catch (err: any) {
      console.warn(`[Store] PG write error for ${col}:`, err.message);
      
    }
  }

  // Write to Firestore for durable persistence
  try {
    const fs = await initFirestore();
    if (fs) {
      await fs.collection('store_data').doc(col).set({
        data,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err: any) {
    console.warn(`[Store] Firestore write error for ${col}:`, err.message);
  }
}

export async function readAll(): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const col of COLLECTIONS) {
    result[col] = await readCol(col);
  }
  return result;
}

export async function backupDatabase(targetPath: string): Promise<void> {
  try {
    copyFileSync(SQLITE_FILE, targetPath);
  } catch (err: any) {
    throw new Error(`Backup failed: ${err.message}`);
  }
}

export async function saveUploadedFile(filename: string, mimeType: string, buffer: Buffer): Promise<void> {
  // Save to SQLite
  try {
    const db = getSqlite();
    if (db) {
      const stmt = db.prepare(`
        INSERT INTO uploaded_files (filename, mime_type, data)
        VALUES (?, ?, ?)
        ON CONFLICT(filename) DO UPDATE SET mime_type = excluded.mime_type, data = excluded.data
      `);
      stmt.run(filename, mimeType, buffer);
    }
  } catch (err: any) {
    console.error('[Store] SQLite saveUploadedFile error:', err.message);
  }

  // Save to Postgres if DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    try {
      const pgPool = await ensurePgPool();
      if (pgPool) {
        await pgPool.query(
          'INSERT INTO uploaded_files (filename, mime_type, data) VALUES ($1, $2, $3) ON CONFLICT (filename) DO UPDATE SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data',
          [filename, mimeType, buffer]
        );
        isPgConnected = true;
      }
    } catch (err: any) {
      console.warn('[Store] PG saveUploadedFile error:', err.message);
      
    }
  }

  // Save to Firestore for durable persistence
  try {
    const fs = await initFirestore();
    if (fs) {
      const base64Data = buffer.toString('base64');
      await fs.collection('uploaded_files').doc(filename).set({
        mime_type: mimeType,
        data: base64Data,
        updatedAt: new Date().toISOString()
      });
      console.log(`[Store] Saved uploaded file ${filename} to Firestore.`);
    }
  } catch (err: any) {
    console.warn('[Store] Firestore saveUploadedFile error:', err.message);
  }
}

export async function getUploadedFile(filename: string): Promise<{ mime_type: string; data: Buffer } | null> {
  // Try Postgres if DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    try {
      const pgPool = await ensurePgPool();
      if (pgPool) {
        const res = await pgPool.query('SELECT mime_type, data FROM uploaded_files WHERE filename = $1', [filename]);
        if (res.rows.length > 0) {
          isPgConnected = true;
          return { mime_type: res.rows[0].mime_type, data: res.rows[0].data };
        }
      }
    } catch (err: any) {
      console.warn('[Store] PG getUploadedFile error:', err.message);
      
    }
  }

  // Try Firestore for durable persistence
  try {
    const fs = await initFirestore();
    if (fs) {
      const docSnap = await fs.collection('uploaded_files').doc(filename).get();
      if (docSnap.exists) {
        const docData = docSnap.data();
        if (docData && docData.data) {
          const mime_type = docData.mime_type;
          const data = Buffer.from(docData.data, 'base64');
          
          // Cache/sync back to local sqlite for high-speed subsequent server-side reads
          try {
            const db = getSqlite();
            if (db) {
              const stmt = db.prepare(`
                INSERT INTO uploaded_files (filename, mime_type, data)
                VALUES (?, ?, ?)
                ON CONFLICT(filename) DO UPDATE SET mime_type = excluded.mime_type, data = excluded.data
              `);
              stmt.run(filename, mime_type, data);
            }
          } catch {}

          return { mime_type, data };
        }
      }
    }
  } catch (err: any) {
    console.warn('[Store] Firestore getUploadedFile error:', err.message);
  }

  // Fallback to SQLite (non-production only)
  if (true) {
    try {
      const db = getSqlite();
      if (db) {
        const stmt = db.prepare('SELECT mime_type, data FROM uploaded_files WHERE filename = ?');
        const row = stmt.get(filename) as { mime_type: string; data: Buffer } | undefined;
        if (row) {
          return { mime_type: row.mime_type, data: row.data };
        }
      }
    } catch (err: any) {
      console.error('[Store] SQLite getUploadedFile error:', err.message);
    }
  }

  return null;
}

export async function deleteUploadedFile(filename: string): Promise<void> {
  try {
    const db = getSqlite();
    if (db) {
      db.prepare('DELETE FROM uploaded_files WHERE filename = ?').run(filename);
    }
  } catch {}

  if (process.env.DATABASE_URL) {
    try {
      const pgPool = await ensurePgPool();
      if (pgPool) {
        await pgPool.query('DELETE FROM uploaded_files WHERE filename = $1', [filename]);
        isPgConnected = true;
      }
    } catch (err: any) {
      
    }
  }

  // Delete from Firestore
  try {
    const fs = await initFirestore();
    if (fs) {
      await fs.collection('uploaded_files').doc(filename).delete();
      console.log(`[Store] Deleted uploaded file ${filename} from Firestore.`);
    }
  } catch (err: any) {
    console.warn('[Store] Firestore deleteUploadedFile error:', err.message);
  }
}

export async function saveMediaRecord(record: MediaRecord): Promise<void> {
  try {
    const db = getSqlite();
    if (db) {
      const stmt = db.prepare(`
        INSERT INTO image_metadata (
          id, url, storage_key, filename, mime_type, size, width, height, ratio, module, title, alt_text, caption, enabled, position, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          url = excluded.url, storage_key = excluded.storage_key, filename = excluded.filename, mime_type = excluded.mime_type,
          size = excluded.size, width = excluded.width, height = excluded.height, ratio = excluded.ratio, module = excluded.module,
          title = excluded.title, alt_text = excluded.alt_text, caption = excluded.caption, enabled = excluded.enabled,
          position = excluded.position, updated_at = excluded.updated_at
      `);
      stmt.run(
        record.id, record.url, record.storageKey, record.filename, record.mimeType,
        record.size, record.width ?? null, record.height ?? null, record.ratio ?? 'Original',
        record.module ?? 'General', record.title ?? record.filename, record.altText ?? '',
        record.caption ?? '', record.enabled ? 1 : 0, record.position ?? 0,
        record.createdAt, record.updatedAt
      );
    }
  } catch (err: any) {
    console.error('[Store] SQLite saveMediaRecord error:', err.message);
  }

  if (process.env.DATABASE_URL) {
    try {
      const pgPool = await ensurePgPool();
      if (pgPool) {
        await pgPool.query(
          `INSERT INTO image_metadata (
            id, url, storage_key, filename, mime_type, size, width, height, ratio, module, title, alt_text, caption, enabled, position, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO UPDATE SET
            url = EXCLUDED.url, storage_key = EXCLUDED.storage_key, filename = EXCLUDED.filename, mime_type = EXCLUDED.mime_type,
            size = EXCLUDED.size, width = EXCLUDED.width, height = EXCLUDED.height, ratio = EXCLUDED.ratio, module = EXCLUDED.module,
            title = EXCLUDED.title, alt_text = EXCLUDED.alt_text, caption = EXCLUDED.caption, enabled = EXCLUDED.enabled,
            position = EXCLUDED.position, updated_at = EXCLUDED.updated_at`,
          [
            record.id, record.url, record.storageKey, record.filename, record.mimeType,
            record.size, record.width ?? null, record.height ?? null, record.ratio ?? 'Original',
            record.module ?? 'General', record.title ?? record.filename, record.altText ?? '',
            record.caption ?? '', record.enabled ? true : false, record.position ?? 0,
            record.createdAt, record.updatedAt
          ]
        );
        isPgConnected = true;
      }
    } catch (err: any) {
      console.warn('[Store] PG saveMediaRecord error:', err.message);
      
    }
  }

  // Save to Firestore
  try {
    const fs = await initFirestore();
    if (fs) {
      await fs.collection('image_metadata').doc(record.id).set({
        url: record.url,
        storageKey: record.storageKey,
        filename: record.filename,
        mimeType: record.mimeType,
        size: record.size,
        width: record.width ?? null,
        height: record.height ?? null,
        ratio: record.ratio ?? 'Original',
        module: record.module ?? 'General',
        title: record.title ?? record.filename,
        altText: record.altText ?? '',
        caption: record.caption ?? '',
        enabled: record.enabled,
        position: record.position ?? 0,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      });
      console.log(`[Store] Saved media record ${record.id} to Firestore.`);
    }
  } catch (err: any) {
    console.warn('[Store] Firestore saveMediaRecord error:', err.message);
  }
}

export async function getAllMediaRecords(): Promise<MediaRecord[]> {
  if (process.env.DATABASE_URL) {
    try {
      const pgPool = await ensurePgPool();
      if (pgPool) {
        const res = await pgPool.query('SELECT * FROM image_metadata ORDER BY position ASC, created_at DESC');
        isPgConnected = true;
        return res.rows.map(r => ({
          id: r.id, url: r.url, storageKey: r.storage_key, filename: r.filename, mimeType: r.mime_type,
          size: Number(r.size), width: r.width ?? undefined, height: r.height ?? undefined, ratio: r.ratio ?? 'Original',
          module: r.module ?? 'General', title: r.title ?? '', altText: r.alt_text ?? '', caption: r.caption ?? '',
          enabled: Boolean(r.enabled), position: Number(r.position ?? 0), createdAt: r.created_at, updatedAt: r.updated_at
        }));
      }
    } catch (err: any) {
      console.warn('[Store] PG getAllMediaRecords error:', err.message);
      
    }
  }

  if (true) {
    try {
      const db = getSqlite();
      if (db) {
        const stmt = db.prepare('SELECT * FROM image_metadata ORDER BY position ASC, created_at DESC');
        const rows = stmt.all() as any[];
        return rows.map(r => ({
          id: r.id, url: r.url, storageKey: r.storage_key, filename: r.filename, mimeType: r.mime_type,
          size: Number(r.size), width: r.width ?? undefined, height: r.height ?? undefined, ratio: r.ratio ?? 'Original',
          module: r.module ?? 'General', title: r.title ?? '', altText: r.alt_text ?? '', caption: r.caption ?? '',
          enabled: Boolean(r.enabled), position: Number(r.position ?? 0), createdAt: r.created_at, updatedAt: r.updated_at
        }));
      }
    } catch (err: any) {
      console.error('[Store] SQLite getAllMediaRecords error:', err.message);
    }
  }
  return [];
}

export async function getMediaRecordById(id: string): Promise<MediaRecord | null> {
  if (process.env.DATABASE_URL) {
    try {
      const pgPool = await ensurePgPool();
      if (pgPool) {
        const res = await pgPool.query('SELECT * FROM image_metadata WHERE id = $1', [id]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          isPgConnected = true;
          return {
            id: r.id, url: r.url, storageKey: r.storage_key, filename: r.filename, mimeType: r.mime_type,
            size: Number(r.size), width: r.width ?? undefined, height: r.height ?? undefined, ratio: r.ratio ?? 'Original',
            module: r.module ?? 'General', title: r.title ?? '', altText: r.alt_text ?? '', caption: r.caption ?? '',
            enabled: Boolean(r.enabled), position: Number(r.position ?? 0), createdAt: r.created_at, updatedAt: r.updated_at
          };
        }
      }
    } catch (err: any) {
      console.warn('[Store] PG getMediaRecordById error:', err.message);
      
    }
  }

  if (true) {
    try {
      const db = getSqlite();
      if (db) {
        const stmt = db.prepare('SELECT * FROM image_metadata WHERE id = ?');
        const r = stmt.get(id) as any;
        if (r) {
          return {
            id: r.id, url: r.url, storageKey: r.storage_key, filename: r.filename, mimeType: r.mime_type,
            size: Number(r.size), width: r.width ?? undefined, height: r.height ?? undefined, ratio: r.ratio ?? 'Original',
            module: r.module ?? 'General', title: r.title ?? '', altText: r.alt_text ?? '', caption: r.caption ?? '',
            enabled: Boolean(r.enabled), position: Number(r.position ?? 0), createdAt: r.created_at, updatedAt: r.updated_at
          };
        }
      }
    } catch (err: any) {
      console.error('[Store] SQLite getMediaRecordById error:', err.message);
    }
  }

  return null;
}

export async function deleteMediaRecord(id: string): Promise<void> {
  try {
    const db = getSqlite();
    if (db) {
      db.prepare('DELETE FROM image_metadata WHERE id = ?').run(id);
    }
  } catch {}

  if (process.env.DATABASE_URL) {
    try {
      const pgPool = await ensurePgPool();
      if (pgPool) {
        await pgPool.query('DELETE FROM image_metadata WHERE id = $1', [id]);
        isPgConnected = true;
      }
    } catch (err: any) {
      
    }
  }

  // Delete from Firestore
  try {
    const fs = await initFirestore();
    if (fs) {
      await fs.collection('image_metadata').doc(id).delete();
      console.log(`[Store] Deleted media record ${id} from Firestore.`);
    }
  } catch (err: any) {
    console.warn('[Store] Firestore deleteMediaRecord error:', err.message);
  }
}

export function getDbConnectionStatus(): { isPgConnected: boolean; type: 'postgres' | 'sqlite'; databaseUrlConfigured: boolean } {
  return {
    isPgConnected: !!process.env.DATABASE_URL ? isPgConnected : false,
    type: (!!process.env.DATABASE_URL && isPgConnected) ? 'postgres' : 'sqlite',
    databaseUrlConfigured: !!process.env.DATABASE_URL
  };
}

export async function testDatabaseQuery(): Promise<{ success: boolean; latency: number; error?: string; engine: 'postgres' | 'sqlite' }> {
  const t0 = Date.now();
  if (process.env.DATABASE_URL) {
    try {
      const pgPool = await ensurePgPool();
      if (pgPool) {
        await pgPool.query('SELECT 1');
        isPgConnected = true;
        return { success: true, latency: Date.now() - t0, engine: 'postgres' };
      }
    } catch (err: any) {
      isPgConnected = false;
      return { success: false, latency: Date.now() - t0, error: err.message, engine: 'postgres' };
    }
  }

  try {
    const db = getSqlite();
    if (db) {
      db.prepare('SELECT 1').get();
      return { success: true, latency: Date.now() - t0, engine: 'sqlite' };
    }
    return { success: false, latency: Date.now() - t0, error: 'SQLite database connection unavailable', engine: 'sqlite' };
  } catch (err: any) {
    return { success: false, latency: Date.now() - t0, error: err.message, engine: 'sqlite' };
  }
}

