import fs from 'fs';
const file = 'artifacts/sbg-army/src/components/admin/AdminSettings.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `<Field label="Keywords (comma-separated)">
                <Input value={(form as any).seoKeywords ?? ''} onChange={v => set('seoKeywords' as any, v)} placeholder="esports, bgmi, competitive gaming, sbg army" />
              </Field>
            </div>
          </Section>`;

const replacement = `<Field label="Keywords (comma-separated)">
                <Input value={(form as any).seoKeywords ?? ''} onChange={v => set('seoKeywords' as any, v)} placeholder="esports, bgmi, competitive gaming, sbg army" />
              </Field>
            </div>
          </Section>

          <Section title="🔍 Google Search Console" desc="Verify your site ownership with Google">
            <div className="space-y-4">
              <Field label="Google Verification Meta Tag">
                <Input value={(form as any).gscVerification ?? ''} onChange={v => set('gscVerification' as any, v)} placeholder="e.g. google1234567890abcdef.html or meta tag content" />
                <p className="text-[10px] text-gray-600 mt-1">If using HTML meta tag, paste the content value here.</p>
              </Field>
              <Field label="HTML File Verification">
                <Input value={(form as any).gscHtmlFile ?? ''} onChange={v => set('gscHtmlFile' as any, v)} placeholder="e.g. google1234567890abcdef.html" />
                <p className="text-[10px] text-gray-600 mt-1">If using HTML file upload, enter the filename here.</p>
              </Field>
            </div>
          </Section>

          <Section title="🗺️ Robots & Sitemap" desc="Advanced SEO configuration">
            <div className="space-y-4">
              <Field label="robots.txt (Custom)">
                <textarea value={(form as any).robotsTxt ?? ''} onChange={e => set('robotsTxt' as any, e.target.value)} rows={4} placeholder="User-agent: *\nAllow: /"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-yellow-500/40 resize-none placeholder-gray-700" />
              </Field>
              <Field label="sitemap.xml (Custom)">
                <textarea value={(form as any).sitemapXml ?? ''} onChange={e => set('sitemapXml' as any, e.target.value)} rows={4} placeholder="<?xml version='1.0' encoding='UTF-8'?>\n<urlset>...</urlset>"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-yellow-500/40 resize-none placeholder-gray-700" />
              </Field>
            </div>
          </Section>`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
