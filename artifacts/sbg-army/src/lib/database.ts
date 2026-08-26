
export interface CtaItem {
  id: string;
  title: string;
  buttonText: string;
  url: string;
  enabled: boolean;
  openInNewTab: boolean;
  order: number;
  createdAt?: number | string;
  updatedAt?: number | string;
}
import { get, set, createStore } from 'idb-keyval';
import { apiGetAll, apiPost, apiPostBulk, connectWs, onWsReconnect } from './wsClient';

export interface Player {
  id: string; name: string; ign: string; role: string; game: string;
  image: string; visible: boolean; order: number;
  status: string; social?: string;
  // Enhanced profile fields
  teamName?: string;
  country?: string;
  achievements?: string[];
  mvpCount?: number;
  kdRatio?: string;
  kdRatioImage?: string;
  uid?: string;
  socialInstagram?: string;
  socialYoutube?: string;
  socialFacebook?: string;
  socialDiscord?: string;
}

export interface Match {
  id: string; title: string; opponent: string; game: string;
  mode: string;
  round: string;
  date: string; time: string; status: string; score?: string;
}

export interface ScheduleEvent {
  id: string; eventType: string;
  teamName: string; opponentName: string; game: string;
  date: string; time: string; status: string; notes: string;
}

export interface Sponsor {
  id: string; name: string; logo: string; link: string;
  visible: boolean; order: number; width?: number; height?: number;
  category?: 'main' | 'gold' | 'silver' | 'community';
  description?: string;
}

export interface Post {
  id: string; title: string; description: string; thumbnail: string;
  image?: string; content?: string; createdAt?: number;
  category: string; date: string; visible: boolean;
}

/** @deprecated Use Post instead */
export type NewsPost = Post;

export interface Game {
  id: string; name: string; logo: string; enabled: boolean; order: number;
}

export interface Creator {
  id: string; name: string; ign: string; role: string; photo: string;
  contentTypes: string[]; visible: boolean; order: number; social?: string;
}

export interface Founder {
  id: string; name: string; designation: string; photo: string; description: string;
  type: 'founder' | 'management';
  socialInstagram: string; socialTwitter: string; socialYoutube: string;
  visible: boolean; order: number;
}

export interface ShopItem {
  id: string; title: string; image: string; price: number; discountPrice: number;
  description: string; stockStatus: string;
  sizes?: string[]; colors?: string[]; upiId?: string; upiQr?: string;
  visible: boolean; order: number;
}

export interface Tournament {
  id: string; title: string; logo: string; game: string;
  type: string;
  slots: number; prizePool: string; entryFee: number; entryType: 'free' | 'paid';
  upiId?: string; upiQr?: string;
  registrationDeadline: string; matchDate: string; matchTime: string;
  registrationStatus: string;
  roomId?: string; roomPassword?: string; roomIdReleased?: boolean;
  roomIdScheduled?: string;
  rules?: string; description?: string; visible: boolean; createdAt: number;
}

export interface Registration {
  id: string; tournamentId: string; tournamentTitle: string;
  teamName: string; leaderName: string; leaderUid: string;
  leaderWhatsApp: string; leaderAge: string;
  player2Uid?: string; player3Uid?: string; player4Uid?: string; substituteUid?: string;
  paymentScreenshot?: string; paymentStatus: 'pending' | 'verified' | 'rejected';
  status: 'pending' | 'approved' | 'rejected' | 'correction_required';
  adminNote?: string; createdAt: number;
}

export interface FanMessage {
  id: string; type: 'feedback' | 'newsletter' | 'discord' | 'whatsapp' | 'other';
  name: string; email?: string; message?: string; whatsapp?: string;
  read: boolean; createdAt: number;
}

export interface Giveaway {
  id: string; title: string; rules: string; reward: string;
  deadline: string; status: 'active' | 'ended' | 'draft' | 'winner_announced';
  winners?: string[]; visible: boolean; createdAt: number;
}

export interface CollabRequest {
  id: string; name: string; organization: string; purpose: string;
  budget?: string; email: string; phone?: string; message?: string;
  read: boolean; status: 'new' | 'reviewing' | 'accepted' | 'rejected'; createdAt: number;
}

export interface Video {
  id: string; title: string; url: string; thumbnail?: string;
  embedUrl?: string;
  videoType?: 'upload' | 'youtube' | 'instagram';
  description?: string;
  category: 'highlight' | 'match' | 'announcement' | 'other';
  visible: boolean; order: number; createdAt: number;
}

export interface FacilitySection {
  id: string; title: string; description: string; image: string;
  icon?: string; visible: boolean; order: number;
}

export interface FacilityStat {
  id: string; label: string; value: string; color: string;
  suffix?: string; icon?: string; position?: number; visible?: boolean; numericEnd?: number;
}

