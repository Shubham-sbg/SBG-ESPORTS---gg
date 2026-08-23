const fs = require('fs');
const file = 'artifacts/sbg-army/src/lib/database.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /metaDescription\?: string;\n  analyticsId\?: string;/,
  'metaDescription?: string;\n  analyticsId?: string;\n  recruitmentPopupTitle?: string;\n  recruitmentPopupSubtitle?: string;\n  recruitmentPopupText?: string;'
);
fs.writeFileSync(file, content);
