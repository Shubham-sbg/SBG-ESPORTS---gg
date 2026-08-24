import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distFile = path.resolve(__dirname, "dist/index.mjs");

if (!existsSync(distFile)) {
  console.log("[api-server] dist/index.mjs not found, running build first...");
  await import("./build.mjs");
}

await import(distFile);
