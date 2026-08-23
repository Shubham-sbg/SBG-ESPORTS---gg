const fs = require('fs');
const path = require('path');

const apiServerSrc = path.join('artifacts', 'api-server', 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk(apiServerSrc);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('readCol') || content.includes('writeCol') || content.includes('readAll') || content.includes('initStore')) {
    // We will skip store.ts, we will overwrite it manually
    if (file.endsWith('store.ts')) continue;

    // Convert router callbacks to async
    content = content.replace(/router\.(get|post|put|delete|patch)\(([^,]+),\s*(require[^,]*,)?\s*\(([^)]+)\)\s*=>\s*\{/g, (match, method, path, middleware, args) => {
      changed = true;
      return `router.${method}(${path}, ${middleware ? middleware : ''} async (${args}) => {`;
    });
    
    // app.get/app.post
    content = content.replace(/app\.(get|post|put|delete|patch)\(([^,]+),\s*(require[^,]*,)?\s*\(([^)]+)\)\s*=>\s*\{/g, (match, method, path, middleware, args) => {
      changed = true;
      return `app.${method}(${path}, ${middleware ? middleware : ''} async (${args}) => {`;
    });

    // Replace readCol(...) with await readCol(...)
    content = content.replace(/readCol\(/g, 'await readCol(');
    content = content.replace(/writeCol\(/g, 'await writeCol(');
    content = content.replace(/readAll\(/g, 'await readAll(');
    content = content.replace(/initStore\(/g, 'await initStore(');
    
    if (changed || content.includes('await readCol') || content.includes('await writeCol')) {
      fs.writeFileSync(file, content);
      console.log(`Refactored ${file}`);
    }
  }
}
