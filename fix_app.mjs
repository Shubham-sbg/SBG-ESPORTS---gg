import fs from 'fs';
let code = fs.readFileSync('artifacts/api-server/src/app.ts', 'utf8');
code = code.replace("app.get('/google[a-zA-Z0-9_-]+.html',", "app.get(/^\\/google[a-zA-Z0-9_-]+\\.html$/,");
fs.writeFileSync('artifacts/api-server/src/app.ts', code);
