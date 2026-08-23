-- SBG ARMY Esports Platform — Database Schema
-- This schema documents all data collections used by the platform.
-- The actual storage uses JSON flat-files in artifacts/database/*.json
-- If migrating to SQLite/PostgreSQL, use this schema as reference.

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  organization_name TEXT NOT NULL DEFAULT 'SBG ARMY',
  tagline TEXT,
  logo TEXT,
  primary_color TEXT DEFAULT '#ff6b00',
  secondary_color TEXT DEFAULT '#1a1a2e',
  accent_color TEXT DEFAULT '#e94560',
  maintenance_mode INTEGER DEFAULT 0,
  maintenance_message TEXT,
  social_discord TEXT,
  social_youtube TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  upi_id TEXT,
  upi_qr TEXT,
  announcement_text TEXT,
  support_whatsapp TEXT,
  support_email TEXT
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ign TEXT NOT NULL,
  role TEXT,
  game TEXT,
  image TEXT,
  visible INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  social TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  opponent TEXT,
  game TEXT,
  mode TEXT,
  round TEXT,
  match_date TEXT,
  match_time TEXT,
  status TEXT DEFAULT 'upcoming',
  score TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS schedule (
  id TEXT PRIMARY KEY,
  event_type TEXT,
  team_name TEXT DEFAULT 'SBG ARMY',
  opponent_name TEXT,
  game TEXT,
  event_date TEXT,
  event_time TEXT,
  status TEXT DEFAULT 'upcoming',
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT,
  publish_date TEXT,
  visible INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  enabled INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  link TEXT,
  visible INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  width INTEGER DEFAULT 120,
  height INTEGER DEFAULT 60
);

CREATE TABLE IF NOT EXISTS shop_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image TEXT,
  price REAL DEFAULT 0,
  discount_price REAL DEFAULT 0,
  description TEXT,
  stock_status TEXT DEFAULT 'in_stock',
  sizes TEXT,
  colors TEXT,
  upi_id TEXT,
  upi_qr TEXT,
  visible INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  user_id TEXT,
  player_name TEXT,
  product_id TEXT,
  product_title TEXT,
  size TEXT,
  quantity INTEGER DEFAULT 1,
  price REAL,
  amount REAL,
  payment_screenshot TEXT,
  notes TEXT,
  status TEXT DEFAULT 'waiting',
  admin_note TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  logo TEXT,
  game TEXT,
  type TEXT,
  slots INTEGER DEFAULT 100,
  prize_pool TEXT,
  entry_fee REAL DEFAULT 0,
  entry_type TEXT DEFAULT 'free',
  upi_id TEXT,
  upi_qr TEXT,
  registration_deadline TEXT,
  match_date TEXT,
  match_time TEXT,
  registration_status TEXT DEFAULT 'open',
  room_id TEXT,
  room_password TEXT,
  room_id_released INTEGER DEFAULT 0,
  room_id_scheduled TEXT,
  rules TEXT,
  description TEXT,
  visible INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  tournament_title TEXT,
  team_name TEXT,
  leader_name TEXT,
  leader_uid TEXT,
  leader_whatsapp TEXT,
  leader_age TEXT,
  player2_uid TEXT,
  player3_uid TEXT,
  player4_uid TEXT,
  substitute_uid TEXT,
  payment_screenshot TEXT,
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  uid TEXT,
  preferred_game TEXT,
  whatsapp TEXT,
  country TEXT,
  email TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS staff_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  allowed_modules TEXT,
  active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS giveaways (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  rules TEXT,
  reward TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'active',
  winners TEXT,
  visible INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS fan_messages (
  id TEXT PRIMARY KEY,
  type TEXT,
  name TEXT,
  email TEXT,
  message TEXT,
  whatsapp TEXT,
  is_read INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS collab_requests (
  id TEXT PRIMARY KEY,
  name TEXT,
  organization TEXT,
  purpose TEXT,
  budget TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  category TEXT DEFAULT 'other',
  visible INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS facility (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  image TEXT,
  icon TEXT,
  visible INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS facility_stats (
  id TEXT PRIMARY KEY,
  label TEXT,
  value TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY DEFAULT 'main',
  total_visits INTEGER DEFAULT 0,
  today_visits INTEGER DEFAULT 0,
  weekly_visits INTEGER DEFAULT 0,
  last_visit_date TEXT
);

CREATE TABLE IF NOT EXISTS navigation (
  id TEXT PRIMARY KEY,
  label TEXT,
  href TEXT,
  visible INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS founders (
  id TEXT PRIMARY KEY,
  name TEXT,
  designation TEXT,
  photo TEXT,
  description TEXT,
  type TEXT DEFAULT 'founder',
  social_instagram TEXT,
  social_twitter TEXT,
  social_youtube TEXT,
  visible INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS creators (
  id TEXT PRIMARY KEY,
  name TEXT,
  ign TEXT,
  role TEXT,
  photo TEXT,
  content_types TEXT,
  visible INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  social TEXT
);

CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  title TEXT,
  ad_type TEXT,
  placement TEXT,
  image_url TEXT,
  link TEXT,
  enabled INTEGER DEFAULT 0,
  script TEXT,
  iframe_src TEXT,
  video_url TEXT,
  start_date TEXT,
  end_date TEXT,
  device_target TEXT DEFAULT 'all',
  popup_delay INTEGER DEFAULT 3,
  popup_frequency TEXT DEFAULT 'once_per_session',
  target_pages TEXT
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  project_title TEXT,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);
