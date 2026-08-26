const fs = require('fs');

const files = [
  'artifacts/sbg-army/src/components/themes/EliteHomePage.tsx',
  'artifacts/sbg-army/src/components/themes/ChampionsHomePage.tsx',
  'artifacts/sbg-army/src/components/themes/ProArenaHomePage.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('AdsRenderer')) {
    content = content.replace("import Navbar from '@/components/Navbar';", "import Navbar from '@/components/Navbar';\nimport AdsRenderer from '@/components/AdsRenderer';");
    content = content.replace("<Navbar ", "{isPlacementActive(db, 'ads') && <AdsRenderer ads={db.ads || []} />}\n      <Navbar ");
    fs.writeFileSync(file, content);
  }
}