export interface VisitRecord {
  id: string; timestamp: number; date: string; page: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export interface Settings {
  logo: string; organizationName: string; tagline: string;
  primaryColor: string; secondaryColor: string; accentColor: string;
  maintenanceMode: boolean; maintenanceMessage: string;
  socialDiscord: string; socialYoutube: string; socialInstagram: string; socialTwitter: string;
  socialWhatsApp?: string; socialFacebook?: string;
  upiId?: string; upiQr?: string;
  announcementText?: string;
  supportWhatsApp?: string;
  supportEmail?: string;
  heroVideoUrl?: string;
  heroImageUrl?: string;
  favicon?: string;
  appleTouchIcon?: string;
  metaTitle?: string;
  metaDescription?: string;
  analyticsId?: string;
  recruitmentPopupTitle?: string;
  recruitmentPopupSubtitle?: string;
  recruitmentPopupText?: string;
  cookieBannerEnabled?: boolean;
  googleLoginEnabled?: boolean;
  activeTheme?: 'classic' | 'classic-sbg-army' | 'classic-sbg-esports' | 'motion' | 'cyberpunk' | 'luxury_gold' | 'royal' | 'elite' | 'new-esports' | 'pro-arena' | 'champions';
  // Loading Screen
  loadingLogo?: string;
  loadingParticles?: boolean;
  loadingGlow?: boolean;
  loadingSkipButton?: boolean;
  loadingTips?: string[];
  loadingDuration?: number;
  loadingBg?: 'dark' | 'gold' | 'grid' | 'neon';
  // Streaming Hub
  streamingYoutube?: string;
  streamingTwitch?: string;
  streamingKick?: string;
  streamingFacebook?: string;
  streamingInstagram?: string;
  // Downloads / Media Kit
  wallpapers?: { id: string; title: string; url: string; thumb?: string; resolution?: string }[];
  mediaKitUrl?: string;
  pressKitUrl?: string;
  // Notifications
  notifications?: { id: string; title: string; body: string; type: 'info'|'success'|'warning'|'alert'; createdAt: number; visible: boolean }[];
  // Hero Stats (count-up numbers shown in hero section)
  heroStats?: { value: string; label: string; numericEnd: number; suffix: string; icon?: string; position?: number; visible?: boolean }[];
  // Legal pages (rich text HTML)
  legalPages?: {
    privacyPolicy?: string;
    terms?: string;
    cookies?: string;
    refund?: string;
    dmca?: string;
    disclaimer?: string;
  };
  // HOF page settings
  hofPageTitle?: string;
  hofPageSubtitle?: string;
  // Trophy room settings
  trophyRoomTitle?: string;
  trophyRoomSubtitle?: string;
  // Records page settings
  recordsPageTitle?: string;
  // Team History settings
  teamHistoryTitle?: string;
  // Stats dashboard settings
  statsPageTitle?: string;
  // Feedback page settings
  feedbackPageTitle?: string;
  feedbackPageSubtitle?: string;
  // Schedule page settings
  schedulePageTitle?: string;
  // Facility Section settings
  facilityBadge?: string;
  facilityTitle?: string;
  facilitySubtitle?: string;
  facilityIcon?: string;
  // ── Hero Section text ──────────────────────────────────────────────────
  heroBadgeText?: string;
  heroCtaJoinLabel?: string;
  heroCtaJoinVisible?: boolean;
  heroCtaTournamentLabel?: string;
  heroCtaTournamentVisible?: boolean;
  heroCtaLiveLabel?: string;
  heroCtaLiveVisible?: boolean;
  // ── Footer text ────────────────────────────────────────────────────────
  footerSupportTitle?: string;
  footerSupportText?: string;
  footerQuickLinksTitle?: string;
  footerExploreTitle?: string;
  footerText?: string;
  footerCopyright?: string;
  footerDescription?: string;
  footerExploreLinks?: { id: string; label: string; href: string }[];
  // ── Countdown ────────────────────────────────────────────────────────────
  countdownEnabled?: boolean;
  countdownTargetDate?: string;
  countdownTitle?: string;
  countdownExpiredMessage?: string;
  // ── Background Manager ───────────────────────────────────────────────────
  bgParticlesEnabled?: boolean;
  bgParticleColor?: string;
  bgGlowEnabled?: boolean;
  bgAnimationSpeed?: number;
  bgOverlayOpacity?: number;
  // ── Hero extras ──────────────────────────────────────────────────────────
  heroOverlayOpacity?: number;
  // ── Navigation text ────────────────────────────────────────────────────
  navBadgeText?: string;
  // ── About page hero text (structured About content lives in db.about) ──
  aboutBadgeText?: string;
  aboutHeroDescription?: string;
  // ── Contact page content ──────────────────────────────────────────────
  contactIntro?: string;
  contactCategories?: string[];
  contactHours?: string[];
  // ── Recruitment / Join page content ────────────────────────────────────
  joinIntro?: string;
  joinRequirements?: string[];
  joinInstructions?: string;
  // ── Hall of Fame / Achievements intro text ─────────────────────────────
  hofIntroText?: string;
  achievementsIntroText?: string;
  // ── SEO ─────────────────────────────────────────────────────────────────
  seoOgImage?: string;
  seoKeywords?: string;
  // ── External Links ────────────────────────────────────────────────────────
  externalLinksVisible?: boolean;
  externalLinks?: ExternalLink[];
  ctaEnabled?: boolean;
  // ── Ad Provider Manager Settings ─────────────────────────────────────────
  adProviders?: AdProviderSettings;
}

export interface ExternalLink {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  order: number;
}

export interface AdProviderSettings {
  activeProvider: 'none' | 'adsense' | 'hilltopads' | 'custom' | 'both';
  adsense: {
    enabled: boolean;
    publisherId: string;
    autoAdsEnabled: boolean;
    headerSlotId?: string;
    sidebarSlotId?: string;
    inArticleSlotId?: string;
    scriptSnippet?: string;
  };
  hilltopads: {
    enabled: boolean;
    siteKey?: string;
    zoneId?: string;
    popunderScript?: string;
    bannerScript?: string;
    directLink?: string;
    nativeAdScript?: string;
    antiAdblockEnabled?: boolean;
  };
  customProvider?: {
    enabled: boolean;
    name: string;
    headerScript?: string;
    bodyScript?: string;
  };
  fallbackProvider?: 'none' | 'adsense' | 'hilltopads' | 'custom';
  antiAdblockBypass?: boolean;
  globalAdsEnabled?: boolean;
}

// ── About Page CMS ───────────────────────────────────────────────────────
export interface AboutStat { id: string; label: string; value: string; icon?: string; color?: string; }
export interface AboutTimelineItem { id: string; year: string; title: string; description: string; }
export interface AboutValue { id: string; icon: string; title: string; description: string; }
export interface AboutImage { id: string; url: string; caption?: string; }
export interface AboutVideo { id: string; url: string; title?: string; }
export interface AboutContent {
  heading: string;
  description: string;
  mission: string;
  vision: string;
  story: string;
  stats: AboutStat[];
  timeline: AboutTimelineItem[];
  values: AboutValue[];
  images: AboutImage[];
  videos: AboutVideo[];
}

// ── FAQ CMS ──────────────────────────────────────────────────────────────
export interface FaqItem {
  id: string; question: string; answer: string;
  category?: string; order: number; visible: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  playerName: string;
  productId: string;
  productTitle: string;
  size?: string;
  quantity: number;
  price: number;
  amount: number;
  paymentScreenshot?: string;
  notes?: string;
  status: 'waiting' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: number;
}

export interface Ad {
  id: string;
  title?: string;
  adType?: string;
  placement: string;
  imageUrl: string;
  link: string;
  enabled: boolean;
  script?: string;
  iframeSrc?: string;
  videoUrl?: string;
  startDate?: string;
  endDate?: string;
  deviceTarget?: string;
  popupDelay?: number;
  popupFrequency?: string;
  targetPages?: string[];
}

export interface Analytics {
  totalVisits: number; todayVisits: number; weeklyVisits: number;
  lastVisitDate: string;
  visitHistory: { date: string; count: number }[];
  visitRecords: VisitRecord[];
  manualTodayVisits: number | null;
  manualWeeklyVisits: number | null;
  manualTotalVisits: number | null;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  icon?: string;
}

export interface Navigation {
  items: NavigationItem[];
  /** Quick-access shortcut grid shown in the mobile menu.
   *  Empty array = fall back to the hardcoded SHORTCUT_NAV defaults. */
  shortcuts: NavigationItem[];
}

export interface StaffAccount {
  id: string; name: string; email: string; password: string;
  role: 'admin' | 'staff'; allowedModules: string[];
  active: boolean; createdAt: number; photo?: string;
}

export interface GalleryItem {
  id: string; title: string; image: string; category: string;
  date: string; featured: boolean; visible: boolean;
}

export type FeatureState = 'enabled' | 'hidden' | 'featured';
export interface FeatureConfig {
  state: FeatureState;
  placements: string[];
}
export interface SiteFeatures {
  sections: Record<string, FeatureConfig | boolean>;
  pages: Record<string, FeatureConfig | boolean>;
}

export function isFeatureActive(config: FeatureConfig | boolean | undefined): boolean {
  if (config === undefined) return true;
  if (typeof config === 'boolean') return config;
  return config.state !== 'hidden';
}

export function isFeatureState(config: FeatureConfig | boolean | undefined, state: FeatureState): boolean {
  if (config === undefined) return state === 'enabled';
  if (typeof config === 'boolean') return (config ? 'enabled' : 'hidden') === state;
  return config.state === state;
}

export function getFeaturePlacements(config: FeatureConfig | boolean | undefined): string[] {
  if (config === undefined || typeof config === 'boolean') return [];
  return config.placements || [];
}

export function isPlacementActive(config: FeatureConfig | boolean | undefined, placement: string): boolean {
  if (config === undefined) return true;
  if (typeof config === 'boolean') return config;
  if (config.state === 'hidden') return false;
  if (Array.isArray(config.placements)) {
    return config.placements.includes(placement);
  }
  return true;
}

export type AdStatus = 'active' | 'expired' | 'upcoming' | 'disabled';

export function getAdStatus(ad: Ad): AdStatus {
  if (ad.enabled === false) return 'disabled';
  const now = new Date();
  if (ad.startDate) {
    const start = new Date(ad.startDate);
    start.setHours(0, 0, 0, 0);
    if (now < start) return 'upcoming';
  }
  if (ad.endDate) {
    const end = new Date(ad.endDate);
    end.setHours(23, 59, 59, 999);
    if (now > end) return 'expired';
  }
  return 'active';
}

export function isAdActive(ad: Ad): boolean {
  return getAdStatus(ad) === 'active';
}

export function matchesAdDevice(target?: string): boolean {
  if (!target || target === 'all') return true;
  if (typeof window === 'undefined') return true;
  const w = window.innerWidth;
  if (target === 'mobile') return w < 768;
  if (target === 'tablet') return w >= 768 && w < 1024;
  if (target === 'desktop') return w >= 1024;
  return true;
}


export interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  projectTitle: string;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface PlayerUser {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  uid: string;
  preferredGame: string;
  whatsapp: string;
  country: string;
  email?: string;
  createdAt: number;
}

export interface Project {
  id: string; title: string; description: string;
  status: 'planning' | 'active' | 'review' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string[]; startDate: string; deadline: string;
  progress: number; tags: string[]; createdAt: number;
}

export interface Task {
  id: string; title: string; description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string[]; dueDate: string; projectId?: string;
  tags: string[]; createdAt: number;
}

// ── Weekly Schedule ────────────────────────────────────────────────────────
export interface WeeklyEvent {
  id: string;
  title: string;
  game: string;
  gameLogo?: string;
  banner?: string;
  tournamentName: string;
  eventType: 'match' | 'practice' | 'scrim' | 'tournament' | 'community' | 'training' | 'other';
  matchType: 'solo' | 'duo' | 'squad' | 'tdm' | '5v5' | 'custom' | 'open' | 'invitational';
  date: string;           // ISO date
  time: string;           // "HH:MM"
  duration?: number;      // minutes
  venue?: string;         // online / city
  streamUrl?: string;
  ticketUrl?: string;
  registerUrl?: string;
  reminderEnabled?: boolean;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled' | 'postponed';
  opponent?: string;
  notes?: string;
  visible: boolean;
  order: number;
  createdAt: number;
}

// ── Feedback & Bug Reports ─────────────────────────────────────────────────
export interface FeedbackReport {
  id: string;
  category: 'Bug Report' | 'UI Problem' | 'Feature Request' | 'Performance Issue' | 'Security Report' | 'Tournament Feedback' | 'General Feedback';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  title: string;
  description: string;
  name?: string;
  email?: string;
  username?: string;
  discord?: string;
  device?: string;
  browser?: string;
  screenshotUrl?: string;
  attachmentUrl?: string;
  adminNote?: string;
  assignedTo?: string;
  internalNotes?: { text: string; by: string; at: number }[];
  replies?: { text: string; by: string; at: number; isAdmin: boolean }[];
  read: boolean;
  createdAt: number;
  updatedAt?: number;
}

// ── Hall of Fame Timeline Milestones ───────────────────────────────────────
export interface HOFMilestone {
  id: string;
  year: number;
  month?: number;        // 1-12
  title: string;
  description: string;
  category: 'Founded' | 'Tournament Win' | 'Championship' | 'Signing' | 'Sponsor' | 'Milestone' | 'Record' | 'Roster Change' | 'Award' | 'Expansion';
  icon: string;          // emoji
  image?: string;
  badge?: string;        // e.g. "GOLD", "PLATINUM"
  playerName?: string;
  prizePool?: string;
  featured: boolean;
  visible: boolean;
  order: number;
  createdAt: number;
}

// ── Trophy Room ────────────────────────────────────────────────────────────
export interface Trophy {
  id: string;
  title: string;
  tournamentName: string;
  tournamentLogo?: string;
  game: string;
  placement: string;      // "1st", "2nd", "3rd", etc.
  prizePool?: string;
  date: string;
  mvp?: string;
  teamRoster?: string[];
  teamPhoto?: string;
  gallery?: string[];
  matchReplayUrl?: string;
  description?: string;
  trophyModel?: '3d-gold' | '3d-silver' | '3d-bronze' | '3d-crystal' | '3d-diamond';
  featured: boolean;
  visible: boolean;
  order: number;
  createdAt: number;
}

// ── Records Center ─────────────────────────────────────────────────────────
export interface TeamRecord {
  id: string;
  category: 'Win Streak' | 'MVPs' | 'Kills' | 'Matches' | 'Fastest Victory' | 'Prize Money' | 'Best Finish' | 'Custom';
  title: string;
  value: string;           // "23 wins", "147 kills", "$50,000"
  numericValue?: number;   // for auto-sorting
  unit?: string;           // "wins", "kills", "USD"
  holder?: string;         // player name or "Team"
  date?: string;
  game?: string;
  tournamentName?: string;
  description?: string;
  icon: string;            // emoji
  isActive: boolean;       // still-standing record
  visible: boolean;
  order: number;
  createdAt: number;
}

// ── Team History ───────────────────────────────────────────────────────────
export interface TeamSeason {
  id: string;
  season: string;           // e.g. "Season 1 — 2021"
  year: number;
  startDate: string;
  endDate?: string;
  roster: {
    name: string;
    ign: string;
    role: string;
    photo?: string;
    isCaptain?: boolean;
    country?: string;
  }[];
  coaches?: { name: string; role: string; photo?: string }[];
  managers?: { name: string; role: string; photo?: string }[];
  jerseyImage?: string;
  achievements?: string[];   // short strings
  tournaments?: string[];
  sponsors?: string[];
  notes?: string;
  visible: boolean;
  order: number;
  createdAt: number;
}

// ── Live Streams ───────────────────────────────────────────────────────────
export interface LiveStream {
  id: string;
  title: string;
  platform: 'youtube' | 'twitch' | 'facebook' | 'other';
  streamUrl: string;
  thumbnail?: string;
  status: 'live' | 'scheduled' | 'ended';
  scheduledAt?: string;
  description?: string;
  game?: string;
  visible: boolean;
  createdAt: number;
}

// ── Achievement interface ──────────────────────────────────────────────────
export interface Achievement {
  id: string;
  title: string;
  category: 'Tournament Win' | 'Runner-up' | 'Top 3' | 'MVP Award' | 'National Event' | 'International Event' | 'Community Award' | 'Content Creator Award';
  trophyIcon: string;       // emoji, e.g. "🏆"
  tournamentLogo?: string;  // image URL
  date: string;             // ISO date
  placement: string;        // "1st", "2nd", "3rd", etc.
  prizePool?: string;       // e.g. "$10,000"
  result: string;           // "W", "L", "Draw", "Record"
  teamRoster?: string[];    // player names
  mvp?: string;             // player name
  gallery?: string[];       // image URLs
  matchReplayUrl?: string;
  certificateUrl?: string;
  externalLink?: string;
  description?: string;
  isFeatured: boolean;
  visible: boolean;
  order: number;
  createdAt: number;
}

// ── Recruitment Openings & Config ─────────────────────────────────────────
export interface RecruitmentCustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'file';
  options?: string[];
  required: boolean;
}

