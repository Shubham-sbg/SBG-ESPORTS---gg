# Brand Guidelines
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Date:** July 2026

---

## 1. Brand Identity

### 1.1 Brand Overview

**SBG ARMY** is a competitive esports organization built on the values of discipline, teamwork, and relentless growth. The brand identity is rooted in military precision combined with the electrifying energy of competitive gaming — professional, formidable, and community-driven.

### 1.2 Brand Personality

| Trait | Description |
|-------|-------------|
| **Competitive** | Always striving for excellence; never settling |
| **Disciplined** | Structured, organized, reliable |
| **Bold** | Confident presence, striking visuals |
| **Community** | Inclusive, fan-first, grassroots roots |
| **Modern** | Cutting-edge tech, forward-looking |

### 1.3 Brand Voice

| Context | Tone | Example |
|---------|------|---------|
| Social media | Energetic, punchy | "Bracket dropped. Fear us. 🔥" |
| News articles | Professional, informative | "SBG ARMY secures top-4 finish..." |
| Tournament announcements | Hype, engaging | "Registration is OPEN. Register or regret." |
| Admin communications | Clear, direct | "Registration approved. Room ID shared." |
| Legal/Policy pages | Formal, precise | "By accessing this platform, you agree to..." |

---

## 2. Logo

### 2.1 Primary Logo

The SBG ARMY logo consists of:
1. **Shield emblem** — Represents protection, defense, and team solidarity
2. **"SBG" lettermark** — Bold, uppercase, tracked out
3. **"ARMY" wordmark** — Military-style, strong weight
4. **Optional tagline** — "COMPETE. CONQUER. RISE."

### 2.2 Logo Variants

| Variant | Usage |
|---------|-------|
| Full color (dark bg) | Primary — use on dark backgrounds |
| Full color (light bg) | Secondary — use on white/light backgrounds |
| Monochrome white | Reversed — use on colored/photo backgrounds |
| Monochrome black | Print — use on light print materials |
| Icon only (shield) | Favicon, app icon, small spaces (≤32px) |

### 2.3 Logo Clear Space

Minimum clear space on all sides = **1× the height of the "A" in ARMY**

```
    ┌─────────────────────────────────────────┐
    │  [clear space]                           │
    │  [clear]  [LOGO]  [clear]               │
    │  [clear space]                           │
    └─────────────────────────────────────────┘
```

### 2.4 Logo Don'ts

- ❌ Do not stretch or distort the logo
- ❌ Do not rotate the logo
- ❌ Do not add drop shadows or effects
- ❌ Do not change individual logo colors
- ❌ Do not place on low-contrast backgrounds
- ❌ Do not use the wordmark without the shield (except in text contexts)
- ❌ Do not recreate the logo in a different font
- ❌ Do not add outlines or strokes

### 2.5 Minimum Size

| Application | Minimum Width |
|-------------|---------------|
| Digital (screen) | 120px |
| Print | 25mm |
| Icon-only | 16px (as favicon) |

---

## 3. Color System

### 3.1 Primary Brand Colors

| Color | Name | HEX | RGB | Usage |
|-------|------|-----|-----|-------|
| 🟣 | SBG Indigo | `#6366F1` | 99, 102, 241 | Primary brand color; buttons, links, accents |
| 🟣 | SBG Violet | `#8B5CF6` | 139, 92, 246 | Secondary; gradients, highlights |
| 🟠 | SBG Gold | `#F59E0B` | 245, 158, 11 | CTAs, achievements, top-tier elements |

### 3.2 Neutral Palette

| Color | Name | HEX | Usage |
|-------|------|-----|-------|
| ⬛ | Deep Navy | `#0F0F1A` | Page background |
| ⬛ | Dark Navy | `#1A1A2E` | Card background |
| ⬛ | Navy Blue | `#16213E` | Elevated surfaces |
| ⬜ | Near White | `#F8FAFC` | Primary text |
| 🔲 | Slate 400 | `#94A3B8` | Secondary text |
| 🔲 | Slate 600 | `#475569` | Muted/disabled |
| 🔲 | Slate 800 | `#1E293B` | Borders |

### 3.3 Semantic Colors

| Color | HEX | Meaning |
|-------|-----|---------|
| `#10B981` | Emerald 500 | Live, active, success, approved |
| `#EF4444` | Red 500 | Error, danger, rejected |
| `#F59E0B` | Amber 500 | Warning, pending, featured |
| `#3B82F6` | Blue 500 | Information, info badge |

### 3.4 Color Usage Rules

1. **Dark backgrounds always** — Never use light backgrounds on the main platform; dark backgrounds are core to the brand
2. **Primary indigo for action** — Buttons, links, and interactive elements use `#6366F1`
3. **Gold for achievement** — Reserve amber/gold for awards, CTAs, and premium content
4. **Limit accent usage** — Never use more than 2 accent colors on a single screen
5. **Ensure contrast** — All text on dark backgrounds must meet WCAG AA (4.5:1 ratio)

