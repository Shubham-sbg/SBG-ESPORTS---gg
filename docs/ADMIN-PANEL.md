# Admin Panel Specification
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Date:** July 2026

---

## 1. Overview

The SBG ARMY Admin Panel is a JWT-protected single-page application embedded within the main React app. It provides comprehensive management of all organization data through 18+ specialized modules accessible via a persistent sidebar navigation.

### 1.1 Access

| Route | Description |
|-------|-------------|
| `/admin` | Redirects to login if not authenticated, otherwise dashboard |
| `/admin/setup` | First-run super admin account creation |
| `/admin/login` | Login form |
| `/admin/dashboard` | Main dashboard (post-login) |

### 1.2 Authentication Guard

Every admin route is wrapped in an `<AdminGuard>` component that:
1. Checks `sessionStorage` for a valid JWT token
2. Calls `GET /api/admin/verify` to validate the token
3. Redirects to `/admin/login` if token is absent or invalid
4. Schedules automatic token refresh every 20 minutes

---

## 2. Dashboard Module

### 2.1 Layout

The dashboard is the landing page after login and provides an at-a-glance view of platform health.

**Metric Cards (top row):**
| Card | Data Source | Description |
|------|-------------|-------------|
| Total Players | `players.length` | Count of all player records |
| Active Tournaments | `tournaments.filter(active).length` | Active/registration tournaments |
| Pending Registrations | `registrations.filter(pending).length` | Awaiting approval |
| Unread Messages | `contact_messages.filter(unread).length` | Contact inbox |
| Published Articles | `posts.filter(published).length` | Live news articles |
| Active Sponsors | `sponsors.filter(active).length` | Currently displayed sponsors |

**Analytics Chart:**
- Line/bar chart showing daily page visits for last 7 and 30 days
- Uses Recharts `LineChart` or `BarChart` component
- Data from `analytics` collection

**Recent Activity Panels:**
- Last 5 contact messages (preview)
- Last 5 fan messages (preview)
- Last 5 recruitment applications (preview)
- Last 5 news articles (title, status, date)

**Quick Actions:**
- + Add Player
- + Create Tournament
- + Write Article
- Export Database

---

## 3. Player Manager Module

### 3.1 Features
- List all players with search and filter
- Filter by: game, status, team
- Sort by: name, game, status, join date
- Pagination (25 per page)

### 3.2 Create / Edit Player Form

