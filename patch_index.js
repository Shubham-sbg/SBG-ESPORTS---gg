const fs = require('fs');
const file = 'artifacts/api-server/src/index.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const rawPort = process.env.API_PORT \|\| \(process.env.PORT === "3000" \|\| process.env.PORT === "8080" \? "8081" : process.env.PORT\) \|\| "8081";/g,
  'const rawPort = process.env.PORT || "3000";'
);

fs.writeFileSync(file, content);
