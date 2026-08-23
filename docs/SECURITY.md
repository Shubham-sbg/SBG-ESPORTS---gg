# Security Documentation
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Date:** July 2026 | **Classification:** Internal

---

## 1. Security Overview

The SBG ARMY platform implements a defense-in-depth security model across multiple layers. This document describes the security controls, their implementation, and operational guidance.

### 1.1 Threat Model Summary

| Threat | Risk | Control |
|--------|------|---------|
| Unauthorized admin access | High | JWT auth + bcrypt |
| Brute-force login | High | Rate limiting |
| XSS attacks | Medium | React escaping + CSP |
| CSRF attacks | Medium | JWT in sessionStorage (not cookies) |
| Data exfiltration | Medium | CORS restriction |
| SQL/NoSQL injection | Low | No SQL; JSON path sanitization |
| Credential exposure | High | Password stripping in responses |
| Token theft | Medium | sessionStorage (not localStorage) |
| File upload abuse | Medium | MIME type + size validation |
| Denial of Service | Medium | Rate limiting + body size limit |

---

## 2. Authentication Security

### 2.1 Password Hashing

All passwords are hashed using **bcrypt** before storage:

```typescript
// Hashing (on account creation)
const SALT_ROUNDS = 12;
const hash = await bcrypt.hash(plaintext, SALT_ROUNDS);

// Verification (on login)
const isValid = await bcrypt.compare(plaintext, hash);
```

**Why bcrypt with 12 rounds:**
- 12 rounds = ~250ms per hash on modern hardware
- Resists GPU/ASIC brute-force attacks
- Auto-includes random salt (no rainbow table vulnerability)
- Widely audited, battle-tested algorithm

**Requirements:**
- Minimum password length: 8 characters (enforced on account creation)
- Passwords must never be logged, returned in responses, or stored in plaintext

### 2.2 JWT Implementation

```typescript
// Token signing
const token = jwt.sign(
  {
    id: staff.id,
    username: staff.username,
    role: staff.role,
    permissions: staff.permissions
  },
  process.env.SESSION_SECRET!,
  { expiresIn: '24h', issuer: 'sbg-army-api' }
);

// Token verification
const payload = jwt.verify(token, process.env.SESSION_SECRET!) as JWTPayload;
```

**Token security properties:**
- Algorithm: HS256 (HMAC-SHA256)
- Expiry: 24 hours
- Secret: minimum 32 characters, randomly generated
- Refresh: available via dedicated endpoint (no expiry extension without re-verify)
- Storage: `sessionStorage` (cleared on browser close; not accessible cross-tab/cross-origin)

**Why sessionStorage over cookies:**
- Immune to CSRF attacks (requires JavaScript access, not automatically sent)
- Cleared when browser tab/window closes
- No `HttpOnly` vs `accessible` tradeoff — auth state is intentionally JS-accessible

### 2.3 Session Management

```typescript
// Server-side: No session store (stateless JWT)
// Client-side: sessionStorage
sessionStorage.setItem('admin_token', token);  // Set on login
sessionStorage.removeItem('admin_token');        // Clear on logout
```

**Logout behavior:**
- Clears token from sessionStorage
- No server-side session invalidation (stateless — token remains valid until expiry)
- For immediate invalidation (e.g., compromised token): rotate `SESSION_SECRET` environment variable

### 2.4 SERVER_SECRET Fail-Closed

```typescript
if (!process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable not set');
  process.exit(1);  // Server refuses to start
}
```

This prevents running without auth in misconfigured deployments.

---

## 3. Authorization

### 3.1 Role-Based Access Control (RBAC)

```typescript
// Middleware: require any valid admin token
export function requireAdmin(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const payload = jwt.verify(token, SESSION_SECRET) as JWTPayload;
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Middleware: require super_admin role
export function requireSuperAdmin(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  });
}
```

### 3.2 Permission Matrix

