const fs = require('fs');
const file = 'artifacts/sbg-army/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('isFeatureActive')) {
  content = content.replace('import { getDB } from "@/lib/database";', 'import { getDB, isFeatureActive } from "@/lib/database";');
  content = content.replace('if (pages[pageKey] === false) return <Redirect to="/" />;', 'if (!isFeatureActive(pages[pageKey])) return <Redirect to="/" />;');
  fs.writeFileSync(file, content);
}
