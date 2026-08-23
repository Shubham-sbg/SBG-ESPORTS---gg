const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => console.log('DB CONNECTED')).catch(e => console.log('DB ERROR', e.message));
