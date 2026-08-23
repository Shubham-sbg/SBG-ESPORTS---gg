import fs from 'fs';
const file = 'artifacts/api-server/src/app.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `const staticDir = path.resolve(__dirname, "../../sbg-army/dist/public");
if (existsSync(staticDir)) {`;

const replacement = `const staticDir = path.resolve(__dirname, "../../sbg-army/dist/public");

// SEO & GSC endpoints
app.get('/google[a-zA-Z0-9_-]+.html', (req, res, next) => {
  const settings = (readCol('settings') || {}) as any;
  if (settings.gscHtmlFile && req.path.slice(1) === settings.gscHtmlFile) {
    res.send(\`google-site-verification: \${settings.gscHtmlFile}\`);
  } else {
    next();
  }
});
app.get('/robots.txt', (req, res, next) => {
  const settings = (readCol('settings') || {}) as any;
  if (settings.robotsTxt) {
    res.type('text/plain');
    res.send(settings.robotsTxt);
  } else {
    next();
  }
});
app.get('/sitemap.xml', (req, res, next) => {
  const settings = (readCol('settings') || {}) as any;
  if (settings.sitemapXml) {
    res.type('application/xml');
    res.send(settings.sitemapXml);
  } else {
    next();
  }
});

if (existsSync(staticDir)) {`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
