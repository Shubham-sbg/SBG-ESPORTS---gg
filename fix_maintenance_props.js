const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/themes/EliteHomePage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/if \(!db\) return <MaintenanceScreen \/>;/g, 'if (!db) return <MaintenanceScreen settings={{} as any} />;');
content = content.replace(/if \(settings\.maintenanceMode\) return <MaintenanceScreen \/>;/g, 'if (settings.maintenanceMode) return <MaintenanceScreen settings={settings as any} />;');

fs.writeFileSync(file, content);
