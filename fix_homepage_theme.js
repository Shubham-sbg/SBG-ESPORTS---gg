const fs = require('fs');
const file = 'artifacts/sbg-army/src/pages/HomePage.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('EliteHomePage')) {
  content = content.replace("import GoldLegacyHomePage from '@/components/themes/GoldLegacyHomePage';", "import GoldLegacyHomePage from '@/components/themes/GoldLegacyHomePage';\nimport EliteHomePage from '@/components/themes/EliteHomePage';");
  
  const eliteLogic = `
  if (activeTheme === 'elite') {
    return (
      <ThemeErrorBoundary fallback={<ClassicHomePage db={db} />}>
        <EliteHomePage />
      </ThemeErrorBoundary>
    );
  }
`;

  content = content.replace("return <ClassicHomePage db={db} />;", eliteLogic + "\n  return <ClassicHomePage db={db} />;");
  
  fs.writeFileSync(file, content);
}
