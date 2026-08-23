const fs = require('fs');
const path = require('path');

const srcDir = path.join('artifacts', 'sbg-army', 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace literal string 'SBG ARMY' in JSX with {db.settings.organizationName || 'SBG ARMY'}
  // Only if db is available in the file
  if (content.includes('useDatabase()') || content.includes('db.')) {
    // Replace text nodes like >SBG ARMY<
    const jsxRegex = />\s*SBG ARMY\s*</g;
    if (jsxRegex.test(content)) {
      content = content.replace(jsxRegex, '>{db.settings.organizationName || "SBG ARMY"}<');
      changed = true;
    }
    
    // Replace "SBG ARMY" inside template literals or string properties if safe
    // We will do a generic replacement if it's safe
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated name in ${file}`);
  }
}
