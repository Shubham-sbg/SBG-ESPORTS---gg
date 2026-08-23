import fs from 'fs';
import { execSync } from 'child_process';

const files = execSync('grep -rnl "SBG ARMY" artifacts/sbg-army/src/').toString().trim().split('\n');

for (const file of files) {
  if (file.includes('themeBranding.ts')) continue;
  if (file.includes('brandConfig.ts')) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  let isAdmin = file.includes('/admin/') || file.includes('Staff') || file.includes('AdminSetup');
  let brandVar = isAdmin ? 'ADMIN_BRAND_NAME' : 'PUBLIC_BRAND_NAME';

  // We want to replace SBG ARMY with the variable.
  // 1. `... SBG ARMY ...` (template literals)
  // 2. '... SBG ARMY ...' or "... SBG ARMY ..." (string literals)
  // 3. >... SBG ARMY ...< (JSX text nodes)

  // It's actually safer to just replace 'SBG ARMY' and "SBG ARMY" (exact matches) with brandVar.
  content = content.replace(/'SBG ARMY'/g, brandVar);
  content = content.replace(/"SBG ARMY"/g, brandVar);

  // Replace inside template literals, e.g. `Welcome to SBG ARMY` -> `Welcome to ${brandVar}`
  content = content.replace(/`([^`]*)SBG ARMY([^`]*)`/g, '`$1${' + brandVar + '}$2`');
  // Need to handle multiple in one template literal if it happens? Let's just do a while loop.
  let prev;
  do {
    prev = content;
    content = content.replace(/`([^`]*?)SBG ARMY([^`]*?)`/g, '`$1${' + brandVar + '}$2`');
  } while (prev !== content);
  
  // Replace in JSX text: e.g. >Welcome to SBG ARMY< -> >Welcome to {brandVar}<
  do {
    prev = content;
    content = content.replace(/>([^<]*?)SBG ARMY([^<]*?)</g, '>$1{' + brandVar + '}$2<');
  } while (prev !== content);
  
  // What if it's inside a comment?
  content = content.replace(/\/\/.*SBG ARMY.*/g, (match) => match.replace(/SBG ARMY/g, brandVar + ' (ref)'));

  // What if it's inside an object key or something? Unlikely, but let's check.
  
  if (content !== original) {
    // Add import if not present
    if (!content.includes(`import { ${brandVar} }`)) {
      // Find last import
      let lines = content.split('\n');
      let lastImportIdx = -1;
      for (let i=0; i<lines.length; i++) {
        if (lines[i].startsWith('import ')) lastImportIdx = i;
      }
      
      let importStr = `import { ${brandVar} } from '@/lib/brandConfig';`;
      if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, importStr);
      } else {
        lines.unshift(importStr);
      }
      content = lines.join('\n');
    }
    fs.writeFileSync(file, content);
  }
}
console.log('Done');