export interface RecruitmentFormFieldConfig {
  id: string;
  label: string;
  required: boolean;
  enabled: boolean;
  order: number;
}

export interface RecruitmentOpening {
  id: string;
  position: 'Player' | 'Staff' | 'Coach' | 'Manager' | 'Content Creator' | 'Other';
  title: string;
  description: string;
  requirements: string[];
  game: string;
  minExperienceYears?: number;
  minAge?: number;
  requiredSkills: string[];
  slotsAvailable: number;
  deadline?: string;
  status: 'Open' | 'Closed';
  featured: boolean;
  formFields?: RecruitmentFormFieldConfig[];
  customQuestions?: RecruitmentCustomQuestion[];
  createdAt: number;
  updatedAt: number;
}

export interface RecruitmentApplicationAudit {
  id: string;
  action: string;
  reviewer?: string;
  timestamp: number;
}

export interface RecruitmentApplication {
  id: string;
  openingId?: string;
  openingTitle?: string;
  name: string;
  age?: string;
  email: string;
  whatsapp?: string;
  country?: string;
  game: string;
  ign?: string;
  role: string;
  currentOrg?: string;
  uid?: string;
  rank?: string;
  experience?: string;
  experienceYears?: number;
  achievements?: string;
  about?: string;
  youtube?: string;
  instagram?: string;
  socials?: {
    youtube?: string;
    instagram?: string;
    twitter?: string;
    discord?: string;
    streamUrl?: string;
    portfolioUrl?: string;
  };
  resumeUrl?: string;
  photoUrl?: string;
  customAnswers?: Record<string, string>;
  availability?: string;
  status: 'new' | 'reviewing' | 'shortlisted' | 'interview' | 'selected' | 'signed' | 'rejected' | 'archived' | 'pending' | 'reviewed' | 'accepted';
  rating?: number;
  tags?: string[];
  adminNote?: string;
  read: boolean;
  auditTrail?: RecruitmentApplicationAudit[];
  notificationSent?: {
    email?: boolean;
    discord?: boolean;
  };
  createdAt: number;
  updatedAt?: number;
}