| Field | Input Type | Validation |
|-------|------------|------------|
| Name (gamertag) | Text | Required, max 50 chars |
| Game | Select (from games collection) | Required |
| Team | Select (from teams collection) | Optional |
| Role | Text | Optional (IGL, Support, etc.) |
| Status | Select | Required (active/inactive/retired/tryout) |
| Country | Select (country list) | Optional |
| Join Date | Date picker | Optional |
| Profile Image | File upload | Optional, image/* |
| Biography | Textarea | Optional, max 500 chars |
| Twitter URL | Text (URL) | Optional, URL format |
| YouTube URL | Text (URL) | Optional, URL format |
| Twitch URL | Text (URL) | Optional, URL format |
| Instagram URL | Text (URL) | Optional, URL format |
| Stats (JSON) | Key-value editor | Optional |

### 3.3 Player Card Preview

When editing a player, a live preview card shows how the player will appear on the public website.

### 3.4 Bulk Actions

- Bulk status change (select multiple → change status)
- Bulk team assignment
- Bulk delete (with confirmation)

---

## 4. Team Manager Module

### 4.1 Features
- List all teams with game filter
- Team status toggle (active/inactive/disbanded)
- Assign/remove players from teams

### 4.2 Create / Edit Team Form

| Field | Input Type | Validation |
|-------|------------|------------|
| Team Name | Text | Required, max 50 chars |
| Game | Select | Required |
| Status | Select | Required |
| Logo | File upload | Optional, image/* |
| Banner | File upload | Optional, image/* |
| Description | Textarea | Optional |
| Captain | Select (from team players) | Optional |
| Coach | Select (from team players) | Optional |
| Founded Year | Number | Optional |

### 4.3 Roster Management

Within each team editor, a **Roster Panel** shows:
- Current players assigned to the team
- Search players to add
- Remove players (click ×)
- Drag to reorder (display order)

---

## 5. Match Manager Module

### 5.1 Features
- Schedule and manage all matches
- Update scores in real-time
- Manage room IDs for tournament matches
- Filter by: tournament, status, date, game

### 5.2 Create / Edit Match Form

| Field | Input Type | Validation |
|-------|------------|------------|
| Team 1 | Select (from teams) OR text | Required |
| Team 2 | Select (from teams) OR text | Required |
| Game | Select | Required |
| Tournament | Select (optional) | Optional |
| Scheduled Date | DateTime picker | Required |
| Format | Select (BO1/BO3/BO5) | Optional |
| Status | Select | Required |
| Team 1 Score | Number | Optional |
| Team 2 Score | Number | Optional |
| Room ID | Text | Optional |
| Room Password | Text | Optional |
| Stream URL | Text (URL) | Optional |
| Notes | Textarea | Optional |

### 5.3 Score Update Quick Panel

From the match list, a ⚡ quick-update button opens a minimal score update dialog without opening the full edit form — optimized for live scoring during events.

---

## 6. Tournament Manager Module

### 6.1 Features
- Full tournament lifecycle management
- Registration approval workflow
- Bracket generation
- Room ID distribution

### 6.2 Create / Edit Tournament Form

| Field | Input Type | Validation |
|-------|------------|------------|
| Name | Text | Required |
| Game | Select | Required |
| Format | Select | Required |
| Status | Select | Required |
| Start Date | DateTime | Required |
| End Date | DateTime | Optional |
| Registration Deadline | DateTime | Optional |
| Entry Fee | Number (INR) | Required (0 = free) |
| Prize Pool | Text | Optional |
| Max Teams | Number | Optional |
| Registration Open | Toggle | Required |
| UPI ID | Text | Optional |
| UPI QR Image | File upload | Optional |
| Banner | File upload | Optional |
| Rules | Textarea (Markdown) | Optional |

### 6.3 Registration Management Sub-Panel

Within each tournament, a **Registrations** tab shows:

```
┌──────────────────────────────────────────────────────────┐
│ Team Name      │ Contact    │ Status   │ Payment │ Actions│
├──────────────────────────────────────────────────────────┤
│ Shadow Wolves  │ Ravi Kumar │ Pending  │ 🔍 View │ ✅ ❌ │
│ Alpha Squad    │ Priya S.   │ Approved │ ✅ Verified│[RID]│
│ Ghost Force    │ Raj M.     │ Rejected │ ❌ Invalid│  —  │
└──────────────────────────────────────────────────────────┘
```

**Actions:**
- 🔍 View payment screenshot (opens image in modal)
- ✅ Approve registration
- ❌ Reject registration (with optional reason)
- [RID] Send room ID to approved teams

### 6.4 Bracket Generator

After approval window closes:
1. Admin clicks "Generate Bracket"
2. System takes all approved registrations
3. Generates match structure based on format (single/double elimination, round robin)
4. Saves bracket to tournament record
5. Public bracket page auto-updates via WS

---

## 7. News CMS Module

### 7.1 Features
- Create, edit, publish, unpublish, delete articles
- Article preview before publishing
- Image upload for cover photos
- Category management
- Featured article toggle

### 7.2 Article Editor

| Field | Input Type | Validation |
|-------|------------|------------|
| Title | Text | Required, max 120 chars |
| Slug | Auto-generated from title | Editable, URL-safe |
| Category | Select/text | Optional |
| Cover Image | File upload | Optional |
| Content | Rich text editor | Required |
| Excerpt | Textarea | Optional, max 200 chars |
| Author Name | Text | Optional |
| Featured | Toggle | Default: off |
| Status | Select (Draft/Published) | Required |
| Publish Date | DateTime | Optional (defaults to save time) |
| Tags | Tag input | Optional |

### 7.3 Rich Text Editor

The content field uses a rich text editor supporting:
- Bold, italic, underline
- Headings (H1–H4)
- Ordered and unordered lists
- Blockquotes
- Image embedding (via upload)
- Link insertion
- Code blocks

---

## 8. Gallery Manager Module

### 8.1 Features
- Upload multiple images
- Organize by category
- Reorder via drag-and-drop
- Feature/unfeature images
- Bulk delete

### 8.2 Upload Flow

1. Admin clicks "Upload Images"
2. File picker (multi-select, image/* only)
3. Preview grid shown for confirmation
4. Optional: add title, category, description per image
5. Upload all → progress bar
6. Success: images appear in gallery grid

### 8.3 Category Management

Default categories: Events, Team Photos, Achievements, Behind the Scenes, Fan Content

Admins can create custom categories.

---

## 9. Sponsor Manager Module

### 9.1 Features
- Add/edit/remove sponsors
- Tier management (Title, Gold, Silver, Bronze, Partner)
- Active/inactive toggle
- Display order drag-and-drop
- Logo upload

### 9.2 Sponsor Form

| Field | Input Type | Validation |
|-------|------------|------------|
| Name | Text | Required |
| Logo | File upload | Required |
| Website URL | Text (URL) | Optional |
| Tier | Select | Optional |
| Description | Textarea | Optional |
| Active | Toggle | Default: true |
| Display Order | Number | Auto-assigned |
| Partnership Start | Date | Optional |
| Partnership End | Date | Optional |

---

## 10. Recruitment Inbox Module

### 10.1 Features
- View all recruitment applications
- Filter by status, game, date
- Approve or reject with notes
- Export applications to CSV

### 10.2 Application View

Each application displays:
- Applicant name, age, game, role
- Contact information
- Play style description
- Device/setup info
- Available hours
- Previous experience
- Social links
- Submission date

**Actions:**
- ✅ Approve (moves to active consideration)
- ❌ Reject
- 📝 Add internal notes
- ✉️ Copy contact email

---

## 11. Contact & Fan Messages Module

### 11.1 Contact Messages

| Feature | Description |
|---------|-------------|
| List view | All messages with status indicators |
| Filter | By status (unread/read/replied) |
| Read view | Full message with sender info |
| Mark as read | On open or manual action |
| Delete | Remove message |
| Reply (planned) | Direct reply via EmailJS |

### 11.2 Fan Messages

| Feature | Description |
|---------|-------------|
| List view | All fan messages |
| Approval toggle | Approve for public display on website |
| Delete | Remove message |
| Filter | By approved/pending |

---

## 12. Giveaway Manager Module

### 12.1 Features
- Create giveaways with title, prize, end date
- View all entries
- Select winner (random or manual)
- Mark giveaway as completed

### 12.2 Giveaway Form

| Field | Input Type |
|-------|------------|
| Title | Text |
| Prize Description | Textarea |
| Entry Method | Select (fan message, form, etc.) |
| Start Date | DateTime |
| End Date | DateTime |
| Status | Select (upcoming/active/completed) |

---

## 13. Shop Manager Module

### 13.1 Features
- Add/edit/remove products
- Set prices, stock levels
- Toggle product visibility
- View orders

### 13.2 Product Form

| Field | Input Type | Validation |
|-------|------------|------------|
| Name | Text | Required |
| Description | Textarea | Required |
| Price (INR) | Number | Required |
| Product Image | File upload | Required |
| Category | Select/text | Optional |
| Stock | Number (-1 = unlimited) | Optional |
| Active | Toggle | Default: true |

### 13.3 Orders View

| Column | Description |
|--------|-------------|
| Order ID | Auto-generated |
| Product | Product name |
| Customer | Name + contact |
| Quantity | Number ordered |
| Total | Price × quantity |
| Status | Pending/Processing/Shipped/Delivered |
| Date | Order timestamp |

---

## 14. Hall of Fame & Achievements Module

### 14.1 Achievements Manager

- Add/edit/remove team achievements
- Fields: title, description, game, team, tournament, placement, date, image
- Sorted by date (newest first)

### 14.2 HOF Milestones Manager

- Individual player milestones for Hall of Fame
- Fields: title, description, player, date, category, image

### 14.3 Trophies Manager

- Trophy cabinet display items
- Fields: name, tournament, year, place, image

---

## 15. Analytics Module

### 15.1 Dashboard View

```
┌────────────────────────────────────────────────────┐
│  Date Range: [7 Days ▼]                            │
├─────────────────────────┬──────────────────────────┤
│  Total Visits: 4,230    │  Unique Visitors: 1,840  │
│  Today: 342             │  Week avg: 604/day       │
├─────────────────────────┴──────────────────────────┤
│  Daily Visits Chart (Recharts LineChart)           │
│                                                    │
│  [─────────────────────────────────────────]      │
│  Mon Tue Wed Thu Fri Sat Sun                       │
├────────────────────────────────────────────────────┤
│  Top Pages              │  Traffic Sources          │
│  / (homepage): 1,240    │  Direct: 65%              │
│  /tournaments: 890      │  Social: 22%              │
│  /news: 420             │  Search: 13%              │
└────────────────────────────────────────────────────┘
```

### 15.2 Data Range Options

- Last 7 days
- Last 30 days
- Last 90 days
- Custom range

---

## 16. Staff Manager Module

*(super_admin only)*

### 16.1 Features
- View all staff accounts
- Create new admin/staff accounts
- Edit roles and permissions
- Reset passwords
- Deactivate accounts
- View last login time and login count

### 16.2 Staff Account Form

| Field | Input Type | Notes |
|-------|------------|-------|
| Username | Text | Unique, immutable after creation |
| Password | Password | Min 8 chars; stored as bcrypt hash |
| Confirm Password | Password | Must match |
| Display Name | Text | Shown in panel header |
| Role | Select (admin/staff) | |
| Module Permissions | Checkboxes | Only shown if role = staff |
| Active | Toggle | Deactivate without deleting |

### 16.3 Permission Matrix UI

```
Module Permissions
──────────────────
☑ Players
☑ Teams
☑ Tournaments
☑ News
☐ Gallery
☐ Sponsors
☐ Shop
☑ Recruitment
☐ Analytics
```

---

## 17. Site Settings Module

### 17.1 General Settings

| Setting | Input Type | Description |
|---------|------------|-------------|
| Site Name | Text | Organization name |
| Tagline | Text | Organization tagline |
| Logo | File upload | Main site logo |
| Favicon | File upload | Browser favicon |
| Contact Email | Email | Public contact email |
| Maintenance Mode | Toggle | Shows maintenance page to visitors |

### 17.2 Theme Settings

| Setting | Input Type | Description |
|---------|------------|-------------|
| Primary Color | Color picker | Main brand color |
| Secondary Color | Color picker | Supporting brand color |
| Accent Color | Color picker | Highlight/CTA color |
| Background Color | Color picker | Page background |
| Font Family | Select | Body font |
| Border Radius | Select (none/sm/md/lg/pill) | Global border rounding |

### 17.3 Homepage Settings

| Setting | Input Type | Description |
|---------|------------|-------------|
| Hero Title | Text | Main hero heading |
| Hero Subtitle | Text | Hero subheading |
| CTA 1 Text | Text | Primary button text |
| CTA 1 URL | Text | Primary button link |
| CTA 2 Text | Text | Secondary button text |
| CTA 2 URL | Text | Secondary button link |
| Live Stream URL | Text | Embedded stream URL |
| Live Stream Active | Toggle | Show live badge |

### 17.4 Social Links

| Platform | Field |
|----------|-------|
| Discord | URL |
| Twitter/X | URL |
| YouTube | URL |
| Instagram | URL |
| Twitch | URL |
| Facebook | URL |

### 17.5 Feature Flags

Toggle platform features on/off:
- Shop
- Live Stream Section
- Giveaways
- Recruitment
- Hall of Fame
- Community Page
- Analytics Tracking
- Cookie Consent Banner

---

## 18. Navigation Menu Builder Module

### 18.1 Features
- Add/remove navigation menu items
- Drag-and-drop reorder
- Set label, URL, and target
- Toggle item visibility
- Nested/dropdown items (planned)

### 18.2 Nav Item Form

| Field | Input Type | Description |
|-------|------------|-------------|
| Label | Text | Display text in nav |
| URL | Text | Link target (relative or absolute) |
| Target | Select (`_self`/`_blank`) | Open in same or new tab |
| Visible | Toggle | Show/hide in nav |
| Icon | Select (optional) | Icon to show with label |
| Order | Number | Display order (drag-to-reorder) |

---

## 19. Custom Code Module

*(super_admin only)*

### 19.1 Features
- Inject custom CSS into `<head>` of public site
- Inject custom JavaScript before `</body>` of public site
- Live syntax highlighting (CodeMirror or similar)
- Preview before save

### 19.2 Use Cases
- Custom font imports beyond standard set
- Third-party tracking scripts (Google Analytics, Meta Pixel)
- Emergency style overrides
- A/B testing scripts

### 19.3 Security Notice

> ⚠️ Custom code runs in the user's browser with full page access. This feature is restricted to `super_admin` only. All code is stored as-is without sanitization. Admins are responsible for code correctness and security.

---

## 20. CMS Pages Module

### 20.1 CMS-Driven Pages

The following public pages are fully CMS-managed:
- **About** — Organization story, mission, values, founders
- **Privacy Policy** — Legal privacy information
- **Terms of Service** — Legal terms information
- **Cookie Policy** — Cookie usage information

### 20.2 AboutCMS Editor

| Section | Field | Type |
|---------|-------|------|
| Hero | Title, Subtitle, Background image | Text, File |
| Mission | Heading, Content (rich text) | Text, Rich |
| History | Timeline items (date, event, description) | Array |
| Values | Value cards (icon, title, description) | Array |
| Team/Founders | Linked to founders collection | Auto |
| Statistics | Stat tiles (number, label) | Array |

### 20.3 Legal Pages Editor

Simple rich text editor for each legal page. Changes reflect immediately on the public site via WebSocket sync.

---

## 21. Database Backup & Restore Module

*(admin only)*

### 21.1 Export

| Feature | Description |
|---------|-------------|
| Export button | Downloads full DB as JSON |
| Filename format | `sbg-army-backup-YYYY-MM-DD.json` |
| Contents | All registered collections |
| Sensitive data | Included (passwords as hashes) |

### 21.2 Restore

| Feature | Description |
|---------|-------------|
| File upload | Upload a previously exported JSON |
| Validation | Checks format and version |
| Warning dialog | "This will overwrite ALL data" confirmation |
| Result | All collections replaced; WS broadcast sent |

### 21.3 Auto-Backup (Planned)

Scheduled daily backup to local `/backups/` folder, retained for 30 days.

---

## 22. Activity / Audit Log Module

### 22.1 Log Events

| Event | Logged Info |
|-------|-------------|
| Login | Username, IP, timestamp, success/fail |
| Player created/edited/deleted | Who, what record, timestamp |
| Tournament created/edited | Who, record ID, timestamp |
| Registration approved/rejected | Who, registration ID, timestamp |
| Backup exported | Who, timestamp, file size |
| Database restored | Who, timestamp, backup version |
| Staff account created/edited | Who, target account, timestamp |
| Settings changed | Who, setting key, old/new value, timestamp |
| Custom code saved | Who, timestamp |

### 22.2 Log Display

```
┌──────────────────────────────────────────────────────────┐
│ Timestamp           │ User      │ Action                  │
├──────────────────────────────────────────────────────────┤
│ 2026-07-21 14:32:01 │ admin     │ Player "ShadowX" edited │
│ 2026-07-21 14:31:45 │ admin     │ News article published  │
│ 2026-07-21 13:15:22 │ manager   │ Login successful        │
│ 2026-07-21 11:00:00 │ system    │ Auto-backup completed   │
└──────────────────────────────────────────────────────────┘
```

---

*Admin Panel Specification v3.0 — SBG ARMY Esports Platform — July 2026*
