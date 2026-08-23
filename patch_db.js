const fs = require('fs');
const file = '/app/applet/artifacts/api-server/src/routes/database.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the /db and /db/:collection routes to conditionally scrub based on auth
content = content.replace("router.get('/db', (_req, res) => {", 
`import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'sbg_army_admin_jwt_secret_key_2026';
router.get('/db', (req, res) => {
  let isAdmin = false;
  try {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token) {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload && payload.role) isAdmin = true;
    }
  } catch {}
`);

content = content.replace("router.get('/db/ws-status', (_req, res) => {",
`router.get('/db/ws-status', (_req, res) => {`);

// Patch the first scrub call in /db route
content = content.replace(
`  for (const [col, data] of Object.entries(all)) {
    safe[col] = scrub(col, data);
  }`,
`  for (const [col, data] of Object.entries(all)) {
    if (isAdmin && PRIVATE_COLLECTIONS.includes(col)) {
       safe[col] = data; // Give full access to admins
    } else {
       safe[col] = scrub(col, data);
    }
  }`
);

// Patch the /db/:collection route
content = content.replace(
`router.get('/db/:collection', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  const collection = req.params['collection'] as string;
  res.json(scrub(collection, readCol(collection)));
});`,
`router.get('/db/:collection', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  const collection = req.params['collection'] as string;
  let isAdmin = false;
  try {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token) {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload && payload.role) isAdmin = true;
    }
  } catch {}
  if (isAdmin && PRIVATE_COLLECTIONS.includes(collection)) {
    res.json(readCol(collection));
  } else {
    res.json(scrub(collection, readCol(collection)));
  }
});`
);

fs.writeFileSync(file, content);