### 3.5 Gradient Usage

**Brand gradient (for hero elements and special highlights):**
```css
background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);
```

**Gold gradient (for trophies, achievements, title sponsors):**
```css
background: linear-gradient(135deg, #F59E0B, #FBBF24, #D97706);
```

**Text gradient (for hero headings only):**
```css
background: linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

**Usage rule:** Gradients are reserved for:
- Hero section backgrounds
- Major heading text effects
- Achievement/trophy displays
- Sponsor tier decorations
- Special event banners

Do NOT use gradients on:
- Body text
- Standard buttons (use solid color)
- Navigation backgrounds
- Admin panel backgrounds

---

## 4. Typography

### 4.1 Typefaces

**Display / Headings:**
- **Primary:** Rajdhani (Google Fonts)
- **Fallback:** Exo 2, sans-serif
- **Character:** Military-inspired, modern, impactful

**Body:**
- **Primary:** Inter (Google Fonts)
- **Fallback:** Roboto, system-ui, sans-serif
- **Character:** Clean, readable, professional

**Monospace:**
- **Primary:** JetBrains Mono (Google Fonts)
- **Use:** Game IDs, player UIDs, code, stats numbers

### 4.2 Type Hierarchy

| Level | Font | Size | Weight | Transform | Usage |
|-------|------|------|--------|-----------|-------|
| Hero | Rajdhani | 72px | 800 | UPPERCASE | Main hero text only |
| H1 | Rajdhani | 48px | 700 | Title Case | Page/section titles |
| H2 | Rajdhani | 36px | 700 | Title Case | Section headings |
| H3 | Rajdhani | 24px | 600 | Title Case | Card/panel titles |
| H4 | Inter | 20px | 600 | Title Case | Component labels |
| Body LG | Inter | 18px | 400 | Normal | Lead text |
| Body | Inter | 16px | 400 | Normal | Standard body |
| Small | Inter | 14px | 400 | Normal | Secondary info |
| XS / Label | Inter | 12px | 600 | UPPERCASE | Badges, labels, tags |

### 4.3 Typography Rules

- **Hero headlines:** Rajdhani, bold, often with text-gradient or outlined style
- **Numbers/stats:** JetBrains Mono for in-game IDs, scores, and statistics
- **Labels/badges:** Always uppercase with wide letter-spacing (0.08–0.12em)
- **CTA buttons:** 14px, 600 weight, 0.02em tracking
- **Legal/body text:** Inter 400, 1.6 line-height for readability
- **Minimum readable size:** Never below 12px for any user-facing text

---

## 5. Iconography

### 5.1 Icon Library

**Primary:** Lucide React (line icons, 1.5px stroke weight)

**Why Lucide:**
- Consistent 24×24 grid
- Clean line style matches brand aesthetic
- Tree-shakeable (bundle only what you use)
- MIT licensed

### 5.2 Icon Style Rules

| Rule | Guideline |
|------|-----------|
| Style | Line icons only (no filled icons in nav/UI) |
| Stroke weight | 1.5px (default Lucide) |
| Size in buttons | 16px (sm), 20px (md) |
| Size in navigation | 20px |
| Size in feature tiles | 24–32px |
| Color | Match text color or use brand accent |
| Decorative icons | Can use primary or accent color |

### 5.3 Social Media Icons

Social icons use custom SVG paths (brand-specific shapes):
- Discord — Official Discord icon
- Twitter/X — Official X icon
- YouTube — Official YouTube icon
- Twitch — Official Twitch icon
- Instagram — Official Instagram icon
- Facebook — Official Facebook icon

**Rules for social icons:**
- Always use official brand colors when on white backgrounds
- Use white monochrome versions on dark backgrounds
- Minimum touch target: 44×44px
- Always link to correct platform URL
- Open in new tab (`target="_blank"`)

---

## 6. Photography & Imagery Guidelines

### 6.1 Photography Style

**Do use:**
- High-contrast, dramatic lighting
- Action shots during gameplay (controllers, screens, events)
- Team photos with consistent positioning and lighting
- Tournament/event atmosphere shots
- Close-up character/player portraits with dark backgrounds

**Avoid:**
- Bright, airy "lifestyle" photography (wrong brand tone)
- Stock photography clichés (handshakes, pointing at screens)
- Low resolution or blurry images
- Inconsistent color grading across a section

### 6.2 Image Treatment

**Color grading for consistency:**
- Slightly desaturated base image
- Blue/purple toning in shadows
- Gold/amber toning in highlights
- High contrast to maintain drama

**Overlays on images:**
```css
/* Gradient overlay for text legibility on hero images */
background: linear-gradient(
  to bottom,
  transparent 0%,
  rgba(15, 15, 26, 0.6) 60%,
  rgba(15, 15, 26, 0.95) 100%
);
```

### 6.3 Image Specifications

| Usage | Aspect Ratio | Minimum Resolution | Format |
|-------|-------------|-------------------|--------|
| Player profile | 1:1 (square) | 400×400px | WebP/JPG |
| Team logo | 1:1 or 4:3 | 200×200px | PNG (transparent) |
| News cover | 16:9 | 1200×675px | WebP/JPG |
| Tournament banner | 3:1 | 1200×400px | WebP/JPG |
| Sponsor logo | Variable | 300px wide min | PNG (transparent) |
| Gallery | 4:3 or 16:9 | 1600×900px | WebP/JPG |
| Hero background | 16:9 | 1920×1080px | WebP/JPG |
| Favicon | 1:1 | 512×512px | PNG/SVG |

---

## 7. Sponsor Guidelines

### 7.1 Sponsor Tier Visual Treatment

| Tier | Badge Color | Logo Size | Placement |
|------|-------------|-----------|-----------|
| Title Sponsor | Gold gradient | 240px wide | Hero section, prominent |
| Gold Sponsor | Gold/amber | 180px wide | Sponsor section, top row |
| Silver Sponsor | Silver/gray | 140px wide | Sponsor section, middle row |
| Bronze Sponsor | Bronze | 100px wide | Sponsor section, bottom row |
| Media Partner | Blue | 120px wide | Footer |
| Community Partner | Green | 100px wide | Footer |

### 7.2 Sponsor Display Rules

- Sponsor logos should be displayed against a dark background (use the dark version of their logo)
- Maintain sponsor logo clear space (respect each sponsor's brand guidelines)
- Do not recolor, distort, or add effects to sponsor logos
- Sponsor section on homepage uses horizontal scrolling ticker
- Title sponsor may appear in hero section and page header

### 7.3 Sponsor Ticker Animation

```css
/* Horizontal scroll animation for sponsor logos */
@keyframes ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }  /* -50% = seamless loop */
}

