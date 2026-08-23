const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('artifacts/sbg-army/src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace (import.meta.env.VITE_API_URL || "") with (import.meta.env.VITE_API_URL || "https://sbg-esportsgg.onrender.com")
    content = content.replace(/\(import\.meta\.env\.VITE_API_URL \|\| ""\)/g, '(import.meta.env.VITE_API_URL || "https://sbg-esportsgg.onrender.com")');
    content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL \|\| ""\}/g, '${import.meta.env.VITE_API_URL || "https://sbg-esportsgg.onrender.com"}');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
