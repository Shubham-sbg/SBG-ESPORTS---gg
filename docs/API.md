# API Reference Documentation
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Base URL:** `https://api.sbgarmy.gg` | **Date:** July 2026

---

## 1. Overview

### 1.1 API Design

- **Protocol:** REST over HTTPS
- **Format:** JSON (request and response bodies)
- **Authentication:** Bearer JWT token in `Authorization` header
- **Versioning:** URL path versioning planned for V4 (`/api/v2/`)
- **Current prefix:** `/api`

### 1.2 Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5000` |
| Production | `https://api.sbgarmy.gg` (example) |

### 1.3 Authentication

Protected endpoints require a valid JWT token:

```
Authorization: Bearer <token>
```

Tokens are obtained via `POST /api/admin/login` and expire in 24 hours. Use `POST /api/admin/refresh` to extend active sessions.

### 1.4 Standard Response Format

**Success:**
```json
{
  "data": <response payload>,
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "error": "Human-readable error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 1.5 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request — invalid input |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — valid token but insufficient permissions |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — duplicate resource |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |

---

## 2. Authentication Endpoints

### 2.1 Admin Login

Authenticate an admin or staff user and receive a JWT token.

```
POST /api/admin/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "staff_abc123",
    "username": "admin",
    "displayName": "Site Administrator",
    "role": "super_admin",
    "permissions": {}
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `MISSING_FIELDS` | username or password not provided |
| 401 | `INVALID_CREDENTIALS` | Username not found or password mismatch |
| 429 | `RATE_LIMITED` | Too many login attempts (5 per 15 min) |

**Rate Limiting:** 5 requests per 15 minutes per IP address.

---

### 2.2 Refresh Token

Extend an active admin session with a new token.

```
POST /api/admin/refresh
Authorization: Bearer <current-token>
```

**Request Body:** None

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "staff_abc123",
    "username": "admin",
    "role": "super_admin"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `TOKEN_INVALID` | Token is missing, malformed, or expired |

---

### 2.3 Verify Token

Check if a JWT token is valid (used by AdminGuard on app load).

```
GET /api/admin/verify
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": "staff_abc123",
    "username": "admin",
    "role": "super_admin",
    "permissions": {}
  }
}
```

**Error Response (401):**
```json
{
  "valid": false,
  "error": "Token expired"
}
```

---

### 2.4 Admin Setup (First Run)

Create the initial super_admin account. Only works when no staff accounts exist.

```
POST /api/admin/setup
Content-Type: application/json
```

**Request Body:**
```json
{
  "setupCode": "string (required) - matches VITE_SETUP_CODE env var",
  "username": "string (required)",
  "password": "string (required, min 8 chars)",
  "displayName": "string (required)"
}
```

