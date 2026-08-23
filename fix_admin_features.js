const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/admin/AdminFeatures.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add error state
if (!content.includes('const [error, setError]')) {
  content = content.replace('const [saved, setSaved] = useState(false);', 'const [saved, setSaved] = useState(false);\n  const [error, setError] = useState<string | null>(null);');
}

// Modify handleSave
const oldSave = `  const handleSave = async () => {
    const db = getDB() as any;
    db.features = features;
    if (!db.navigation) db.navigation = { items: [], shortcuts: [] };
    db.navigation.shortcuts = shortcuts;
    await saveDB(db);
    onRefresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };`;

const newSave = `  const handleSave = async () => {
    try {
      setError(null);
      const db = getDB() as any;
      db.features = features;
      if (!db.navigation) db.navigation = { items: [], shortcuts: [] };
      db.navigation.shortcuts = shortcuts;
      await saveDB(db);
      onRefresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save feature configurations.");
    }
  };`;

content = content.replace(oldSave, newSave);

// Add error display near save button
const errorDisplay = `
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
`;

content = content.replace(/<div className="flex items-center gap-3">[\s\S]*?<button[\s\S]*?onClick=\{handleSave\}/, (match) => {
  return `{error && (
        <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}\n      ` + match;
});

fs.writeFileSync(file, content);