export interface ThemeSettings {
  activeTheme: 'classic' | 'classic-sbg-army' | 'classic-sbg-esports' | 'motion' | 'cyberpunk' | 'luxury_gold' | 'royal' | 'elite' | 'new-esports' | 'pro-arena' | 'champions';
  updatedAt?: number;
}

export interface Database {
  ctas: CtaItem[];
  settings: Settings;
  themeSettings?: ThemeSettings;
  about: AboutContent;
  faq: FaqItem[];
  players: Player[];
  matches: Match[];
  schedule: ScheduleEvent[];
  posts: Post[];
  sponsors: Sponsor[];
  games: Game[];
  ads: Ad[];
  analytics: Analytics;
  navigation: Navigation;
  creators: Creator[];
  founders: Founder[];
  shop: ShopItem[];
  staffAccounts: StaffAccount[];
  tournaments: Tournament[];
  registrations: Registration[];
  playerUsers: PlayerUser[];
  contact_messages: ContactMessage[];
  fan_messages: FanMessage[];
  giveaways: Giveaway[];
  collab_requests: CollabRequest[];
  videos: Video[];
  facility: FacilitySection[];
  facilityStats: FacilityStat[];
  orders: Order[];
  projects: Project[];
  tasks: Task[];
  gallery: GalleryItem[];
  features: SiteFeatures;
  achievements: Achievement[];
  weeklyEvents: WeeklyEvent[];
  feedback: FeedbackReport[];
  hofMilestones: HOFMilestone[];
  trophies: Trophy[];
  teamRecords: TeamRecord[];
  teamSeasons: TeamSeason[];
  livestreams: LiveStream[];
  leaderboard: unknown[];
  customCode: unknown[];
  recruitment: RecruitmentApplication[];
  recruitmentOpenings: RecruitmentOpening[];
}

