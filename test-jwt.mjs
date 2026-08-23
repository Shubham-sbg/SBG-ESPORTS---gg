import jwt from 'jsonwebtoken';
console.log(jwt.sign({ role: 'super_admin' }, 'sbg_army_admin_jwt_secret_key_2026'));
