const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/RecruitmentPopup.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const timer = setTimeout\(\(\) => setIsOpen\(true\), 1200\);\s*return \(\) => clearTimeout\(timer\);/g, 'setTimeout(() => setIsOpen(true), 1200);');
fs.writeFileSync(file, content);
