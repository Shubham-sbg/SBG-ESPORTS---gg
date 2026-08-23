import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distFile = path.resolve(__dirname, "dist/index.mjs");

await import(distFile);
