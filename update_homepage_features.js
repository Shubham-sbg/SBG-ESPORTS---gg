const fs = require('fs');
const file = 'artifacts/sbg-army/src/pages/HomePage.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('isFeatureActive')) {
  content = content.replace('import { getDB } from "@/lib/database";', 'import { getDB, isFeatureActive } from "@/lib/database";');
  content = content.replace('const show = (key: string) => sec[key] !== false;', 'const show = (key: string) => isFeatureActive(sec[key]);');
  fs.writeFileSync(file, content);
}
