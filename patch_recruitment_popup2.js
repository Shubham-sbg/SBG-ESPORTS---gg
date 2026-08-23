const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/RecruitmentPopup.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /WE ARE RECRUITING/,
  "{db?.settings?.recruitmentPopupSubtitle || 'WE ARE RECRUITING'}"
);

content = content.replace(
  /<h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">[\s\S]*?<\/h2>/,
  '<h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider" dangerouslySetInnerHTML={{ __html: db?.settings?.recruitmentPopupTitle || \'JOIN <span class="text-amber-400" style="text-shadow: 0 0 20px #d4af37aa">SBG ARMY</span>\' }} />'
);

content = content.replace(
  /<p className="text-xs text-gray-400 max-w-sm mx-auto">[\s\S]*?We are actively scouting talent for official esports rosters & content teams.[\s\S]*?<\/p>/,
  '<p className="text-xs text-gray-400 max-w-sm mx-auto">{db?.settings?.recruitmentPopupText || "We are actively scouting talent for official esports rosters & content teams."}</p>'
);

fs.writeFileSync(file, content);
