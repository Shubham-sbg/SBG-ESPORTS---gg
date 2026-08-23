# Testing Documentation
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Date:** July 2026

---

## 1. Testing Strategy

### 1.1 Testing Pyramid

```
        ┌─────────────┐
        │   E2E / UI  │  (Playwright / Cypress)
       ┌┤─────────────├┐
      ┌┤│ Integration  │├┐
     ┌┤││─────────────│├┐│
    ┌┤│││  Unit Tests  │││├┐
    └┴┴┴┴─────────────┴┴┴┘
    Many  ──────────────►  Few
    Fast                   Slow
    Cheap                Expensive
```

| Layer | Tools | Coverage Goal | Runs |
|-------|-------|---------------|------|
| Unit | Vitest + Testing Library | 60% | Every commit |
| Integration | Supertest + Vitest | API endpoints | Every commit |
| E2E / UI | Playwright | Critical flows | Pre-deploy |
| Security | Manual + ZAP | All auth flows | Monthly |
| Performance | Lighthouse + k6 | Core pages | Pre-deploy |

---

## 2. Unit Tests

### 2.1 Test Setup

```bash
# Install test dependencies
pnpm add -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom happy-dom

# Add to package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
});
```

`src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});
```

### 2.2 Frontend Unit Test Cases

#### Authentication Utilities

```typescript
// src/lib/__tests__/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, setToken, clearToken, isTokenExpired } from '../auth';

describe('Auth utilities', () => {
  beforeEach(() => sessionStorage.clear());

  it('should store and retrieve token', () => {
    setToken('test-token');
    expect(getToken()).toBe('test-token');
  });

  it('should return null when no token stored', () => {
    expect(getToken()).toBeNull();
  });

  it('should clear token on logout', () => {
    setToken('test-token');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('should detect expired JWT', () => {
    // JWT with exp in the past
    const expiredToken = 'eyJ...';  // Mock expired JWT
    expect(isTokenExpired(expiredToken)).toBe(true);
  });

  it('should detect valid JWT', () => {
    // JWT with exp in the future
    const validToken = generateMockToken({ exp: Date.now() / 1000 + 3600 });
    expect(isTokenExpired(validToken)).toBe(false);
  });
});
```

#### URL Sanitization

```typescript
// src/lib/__tests__/utils.test.ts
import { sanitizeUrl, sanitizeImageUrl } from '../utils';

describe('URL sanitization', () => {
  it('should allow valid https URLs', () => {
    expect(sanitizeUrl('https://youtube.com/@user')).toBe('https://youtube.com/@user');
  });

  it('should allow valid http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('should allow relative paths', () => {
    expect(sanitizeUrl('/uploads/players/photo.jpg')).toBe('/uploads/players/photo.jpg');
  });

  it('should reject javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('should reject data: URIs for external links', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('should return empty string for undefined input', () => {
    expect(sanitizeUrl(undefined)).toBe('');
  });
});
```

#### Player Component

```typescript
// src/components/__tests__/PlayerCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PlayerCard } from '../PlayerCard';

const mockPlayer = {
  id: 'plr_001',
  name: 'ShadowX',
  game: 'BGMI',
  role: 'IGL',
  status: 'active',
  imageUrl: '/uploads/players/shadow.jpg',
  stats: { kd: 3.2, winRate: 0.68 }
};

describe('PlayerCard', () => {
  it('renders player name', () => {
    render(<PlayerCard player={mockPlayer} />);
    expect(screen.getByText('ShadowX')).toBeInTheDocument();
  });

  it('renders player role and game', () => {
    render(<PlayerCard player={mockPlayer} />);
    expect(screen.getByText('IGL')).toBeInTheDocument();
    expect(screen.getByText('BGMI')).toBeInTheDocument();
  });

  it('renders active status badge', () => {
    render(<PlayerCard player={mockPlayer} />);
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it('renders player stats', () => {
    render(<PlayerCard player={mockPlayer} />);
    expect(screen.getByText('3.2')).toBeInTheDocument();
  });

  it('renders profile image with alt text', () => {
    render(<PlayerCard player={mockPlayer} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', expect.stringContaining('ShadowX'));
  });

  it('renders fallback when no image', () => {
    render(<PlayerCard player={{ ...mockPlayer, imageUrl: undefined }} />);
    // Should render avatar placeholder
    expect(screen.getByTestId('avatar-placeholder')).toBeInTheDocument();
  });
});
```

