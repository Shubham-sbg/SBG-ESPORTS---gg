import fs from 'fs';

let content = fs.readFileSync('artifacts/sbg-army/src/lib/themeBranding.ts', 'utf8');

content = content.replace(/import \{ Settings \} from '\.\/database';/, `import { Settings } from './database';\nimport { PUBLIC_BRAND_NAME } from './brandConfig';`);

// In `resolveThemeBranding`:
//  let brandName = 'SBG ARMY';
//  if (isClassicEsports) {
//    brandName = 'SBG ESPORTS';
//  } else if (isClassicArmy) {
//    brandName = 'SBG ARMY';
//  } else if (base.organizationName) {
//    brandName = base.organizationName;
//  } else {
//    brandName = 'SBG ESPORTS';
//  }

content = content.replace(/let brandName = 'SBG ARMY';/g, "let brandName = PUBLIC_BRAND_NAME;");
content = content.replace(/brandName = 'SBG ARMY';/g, "brandName = PUBLIC_BRAND_NAME;");
content = content.replace(/brandName = 'SBG ESPORTS';/g, "brandName = PUBLIC_BRAND_NAME;");

fs.writeFileSync('artifacts/sbg-army/src/lib/themeBranding.ts', content);