.sponsor-ticker {
  animation: ticker 30s linear infinite;
  display: flex;
  gap: 80px;
  width: max-content;
}
```

---

## 8. Motion & Animation Brand Identity

### 8.1 Animation Personality

SBG ARMY animations feel **precise and powerful** — not bouncy or playful. Movements are intentional, fast, and impactful:

- **Entrances:** Quick fade + directional slide (from below or left)
- **Exits:** Fast fade out
- **Hover states:** Subtle lift + border glow
- **CTAs:** Pulse on load; glow on hover
- **Achievements:** Dramatic reveal (scale + glow)
- **Scores:** Number roll-up counter effect

### 8.2 Neon Glow Effects (Selective Use)

Neon glow is used selectively to add esports energy:

```css
/* Primary neon glow */
box-shadow: 0 0 20px rgba(99, 102, 241, 0.5),
            0 0 40px rgba(99, 102, 241, 0.3),
            0 0 80px rgba(99, 102, 241, 0.1);

/* Gold glow (achievements, #1 rank) */
box-shadow: 0 0 20px rgba(245, 158, 11, 0.6),
            0 0 40px rgba(245, 158, 11, 0.3);
```

**Use neon glow on:**
- Live match badges
- Active tournament cards (hover)
- Achievement/trophy displays
- Hero CTA buttons (hover)
- Featured player cards

**Avoid neon glow on:**
- Body text
- Standard nav links
- Admin panel (minimal glow for focus state only)

---

## 9. Platform-Specific Brand Applications

### 9.1 Website (sbgarmy.gg)

- Full dark theme
- Hero with Three.js particle animation
- Gradient text on main headings
- Neon glow on interactive elements
- Animated section entries

### 9.2 Discord Server

- Server icon: Shield emblem (icon-only logo variant)
- Banner: Gradient hero artwork with "SBG ARMY" wordmark
- Role colors: Match tier colors (Captain=Gold, Player=Indigo, Fan=Gray)
- Channel emoji: Use consistent set aligned with brand icons

### 9.3 Social Media Profiles

**Profile images:** Icon-only shield logo, white on brand indigo background

**Cover images:** 
- Gradient background with "SBG ARMY" wordmark
- Current tagline or season identifier
- Tournament countdown (event-specific covers)

**Post format:**
- Achievement posts: Dark background, player photo, gold accent, bold stat
- Tournament announcements: Gradient banner, bold headline, key details
- Match results: Score card, team logos, result badge

### 9.4 In-Game Jerseys / Uniforms

*(When applicable)*

- Primary: Deep navy base with SBG indigo accents
- Secondary: White base with SBG indigo primary
- Number font: Custom military-style stencil
- Logo placement: Left chest (primary), back collar (wordmark)
- Sponsor placement: Chest (title sponsor), sleeve (supporting sponsors)

---

## 10. Brand Assets Storage

All brand assets should be stored in the platform at:
- Logos: `/uploads/misc/logos/`
- Sponsor logos: `/uploads/sponsors/`
- Tournament banners: `/uploads/tournaments/`
- Team logos: `/uploads/teams/`

Master source files (SVG, PSD, AI) should be maintained in a separate secure design repository outside the platform.

---

*Brand Guidelines v3.0 — SBG ARMY Esports Platform — July 2026*