#### WebGL Detection

```typescript
// src/lib/__tests__/webgl.test.ts
import { isWebGLAvailable } from '../webgl';

describe('WebGL detection', () => {
  it('returns false when canvas getContext is unavailable', () => {
    // jsdom doesn't support WebGL
    expect(isWebGLAvailable()).toBe(false);
  });

  it('returns true when WebGL context is available', () => {
    // Mock WebGL support
    const mockGL = {};
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockGL);
    expect(isWebGLAvailable()).toBe(true);
  });
});
```

#### Database Hook

```typescript
// src/hooks/__tests__/useDatabase.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDatabase } from '../useDatabase';

// Mock wsClient
vi.mock('../../lib/wsClient', () => ({
  wsClient: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onMessage: vi.fn()
  }
}));

describe('useDatabase', () => {
  it('initializes with empty state', () => {
    const { result } = renderHook(() => useDatabase());
    expect(result.current.db.players).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('updates state on db_update message', async () => {
    const { result } = renderHook(() => useDatabase());
    
    await act(async () => {
      // Simulate WS message
      result.current._handleMessage({
        type: 'db_update',
        collection: 'players',
        data: [{ id: 'plr_001', name: 'TestPlayer' }]
      });
    });
    
    expect(result.current.db.players).toHaveLength(1);
    expect(result.current.db.players[0].name).toBe('TestPlayer');
  });
});
```

### 2.3 Backend Unit Test Cases

```typescript
// artifacts/api-server/src/__tests__/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = 'test-secret-32-characters-minimum';

describe('Password hashing', () => {
  it('should hash password', async () => {
    const hash = await bcrypt.hash('password123', 12);
    expect(hash).not.toBe('password123');
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it('should verify correct password', async () => {
    const hash = await bcrypt.hash('password123', 12);
    expect(await bcrypt.compare('password123', hash)).toBe(true);
  });

  it('should reject wrong password', async () => {
    const hash = await bcrypt.hash('password123', 12);
    expect(await bcrypt.compare('wrongpassword', hash)).toBe(false);
  });
});

describe('JWT operations', () => {
  it('should create and verify valid token', () => {
    const payload = { id: 'staff_001', role: 'admin', username: 'admin' };
    const token = jwt.sign(payload, SECRET, { expiresIn: '24h' });
    const decoded = jwt.verify(token, SECRET) as typeof payload;
    expect(decoded.id).toBe('staff_001');
    expect(decoded.role).toBe('admin');
  });

  it('should reject expired token', () => {
    const token = jwt.sign({ id: 'staff_001' }, SECRET, { expiresIn: '-1s' });
    expect(() => jwt.verify(token, SECRET)).toThrow('jwt expired');
  });

  it('should reject tampered token', () => {
    const token = jwt.sign({ id: 'staff_001', role: 'staff' }, SECRET);
    const parts = token.split('.');
    // Tamper with payload
    const fakePayload = btoa(JSON.stringify({ id: 'staff_001', role: 'super_admin' }));
    const tamperedToken = `${parts[0]}.${fakePayload}.${parts[2]}`;
    expect(() => jwt.verify(tamperedToken, SECRET)).toThrow();
  });
});
```

---

## 3. Integration Tests

### 3.1 API Integration Tests (Supertest)

```bash
pnpm add -D supertest @types/supertest
```

```typescript
// artifacts/api-server/src/__tests__/integration/auth.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';

let app: Express;
let adminToken: string;

beforeAll(async () => {
  app = createApp({ testMode: true });
  // Create test admin account
  await seedTestAdmin({ username: 'testadmin', password: 'TestPass123!' });
});

describe('POST /api/admin/login', () => {
  it('returns JWT on valid credentials', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'TestPass123!' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe('testadmin');
    expect(res.body.user.passwordHash).toBeUndefined();

    adminToken = res.body.token;
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  it('returns 400 on missing fields', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'testadmin' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/db/players', () => {
  it('returns players array publicly', async () => {
    const res = await request(app).get('/api/db/players');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/db/players', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/db/players')
      .send([{ name: 'Test Player', game: 'BGMI' }]);
    expect(res.status).toBe(401);
  });

  it('saves players with valid token', async () => {
    const players = [
      { id: 'plr_test001', name: 'Test Player', game: 'BGMI', status: 'active' }
    ];

    const res = await request(app)
      .post('/api/db/players')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(players);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });
});

describe('GET /api/backup', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/backup');
    expect(res.status).toBe(401);
  });

  it('returns backup JSON for authenticated admin', async () => {
    const res = await request(app)
      .get('/api/backup')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.version).toBeTruthy();
    expect(res.body.collections).toBeTruthy();
  });
});

describe('POST /api/upload', () => {
  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('fake-image'), 'test.jpg');
    expect(res.status).toBe(401);
  });

  it('rejects invalid file types', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('category', 'players')
      .attach('file', Buffer.from('fake-exe'), { filename: 'malware.exe', contentType: 'application/octet-stream' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid file type/i);
  });
});
```

