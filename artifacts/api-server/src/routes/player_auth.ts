import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { readCol, writeCol } from '../lib/store.js';

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'sbg_army_admin_jwt_secret_key_2026';

const playerAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (_req, res) => res.status(429).json({ success: false, error: 'Too many attempts.' })
});

const playerRegLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  handler: (_req, res) => res.status(429).json({ success: false, error: 'Too many registrations.' })
});

router.post('/login', playerAuthLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Required fields missing' });
    
    const users = (await readCol('playerUsers') as any[]) || [];
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    let match = false;
    // Handle old simpleHash passwords
    if (!user.passwordHash.startsWith('$2')) {
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      if (Math.abs(hash).toString(36) === user.passwordHash) match = true;
    } else {
      match = await bcrypt.compare(password, user.passwordHash);
    }

    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ uid: user.id, username: user.username, role: 'player' }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('sbg_player_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7*24*60*60*1000 });
    
    // Auto upgrade hash
    if (!user.passwordHash.startsWith('$2')) {
      user.passwordHash = await bcrypt.hash(password, 10);
      await writeCol('playerUsers', users);
    }
    
    res.json({ success: true, userId: user.id });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/register', playerRegLimiter, async (req, res) => {
  try {
    const data = req.body;
    if (!data.username || !data.password || data.password.length < 12) {
      return res.status(400).json({ success: false, error: 'Password must be at least 12 characters.' });
    }
    const users = (await readCol('playerUsers') as any[]) || [];
    if (users.find(u => u.username.toLowerCase() === data.username.toLowerCase())) {
      return res.status(409).json({ success: false, error: 'Username taken' });
    }
    const newUser = {
      ...data,
      id: `pu_${Date.now()}`,
      passwordHash: await bcrypt.hash(data.password, 10),
      createdAt: Date.now()
    };
    delete newUser.password;
    users.push(newUser);
    await writeCol('playerUsers', users);
    
    const token = jwt.sign({ uid: newUser.id, username: newUser.username, role: 'player' }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('sbg_player_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7*24*60*60*1000 });
    
    res.json({ success: true, userId: newUser.id });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/verify', async (req, res) => {
  try {
    const token = req.cookies?.sbg_player_token;
    if (!token) return res.status(401).json({ success: false });
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const users = (await readCol('playerUsers') as any[]) || [];
    const user = users.find(u => u.id === payload.uid);
    if (!user) return res.status(401).json({ success: false });
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch {
    res.status(401).json({ success: false });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('sbg_player_token');
  res.json({ success: true });
});

export default router;