| Route | Required Role |
|-------|--------------|
| `GET /api/db/players` | Public |
| `POST /api/db/players` | admin or staff (with players permission) |
| `GET /api/backup` | admin+ |
| `POST /api/restore` | admin+ |
| `GET /api/db/staffAccounts` | super_admin |
| `POST /api/admin/staff` | super_admin |
| `DELETE /api/admin/staff/:id` | super_admin |
| Custom code routes | super_admin |

### 3.3 Sensitive Field Stripping

```typescript
// mergeSensitive() — strips dangerous fields from API responses
function stripSensitive(record: Record<string, any>): Record<string, any> {
  const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'secret'];
  const cleaned = { ...record };
  SENSITIVE_FIELDS.forEach(field => delete cleaned[field]);
  return cleaned;
}
```

This is applied to ALL staff account responses to prevent password hash exposure.

---

## 4. Input Validation & Sanitization

### 4.1 Request Body Limits

```typescript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

This prevents memory exhaustion via extremely large request bodies.

### 4.2 File Upload Validation

```typescript
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});
```

**Additional controls:**
- Files stored with UUID-based names (prevents directory traversal)
- Files stored outside web root where possible
- No executable file types allowed

### 4.3 XSS Protection

**React's automatic escaping:**
React escapes all JSX content by default. `{userContent}` is safe:
```jsx
// SAFE: React escapes this
<p>{player.bio}</p>

// UNSAFE: Avoid unless content is sanitized
<p dangerouslySetInnerHTML={{ __html: article.content }} />
```

**CMS content (articles, legal pages):**
When rendering CMS HTML content, content should be sanitized before injection. Recommended: `DOMPurify`:
```typescript
import DOMPurify from 'dompurify';

const safeHtml = DOMPurify.sanitize(article.content, {
  ALLOWED_TAGS: ['p','h1','h2','h3','h4','b','i','u','ul','ol','li','a','img','blockquote','code','pre'],
  ALLOWED_ATTR: ['href','src','alt','class','target']
});
```

**Content Security Policy (production):**
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.emailjs.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' wss://api.sbgarmy.gg https://api.sbgarmy.gg;
  frame-src https://www.youtube.com https://player.twitch.tv;
```

### 4.4 CSRF Protection

No CSRF tokens needed because:
1. JWT is stored in `sessionStorage`, not cookies
2. All state-mutating requests require `Authorization: Bearer <token>` header
3. Browsers never auto-send custom headers cross-origin (blocked by CORS)

---

## 5. Transport Security

### 5.1 HTTPS Enforcement

In production, all traffic must be served over HTTPS:

```nginx
# Nginx redirect
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

```typescript
// Express: trust proxy, redirect HTTP (if applicable)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}
```

### 5.2 WebSocket Security

WebSocket connections in production use `wss://` (WebSocket Secure) — the WebSocket upgrade of HTTPS connections.

### 5.3 Security Headers

Recommended response headers (via Nginx or Express middleware):

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 6. CORS Configuration

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false  // JWT in header, not cookies
}));
```

**Production:** Set `CORS_ORIGIN` to the exact frontend domain: `https://sbgarmy.gg`

**Never use `*` in production** — this allows any website to call your API with a user's token.

---

## 7. Rate Limiting

### 7.1 Auth Endpoints

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                      // 5 requests per window
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/admin/login', loginLimiter, loginHandler);
app.post('/api/admin/setup', loginLimiter, setupHandler);
```

### 7.2 Upload Endpoints

```typescript
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 20               // 20 uploads per minute
});

app.post('/api/upload', requireAdmin, uploadLimiter, uploadHandler);
```

### 7.3 General API

```typescript
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 200              // 200 requests per minute per IP
});

app.use('/api', generalLimiter);
```

---

## 8. Logging & Monitoring

### 8.1 Security Event Logging

All security events are logged with Pino at appropriate levels:

```typescript
// Failed login
logger.warn({
  event: 'login_failed',
  username: req.body.username,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString()
}, 'Failed admin login attempt');

// Successful login
logger.info({
  event: 'login_success',
  userId: staff.id,
  username: staff.username,
  role: staff.role,
  ip: req.ip
}, 'Admin login successful');

