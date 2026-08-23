const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/admin/AdminDesignManager.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/royal: 'Royal Gold Luxury',/, "luxury_gold: 'Royal Gold Luxury',\n  elite: 'SBG ARMY Elite Design',");

// Let's add the card for elite
const eliteCard = `          {/* SBG ARMY Elite Design Card */}
          <div
            onClick={() => setSelectedTheme('elite')}
            className={\`cursor-pointer rounded-2xl p-5 border transition-all relative flex flex-col justify-between \${
              selectedTheme === 'elite'
                ? 'border-[#d4af37] bg-[rgba(212,175,55,0.05)] shadow-[0_0_20px_rgba(212,175,55,0.15)] scale-[1.02]'
                : 'border-white/10 bg-white/5 hover:border-white/30'
            }\`}
          >
            {activeTheme === 'elite' && (
              <div className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> LIVE
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-black to-zinc-900 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                  👑
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">SBG ARMY ELITE</h4>
                  <p className="text-[10px] text-[#d4af37]">Cinematic Premium Esports Design</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                Completely original, premium cinematic esports aesthetic. Features dark charcoal/black backgrounds, premium metallic gold accents, glassmorphism, HUD elements, and smooth scroll-triggered animations.
              </p>
            </div>
            
            <div className="flex gap-2">
              <span className="text-[9px] px-2 py-1 rounded bg-black/40 border border-white/5 text-gray-300">Glassmorphism</span>
              <span className="text-[9px] px-2 py-1 rounded bg-black/40 border border-white/5 text-gray-300">Cinematic Gold</span>
            </div>
          </div>
          `;

// Replace `royal` card or inject after `luxury_gold` card
content = content.replace(/\{(\/\* Royal Gold Luxury Card \*\/[\s\S]*?\}|.*<h4.*ROYAL GOLD LUXURY[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/g, function(match) {
  return eliteCard;
});
// Let's just find `Luxury Gold Card` and append the elite card after it if the replace above doesn't work well
if (!content.includes('SBG ARMY ELITE')) {
   // Let's do it using generic string insertion before `</div>\n      </div>\n\n      {/* Action Bar */}`
   const searchStr = `        </div>\n      </div>\n\n      {/* Action Bar */}`;
   content = content.replace(searchStr, eliteCard + '\n' + searchStr);
}

fs.writeFileSync(file, content);
