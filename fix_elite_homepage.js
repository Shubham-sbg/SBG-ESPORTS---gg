const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/themes/EliteHomePage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(file, content);
