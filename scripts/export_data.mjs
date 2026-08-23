import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Root directory (assuming script is in ./scripts)
const rootDir = path.join(__dirname, '..');

const dbDir = path.join(rootDir, 'artifacts', 'database');
const exportFile = path.join(rootDir, 'sbg_army_export.tar.gz');

console.log(`Starting export of local database and uploads...`);
console.log(`Source Directory: ${dbDir}`);
console.log(`Destination File: ${exportFile}`);

try {
  execSync(`tar -czf ${exportFile} -C ${dbDir} .`, { stdio: 'inherit' });
  console.log(`\n✅ Export successful!`);
  console.log(`Archive created at: ${exportFile}`);
  console.log(`You can now use the file explorer to right-click and download 'sbg_army_export.tar.gz'.`);
} catch (error) {
  console.error('❌ Failed to create archive:', error.message);
  process.exit(1);
}
