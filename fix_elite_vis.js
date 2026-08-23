const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/themes/EliteHomePage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const show = \(key: string\) => isFeatureActive\(features\.sections\?\.\[key\]\);/, `const show = (key: string) => isFeatureActive(features.sections?.[key]);\n  const showPage = (key: string) => isFeatureActive(features.pages?.[key]);`);

content = content.replace(/<EliteAchievements db=\{db\} \/>/g, "{showPage('hallOfFame') && <EliteAchievements db={db} />}");
content = content.replace(/\{show\('hero'\) && <EliteRecruitment db=\{db\} \/>\}/g, "{showPage('join') && <EliteRecruitment db={db} />}");
content = content.replace(/\{show\('games'\) && <EliteLiveStream db=\{db\} \/>\}/g, "{(showPage('live') || show('games')) && <EliteLiveStream db={db} />}");


fs.writeFileSync(file, content);