const DEFAULT_DB: Database = {
  ctas: [],
  settings: {
    logo: '/transparent_eagle_logo.png', organizationName: 'SBG ESPORTS',
    tagline: 'BORN TO WIN. BUILT TO DOMINATE.',
    primaryColor: '#ff6b00', secondaryColor: '#1a1a2e', accentColor: '#e94560',
    maintenanceMode: false, maintenanceMessage: 'We are upgrading our systems. Back soon!',
    socialDiscord: 'https://discord.gg/sbgarmy', socialYoutube: 'https://youtube.com/@sbgarmy',
    socialInstagram: 'https://instagram.com/sbgarmy', socialTwitter: 'https://twitter.com/sbgarmy',
    upiId: '', upiQr: '',
    heroBadgeText: 'Professional Esports Organization',
    heroCtaJoinLabel: 'JOIN SBG ESPORTS', heroCtaJoinVisible: true,
    heroCtaTournamentLabel: 'VIEW TOURNAMENTS', heroCtaTournamentVisible: true,
    heroCtaLiveLabel: 'WATCH LIVE', heroCtaLiveVisible: true,
    footerSupportTitle: 'Official Support', footerSupportText: 'Built for competitive excellence.',
    footerQuickLinksTitle: 'Quick Links', footerExploreTitle: 'Explore',
    navBadgeText: 'OFFICIAL PLATFORM',
    aboutBadgeText: 'OUR STORY',
    aboutHeroDescription: 'Born from passion. Built on discipline. Driven by the relentless pursuit of victory. We are more than an esports organization — we are a movement.',
    contactIntro: 'Have a question, partnership idea, or just want to say hi? Reach out to the SBG ESPORTS team.',
    contactCategories: ['General Inquiry', 'Sponsorship', 'Tournament', 'Media & Press', 'Support'],
    contactHours: ['Mon–Fri: 10:00 AM – 7:00 PM', 'Sat: 11:00 AM – 4:00 PM', 'Sun: Closed'],
    joinIntro: 'Think you have what it takes to compete at the highest level? SBG ESPORTS is always scouting for elite talent.',
    joinRequirements: ['18+ years old (or parental consent)', 'Proven competitive track record', 'Reliable internet & setup', 'Team-first mentality'],
    joinInstructions: 'Fill out the form below with your game, rank, and social links. Our scouting team reviews every submission.',
    hofIntroText: 'Celebrating the milestones, victories, and moments that built the SBG ESPORTS legacy.',
    achievementsIntroText: 'A record of the titles, trophies, and unforgettable performances earned by SBG ESPORTS.',
    // Countdown defaults (off by default until admin sets a real date)
    countdownEnabled: false,
    countdownTargetDate: '',
    countdownTitle: 'Next Tournament',
    countdownExpiredMessage: 'Stay tuned — next event starting soon!',
    // Background Manager defaults
    bgParticlesEnabled: true,
    bgParticleColor: '#d4af37',
    bgGlowEnabled: true,
    bgAnimationSpeed: 1,
    bgOverlayOpacity: 0.07,
    heroOverlayOpacity: 0.15,
    footerDescription: '',
    footerExploreLinks: [],
    heroStats: [
      { value: '20+', label: 'PRO PLAYERS', numericEnd: 20, suffix: '+', visible: true, position: 0, icon: '🎮' },
      { value: '50+', label: 'TOURNAMENTS', numericEnd: 50, suffix: '+', visible: true, position: 1, icon: '🏆' },
      { value: '78%', label: 'WIN RATE', numericEnd: 78, suffix: '%', visible: true, position: 2, icon: '🏅' },
      { value: '15', label: 'TITLES', numericEnd: 15, suffix: '', visible: true, position: 3, icon: '👥' },
    ],
    facilityBadge: 'EXCELLENCE',
    facilityTitle: 'OUR FACILITY',
    facilitySubtitle: 'State-of-the-art gaming environment engineered for elite esports performance.',
    facilityIcon: '🏢',
    externalLinksVisible: true,
    externalLinks: [
      { id: 'ext1', name: 'SBG Shop', url: 'https://example.com/shop', enabled: true, order: 0 },
      { id: 'ext2', name: 'SBG Store', url: 'https://example.com/store', enabled: true, order: 1 },
      { id: 'ext3', name: 'SBG Media', url: 'https://example.com/media', enabled: true, order: 2 },
      { id: 'ext4', name: 'SBG News', url: 'https://example.com/news', enabled: true, order: 3 },
    ],
    adProviders: {
      activeProvider: 'none',
      globalAdsEnabled: true,
      antiAdblockBypass: false,
      fallbackProvider: 'none',
      adsense: {
        enabled: false,
        publisherId: '',
        autoAdsEnabled: false,
        headerSlotId: '',
        sidebarSlotId: '',
        inArticleSlotId: '',
        scriptSnippet: '',
      },
      hilltopads: {
        enabled: false,
        siteKey: '',
        zoneId: '',
        popunderScript: '',
        bannerScript: '',
        directLink: '',
        nativeAdScript: '',
        antiAdblockEnabled: false,
      },
      customProvider: {
        enabled: false,
        name: 'Custom Network',
        headerScript: '',
        bodyScript: '',
      },
    },
  },
  themeSettings: {
    activeTheme: 'classic',
    updatedAt: Date.now(),
  },
  about: {
    heading: 'ABOUT SBG ESPORTS',
    description: 'Born from passion. Built on discipline. Driven by the relentless pursuit of victory. We are more than an esports organization — we are a movement.',
    mission: 'To build a world-class esports organization that empowers players to reach their full competitive potential while fostering a culture of excellence, discipline, and brotherhood.',
    vision: 'To become one of the most respected esports organizations globally, known for developing elite talent and setting new standards in competitive gaming.',
    story: 'SBG ESPORTS started as a squad of passionate gamers with a shared dream — to compete, to win, and to build something bigger than themselves.',
    // Sub-arrays start empty so admin data always takes precedence
    stats: [],
    timeline: [],
    values: [],
    images: [],
    videos: [],
  },
  faq: [
    { id: 'faq1', question: 'How do I join SBG ESPORTS?', answer: 'Head to the Join Team page, fill out the recruitment form with your game, rank, and social links. Our scouting team reviews every submission.', order: 1, visible: true },
    { id: 'faq2', question: 'How do I register for a tournament?', answer: 'Visit the Tournaments page, pick an open event, and complete the registration form before the deadline.', order: 2, visible: true },
    { id: 'faq3', question: 'How can I contact support?', answer: 'Use the Contact page or reach out via our official Discord and WhatsApp channels listed in the footer.', order: 3, visible: true },
  ],
  // Content collections default to empty — admin panel is the only source of truth.
  // Demo entries must never appear in production; the server always takes precedence.
  players: [],
  matches: [],
  schedule: [],
  posts: [],
  sponsors: [],
  games: [],
  ads: [
    { id: 'ad1', placement: 'hero', imageUrl: '', link: '', enabled: false },
    { id: 'ad2', placement: 'header', imageUrl: '', link: '', enabled: false },
    { id: 'ad3', placement: 'sidebar', imageUrl: '', link: '', enabled: false },
    { id: 'ad4', placement: 'footer', imageUrl: '', link: '', enabled: false },
    { id: 'ad5', placement: 'popup', imageUrl: '', link: '', enabled: false, popupDelay: 3, popupFrequency: 'once_per_session', targetPages: ['all'] },
  ],
  analytics: {
    totalVisits: 0, todayVisits: 0, weeklyVisits: 0,
    lastVisitDate: '', visitHistory: [], visitRecords: [],
    manualTodayVisits: null, manualWeeklyVisits: null, manualTotalVisits: null,
  },
  navigation: {
    items: [
      { id: 'nav1',  label: 'HOME',         href: '/',            visible: true  },
      { id: 'nav2',  label: 'ABOUT',        href: '/about',       visible: true  },
      { id: 'nav3',  label: 'TOURNAMENTS',  href: '/tournaments', visible: true  },
      { id: 'nav4',  label: 'LEADERBOARDS', href: '/leaderboards',visible: true  },
      { id: 'nav5',  label: 'GALLERY',      href: '/gallery',     visible: true  },
      { id: 'nav6',  label: 'SCHEDULE',     href: '/schedule',    visible: true  },
      { id: 'nav7',  label: 'STATS',        href: '/stats',       visible: true  },
      { id: 'nav8',  label: 'RECORDS',      href: '/records',     visible: true  },
      { id: 'nav9',  label: 'EVENTS',       href: '/events',      visible: true  },
      { id: 'nav10', label: 'COMMUNITY',    href: '/community',   visible: false },
      { id: 'nav11', label: 'SHOP',         href: '/shop',        visible: false },
      { id: 'nav12', label: 'CONTACT',      href: '/contact',     visible: true  },
      { id: 'nav13', label: 'ACHIEVEMENTS', href: '/achievements',visible: false },
      { id: 'nav14', label: 'HALL OF FAME', href: '/hall-of-fame',visible: false },
      { id: 'nav15', label: 'TROPHY ROOM',  href: '/trophy-room', visible: false },
      { id: 'nav16', label: 'TEAM HISTORY', href: '/team-history',visible: false },
    ],
    shortcuts: [],
  },
  creators: [],
  founders: [],
  shop: [],
  staffAccounts: [],
  tournaments: [],
  registrations: [],
  playerUsers: [],
  contact_messages: [],
  fan_messages: [],
  giveaways: [],
  collab_requests: [],
  videos: [],
  facility: [
    { id: 'fac1', title: '4K Gaming Monitors', description: '240Hz ultra-fast displays for competitive edge', icon: '🖥️', image: '', visible: true, order: 0 },
    { id: 'fac2', title: 'Fiber Internet', description: '1Gbps dedicated gaming connection, zero lag', icon: '🌐', image: '', visible: true, order: 1 },
    { id: 'fac3', title: 'Pro Peripherals', description: 'Top-tier mice, keyboards, and headsets', icon: '🖱️', image: '', visible: true, order: 2 },
    { id: 'fac4', title: 'Coaching Staff', description: 'Expert coaches and performance analysts', icon: '🧠', image: '', visible: true, order: 3 },
  ],
  facilityStats: [
    { id: 'fs1', label: 'PRO PLAYERS', value: '20+', numericEnd: 20, suffix: '+', color: '#f97316', visible: true, position: 0 },
    { id: 'fs2', label: 'TOURNAMENTS', value: '50+', numericEnd: 50, suffix: '+', color: '#ef4444', visible: true, position: 1 },
    { id: 'fs3', label: 'WIN RATE', value: '78%', numericEnd: 78, suffix: '%', color: '#eab308', visible: true, position: 2 },
    { id: 'fs4', label: 'TITLES', value: '15', numericEnd: 15, suffix: '', color: '#3b82f6', visible: true, position: 3 },
  ],
  orders: [],
  projects: [] as Project[],
  tasks: [] as Task[],
  gallery: [] as GalleryItem[],
  achievements: [] as Achievement[],
  features: {
    sections: {
      hero: true, heroStats: true, ads: true, roster: true, matches: true, schedule: true,
      games: true, creators: true, news: true, videos: true, founders: true,
      sponsors: true, facility: true, contact: true, announcement: true,
    },
    pages: {
      shop: true, tournaments: false, leaderboards: true, events: true,
      blog: true, hallOfFame: true, live: false, join: true,
      community: true, fanConnect: true, giveaways: true, collaborate: true,
      playerPortal: false, dashboard: false, records: true, stats: true,
      trophyRoom: true, teamHistory: true, gallery: true, achievements: true,
      schedule: true, feedback: true, hofTimeline: true,
    },
  },
  weeklyEvents: [] as WeeklyEvent[],
  feedback: [] as FeedbackReport[],
  hofMilestones: [] as HOFMilestone[],
  trophies: [] as Trophy[],
  teamRecords: [] as TeamRecord[],
  teamSeasons: [] as TeamSeason[],
  livestreams: [] as LiveStream[],
  leaderboard: [],
  customCode: [],
  recruitment: [] as RecruitmentApplication[],
  recruitmentOpenings: [] as RecruitmentOpening[],
};

