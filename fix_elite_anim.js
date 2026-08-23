const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/themes/EliteHomePage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Colors
content = content.replace(/bg-\[#050507\]/g, 'bg-[#020202]');
content = content.replace(/via-\[#050507\]/g, 'via-[#020202]');
content = content.replace(/to-\[#050507\]/g, 'to-[#020202]');
content = content.replace(/bg-\[#0a0a0c\]/g, 'bg-[#050505]');

// Animations in Hero
const heroAnimReplace = `<motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } }
          }}
          className="flex flex-col items-center"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }}>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/5 backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="text-[10px] font-bold text-[#d4af37] tracking-[0.3em] uppercase">Professional Esports Organization</span>
            </div>
          </motion.div>
          
          <motion.h1 variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } } }} className="text-6xl md:text-8xl lg:text-[120px] font-black uppercase tracking-tighter leading-[0.85] mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">SBG</span><br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#d4af37] to-[#8a7224] drop-shadow-[0_0_40px_rgba(212,175,55,0.2)]">ARMY</span>
          </motion.h1>
          
          <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }} className="text-lg md:text-2xl text-gray-400 font-medium tracking-[0.2em] uppercase mb-12 max-w-2xl mx-auto">
            Born to Win. Built to Dominate.
          </motion.p>
          
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }} className="flex flex-wrap justify-center gap-4">
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
          </motion.div>
        </motion.div>`;

content = content.replace(/<motion\.div initial=\{\{ opacity: 0, y: 30 \}\} animate=\{\{ opacity: 1, y: 0 \}\} transition=\{\{ duration: 1, ease: "easeOut" \}\}>[\s\S]*?<\/motion\.div>/, heroAnimReplace);

fs.writeFileSync(file, content);
