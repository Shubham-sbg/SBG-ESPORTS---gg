const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/Footer.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getDB')) {
  content = content.replace('import { Link } from "wouter";', 'import { Link } from "wouter";\nimport { getDB, isFeatureActive } from "@/lib/database";');
}

const mapLogic = `
  const db = getDB() as any;
  const pages = db?.features?.pages || {};
  
  const isNavItemActive = (href: string) => {
    let key = href.replace('/', '');
    if (key === '') return true;
    if (key.includes('#')) return true;
    if (key === 'join-team') key = 'join';
    if (key === 'player-login' || key === 'player-register' || key === 'player-dashboard') key = 'playerPortal';
    
    if (pages[key] !== undefined) {
      return isFeatureActive(pages[key]);
    }
    return true;
  };

  const visibleItems = (navigation?.items || []).filter(i => i.visible && isNavItemActive(i.href));
  const navLinks = visibleItems.length > 0
    ? visibleItems.map(i => ({ label: i.label, href: i.href.startsWith('#') ? \`/\${i.href}\` : i.href }))
    : DEFAULT_LINKS.filter(i => isNavItemActive(i.href));
    
  const expLinks = DEFAULT_EXPLORE_LINKS.filter(i => isNavItemActive(i.href));
`;

content = content.replace(/const visibleItems = \(navigation\?\.items \|\| \[\]\)\.filter\(i => i\.visible\);\s*const navLinks = visibleItems\.length > 0\s*\? visibleItems\.map\(i => \(\{ label: i\.label, href: i\.href\.startsWith\('#'\) \? \`\/\$\{i\.href\}\` : i\.href \}\)\)\s*: DEFAULT_LINKS;/g, mapLogic);

// Replace mapping of DEFAULT_EXPLORE_LINKS
content = content.replace(/DEFAULT_EXPLORE_LINKS\.map/g, 'expLinks.map');

fs.writeFileSync(file, content);
