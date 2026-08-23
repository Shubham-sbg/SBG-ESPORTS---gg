# UI/UX Design System
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Date:** July 2026

---

## 1. Design Philosophy

### 1.1 Design Language

The SBG ARMY platform embraces an **esports-native aesthetic**: dark backgrounds, neon accent colors, sharp geometric elements, and smooth motion. The design communicates competitive energy while maintaining professional clarity.

**Core Principles:**
1. **Dark-first** — Dark backgrounds reduce eye strain for gaming audiences
2. **Motion matters** — Animations communicate brand energy, not decoration
3. **Hierarchy through contrast** — Content priority communicated by luminance and scale
4. **Mobile-first** — Built for thumbs, enhanced for mouse

---

## 2. Color Palette

### 2.1 Core Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--primary-color` | `#6366F1` (Indigo) | Primary actions, highlights, links |
| `--secondary-color` | `#8B5CF6` (Violet) | Secondary elements, gradients |
| `--accent-color` | `#F59E0B` (Amber) | CTAs, badges, live indicators |
| `--background-color` | `#0F0F1A` (Deep Navy) | Page backgrounds |
| `--surface-color` | `#1A1A2E` (Dark Navy) | Cards, panels |
| `--surface-2` | `#16213E` (Navy Blue) | Elevated surfaces |
| `--text-primary` | `#F8FAFC` (Near White) | Primary text |
| `--text-secondary` | `#94A3B8` (Slate 400) | Secondary, helper text |
| `--text-muted` | `#475569` (Slate 600) | Disabled, placeholder |
| `--border-color` | `#1E293B` (Slate 800) | Borders, dividers |
| `--error-color` | `#EF4444` (Red 500) | Errors, destructive actions |
| `--success-color` | `#10B981` (Emerald 500) | Success states |
| `--warning-color` | `#F59E0B` (Amber 500) | Warnings |
| `--info-color` | `#3B82F6` (Blue 500) | Information |

> **Note:** All color values are configurable via Admin Settings panel and injected as CSS custom properties at runtime.

### 2.2 Gradients

```css
/* Hero gradient */
--gradient-hero: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);

/* Card shimmer */
--gradient-card: linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);

/* Gold accent (for achievements, top tier) */
--gradient-gold: linear-gradient(135deg, #F59E0B, #FBBF24, #D97706);

/* Text gradient for hero headings */
--gradient-text: linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899);
```

### 2.3 Semantic Color Usage

| State | Color | Example |
|-------|-------|---------|
| Active / Live | `#10B981` (Green) | Live match indicator |
| Pending | `#F59E0B` (Amber) | Payment pending badge |
| Approved | `#10B981` (Green) | Registration approved |
| Rejected | `#EF4444` (Red) | Registration rejected |
| Draft | `#6B7280` (Gray) | Draft article status |
| Featured | `#F59E0B` (Gold) | Featured player/post |
| Title Sponsor | `#F59E0B` (Gold) | Title sponsor tier |
| Gold Sponsor | `#FBBF24` | Gold tier |
| Silver Sponsor | `#94A3B8` | Silver tier |

---

## 3. Typography

### 3.1 Font Stack

| Role | Font | Fallback |
|------|------|---------|
| Display (headings) | `"Rajdhani"` | `"Exo 2"`, `sans-serif` |
| Body | `"Inter"` | `"Roboto"`, `system-ui`, `sans-serif` |
| Mono (code, IDs) | `"JetBrains Mono"` | `"Fira Code"`, `monospace` |

> Fonts are loaded via Google Fonts CDN with `font-display: swap` to prevent FOIT.

### 3.2 Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-hero` | 72px / 4.5rem | 1.1 | 800 | Hero heading |
| `text-display` | 48px / 3rem | 1.15 | 700 | Page titles |
| `text-h1` | 36px / 2.25rem | 1.2 | 700 | Section headings |
| `text-h2` | 30px / 1.875rem | 1.25 | 600 | Sub-section headings |
| `text-h3` | 24px / 1.5rem | 1.3 | 600 | Card headings |
| `text-h4` | 20px / 1.25rem | 1.35 | 600 | Component headings |
| `text-body-lg` | 18px / 1.125rem | 1.6 | 400 | Lead paragraphs |
| `text-body` | 16px / 1rem | 1.6 | 400 | Body copy |
| `text-sm` | 14px / 0.875rem | 1.5 | 400 | Secondary text, labels |
| `text-xs` | 12px / 0.75rem | 1.4 | 400 | Captions, badges |