const DB_KEY = 'sbg_army_db_v3';
const CHANNEL_NAME = 'sbg_army_sync';

const dbStore = createStore('sbg_army', 'main');

let dbCache: Database | null = null;
let dbInitialized = false;
let initPromise: Promise<void> | null = null;

function hasContent<T>(arr: T[] | undefined | null): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

function mergeWithDefaults(stored: Partial<Database>): Database {
  const settingsOk = stored.settings && typeof stored.settings === 'object' && !Array.isArray(stored.settings);
  const resolvedSettings: Settings = settingsOk
    ? { ...DEFAULT_DB.settings, ...(stored.settings as Partial<Settings>) }
    : DEFAULT_DB.settings;

  if (!Array.isArray(resolvedSettings.externalLinks)) {
    resolvedSettings.externalLinks = DEFAULT_DB.settings.externalLinks ?? [];
  }
  if (resolvedSettings.externalLinksVisible === undefined) {
    resolvedSettings.externalLinksVisible = true;
  }

  const themeSettingsOk = stored.themeSettings && typeof stored.themeSettings === 'object' && !Array.isArray(stored.themeSettings);
  let resolvedActiveTheme = themeSettingsOk
    ? (stored.themeSettings?.activeTheme || stored.settings?.activeTheme || 'classic')
    : (stored.settings?.activeTheme || DEFAULT_DB.themeSettings?.activeTheme || 'classic');

  

  const resolvedThemeSettings: ThemeSettings = {
    activeTheme: resolvedActiveTheme as any,
    updatedAt: stored.themeSettings?.updatedAt || Date.now(),
  };

  const merged: Database = {
    ...DEFAULT_DB,
    ...stored,
    settings: resolvedSettings,
    themeSettings: resolvedThemeSettings,
  };
  // SAFETY: only ensure array type — never re-inject seed content into empty arrays.
  // An empty array from the server means the admin intentionally cleared that collection.
  if (!Array.isArray(merged.schedule)) merged.schedule = [];
  if (!Array.isArray(merged.creators)) merged.creators = [];
  if (!Array.isArray(merged.founders)) merged.founders = [];
  if (!Array.isArray(merged.shop)) merged.shop = [];
  if (!Array.isArray(merged.players)) merged.players = [];
  if (!Array.isArray(merged.matches)) merged.matches = [];
  if (!Array.isArray(merged.games)) merged.games = [];
  if (!Array.isArray(merged.sponsors)) merged.sponsors = [];
  if (!Array.isArray(merged.posts)) merged.posts = [];
  if (!Array.isArray(merged.ads)) merged.ads = [];
  if (!Array.isArray(merged.facility)) merged.facility = [];
  if (!Array.isArray(merged.facilityStats)) merged.facilityStats = [];
  if (!Array.isArray(merged.staffAccounts)) merged.staffAccounts = [];
  if (!Array.isArray(merged.tournaments)) merged.tournaments = [];
  if (!Array.isArray(merged.registrations)) merged.registrations = [];
  if (!Array.isArray(merged.fan_messages)) merged.fan_messages = [];
  if (!Array.isArray(merged.giveaways)) merged.giveaways = [];
  if (!Array.isArray(merged.collab_requests)) merged.collab_requests = [];
  if (!Array.isArray(merged.videos)) merged.videos = [];
  if (!Array.isArray(merged.playerUsers)) merged.playerUsers = [];
  if (!Array.isArray(merged.contact_messages)) merged.contact_messages = [];
  if (!Array.isArray(merged.orders)) merged.orders = [];
  const analyticsOk = merged.analytics && typeof merged.analytics === 'object' && !Array.isArray(merged.analytics);
  if (!analyticsOk) merged.analytics = DEFAULT_DB.analytics;
  if (!Array.isArray(merged.analytics.visitRecords)) merged.analytics.visitRecords = [];
  if (merged.analytics.manualTodayVisits === undefined) merged.analytics.manualTodayVisits = null;
  if (merged.analytics.manualWeeklyVisits === undefined) merged.analytics.manualWeeklyVisits = null;
  if (merged.analytics.manualTotalVisits === undefined) merged.analytics.manualTotalVisits = null;
  const navOk = merged.navigation && typeof merged.navigation === 'object' && !Array.isArray(merged.navigation) && Array.isArray(merged.navigation.items);
  if (!navOk) {
    merged.navigation = DEFAULT_DB.navigation;
  } else {
    // Preserve admin-managed navigation items exactly as stored.
    // Merge in any NEW shortcut items added by code if they don't exist yet.
    merged.navigation = {
      ...DEFAULT_DB.navigation,
      ...merged.navigation,
      items: merged.navigation.items,
      shortcuts: Array.isArray(merged.navigation.shortcuts) ? merged.navigation.shortcuts : [],
    };
  }
  merged.players = (merged.players ?? []).map(p => ({ ...p, status: (p.status ?? 'active') }));
  if (!Array.isArray(merged.projects)) merged.projects = [];
  if (!Array.isArray(merged.tasks)) merged.tasks = [];
  if (!Array.isArray(merged.gallery)) merged.gallery = [];
  if (!Array.isArray(merged.achievements)) merged.achievements = [];
  if (!Array.isArray(merged.weeklyEvents)) merged.weeklyEvents = [];
  if (!Array.isArray(merged.feedback)) merged.feedback = [];
  if (!Array.isArray((merged as any).hofMilestones)) (merged as any).hofMilestones = [];
  if (!Array.isArray((merged as any).trophies)) (merged as any).trophies = [];
  if (!Array.isArray((merged as any).teamRecords)) (merged as any).teamRecords = [];
  if (!Array.isArray((merged as any).teamSeasons)) (merged as any).teamSeasons = [];
  if (!Array.isArray((merged as any).livestreams)) (merged as any).livestreams = [];
  if (!merged.about || typeof merged.about !== 'object' || Array.isArray(merged.about)) {
    merged.about = DEFAULT_DB.about;
  } else {
    merged.about = {
      ...DEFAULT_DB.about,
      ...merged.about,
      // Use array type check only — never re-seed when admin intentionally cleared these
      stats:    Array.isArray(merged.about.stats)    ? merged.about.stats    : [],
      timeline: Array.isArray(merged.about.timeline) ? merged.about.timeline : [],
      values:   Array.isArray(merged.about.values)   ? merged.about.values   : [],
      images:   Array.isArray(merged.about.images)   ? merged.about.images   : [],
      videos:   Array.isArray(merged.about.videos)   ? merged.about.videos   : [],
    };
  }
  if (!Array.isArray(merged.faq)) merged.faq = [];
  if (!Array.isArray(merged.ctas)) merged.ctas = [];
  if (merged.settings && merged.settings.ctaEnabled === undefined) merged.settings.ctaEnabled = true;
  if (!merged.features || typeof merged.features !== 'object') {
    merged.features = DEFAULT_DB.features;
  } else {
    merged.features = {
      sections: { ...DEFAULT_DB.features.sections, ...merged.features.sections },
      pages: { ...DEFAULT_DB.features.pages, ...merged.features.pages },
    };
  }
  return merged;
}

