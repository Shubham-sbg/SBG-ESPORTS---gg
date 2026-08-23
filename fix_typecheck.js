const fs = require('fs');

// 1. Fix database.ts
const dbFile = 'artifacts/sbg-army/src/lib/database.ts';
let dbContent = fs.readFileSync(dbFile, 'utf8');
dbContent = dbContent.replace(/if \(resolvedActiveTheme === 'royal'\) \{\n    resolvedActiveTheme = 'luxury_gold';\n  \}/g, '');
fs.writeFileSync(dbFile, dbContent);

// 2. Fix AdminDesignManager.tsx
const adminFile = 'artifacts/sbg-army/src/components/admin/AdminDesignManager.tsx';
let adminContent = fs.readFileSync(adminFile, 'utf8');
adminContent = adminContent.replace(/'royal'/g, "'luxury_gold'");
adminContent = adminContent.replace(/"royal"/g, '"luxury_gold"');
fs.writeFileSync(adminFile, adminContent);

// 3. Fix EliteHomePage.tsx props
const eliteFile = 'artifacts/sbg-army/src/components/themes/EliteHomePage.tsx';
let eliteContent = fs.readFileSync(eliteFile, 'utf8');
eliteContent = eliteContent.replace(/<AnnouncementBar settings=\{db\.settings || \{\} as any\} \/>/g, '<AnnouncementBar settings={db.settings as any} />');
eliteContent = eliteContent.replace(/<Navbar settings=\{db\.settings \|\| \{\} as any\} navigation=\{db\.navigation \|\| \{\} as any\} \/>/g, '<Navbar settings={db.settings as any} navigation={db.navigation as any} />');
eliteContent = eliteContent.replace(/<Footer settings=\{db\.settings \|\| \{\} as any\} navigation=\{db\.navigation \|\| \{\} as any\} \/>/g, '<Footer settings={db.settings as any} navigation={db.navigation as any} />');
fs.writeFileSync(eliteFile, eliteContent);

