const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/RecruitmentPopup.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldHeader = `<div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1 text-amber-400 text-xs font-black uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            WE ARE RECRUITING
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
            JOIN <span className="text-amber-400" style={{ textShadow: '0 0 20px #d4af37aa' }}>SBG ARMY</span>
          </h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            We are actively scouting talent for official esports rosters & content teams.
          </p>
        </div>`;

const newHeader = `<div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1 text-amber-400 text-xs font-black uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            {window.__sbgSettings?.recruitmentPopupSubtitle || 'WE ARE RECRUITING'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider" dangerouslySetInnerHTML={{ __html: window.__sbgSettings?.recruitmentPopupTitle || 'JOIN <span class="text-amber-400" style="text-shadow: 0 0 20px #d4af37aa">SBG ARMY</span>' }} />
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {window.__sbgSettings?.recruitmentPopupText || 'We are actively scouting talent for official esports rosters & content teams.'}
          </p>
        </div>`;

content = content.replace(oldHeader, newHeader);

// We need to pass settings to the window object or use useDatabase hook, but RecruitmentPopup is imported in App.tsx maybe? Let's check how Settings is passed.
// Wait, we can use \`useDatabase()\` inside RecruitmentPopup.tsx.
content = content.replace("import type { RecruitmentOpening } from '@/lib/database';", "import type { RecruitmentOpening } from '@/lib/database';\nimport { useDatabase } from '@/hooks/useDatabase';");

content = content.replace("const [openings, setOpenings] = useState<RecruitmentOpening[]>([]);", "const [openings, setOpenings] = useState<RecruitmentOpening[]>([]);\n  const { db } = useDatabase();");

content = content.replace("window.__sbgSettings?.recruitmentPopupSubtitle", "db?.settings?.recruitmentPopupSubtitle");
content = content.replace("window.__sbgSettings?.recruitmentPopupTitle", "db?.settings?.recruitmentPopupTitle");
content = content.replace("window.__sbgSettings?.recruitmentPopupText", "db?.settings?.recruitmentPopupText");

fs.writeFileSync(file, content);
