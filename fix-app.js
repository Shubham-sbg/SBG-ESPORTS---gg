const fs = require('fs');
const file = 'artifacts/sbg-army/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('document.title =')) {
  const effect = `
  useEffect(() => {
    if (db?.settings?.organizationName) {
      document.title = db.settings.organizationName + ' — Official Esports Organization';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', db.settings.organizationName + ' is a professional esports organization.');
      }
    }
  }, [db?.settings?.organizationName]);
`;
  content = content.replace(/function App\(\) \{/, 'function App() {\n' + effect);
  fs.writeFileSync(file, content);
}
