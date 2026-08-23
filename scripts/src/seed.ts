import { db, siteSettingsTable, playersTable, tournamentsTable, postsTable, productsTable, sponsorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function upsertSetting(key: string, value: string, section: string, label: string, type = "text") {
  const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
  if (existing.length > 0) {
    await db.update(siteSettingsTable).set({ value, updatedAt: new Date() }).where(eq(siteSettingsTable.key, key));
  } else {
    await db.insert(siteSettingsTable).values({ key, value, section, label, type });
  }
}

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Site Settings ─────────────────────────────────────────────────
  const settings = [
    // Hero
    ["hero.title", "SBG ARMY", "hero", "Hero Title"],
    ["hero.subtitle", "India's premier competitive esports organization. Dominating tournaments across Free Fire, BGMI, Valorant, and COD Mobile.", "hero", "Hero Subtitle", "textarea"],
    ["hero.primaryButtonText", "Meet the Team", "hero", "Primary Button Text"],
    ["hero.primaryButtonLink", "/roster", "hero", "Primary Button Link"],
    ["hero.secondaryButtonText", "Tournaments", "hero", "Secondary Button Text"],
    // Branding
    ["branding.teamName", "SBG ARMY", "branding", "Team Name"],
    ["branding.primaryColor", "#ff6b00", "branding", "Primary Color", "color"],
    ["branding.accentColor", "#e94560", "branding", "Accent Color", "color"],
    // Contact (NO HARDCODED OWNER EMAIL — stored separately with restricted access)
    ["contact.supportEmail", "support@sbgarmy.in", "contact", "Support Email", "email"],
    ["contact.supportPhone", "+91 00000 00000", "contact", "Support Phone"],
    ["contact.whatsapp", "+91 00000 00000", "contact", "WhatsApp Number"],
    ["contact.businessEmail", "business@sbgarmy.in", "contact", "Business Email", "email"],
    ["contact.sponsorshipEmail", "sponsorship@sbgarmy.in", "contact", "Sponsorship Email", "email"],
    ["contact.discord", "https://discord.gg/sbgarmy", "contact", "Discord Link"],
    ["contact.telegram", "https://t.me/sbgarmy", "contact", "Telegram Link"],
    // Social
    ["social.youtube", "https://youtube.com/@sbgarmy", "social", "YouTube URL"],
    ["social.instagram", "https://instagram.com/sbgarmy", "social", "Instagram URL"],
    ["social.twitter", "https://twitter.com/sbgarmy", "social", "Twitter URL"],
    ["social.facebook", "", "social", "Facebook URL"],
    // SEO
    ["seo.defaultTitle", "SBG ARMY — International Esports Organization", "seo", "Default Title"],
    ["seo.defaultDescription", "India's premier competitive esports organization competing across Free Fire, BGMI, Valorant, and COD Mobile.", "seo", "Default Description", "textarea"],
    ["seo.keywords", "SBG ARMY, esports, Free Fire, BGMI, Valorant, COD Mobile, India esports", "seo", "Keywords"],
    // Nav
    ["nav.showLive", "true", "nav", "Show Live Nav"],
    ["nav.showShop", "true", "nav", "Show Shop Nav"],
    // Announce
    ["announce.text", "", "announce", "Announcement Text"],
  ] as [string, string, string, string, string?][];

  for (const s of settings) {
    await upsertSetting(s[0], s[1], s[2], s[3], s[4]);
  }
  console.log(`✅ ${settings.length} site settings seeded`);

  // ── Players ───────────────────────────────────────────────────────
  const existingPlayers = await db.select().from(playersTable);
  if (existingPlayers.length === 0) {
    const players = [
      { playerName: "SHADOW_X", realName: "Rahul Kumar", game: "Free Fire", role: "IGL", rank: "Grandmaster", kd: 4.2, wins: 156, matches: 820, status: "active" },
      { playerName: "STRIKER99", realName: "Arjun Singh", game: "Free Fire", role: "Fragger", rank: "Heroic", kd: 5.8, wins: 203, matches: 950, status: "active" },
      { playerName: "GHOST_BGMI", realName: "Vikram Patel", game: "BGMI", role: "IGL", rank: "Conqueror", kd: 3.9, wins: 89, matches: 540, status: "active" },
      { playerName: "APEX_GAMER", realName: "Aditya Sharma", game: "BGMI", role: "Fragger", rank: "Ace", kd: 4.7, wins: 112, matches: 680, status: "active" },
      { playerName: "VIPER_VAL", realName: "Priya Nair", game: "Valorant", role: "Duelist", rank: "Immortal", kd: 1.8, wins: 67, matches: 320, status: "active" },
      { playerName: "COD_BEAST", realName: "Rohan Das", game: "COD Mobile", role: "All-Rounder", rank: "Legendary", kd: 3.2, wins: 78, matches: 410, status: "active" },
      { playerName: "BLAZE_FF", realName: "Karan Mehta", game: "Free Fire", role: "Support", rank: "Heroic", kd: 3.1, wins: 134, matches: 720, status: "active" },
      { playerName: "NINJA_BGMI", realName: "Sanjay Gupta", game: "BGMI", role: "Sniper", rank: "Crown", kd: 4.1, wins: 98, matches: 590, status: "active" },
    ];
    await db.insert(playersTable).values(players);
    console.log(`✅ ${players.length} players seeded`);
  } else {
    console.log(`⏭ Players already exist (${existingPlayers.length})`);
  }

  // ── Tournaments ───────────────────────────────────────────────────
  const existingTournaments = await db.select().from(tournamentsTable);
  if (existingTournaments.length === 0) {
    const now = new Date();
    const tournaments = [
      { title: "SBG Army Free Fire Open 2025", game: "Free Fire", status: "upcoming", prizePool: "₹50,000", maxTeams: 32, registeredTeams: 18, startDate: new Date(Date.now() + 7 * 86400000), description: "The biggest Free Fire tournament organized by SBG ARMY. Open to all registered teams.", format: "Battle Royale · 6 rounds", rules: "4 players per squad. No external software. Fair play mandatory." },
      { title: "BGMI Pro League Season 3", game: "BGMI", status: "ongoing", prizePool: "₹75,000", maxTeams: 16, registeredTeams: 16, startDate: new Date(Date.now() - 3 * 86400000), description: "The third season of SBG ARMY BGMI Pro League. Featuring India's top squads.", format: "Group Stage → Playoffs → Grand Finals", streamUrl: "https://youtube.com/@sbgarmy" },
      { title: "Valorant Community Cup", game: "Valorant", status: "completed", prizePool: "₹25,000", maxTeams: 16, registeredTeams: 14, startDate: new Date(Date.now() - 30 * 86400000), description: "The first ever SBG ARMY Valorant tournament.", format: "Double Elimination" },
      { title: "COD Mobile Championship 2024", game: "COD Mobile", status: "completed", prizePool: "₹30,000", maxTeams: 8, registeredTeams: 8, startDate: new Date(Date.now() - 60 * 86400000), description: "COD Mobile tournament for top squads.", format: "Single Elimination" },
    ];
    for (const t of tournaments) {
      await db.insert(tournamentsTable).values(t as any);
    }
    console.log(`✅ ${tournaments.length} tournaments seeded`);
  } else {
    console.log(`⏭ Tournaments already exist (${existingTournaments.length})`);
  }

  // ── Posts ─────────────────────────────────────────────────────────
  const existingPosts = await db.select().from(postsTable);
  if (existingPosts.length === 0) {
    const posts = [
      { title: "SBG ARMY Wins BGMI Pro League Season 3!", category: "match-report", excerpt: "Our BGMI squad dominated the pro league this season, securing first place with an incredible performance across all rounds.", content: "What an incredible season it has been! The SBG ARMY BGMI squad has once again proven why they are one of India's top competitive squads. Starting from the group stage, our players showcased exceptional coordination and individual skill.\n\nGHOST_BGMI led the squad with remarkable in-game calls while APEX_GAMER delivered consistently high kill counts. After intense playoffs, we secured the championship title with a decisive grand finals performance.\n\nThank you to all our fans for the incredible support throughout this journey. We will continue to push boundaries and represent Indian esports at the highest level.", authorName: "SBG ARMY", published: true, featured: true, views: 1240 },
      { title: "Recruitment Now Open — Join SBG ARMY 2025", category: "announcement", excerpt: "We are now accepting applications for all game titles. If you have what it takes to compete at the professional level, apply now.", content: "The SBG ARMY recruitment portal is officially open for 2025! We are looking for dedicated and skilled players across all our competitive titles.\n\nWe are recruiting for:\n- Free Fire (Fraggers, IGLs, Support)\n- BGMI (All positions)\n- Valorant (Duelists, Controllers, Sentinels)\n- COD Mobile (All positions)\n\nRequirements: Consistent rank in top tier, availability for practice sessions, team player mindset, willingness to grow.\n\nApply through our Join page. Shortlisted candidates will be contacted within 5 business days.", authorName: "Management Team", published: true, featured: false, views: 890 },
      { title: "SBG ARMY Partners with Major Esports Brand", category: "news", excerpt: "We are thrilled to announce a new sponsorship partnership that will help take SBG ARMY to the next level.", content: "SBG ARMY is proud to announce a new partnership with a leading esports equipment brand. This partnership will provide our players with premium gaming peripherals and support for upcoming tournaments.\n\nThis is a major milestone for our organization and reflects the hard work our players and management team have put in. We look forward to representing our partner at all upcoming tournaments.", authorName: "SBG ARMY", published: true, featured: false, views: 567 },
    ];
    for (const p of posts) {
      await db.insert(postsTable).values(p as any);
    }
    console.log(`✅ ${posts.length} posts seeded`);
  } else {
    console.log(`⏭ Posts already exist (${existingPosts.length})`);
  }

  // ── Products ──────────────────────────────────────────────────────
  const existingProducts = await db.select().from(productsTable);
  if (existingProducts.length === 0) {
    const products = [
      { name: "SBG ARMY Official Jersey 2025", price: 899, originalPrice: 1299, category: "jersey", description: "Official SBG ARMY esports jersey for 2025. Premium fabric, sublimation print. Custom name and number available.", badge: "BESTSELLER", inStock: true, stockCount: 50, sizes: '["XS","S","M","L","XL","XXL","3XL"]', colors: "Black/Orange,White/Orange", image: "" },
      { name: "SBG ARMY Gaming T-Shirt", price: 499, originalPrice: 699, category: "apparel", description: "Comfortable gaming t-shirt with SBG ARMY logo. 100% cotton, pre-shrunk.", inStock: true, stockCount: 100, sizes: '["S","M","L","XL","XXL"]', colors: "Black,White,Grey", badge: "NEW", image: "" },
      { name: "SBG ARMY Hoodie", price: 1299, originalPrice: 1799, category: "apparel", description: "Premium quality hoodie with embroidered SBG ARMY logo. Perfect for gaming sessions.", inStock: true, stockCount: 30, sizes: '["S","M","L","XL","XXL"]', colors: "Black,Navy", image: "" },
      { name: "SBG ARMY Mousepad XL", price: 649, category: "accessories", description: "Extra large gaming mousepad with SBG ARMY artwork. Anti-slip base, stitched edges.", inStock: true, stockCount: 75, image: "" },
      { name: "SBG ARMY Cap", price: 399, originalPrice: 499, category: "accessories", description: "Adjustable snapback cap with SBG ARMY embroidered logo.", badge: "SALE", inStock: true, stockCount: 60, colors: "Black,White", image: "" },
    ];
    for (const p of products) {
      await db.insert(productsTable).values(p as any);
    }
    console.log(`✅ ${products.length} products seeded`);
  } else {
    console.log(`⏭ Products already exist (${existingProducts.length})`);
  }

  // ── Sponsors ──────────────────────────────────────────────────────
  const existingSponsors = await db.select().from(sponsorsTable);
  if (existingSponsors.length === 0) {
    const sponsors = [
      { name: "Garena Free Fire", tier: "platinum", website: "https://ff.garena.com", description: "Official game sponsor", active: true },
      { name: "BGMI", tier: "gold", website: "https://battlegroundsmobileindia.com", description: "Official game sponsor", active: true },
      { name: "Nodwin Gaming", tier: "silver", website: "https://nodwingaming.com", description: "Esports industry partner", active: true },
    ];
    await db.insert(sponsorsTable).values(sponsors as any);
    console.log(`✅ ${sponsors.length} sponsors seeded`);
  } else {
    console.log(`⏭ Sponsors already exist (${existingSponsors.length})`);
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); });
