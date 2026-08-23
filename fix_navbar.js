const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getDB')) {
  content = content.replace('import { Link, useLocation } from "wouter";', 'import { Link, useLocation } from "wouter";\nimport { getDB, isFeatureActive } from "@/lib/database";');
}

const mapLogic = `
  const db = getDB() as any;
  const pages = db?.features?.pages || {};
  
  const isNavItemActive = (href: string) => {
    // Map href to pageKey
    let key = href.replace('/', '');
    if (key === '') return true; // Home is always active
    if (key.includes('#')) return true; // Anchor links are active
    
    // Check specific aliases
    if (key === 'join-team') key = 'join';
    if (key === 'player-login' || key === 'player-register' || key === 'player-dashboard') key = 'playerPortal';
    
    // If the key exists in features, check it
    if (pages[key] !== undefined) {
      return isFeatureActive(pages[key]);
    }
    return true; // default
  };

  const visibleItems = (navigation?.items || []).filter(i => i.visible && isNavItemActive(i.href));
  const navItems = visibleItems.length > 0
    ? visibleItems.map(i => ({ label: i.label, href: i.href.startsWith('#') ? \`/\${i.href}\` : i.href }))
    : PRIMARY_NAV.filter(i => isNavItemActive(i.href));
`;

content = content.replace(/const visibleItems = \(navigation\?\.items \|\| \[\]\)\.filter\(i => i\.visible\);\s*const navItems = visibleItems\.length > 0\s*\? visibleItems\.map\(i => \(\{ label: i\.label, href: i\.href\.startsWith\('#'\) \? \`\/\$\{i\.href\}\` : i\.href \}\)\)\s*: PRIMARY_NAV;/g, mapLogic);

fs.writeFileSync(file, content);