### 3.3 Typography Rules

- **Hero headings:** All-caps or mixed-case with text-gradient or neon glow
- **Section titles:** Mixed-case, semibold, with colored accent word
- **Body text:** Regular weight, comfortable line-height (1.6)
- **Labels/badges:** All-caps, tracking-widest (letter-spacing: 0.1em)
- **Game names:** Always displayed in their official casing (BGMI, not bgmi)

---

## 4. Spacing System

Based on an 8px base unit (Tailwind's default 4px base × 2):

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Micro spacing |
| `space-2` | 8px | Tight spacing |
| `space-3` | 12px | Component internal |
| `space-4` | 16px | Standard spacing |
| `space-6` | 24px | Component gap |
| `space-8` | 32px | Section padding |
| `space-12` | 48px | Large section gap |
| `space-16` | 64px | Section margin |
| `space-24` | 96px | Page section padding |
| `space-32` | 128px | Hero section padding |

---

## 5. Component Library

### 5.1 Buttons

**Primary Button:**
```css
background: var(--primary-color);
color: white;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
font-size: 14px;
letter-spacing: 0.02em;
transition: all 0.2s ease;

/* Hover */
background: lighten(--primary-color, 10%);
transform: translateY(-1px);
box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
```

**Secondary Button:**
```css
background: transparent;
color: var(--primary-color);
border: 1px solid var(--primary-color);
padding: 11px 23px;  /* account for border */
border-radius: 8px;

/* Hover */
background: rgba(99, 102, 241, 0.1);
```

**Danger Button:**
```css
background: var(--error-color);
color: white;

/* Hover */
background: darken(--error-color, 10%);
```

**Ghost Button:**
```css
background: transparent;
color: var(--text-secondary);
padding: 8px 16px;

/* Hover */
color: var(--text-primary);
background: rgba(255,255,255,0.05);
```

**Icon Button:**
```css
width: 40px;
height: 40px;
border-radius: 8px;
display: flex;
align-items: center;
justify-content: center;
```

**Loading State (all buttons):**
- Spinner icon replaces text
- Button disabled during loading
- Opacity: 0.7

---

### 5.2 Cards

**Standard Card:**
```css
background: var(--surface-color);
border: 1px solid var(--border-color);
border-radius: 12px;
padding: 24px;
transition: transform 0.2s, border-color 0.2s;

/* Hover */
border-color: rgba(99, 102, 241, 0.4);
transform: translateY(-2px);
```

**Player Card:**
```
┌─────────────────────────┐
│  [Avatar 64×64]         │
│  Name (text-h3)         │
│  Role • Game (text-sm)  │
│  ┌──┬──┬──┐             │
│  │KD│Win│Mtch│           │
│  └──┴──┴──┘             │
│  [Social icons]          │
└─────────────────────────┘
```

**Tournament Card:**
```
┌─────────────────────────┐
│  [Banner image]          │
│  [Live/Upcoming badge]   │
│  Name (text-h3)          │
│  Game • Format           │
│  📅 Start date           │
│  💰 Prize pool           │
│  [Register button]       │
└─────────────────────────┘
```

**News Article Card:**
```
┌─────────────────────────┐
│  [Cover image 16:9]     │
│  [Category badge]        │
│  Title (text-h4)         │
│  Excerpt (text-sm, 2 ln) │
│  Date • Author           │
└─────────────────────────┘
```

---

### 5.3 Badges & Status Indicators

```css
/* Base badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Variants */
.badge-success { background: rgba(16,185,129,0.15); color: #10B981; }
.badge-warning { background: rgba(245,158,11,0.15); color: #F59E0B; }
.badge-error   { background: rgba(239,68,68,0.15);  color: #EF4444; }
.badge-info    { background: rgba(59,130,246,0.15);  color: #3B82F6; }
.badge-gray    { background: rgba(107,114,128,0.15); color: #9CA3AF; }
```

**Live Indicator:**
```css
.live-dot {
  width: 8px;
  height: 8px;
  background: #10B981;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.5); opacity: 0.7; }
}
```

---

### 5.4 Forms

**Text Input:**
```css
.input {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 14px;
  width: 100%;
  transition: border-color 0.2s;
}

/* Focus */
.input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Error */
.input.error {
  border-color: var(--error-color);
}
```

**Form Layout:**
```
Label (text-sm, text-secondary)
Input field
Error message (text-xs, text-error) — shown below on validation fail
```

**Select / Dropdown:**
- Uses Radix UI `Select` primitive
- Custom styled to match input design
- Dropdown floats above content on mobile

---

### 5.5 Navigation

**Desktop Navbar:**
```
┌──────────────────────────────────────────────────────┐
│ [LOGO]    Home  Teams  Tournaments  News  Community  [Join Now] │
└──────────────────────────────────────────────────────┘
```
- Fixed top position, `position: sticky; top: 0; z-index: 50`
- Background: glassmorphism `backdrop-filter: blur(20px); background: rgba(15,15,26,0.9)`
- Active link: colored underline with color matching `--primary-color`
- Scroll behavior: shrinks slightly on scroll (transform scale)

**Mobile Navbar:**
```
┌──────────────────┐
│ [LOGO]     [☰]  │
└──────────────────┘

[Slide-out drawer from right]
┌──────────────────────────┐
│            [×]           │
│                          │
│  Home                    │
│  Teams                   │
│  Tournaments             │
│  News                    │
│  Community               │
│                          │
│  [Join Now]              │
│  [Discord] [Twitter]     │
└──────────────────────────┘
```

---

### 5.6 Tables (Admin Panel)

```
┌─────┬──────────────┬──────────┬────────┬──────────┐
│  #  │    Name      │  Status  │  Game  │ Actions  │
├─────┼──────────────┼──────────┼────────┼──────────┤
│  1  │ ShadowX      │ ● Active │  BGMI  │ [✏️][🗑️] │
│  2  │ GhostPlayer  │ ● Active │  BGMI  │ [✏️][🗑️] │
│  3  │ RetiredLegnd │ ○ Retired│  PUBG  │ [✏️][🗑️] │
└─────┴──────────────┴──────────┴────────┴──────────┘
[← Prev]  Page 1 of 5  [Next →]
```

- Zebra striping: alternating row backgrounds
- Hover: row highlight with border-left accent
- Sortable columns: up/down chevrons
- Pagination: max 25 records per page

---

### 5.7 Modals / Dialogs

```
[Backdrop: rgba(0,0,0,0.7) with blur]
┌───────────────────────────────────┐
│ Modal Title              [×]      │
├───────────────────────────────────┤
│                                   │
│  Modal content / form             │
│                                   │
├───────────────────────────────────┤
│  [Cancel]              [Confirm]  │
└───────────────────────────────────┘
```

- Uses Radix UI `Dialog` primitive
- Entry animation: scale + fade in (0.2s)
- Exit animation: scale + fade out (0.15s)
- Closes on: backdrop click, Escape key, ×
- Max width: 560px on desktop; full-screen on mobile

---

### 5.8 Toast Notifications

```
[Bottom-right corner]
┌───────────────────────────────┐
│ ✓  Player saved successfully  │
└───────────────────────────────┘
```

- Position: `fixed; bottom: 24px; right: 24px`
- Auto-dismiss: 4 seconds
- Slide-in from right, slide-out to right
- Types: success (green), error (red), warning (amber), info (blue)
- Stack multiple toasts vertically

---

## 6. Animation Standards

### 6.1 Timing Functions

| Name | CSS Value | Usage |
|------|-----------|-------|
| `ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Most UI transitions |
| `ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful elements, cards |
| `ease-sharp` | `cubic-bezier(0.4, 0, 0.6, 1)` | Quick state changes |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entry animations |

### 6.2 Duration Standards

| Category | Duration | Usage |
|----------|----------|-------|
| Micro | 100ms | Hover state changes |
| Fast | 200ms | Button presses, tooltip show |
| Normal | 300ms | Card hover, modal backdrop |
| Slow | 400ms | Modal entry, drawer open |
| Very Slow | 600ms+ | Page transitions, hero elements |

### 6.3 Framer Motion Presets

**Fade Up (section entry):**
```javascript
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
};
```

**Stagger Children (grid of cards):**
```javascript
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};
const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};
```

**Scale In (modals):**
```javascript
const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 }
};
```

**Slide In Right (drawer):**
```javascript
const slideRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { type: 'tween', duration: 0.3 }
};
```

### 6.4 Three.js Hero Animation

The hero section runs a WebGL particle scene:
- **Particle count:** 3,000–5,000 points
- **Motion:** Slow drift with mouse-parallax
- **Color:** Gradient from `--primary-color` to `--secondary-color`
- **Frame rate:** Locked to requestAnimationFrame (typically 60fps)
- **Fallback:** CSS keyframe animated particles (no WebGL needed)

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Target Device |
|------------|-------|---------------|
| `xs` | < 480px | Small phones |
| `sm` | 480px–767px | Large phones |
| `md` | 768px–1023px | Tablets |
| `lg` | 1024px–1279px | Small laptops |
| `xl` | 1280px–1535px | Desktops |
| `2xl` | ≥ 1536px | Large screens |

### 7.1 Layout Behavior by Breakpoint

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Navbar | Hamburger | Hamburger | Full links |
| Hero text | 36px | 48px | 72px |
| Team cards | 1 column | 2 columns | 3–4 columns |
| News grid | 1 column | 2 columns | 3 columns |
| Admin sidebar | Hidden (drawer) | Hidden (drawer) | Fixed side |
| Admin tables | Scrollable horizontal | Scrollable | Full width |
| Tournament bracket | Horizontal scroll | Horizontal scroll | Full width |

### 7.2 Mobile-First Utility Classes

The platform uses Tailwind's mobile-first responsive prefixes:
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

---

## 8. Icons

### 8.1 Icon System

**Primary library:** Lucide React (`lucide-react`)

| Usage | Icon |
|-------|------|
| Players | `User`, `Users` |
| Teams | `Shield` |
| Tournaments | `Trophy` |
| Matches | `Swords` |
| News | `Newspaper` |
| Gallery | `Image`, `Images` |
| Settings | `Settings`, `Cog` |
| Analytics | `BarChart2`, `TrendingUp` |
| Live | `Zap`, `Radio` |
| Shop | `ShoppingBag` |
| Recruitment | `UserPlus` |
| Dashboard | `LayoutDashboard` |
| Logout | `LogOut` |
| Delete | `Trash2` |
| Edit | `Pencil` |
| Add | `Plus`, `PlusCircle` |
| Upload | `Upload`, `ImagePlus` |
| Download | `Download` |
| Social: YouTube | Custom SVG |
| Social: Twitter/X | Custom SVG |
| Social: Discord | Custom SVG |
| Social: Twitch | Custom SVG |
| Social: Instagram | Custom SVG |

### 8.2 Icon Sizes

| Size | Pixel | Usage |
|------|-------|-------|
| xs | 12px | Inline text icons |
| sm | 16px | Button icons, table actions |
| md | 20px | Navigation icons |
| lg | 24px | Section icons, feature tiles |
| xl | 32px | Hero icons, empty states |
| 2xl | 48px | Decorative, card icons |

---

## 9. Admin Panel Design

### 9.1 Layout Structure

```
┌──────────────────────────────────────────────────────┐
│  [Logo]  SBG ARMY Admin          [User] [Logout]     │  ← Header (60px)
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ Sidebar  │              Content Area                 │
│  240px   │                                           │
│          │  [Module Title]      [+ Add Button]       │
│ • Dashboard│  ─────────────────────────────────────  │
│ • Players │                                           │
│ • Teams  │  [Data Table / Form / Chart]              │
│ • ...    │                                           │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

### 9.2 Admin Color Scheme

The admin panel uses a slightly lighter dark theme to differentiate from the public site:
- Background: `#0F172A` (Slate 900)
- Sidebar: `#1E293B` (Slate 800)
- Content: `#0F172A`
- Cards: `#1E293B`
- Borders: `#334155` (Slate 700)
- Active nav item: Left border accent + background tint

### 9.3 Dashboard Widgets

```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Players │ │  Teams  │ │ Tourns  │ │  Posts  │
│   147   │ │    8    │ │    3    │ │   24    │
│ +12 wk  │ │ active  │ │ active  │ │published│
└─────────┘ └─────────┘ └─────────┘ └─────────┘

┌─────────────────────────┐ ┌──────────────────────┐
│   Visit Analytics       │ │  Recent Messages      │
│   [Line chart 7/30d]    │ │  • John: "hi team"   │
│                         │ │  • Sarah: "...apply" │
└─────────────────────────┘ └──────────────────────┘
```

---

## 10. Accessibility Standards

| Standard | Target |
|----------|--------|
| Color contrast | WCAG AA (4.5:1 minimum) |
| Focus indicators | Visible 2px outline on all interactive elements |
| Screen reader | ARIA labels on all icon-only buttons |
| Keyboard nav | Full keyboard navigation in admin panel |
| Alt text | Required for all content images |
| Form labels | All inputs have associated `<label>` |
| Error messaging | Errors announced to screen readers via `aria-live` |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables animations |

---

*UI/UX Design System v3.0 — SBG ARMY Esports Platform — July 2026*
