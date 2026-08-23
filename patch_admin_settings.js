const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/admin/AdminSettings.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `          <Section title="🔍 Search Engine Optimization" desc="Controls how your site appears in Google and social shares">`;

const replaceStr = `          <Section title="📢 Recruitment Popup" desc="Manage text for the popup that appears when there are active recruitment openings">
            <div className="space-y-4">
              <Field label="Popup Subtitle (Badge text)">
                <Input value={(form as any).recruitmentPopupSubtitle ?? ''} onChange={v => set('recruitmentPopupSubtitle' as any, v)} placeholder="WE ARE RECRUITING" />
              </Field>
              <Field label="Popup Title (HTML allowed)">
                <Input value={(form as any).recruitmentPopupTitle ?? ''} onChange={v => set('recruitmentPopupTitle' as any, v)} placeholder='JOIN <span class="text-amber-400" style="text-shadow: 0 0 20px #d4af37aa">SBG ARMY</span>' />
              </Field>
              <Field label="Popup Text/Description">
                <textarea value={(form as any).recruitmentPopupText ?? ''} onChange={e => set('recruitmentPopupText' as any, e.target.value as any)} rows={3} placeholder="We are actively scouting talent for official esports rosters & content teams."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40 resize-none placeholder-gray-700" />
              </Field>
            </div>
          </Section>

` + targetStr;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync(file, content);