export async function initDB(): Promise<void> {
  if (dbInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const serverData = await apiGetAll().catch(() => null);
      if (serverData && serverData.settings) {
        const merged = mergeWithDefaults(serverData as Partial<Database>);
        dbCache = merged;
        await set(DB_KEY, merged, dbStore).catch(() => {});
        dbInitialized = true;
        connectWs();
        return;
      }
    } catch {}

    try {
      const stored = await get<Database>(DB_KEY, dbStore);
      if (stored) {
        dbCache = mergeWithDefaults(stored);
      } else {
        dbCache = JSON.parse(JSON.stringify(DEFAULT_DB)) as Database;
        await set(DB_KEY, dbCache, dbStore).catch(() => {});
      }
    } catch {
      dbCache = JSON.parse(JSON.stringify(DEFAULT_DB)) as Database;
    }
    dbInitialized = true;
    connectWs();
  })();

  return initPromise;
}

export function getDB(): Database {
  if (!dbCache) {
    dbCache = JSON.parse(JSON.stringify(DEFAULT_DB)) as Database;
  }
  return dbCache;
}

export function updateDBCache(collection: string, data: unknown): void {
  if (!dbCache) return;
  // Spread to create a NEW object reference so React's useState equality
  // check (Object.is) detects the change and triggers a re-render.
  // Mutating dbCache in-place would silently skip re-renders.
  dbCache = { ...dbCache, [collection]: data } as Database;
}