### 3.2 WebSocket Integration Tests

```typescript
// artifacts/api-server/src/__tests__/integration/websocket.integration.test.ts
import { describe, it, expect } from 'vitest';
import WebSocket from 'ws';

const WS_URL = 'ws://localhost:5001/ws';  // Test port

describe('WebSocket', () => {
  it('connects and receives db_init on connection', (done) => {
    const ws = new WebSocket(WS_URL);

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      expect(msg.type).toBe('db_init');
      expect(msg.data).toBeTruthy();
      expect(Array.isArray(msg.data.players)).toBe(true);
      ws.close();
      done();
    });
  });

  it('broadcasts db_update when collection is saved', (done) => {
    const ws = new WebSocket(WS_URL);
    let initReceived = false;

    ws.on('message', async (data) => {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'db_init' && !initReceived) {
        initReceived = true;
        // Trigger a collection update
        await fetch('http://localhost:5001/api/db/players', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify([])
        });
      }

      if (msg.type === 'db_update') {
        expect(msg.collection).toBe('players');
        ws.close();
        done();
      }
    });
  });
});
```

---

## 4. End-to-End Tests (Playwright)

### 4.1 Setup

```bash
pnpm add -D @playwright/test
npx playwright install
```

`playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  }
});
```

### 4.2 Public Website E2E Tests

```typescript
// e2e/public.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Public Website', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SBG ARMY/);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('navigation works for all public pages', async ({ page }) => {
    await page.goto('/');
    
    const links = [
      { text: /tournaments/i, url: '/tournaments' },
      { text: /news/i, url: '/news' },
      { text: /about/i, url: '/about' },
      { text: /contact/i, url: '/contact' }
    ];

    for (const link of links) {
      await page.goto('/');
      await page.getByRole('link', { name: link.text }).first().click();
      await expect(page).toHaveURL(new RegExp(link.url));
      await expect(page.locator('main, [role="main"]')).toBeVisible();
    }
  });

  test('contact form submits successfully', async ({ page }) => {
    await page.goto('/contact');
    
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="subject"]', 'Test Subject');
    await page.fill('[name="message"]', 'This is a test message from Playwright.');
    
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/message sent|thank you/i)).toBeVisible({ timeout: 5000 });
  });

  test('hero section is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
  });

  test('mobile menu works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    // Hamburger button should be visible
    const hamburger = page.getByRole('button', { name: /menu/i });
    await expect(hamburger).toBeVisible();
    
    // Click to open
    await hamburger.click();
    
    // Menu drawer should appear
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });
});
```

### 4.3 Admin Panel E2E Tests

```typescript
// e2e/admin.spec.ts
import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:3000/admin';
const TEST_ADMIN = { username: 'e2eadmin', password: 'E2ETest123!' };

test.describe('Admin Panel', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login|\/admin$/);
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('[name="username"]', 'wronguser');
    await page.fill('[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/invalid credentials|incorrect/i)).toBeVisible();
  });

  test('logs in with valid credentials', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('[name="username"]', TEST_ADMIN.username);
    await page.fill('[name="password"]', TEST_ADMIN.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/dashboard|welcome/i)).toBeVisible();
  });

  test('admin can add and delete a player', async ({ page }) => {
    // Login first
    await loginAsAdmin(page, TEST_ADMIN);
    
    // Navigate to players
    await page.getByRole('link', { name: /players/i }).click();
    
    // Add player
    await page.getByRole('button', { name: /add player/i }).click();
    await page.fill('[name="name"]', 'E2E Test Player');
    await page.selectOption('[name="game"]', { label: 'BGMI' });
    await page.selectOption('[name="status"]', 'active');
    await page.click('button[type="submit"]');
    
    // Verify player appears
    await expect(page.getByText('E2E Test Player')).toBeVisible();
    
    // Delete player
    await page.getByRole('row', { name: /E2E Test Player/ })
      .getByRole('button', { name: /delete/i })
      .click();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Verify player gone
    await expect(page.getByText('E2E Test Player')).not.toBeVisible();
  });

  test('logout clears session', async ({ page }) => {
    await loginAsAdmin(page, TEST_ADMIN);
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/admin/);
    
    // Verify sessionStorage cleared
    const token = await page.evaluate(() => sessionStorage.getItem('admin_token'));
    expect(token).toBeNull();
  });
});

async function loginAsAdmin(page, credentials) {
  await page.goto('/admin');
  await page.fill('[name="username"]', credentials.username);
  await page.fill('[name="password"]', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/);
}
```

