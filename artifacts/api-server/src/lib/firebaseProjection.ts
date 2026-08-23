import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

let adminApp: admin.app.App | null = null;
let firestoreDb: any = null;

export const firestoreHealth = {
  connected: false,
  lastSync: null as string | null,
  lastWrite: null as string | null,
  lastError: null as string | null,
  databaseId: "ai-studio-sbgarmygg-50d61416-99c8-4021-beb1-783af9dce49c",
  projectId: "sbg-army-web",
};

// Lazy initialization of Firebase Admin SDK
export async function getFirestoreInstance() {
  if (firestoreDb) return firestoreDb;

  try {
    // 1. Attempt to fetch service account JSON
    let serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountStr && process.env.DATABASE_URL) {
      // Fallback to database query if env is missing
      const rows = await db
        .select()
        .from(siteSettingsTable)
        .where(eq(siteSettingsTable.key, "firebase.serviceAccount"));
      if (rows.length > 0 && rows[0].value) {
        serviceAccountStr = rows[0].value;
      }
    }

    if (!serviceAccountStr) {
      throw new Error("No Firebase Service Account credentials found. Please save them in Settings.");
    }

    const serviceAccount = JSON.parse(serviceAccountStr);

    // 2. Fetch Project ID and Database ID dynamically
    let databaseId = firestoreHealth.databaseId;
    let projId = "sbg-army-web";
    if (process.env.DATABASE_URL) {
      const dbIdRows = await db
        .select()
        .from(siteSettingsTable)
        .where(eq(siteSettingsTable.key, "firebase.projectId"));
      if (dbIdRows.length > 0 && dbIdRows[0].value) {
        projId = dbIdRows[0].value;
      }
    }

    // Initialize Admin App
    if (!admin.apps.length) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projId,
      });
    } else {
      adminApp = admin.apps[0]!;
    }

    // Initialize Firestore with the correct Database ID
    firestoreDb = getFirestore(adminApp, databaseId);
    firestoreHealth.connected = true;
    firestoreHealth.lastError = null;
    return firestoreDb;
  } catch (err: any) {
    firestoreHealth.connected = false;
    firestoreHealth.lastError = err.message || String(err);
    console.error("[Firestore Projection] Initialization failed:", err.message);
    return null;
  }
}

/**
 * Perform a safe, asynchronous background projection write of a key-value pair or object
 */
export async function projectToFirestore(collectionName: string, docId: string, data: any) {
  try {
    const fs = await getFirestoreInstance();
    if (!fs) {
      console.warn(`[Firestore Projection] Skipped sync for ${collectionName}/${docId} - Firestore not initialized`);
      return false;
    }

    const docRef = fs.collection(collectionName).doc(docId);
    await docRef.set({
      ...data,
      projectedAt: new Date().toISOString(),
    }, { merge: true });

    firestoreHealth.lastWrite = `${collectionName}/${docId}`;
    firestoreHealth.lastSync = new Date().toISOString();
    firestoreHealth.lastError = null;
    console.log(`[Firestore Projection] Successfully synced ${collectionName}/${docId}`);
    return true;
  } catch (err: any) {
    firestoreHealth.lastError = `Write failed to ${collectionName}/${docId}: ${err.message}`;
    console.error(`[Firestore Projection] Failed to sync ${collectionName}/${docId}:`, err.message);
    return false;
  }
}

/**
 * Synchronize all system settings to Firestore to ensure eventual consistency
 */
export async function syncAllSettingsToFirestore() {
  if (!process.env.DATABASE_URL) {
    return false;
  }
  try {
    const rows = await db.select().from(siteSettingsTable);
    const grouped: Record<string, any> = {};

    for (const r of rows) {
      if (!grouped[r.section]) grouped[r.section] = {};
      const keySuffix = r.key.includes(".") ? r.key.split(".").slice(1).join(".") : r.key;
      grouped[r.section][keySuffix] = r.value;
    }

    let successCount = 0;
    for (const section of Object.keys(grouped)) {
      const data = grouped[section];
      const ok = await projectToFirestore("site_settings", section, data);
      if (ok) successCount++;
    }

    console.log(`[Firestore Projection] Full settings sync completed. Synced ${successCount} sections.`);
    return true;
  } catch (err: any) {
    console.warn("[Firestore Projection] Settings sync skipped (Postgres database unavailable):", err.message);
    return false;
  }
}