**Success Response (201):**
```json
{
  "message": "Super admin created successfully",
  "token": "eyJ..."
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `SETUP_ALREADY_DONE` | Staff accounts already exist |
| 400 | `INVALID_SETUP_CODE` | Provided code doesn't match env var |
| 400 | `WEAK_PASSWORD` | Password less than 8 characters |

---

### 2.5 Staff Management

Manage staff accounts (super_admin only).

**List Staff:**
```
GET /api/admin/staff
Authorization: Bearer <super-admin-token>
```

**Response (200):**
```json
[
  {
    "id": "staff_abc123",
    "username": "manager",
    "displayName": "Content Manager",
    "role": "staff",
    "permissions": { "news": true, "gallery": true },
    "active": true,
    "lastLogin": "2026-07-20T14:00:00Z",
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

*Note: `passwordHash` is always stripped from responses.*

**Create Staff:**
```
POST /api/admin/staff
Authorization: Bearer <super-admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string (required, unique)",
  "password": "string (required, min 8 chars)",
  "displayName": "string (required)",
  "role": "admin | staff",
  "permissions": {
    "players": false,
    "teams": false,
    "tournaments": true,
    "news": true,
    "gallery": false
  }
}
```

**Update Staff:**
```
PUT /api/admin/staff/:id
Authorization: Bearer <super-admin-token>
```

**Delete Staff:**
```
DELETE /api/admin/staff/:id
Authorization: Bearer <super-admin-token>
```

---

## 3. Database Endpoints

The database API provides generic CRUD operations for all collections. This is the primary data management API.

### 3.1 Get Full Database

Retrieve all collections (used for initial client sync).

```
GET /api/db
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "players": [...],
  "teams": [...],
  "matches": [...],
  "tournaments": [...],
  "posts": [...],
  "sponsors": [...],
  "settings": {...},
  "navigation": [...],
  "features": [...],
  "analytics": [...],
  ...
}
```

> ⚠️ This endpoint returns the FULL database state. Use with caution over slow connections.

---

### 3.2 Get Collection

Retrieve all documents from a specific collection.

```
GET /api/db/:collection
```

**Path Parameters:**
- `collection` — Collection name (e.g., `players`, `teams`, `posts`)

**Authentication:** Public collections are accessible without auth. Protected collections require admin token.

| Collection | Auth Required |
|------------|--------------|
| players | No |
| teams | No |
| matches | No |
| tournaments | No |
| posts (published only) | No |
| sponsors | No |
| games | No |
| gallery | No |
| settings | No |
| navigation | No |
| features | No |
| staffAccounts | ✅ Yes |
| analytics | ✅ Yes |
| contact_messages | ✅ Yes |
| fan_messages | ✅ Yes |
| registrations | ✅ Yes |
| orders | ✅ Yes |

**Response (200):**
```json
[
  { "id": "...", ... },
  { "id": "...", ... }
]
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 404 | Collection not found / not registered |
| 401 | Auth required but not provided |

---

### 3.3 Save Collection (Bulk)

Replace an entire collection with new data.

```
POST /api/db/:collection
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
[
  { "id": "existing_id", "name": "Updated Item", ... },
  { "id": "new_id_or_omit", "name": "New Item", ... }
]
```

*If `id` is omitted, a new UUID is generated.*

**Response (200):**
```json
{
  "message": "Collection saved",
  "collection": "players",
  "count": 42
}
```

**WebSocket Event Emitted:**
```json
{
  "type": "db_update",
  "collection": "players",
  "data": [...]
}
```

---

### 3.4 Bulk Save (Multiple Collections)

Save multiple collections in a single request.

```
POST /api/db
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "players": [...],
  "teams": [...],
  "settings": {...}
}
```

**Response (200):**
```json
{
  "message": "Database saved",
  "collections": ["players", "teams", "settings"]
}
```

**WebSocket Event Emitted:**
```json
{
  "type": "db_update_bulk",
  "data": {
    "players": [...],
    "teams": [...],
    "settings": {...}
  }
}
```

---

### 3.5 Database Backup (Export)

Export full database as downloadable JSON.

```
GET /api/backup
Authorization: Bearer <admin-token>
```

**Response (200):**
```
Content-Type: application/json
Content-Disposition: attachment; filename="sbg-army-backup-2026-07-21.json"

{
  "version": "3.0",
  "timestamp": "2026-07-21T12:00:00Z",
  "collections": { ... all collections ... }
}
```

> ⚠️ **Security:** Requires admin authentication. Includes ALL data including staffAccounts (with hashed passwords).

---

### 3.6 Database Restore (Import)

Restore database from a backup file. **Overwrites all current data.**

```
POST /api/restore
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:** Complete backup JSON from `/api/backup`

**Response (200):**
```json
{
  "message": "Database restored successfully",
  "timestamp": "2026-07-21T12:00:00Z",
  "collectionsRestored": 24
}
```

**WebSocket Event Emitted:**
```json
{
  "type": "db_init",
  "data": { ... full restored database ... }
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid backup format |
| 400 | Version mismatch |
| 401 | Not authenticated |

---

## 4. Upload Endpoint

### 4.1 Upload File

Upload an image or media file to the server.

```
POST /api/upload
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | The file to upload |
| `category` | string | ✅ | Storage category: `players`, `teams`, `gallery`, `sponsors`, `news`, `tournaments`, `misc` |

**Accepted MIME Types:**
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

**Max File Size:** 5MB

**Success Response (200):**
```json
{
  "url": "/uploads/players/abc123-player.webp",
  "filename": "abc123-player.webp",
  "size": 45632,
  "mimeType": "image/webp"
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_FILE_TYPE` | Unsupported MIME type |
| 400 | `FILE_TOO_LARGE` | File exceeds 5MB limit |
| 400 | `NO_FILE` | No file in request |
| 401 | — | Not authenticated |

**Accessing Uploaded Files:**

Uploaded files are served at: `https://api.sbgarmy.gg/uploads/<category>/<filename>`

---

## 5. Tournament Endpoints (Public)

These endpoints are on the tournament sub-system and are publicly accessible.

### 5.1 Get Public Tournament Info

```
GET /api/tnmt/:tournamentId
```

**Response (200):**
```json
{
  "id": "tnmt_xyz",
  "name": "SBG ARMY Open Cup Season 3",
  "game": "BGMI",
  "status": "registration",
  "startDate": "2026-08-01T10:00:00Z",
  "entryFee": 100,
  "prizePool": "₹10,000",
  "registrationOpen": true,
  "maxTeams": 64,
  "registeredTeams": 23,
  "rules": "...",
  "upiQrUrl": "/uploads/tournaments/upi-qr.png"
}
```

---

### 5.2 Submit Tournament Registration

```
POST /api/tnmt/register
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tournamentId` | string | ✅ | Tournament identifier |
| `teamName` | string | ✅ | Registering team name |
| `contactName` | string | ✅ | Contact person |
| `contactEmail` | string | ✅ | Contact email |
| `contactPhone` | string | ❌ | Phone number |
| `inGameId` | string | ✅ | Primary in-game UID |
| `members` | JSON string | ❌ | Array of member objects |
| `paymentScreenshot` | File | ✅ (paid) | Payment proof image |

**Success Response (201):**
```json
{
  "message": "Registration submitted successfully",
  "registrationId": "reg_abc123",
  "status": "pending",
  "message": "Your registration is pending payment verification. You will be contacted via email once approved."
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `REGISTRATION_CLOSED` | Tournament registration is not open |
| 400 | `TOURNAMENT_FULL` | Max team limit reached |
| 409 | `DUPLICATE_REGISTRATION` | Team already registered |
| 404 | `TOURNAMENT_NOT_FOUND` | Invalid tournament ID |

---

### 5.3 Get Tournament Bracket

```
GET /api/tnmt/:tournamentId/bracket
```

**Response (200):**
```json
{
  "tournamentId": "tnmt_xyz",
  "format": "single_elimination",
  "rounds": [
    {
      "round": 1,
      "name": "Quarter Finals",
      "matches": [
        {
          "id": "match_001",
          "team1": { "id": "team_a", "name": "Alpha Squad" },
          "team2": { "id": "team_b", "name": "Beta Force" },
          "score": { "team1": 2, "team2": 1 },
          "status": "completed",
          "winner": "team_a"
        }
      ]
    }
  ]
}
```

---

## 6. Analytics Endpoints

### 6.1 Public Analytics Summary

```
GET /api/analytics-public
```

**Response (200):**
```json
{
  "totalVisits": 45230,
  "uniqueVisitors": 12840,
  "last7Days": [
    { "date": "2026-07-15", "visits": 342 },
    { "date": "2026-07-16", "visits": 287 },
    ...
  ],
  "topPages": [
    { "page": "/", "visits": 8940 },
    { "page": "/tournaments", "visits": 4230 }
  ]
}
```

---

### 6.2 Record Page Visit

```
POST /api/analytics-public/track
Content-Type: application/json
```

**Request Body:**
```json
{
  "page": "/tournaments",
  "referrer": "https://google.com",
  "sessionId": "anon_session_abc"
}
```

**Response (200):**
```json
{ "tracked": true }
```

---

## 7. WebSocket API

### 7.1 Connection

Connect to the WebSocket server:

```
ws://localhost:5000/ws         (development)
wss://api.sbgarmy.gg/ws        (production)
```

No authentication required for WebSocket connection. However, admin-only data is filtered server-side for public clients (planned).

### 7.2 Server → Client Messages

**`db_init`** — Sent immediately on connection with full database state:
```json
{
  "type": "db_init",
  "data": {
    "players": [...],
    "teams": [...],
    "settings": {...},
    ...
  }
}
```

**`db_update`** — Sent when a single collection is updated:
```json
{
  "type": "db_update",
  "collection": "players",
  "data": [...]
}
```

**`db_update_bulk`** — Sent when multiple collections are updated:
```json
{
  "type": "db_update_bulk",
  "data": {
    "players": [...],
    "matches": [...]
  }
}
```

**`ping`** — Keepalive from server:
```json
{ "type": "ping" }
```

### 7.3 Client → Server Messages

**`pong`** — Keepalive response:
```json
{ "type": "pong" }
```

---

## 8. Error Code Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_FIELDS` | 400 | Required fields not provided |
| `INVALID_FORMAT` | 400 | Field format is invalid (e.g., bad email) |
| `FILE_TOO_LARGE` | 400 | Uploaded file exceeds size limit |
| `INVALID_FILE_TYPE` | 400 | Unsupported file MIME type |
| `INVALID_SETUP_CODE` | 400 | Setup code doesn't match env var |
| `SETUP_ALREADY_DONE` | 400 | Admin setup already completed |
| `WEAK_PASSWORD` | 400 | Password doesn't meet requirements |
| `INVALID_BACKUP_FORMAT` | 400 | Backup JSON is malformed |
| `REGISTRATION_CLOSED` | 400 | Tournament registration is closed |
| `TOURNAMENT_FULL` | 400 | Tournament team limit reached |
| `TOKEN_MISSING` | 401 | No Authorization header |
| `TOKEN_INVALID` | 401 | Token is malformed or expired |
| `INVALID_CREDENTIALS` | 401 | Wrong username or password |
| `INSUFFICIENT_PERMISSIONS` | 403 | Role/permissions don't allow this action |
| `NOT_FOUND` | 404 | Resource or collection not found |
| `TOURNAMENT_NOT_FOUND` | 404 | Tournament ID not found |
| `DUPLICATE_REGISTRATION` | 409 | Already registered for this tournament |
| `USERNAME_TAKEN` | 409 | Username already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 9. API Examples

### 9.1 Full Admin Workflow: Add Player

```bash
# Step 1: Login
curl -X POST https://api.sbgarmy.gg/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"securepass"}'

# Response: { "token": "eyJ...", "user": {...} }
TOKEN="eyJ..."

# Step 2: Upload player image
curl -X POST https://api.sbgarmy.gg/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@player.jpg" \
  -F "category=players"

# Response: { "url": "/uploads/players/uuid.jpg" }

# Step 3: Get current players
curl https://api.sbgarmy.gg/api/db/players \
  -H "Authorization: Bearer $TOKEN"

# Step 4: Add new player (save full collection)
curl -X POST https://api.sbgarmy.gg/api/db/players \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    ...existing players...,
    {
      "id": "plr_new123",
      "name": "ProGamer99",
      "game": "game_bgmi",
      "role": "Fragger",
      "status": "active",
      "imageUrl": "/uploads/players/uuid.jpg",
      "createdAt": "2026-07-21T12:00:00Z"
    }
  ]'
```

### 9.2 Public: Register for Tournament

```bash
curl -X POST https://api.sbgarmy.gg/api/tnmt/register \
  -F "tournamentId=tnmt_openCup3" \
  -F "teamName=Shadow Wolves" \
  -F "contactName=Ravi Kumar" \
  -F "contactEmail=ravi@example.com" \
  -F "inGameId=ShadowR#1234" \
  -F 'members=[{"name":"Player2","inGameId":"Ghost#5678"}]' \
  -F "paymentScreenshot=@payment_proof.jpg"
```

### 9.3 WebSocket Connection (JavaScript)

```javascript
const ws = new WebSocket('wss://api.sbgarmy.gg/ws');

ws.onopen = () => console.log('Connected to SBG ARMY live feed');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  switch (msg.type) {
    case 'db_init':
      // Full database state received
      store.setState(msg.data);
      break;
      
    case 'db_update':
      // Single collection updated
      store.updateCollection(msg.collection, msg.data);
      break;
      
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
  }
};

ws.onclose = () => {
  // Implement exponential backoff reconnect
  setTimeout(() => reconnect(), 2000);
};
```

---

*API Reference v3.0 — SBG ARMY Esports Platform — July 2026*
