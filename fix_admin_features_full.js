const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/admin/AdminFeatures.tsx';
let content = fs.readFileSync(file, 'utf8');

// The file was corrupted, let's fix it manually by inserting the missing function declaration
content = content.replace(/\} \{/, '} \n\nexport default function AdminFeatures({ onRefresh }: { onRefresh: () => void }) {');

fs.writeFileSync(file, content);
