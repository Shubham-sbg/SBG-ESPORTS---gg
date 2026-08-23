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
    
    // Reverse the previous broken replace
    content = content.replace(/fetch\(\(import\.meta\.env\.VITE_API_URL \|\| ""\) \+ "\/api\//g, 'fetch(\'/api/');
    
    // Now apply correctly
    content = content.replace(/fetch\(\s*(['"])\/api\/(.*?)(\1)/g, 'fetch((import.meta.env.VITE_API_URL || "") + $1/api/$2$1');
    content = content.replace(/fetch\(\s*`\/api\/(.*?)`/g, 'fetch(`${import.meta.env.VITE_API_URL || ""}/api/$1`');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
