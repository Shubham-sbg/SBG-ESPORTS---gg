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
  if (file.endsWith('store.ts')) continue;
  
  let changed = false;
  content = content.replace(/saveUploadedFile\(/g, 'await saveUploadedFile(');
  content = content.replace(/getUploadedFile\(/g, 'await getUploadedFile(');
  content = content.replace(/deleteUploadedFile\(/g, 'await deleteUploadedFile(');
  content = content.replace(/saveMediaRecord\(/g, 'await saveMediaRecord(');
  content = content.replace(/getAllMediaRecords\(/g, 'await getAllMediaRecords(');
  content = content.replace(/getMediaRecordById\(/g, 'await getMediaRecordById(');
  content = content.replace(/deleteMediaRecord\(/g, 'await deleteMediaRecord(');
  content = content.replace(/backupDatabase\(/g, 'await backupDatabase(');

  if (content.includes('await saveUploadedFile') || content.includes('await getAllMediaRecords')) {
    fs.writeFileSync(file, content);
    console.log(`Refactored 2 ${file}`);
  }
}
