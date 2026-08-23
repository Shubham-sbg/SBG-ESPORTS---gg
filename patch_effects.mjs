import fs from 'fs';
const file = 'artifacts/sbg-army/src/components/SiteEffects.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `      // 2. Standard meta
      setMeta('description', s.metaDescription ?? '');
      setMeta('keywords', (s as any).seoKeywords ?? '');`;

const replacement = `      // 2. Standard meta
      setMeta('description', s.metaDescription ?? '');
      setMeta('keywords', (s as any).seoKeywords ?? '');
      
      // Google Search Console Meta
      if ((s as any).gscVerification) {
        setMeta('google-site-verification', (s as any).gscVerification);
      }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
