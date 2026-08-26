const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Don't import if not needed
  let needsImport = false;

  // find src={variable}
  content = content.replace(/src=\{([a-zA-Z0-9_\.\?\s]+)\}/g, (match, p1) => {
    // skip if it's already using getImageUrl
    if (p1.includes('getImageUrl') || p1.includes('apiUrl(') || p1.includes('URL.createObjectURL')) return match;
    // skip string literals
    if (p1.startsWith("'") || p1.startsWith('"') || p1.startsWith('`')) return match;
    
    needsImport = true;
    return `src={getImageUrl(${p1})}`;
  });

  // find src={condition ? a : b}
  content = content.replace(/src=\{([^?]+)\s*\?\s*([^:]+)\s*:\s*([^}]+)\}/g, (match, cond, a, b) => {
    if (match.includes('getImageUrl') || match.includes('apiUrl(')) return match;
    needsImport = true;
    return `src={${cond} ? getImageUrl(${a}) : getImageUrl(${b})}`;
  });

  // find backgroundImage: `url(${variable})`
  content = content.replace(/backgroundImage:\s*`url\(\$\{([a-zA-Z0-9_\.\?\s]+)\}\)`/g, (match, p1) => {
    if (p1.includes('getImageUrl') || p1.includes('apiUrl(')) return match;
    needsImport = true;
    return `backgroundImage: \`url(\${getImageUrl(${p1})})\``;
  });

  if (needsImport && content !== original) {
    if (!content.includes("import { getImageUrl }")) {
      content = "import { getImageUrl } from '@/lib/imageResolver';\n" + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir('artifacts/sbg-army/src/components');
walkDir('artifacts/sbg-army/src/pages');
