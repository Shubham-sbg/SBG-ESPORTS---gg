const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/themes/EliteHomePage.tsx';
let content = fs.readFileSync(file, 'utf8');

// The EliteHero doesn't receive db, so we need to pass it or check features.
// Let's pass db to EliteHero
content = content.replace(/\{show\('hero'\) && <EliteHero \/>\}/g, "{show('hero') && <EliteHero db={db} />}");

const oldHero = `function EliteHero() {`;
const newHero = `function EliteHero({ db }: any) {
  const pages = db?.features?.pages || {};
  const isFeatureActive = (cfg: any) => {
    if (cfg === undefined) return true;
    if (typeof cfg === 'boolean') return cfg;
    return cfg.state !== 'hidden';
  };
`;

content = content.replace(/function EliteHero\(\) \{/g, newHero);

const oldLinks = `<motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }} className="flex flex-wrap justify-center gap-4">
            <Link href="/join">
              <a className="group relative px-8 py-4 bg-[#d4af37] text-black font-black uppercase tracking-widest text-sm overflow-hidden flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <span className="relative z-10">Join Team</span>
                <span className="relative z-10">↗</span>
              </a>
            </Link>
            <Link href="/matches">
              <a className="group px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#d4af37]/50 text-white font-black uppercase tracking-widest text-sm transition-all hover:bg-white/10 hover:scale-105 active:scale-95">
                Watch Matches
              </a>
            </Link>
          </motion.div>`;

const newLinks = `<motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }} className="flex flex-wrap justify-center gap-4">
            {isFeatureActive(pages.join) && (
              <Link href="/join">
                <a className="group relative px-8 py-4 bg-[#d4af37] text-black font-black uppercase tracking-widest text-sm overflow-hidden flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                  <span className="relative z-10">Join Team</span>
                  <span className="relative z-10">↗</span>
                </a>
              </Link>
            )}
            {isFeatureActive(pages.matches) && (
              <Link href="/matches">
                <a className="group px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#d4af37]/50 text-white font-black uppercase tracking-widest text-sm transition-all hover:bg-white/10 hover:scale-105 active:scale-95">
                  Watch Matches
                </a>
              </Link>
            )}
            {(!isFeatureActive(pages.join) && !isFeatureActive(pages.matches) && isFeatureActive(pages.playerPortal)) && (
              <Link href="/player-login">
                <a className="group px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#d4af37]/50 text-white font-black uppercase tracking-widest text-sm transition-all hover:bg-white/10 hover:scale-105 active:scale-95">
                  Player Login
                </a>
              </Link>
            )}
          </motion.div>`;

content = content.replace(oldLinks, newLinks);

fs.writeFileSync(file, content);