const ALL_COLLECTIONS: (keyof Database)[] = [
  'settings', 'themeSettings', 'players', 'games', 'matches', 'tournaments', 'registrations',
  'ads', 'sponsors', 'posts', 'analytics', 'shop', 'facility', 'facilityStats',
  'creators', 'navigation', 'founders', 'schedule', 'fan_messages', 'giveaways',
  'collab_requests', 'videos', 'staffAccounts', 'playerUsers', 'contact_messages',
  'orders', 'projects', 'tasks', 'gallery', 'features', 'achievements',
  'weeklyEvents', 'feedback', 'hofMilestones', 'trophies', 'teamRecords', 'teamSeasons',
  'about', 'faq', 'leaderboard', 'customCode', 'recruitment', 'recruitmentOpenings', 'livestreams',
  'ctas',
];

let resyncInFlight: Promise<void> | null = null;

export async function saveDB(db: Database): Promise<void>;
export async function saveDB(db: Database, collection: string): Promise<void>;
export async function saveDB(db: Database, collection?: string): Promise<void> {
  if (resyncInFlight) {
    await Promise.race([
      resyncInFlight,
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]).catch(() => {});
  }

  // Always update local cache and IndexedDB immediately so changes are preserved
  dbCache = db;
  set(DB_KEY, db, dbStore).catch(() => {});

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'DB_UPDATED', timestamp: Date.now() });
    channel.close();
  } catch {}

  // Sync with server backend
  try {
    if (collection) {
      const colData = (db as unknown as Record<string, unknown>)[collection];
      await apiPost(collection, colData);
    } else {
      const updates: Record<string, unknown> = {};
      for (const col of ALL_COLLECTIONS) {
        updates[col] = (db as unknown as Record<string, unknown>)[col];
      }
      await apiPostBulk(updates);
    }
  } catch (err: any) {
    const msg = err?.message ?? '';
    if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
      console.warn(`[saveDB] Sync to backend server failed (${collection || 'bulk'}), but changes are saved locally in cache:`, err);
      return;
    }
    throw err;
  }
}

export async function saveCollection(collection: string, data: unknown): Promise<void> {
  if (dbCache) {
    (dbCache as unknown as Record<string, unknown>)[collection] = data;
  }
  set(DB_KEY, dbCache, dbStore).catch(() => {});

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'DB_UPDATED', timestamp: Date.now() });
    channel.close();
  } catch {}

  try {
    await apiPost(collection, data);
  } catch (err: any) {
    const msg = err?.message ?? '';
    if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
      console.warn(`[saveCollection] Sync to backend server failed for ${collection}, but changes are saved locally in cache:`, err);
      return;
    }
    throw err;
  }
}

export function useBroadcastSync(onUpdate: () => void): () => void {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.type === 'DB_UPDATED') onUpdate();
    };
    return () => channel.close();
  } catch {
    return () => {};
  }
}

/**
 * Re-fetches the full DB snapshot from the server and merges it into the
 * in-memory cache (and the local IndexedDB mirror), WITHOUT falling back to
 * hardcoded mock defaults for empty collections (unlike initDB's cold-start
 * merge). This is used to resync after a dropped WebSocket connection so a
 * stale in-tab cache never gets pushed back to the server via a bulk
 * saveDB() call and silently reverts changes made elsewhere (e.g. new
 * players added from another session while this tab was disconnected).
 */
export async function resyncFromServer(): Promise<void> {
  const run = (async () => {
    try {
      const serverData = await apiGetAll();
      if (!serverData || typeof serverData !== 'object') return;
      if (!dbCache) {
        // Cold start — build from scratch
        dbCache = mergeWithDefaults(serverData as Partial<Database>);
      } else {
        // Warm update — create a NEW object reference so React's Object.is
        // equality check detects the change and triggers re-renders.
        // Never mutate dbCache in-place; that silently skips re-renders.
        const updated = { ...dbCache } as Database;
        for (const col of ALL_COLLECTIONS) {
          if (Object.prototype.hasOwnProperty.call(serverData, col)) {
            (updated as unknown as Record<string, unknown>)[col] =
              (serverData as Record<string, unknown>)[col];
          }
        }
        dbCache = updated;
      }
      await set(DB_KEY, dbCache, dbStore).catch(() => {});
      // Do NOT re-broadcast via BroadcastChannel here — that would create an
      // infinite cascade: tab A resync → BC → tab B resync → BC → tab A …
      // Only saveDB() (which represents an intentional admin write) broadcasts.
    } catch {
      // Server unreachable — keep using the current cache rather than resetting it.
    }
  })();
  resyncInFlight = run;
  try {
    await run;
  } finally {
    if (resyncInFlight === run) resyncInFlight = null;
  }
}

onWsReconnect(() => {
  resyncFromServer();
});

// Safety net in case the WebSocket silently stops delivering events without
// firing onclose (some browsers throttle/suspend background-tab sockets
// without a clean close). Periodically resync and resync when the tab
// regains visibility, so a long-idle admin tab never pushes stale data back.
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (dbInitialized) resyncFromServer();
  }, 3 * 60 * 1000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && dbInitialized) {
      resyncFromServer();
    }
  });
}

export function resetDB(): void {
  const fresh = JSON.parse(JSON.stringify(DEFAULT_DB)) as Database;
  set(DB_KEY, fresh, dbStore).catch(() => {});
  dbCache = fresh;
}

export function getDisplayVisits(analytics: Analytics): { today: number; weekly: number; total: number } {
  return {
    today: analytics.manualTodayVisits ?? analytics.todayVisits,
    weekly: analytics.manualWeeklyVisits ?? analytics.weeklyVisits,
    total: analytics.manualTotalVisits ?? analytics.totalVisits,
  };
}