---

## 5. Security Tests

### 5.1 Authentication Security

| Test | Method | Expected Result |
|------|--------|-----------------|
| Access admin without token | GET /api/backup | 401 Unauthorized |
| Use expired token | GET /api/db/staffAccounts | 401 Unauthorized |
| Use malformed token | GET /api/db/staffAccounts | 401 Unauthorized |
| Brute force login (>5 attempts) | POST /api/admin/login | 429 Too Many Requests |
| Tamper JWT payload | Any protected route | 401 Unauthorized |
| Staff access super_admin route | DELETE /api/admin/staff/:id | 403 Forbidden |

### 5.2 XSS Tests

| Test | Input | Expected Result |
|------|-------|-----------------|
| Script in player name | `<script>alert(1)</script>` | Rendered as text, not executed |
| Script in news article | `<img src=x onerror=alert(1)>` | DOMPurify strips onerror |
| Script in settings | `<script>steal()</script>` | Rendered as text |
| Javascript URL | `javascript:alert(1)` | Sanitized to empty string |

### 5.3 Upload Security

| Test | File | Expected Result |
|------|------|-----------------|
| Upload .exe | malware.exe | 400 Invalid file type |
| Upload .php | shell.php | 400 Invalid file type |
| Upload 10MB image | large.jpg | 400 File too large |
| Upload SVG with JS | evil.svg | 400 or sanitized |
| Upload without auth | any file | 401 Unauthorized |

---

## 6. Performance Tests

### 6.1 Lighthouse Audit

Run against production or staging:
```bash
npx lighthouse https://sbgarmy.gg \
  --output=html \
  --output-path=./reports/lighthouse.html \
  --form-factor=mobile \
  --throttling-method=simulate

# Target scores:
# Performance: 85+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

### 6.2 API Load Test (k6)

```javascript
// k6/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,           // 50 virtual users
  duration: '60s',   // 1 minute
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% under 200ms
    http_req_failed: ['rate<0.01'],    // <1% error rate
  }
};

export default function () {
  // Test public endpoints
  const responses = http.batch([
    ['GET', 'https://api.sbgarmy.gg/api/db/players'],
    ['GET', 'https://api.sbgarmy.gg/api/db/tournaments'],
    ['GET', 'https://api.sbgarmy.gg/api/db/posts'],
  ]);

  responses.forEach(res => {
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200
    });
  });

  sleep(1);
}
```

```bash
k6 run k6/api-load-test.js
```

### 6.3 WebSocket Concurrency Test

```javascript
// k6/ws-load-test.js
import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  vus: 100,        // 100 concurrent WS connections
  duration: '30s'
};

export default function () {
  const url = 'wss://api.sbgarmy.gg/ws';

  const res = ws.connect(url, {}, function (socket) {
    socket.on('message', (data) => {
      const msg = JSON.parse(data);
      check(msg, {
        'received db_init': (m) => m.type === 'db_init'
      });
    });

    socket.setTimeout(() => socket.close(), 20000);
  });

  check(res, { 'connected': (r) => r && r.status === 101 });
}
```

---

## 7. Running Tests

```bash
# Unit tests
pnpm --filter @workspace/sbg-army test
pnpm --filter @workspace/api-server test

# Unit tests with coverage
pnpm --filter @workspace/sbg-army test:coverage

# Integration tests
pnpm --filter @workspace/api-server test:integration

# E2E tests (requires running servers)
pnpm exec playwright test

# E2E tests with UI
pnpm exec playwright test --ui

# E2E tests for specific file
pnpm exec playwright test e2e/admin.spec.ts

# Performance tests
npx lighthouse https://sbgarmy.gg
k6 run k6/api-load-test.js
```

---

*Testing Documentation v3.0 — SBG ARMY Esports Platform — July 2026*
