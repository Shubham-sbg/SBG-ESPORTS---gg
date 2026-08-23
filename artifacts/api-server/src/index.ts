import http from 'http';
import { execSync } from 'child_process';
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { createWsServer } from "./lib/wsServer.js";
import { initStore } from "./lib/store.js";
import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { syncAllSettingsToFirestore } from "./lib/firebaseProjection.js";

// In production (Cloud Run / Docker / Render), API server runs on PORT
// In development, Vite runs on port 3000 and proxies /api to port 8081
const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER;
const port = isProduction
  ? Number(process.env.PORT || 3000)
  : Number(process.env.API_PORT || 8081);

// In dev mode only, attempt to clear stuck port if needed
if (!isProduction) {
  try {
    execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: 'ignore' });
  } catch {
    // Ignore
  }
}

await initStore();

// Seed Firebase Settings if database is available
if (process.env.DATABASE_URL) {
  try {
    const firebaseSeeds = [
      { key: "firebase.apiKey", value: "AIzaSyCHK4ouFw9nhsF5lghesyD3D7jSKJgiagY", label: "API Key", type: "string" },
      { key: "firebase.authDomain", value: "sbg-army-web.firebaseapp.com", label: "Auth Domain", type: "string" },
      { key: "firebase.projectId", value: "sbg-army-web", label: "Project ID", type: "string" },
      { key: "firebase.storageBucket", value: "sbg-army-web.firebasestorage.app", label: "Storage Bucket", type: "string" },
      { key: "firebase.messagingSenderId", value: "974016641231", label: "Messaging Sender ID", type: "string" },
      { key: "firebase.appId", value: "1:974016641231:web:3bad85725e809dd2111fba", label: "App ID", type: "string" },
      { key: "firebase.measurementId", value: "G-XXB70ZDNCW", label: "Measurement ID", type: "string" },
      { key: "firebase.serviceAccount", value: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}", label: "Service Account JSON", type: "password" }
    ];

    for (const s of firebaseSeeds) {
      const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, s.key));
      if (existing.length > 0) {
        // Keep existing settings if already populated
      } else {
        await db.insert(siteSettingsTable).values({
          key: s.key,
          value: s.value,
          section: "firebase",
          label: s.label,
          type: s.type
        });
      }
    }
    logger.info("Firebase settings seeded successfully");
  } catch (e: any) {
    logger.warn(`Skipping Postgres Firebase settings seed (Postgres database unavailable: ${e.message})`);
  }
}

const server = http.createServer(app);
createWsServer(server);

// Graceful shutdown helpers
function shutdown() {
  logger.info("Received kill signal, shutting down gracefully");
  server.close(() => {
    logger.info("Closed out remaining connections");
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE" && process.env.NODE_ENV !== "production" && port !== 3000 && port !== 8080) {
    logger.warn({ port }, `Port ${port} in use, attempting to clear process...`);
    try {
      execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: 'ignore' });
      setTimeout(() => {
        server.listen(port, "0.0.0.0");
      }, 1000);
    } catch (killErr) {
      logger.error({ killErr }, "Failed to clear port");
      process.exit(1);
    }
  } else {
    logger.error({ err }, "Server listening error");
    process.exit(1);
  }
});

server.listen(port, "0.0.0.0", () => {
  logger.info({ port, host: "0.0.0.0" }, "Server listening (HTTP + WebSocket)");
  
  // Asynchronously trigger automatic full database sync to Firestore on startup
  syncAllSettingsToFirestore().catch((err) => {
    logger.error({ err }, "Initial Firestore projection synchronization failed on startup");
  });
});