// Unauthorized access attempt
logger.warn({
  event: 'unauthorized_access',
  path: req.path,
  ip: req.ip,
  token_present: !!req.headers.authorization
}, 'Unauthorized access attempt');
```

### 8.2 What Is Logged

| Event | Level | Fields |
|-------|-------|--------|
| Login success | INFO | userId, username, role, IP |
| Login failure | WARN | username, IP, user-agent |
| Rate limit triggered | WARN | IP, path, timestamp |
| Unauthorized access | WARN | path, IP, token_present |
| Database restore | INFO | who, backup_version, timestamp |
| Staff account created | INFO | created_by, new_account |
| Staff account deleted | WARN | deleted_by, account |
| Backup exported | INFO | who, timestamp |
| Custom code saved | INFO | who, timestamp |

### 8.3 What Is Never Logged

- Passwords (plaintext or hash)
- JWT tokens
- Session secrets
- Full request bodies (may contain PII)
- Payment screenshot file contents

---

## 9. Data Protection

### 9.1 Sensitive Data Classification

| Data | Sensitivity | Protection |
|------|-------------|------------|
| Admin passwords | Critical | bcrypt hashed; never returned |
| JWT secret | Critical | Environment variable only |
| Session tokens | High | sessionStorage; expires 24h |
| Player contact info | Medium | Admin-only access |
| Contact form messages | Medium | Admin-only access |
| Payment screenshots | High | Admin-only access; uploads dir |
| Analytics data | Low | Anonymized by session ID |

### 9.2 GDPR Considerations

- Contact form data (name, email, message) is stored and must be deletable on request
- Fan messages stored with name; deletable via admin panel
- Analytics data uses anonymous session IDs (no IP storage in DB)
- Cookie consent banner should be displayed before analytics tracking
- Privacy Policy page must be accurate and up-to-date

### 9.3 Data Retention

| Data Type | Retention |
|-----------|-----------|
| Analytics | 90 days (admin-configurable) |
| Contact messages | Until manually deleted by admin |
| Fan messages | Until manually deleted by admin |
| Upload files | Indefinite (manual deletion) |
| Backup files | Until manually deleted |
| Activity logs | 30 days (rolling, if persisted to disk) |

---

## 10. Vulnerability Management

### 10.1 Dependency Updates

```bash
# Check for outdated packages
pnpm outdated

# Check for known vulnerabilities
pnpm audit

# Update non-breaking
pnpm update

# Update all (review breaking changes)
pnpm update --latest
```

Run `pnpm audit` monthly and before major deployments.

### 10.2 Known Security Considerations

| Item | Status | Notes |
|------|--------|-------|
| No server-side session revocation | ⚠️ Accepted | Mitigated by 24h expiry; rotate secret for immediate revocation |
| JSON DB no transactions | ⚠️ Accepted | Single-writer pattern; concurrent writes not supported |
| Upload files publicly accessible | ⚠️ By design | All uploads are intended for public display |
| Custom code injection | ⚠️ Restricted | super_admin only; documented risk |
| DOMPurify not enforced | 🔴 TODO | CMS HTML content should be sanitized before `dangerouslySetInnerHTML` |

### 10.3 Incident Response

**If admin credentials are compromised:**
1. Immediately rotate `SESSION_SECRET` environment variable (invalidates ALL existing tokens)
2. Restart API server to apply new secret
3. Log into admin panel with physical server access
4. Change the compromised account's password
5. Review activity logs for unauthorized changes
6. Notify organization leadership

**If database is corrupted:**
1. Stop API server to prevent further writes
2. Restore from latest backup via API or filesystem
3. Verify restored state
4. Restart API server

**If malicious code is injected (custom code module):**
1. Log into admin panel
2. Navigate to Custom Code module
3. Clear the CSS and JS fields
4. Save (WS broadcast removes injected code from public site immediately)
5. Review activity logs to identify who made the change

---

*Security Document v3.0 — SBG ARMY Esports Platform — July 2026*
