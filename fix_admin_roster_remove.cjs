const fs = require('fs');
let content = fs.readFileSync('artifacts/sbg-army/src/components/admin/AdminRoster.tsx', 'utf8');
content = content.replace(/const handleImageUpload = async [\s\S]*?reader\.readAsDataURL\(file\);\s*\};/g, '');
fs.writeFileSync('artifacts/sbg-army/src/components/admin/AdminRoster.tsx', content);
