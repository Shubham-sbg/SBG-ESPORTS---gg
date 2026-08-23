const fs = require('fs');
const file = 'artifacts/sbg-army/src/lib/database.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/if \(resolvedActiveTheme === \('luxury_gold' as any\)\) \{\n    resolvedActiveTheme = 'royal';\n  \}/, "if (resolvedActiveTheme === 'royal') {\n    resolvedActiveTheme = 'luxury_gold';\n  }");

fs.writeFileSync(file, content);
