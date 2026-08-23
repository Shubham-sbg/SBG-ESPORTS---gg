import bcrypt from 'bcryptjs';
import fs from 'fs';

const accounts = JSON.parse(fs.readFileSync('../database/staffAccounts.json', 'utf-8'));

async function run() {
  const email = "Official7sbgarmy7@gamil.com";
  const pass = "Official7Sbgarmyweb2@";
  const hash = await bcrypt.hash(pass, 10);
  
  const existing = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    existing.password = hash;
    existing.role = 'super_admin';
    existing.name = 'Main Owner';
  } else {
    accounts.push({
      id: "admin_" + Date.now(),
      name: "Main Owner",
      email: email,
      password: hash,
      role: "super_admin",
      allowedModules: ["*"],
      active: true,
      createdAt: Date.now()
    });
  }
  
  fs.writeFileSync('../database/staffAccounts.json', JSON.stringify(accounts, null, 2));
  console.log('Done hashing');
}
run();
