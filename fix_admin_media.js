const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/admin/AdminMediaManager.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const getAuthHeader = \(\) => \{/g, 'const getAuthHeader = (): Record<string, string> => {');
fs.writeFileSync(file, content);
