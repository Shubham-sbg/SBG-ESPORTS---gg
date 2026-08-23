-- ============================================================
-- SBG ARMY — Supabase Initial Schema Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── USERS TABLE ────────────────────────────────────────────
-- Mirrors auth.users with extra player/admin profile fields
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  username    text unique,
  uid         text,                             -- In-game UID
  game        text default 'FREE FIRE',
  whatsapp    text,
  country     text default 'India',
  avatar_url  text,
  role        text not null default 'user',     -- 'admin' | 'user'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Admins can read all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ─── ORDERS TABLE ───────────────────────────────────────────
create table if not exists public.orders (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  product_name            text not null,
  size                    text,
  color                   text,
  custom_name             text,
  custom_number           text,
  quantity                integer not null default 1,
  total_amount            numeric(10,2) not null,
  delivery_name           text,
  delivery_phone          text,
  delivery_address        text,
  delivery_pincode        text,
  delivery_state          text,
  payment_screenshot_url  text,
  status                  text not null default 'pending',   -- pending | approved | rejected
  admin_note              text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admins can read all orders"
  on public.orders for select
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

create policy "Admins can update all orders"
  on public.orders for update
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ─── TOURNAMENTS TABLE ──────────────────────────────────────
create table if not exists public.tournaments (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  game                  text not null,
  type                  text,
  slots                 integer default 16,
  prize_pool            text,
  entry_type            text default 'free',
  entry_fee             numeric(10,2) default 0,
  registration_deadline timestamptz,
  match_date            timestamptz,
  status                text default 'open',    -- open | closed | paused
  description           text,
  rules                 text,
  logo_url              text,
  visible               boolean default true,
  created_at            timestamptz not null default now()
);

alter table public.tournaments enable row level security;

create policy "Tournaments are publicly readable"
  on public.tournaments for select
  using (visible = true);

create policy "Admins manage tournaments"
  on public.tournaments for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ─── TOURNAMENT REGISTRATIONS TABLE ─────────────────────────
create table if not exists public.tournament_registrations (
  id                   uuid primary key default uuid_generate_v4(),
  tournament_id        uuid references public.tournaments(id) on delete cascade,
  user_id              uuid references public.users(id) on delete set null,
  team_name            text not null,
  leader_name          text not null,
  leader_uid           text not null,
  leader_whatsapp      text,
  leader_age           text,
  player2_uid          text,
  player3_uid          text,
  player4_uid          text,
  substitute_uid       text,
  payment_screenshot   text,
  payment_status       text default 'pending',
  status               text default 'pending',  -- pending | approved | rejected
  admin_note           text,
  created_at           timestamptz not null default now()
);

alter table public.tournament_registrations enable row level security;

create policy "Users can read own registrations"
  on public.tournament_registrations for select
  using (auth.uid() = user_id);

create policy "Users can insert registrations"
  on public.tournament_registrations for insert
  with check (auth.uid() = user_id);

create policy "Admins manage all registrations"
  on public.tournament_registrations for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ─── NEWS TABLE ─────────────────────────────────────────────
create table if not exists public.news (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  thumbnail    text,
  category     text default 'Announcement',
  published_at date not null default current_date,
  visible      boolean default true,
  sort_order   integer default 0,
  created_at   timestamptz not null default now()
);

alter table public.news enable row level security;

create policy "News publicly readable"
  on public.news for select
  using (visible = true);

create policy "Admins manage news"
  on public.news for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ─── SPONSORS TABLE ─────────────────────────────────────────
create table if not exists public.sponsors (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  logo_url    text,
  website_url text,
  visible     boolean default true,
  sort_order  integer default 0,
  created_at  timestamptz not null default now()
);

alter table public.sponsors enable row level security;

create policy "Sponsors publicly readable"
  on public.sponsors for select
  using (visible = true);

create policy "Admins manage sponsors"
  on public.sponsors for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ─── SITE SETTINGS TABLE ────────────────────────────────────
create table if not exists public.site_settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Site settings publicly readable"
  on public.site_settings for select
  using (true);

create policy "Admins manage site settings"
  on public.site_settings for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ─── PRODUCTS TABLE (Supabase-side shop) ────────────────────
create table if not exists public.products (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  image_url       text,
  price           numeric(10,2) not null,
  discount_price  numeric(10,2) default 0,
  sizes           text[],
  colors          text[],
  stock_status    text default 'in_stock',      -- in_stock | out_of_stock | coming_soon
  visible         boolean default true,
  sort_order      integer default 0,
  created_at      timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Products publicly readable"
  on public.products for select
  using (visible = true);

create policy "Admins manage products"
  on public.products for all
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ─── STORAGE BUCKETS ────────────────────────────────────────
-- Run these in the Supabase Dashboard → Storage section,
-- or adapt to your bucket configuration.
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('payments', 'payments', false) on conflict do nothing;

-- ─── SEED: Admin users ──────────────────────────────────────
-- STEP 1: Go to Supabase Dashboard → Authentication → Users → "Add User"
--         Add your admin email(s) with a secure password.
--
-- STEP 2: After creating each user, copy their UUID from the Auth panel.
--         Then run the INSERT statement below (replace placeholders):
--
-- insert into public.users (id, email, username, role, created_at)
-- values (
--   'PASTE-USER-UUID-HERE',
--   'your-admin-email@example.com',
--   'sbg_admin',
--   'admin',
--   now()
-- )
-- on conflict (id) do update set role = 'admin';
--
-- Admin 2 — official7sbgarmy7@gmail.com
-- insert into public.users (id, email, username, role, created_at)
-- values (
--   'PASTE-UUID-OF-official7sbgarmy7-HERE',
--   'official7sbgarmy7@gmail.com',
--   'sbg_admin_official',
--   'admin',
--   now()
-- )
-- on conflict (id) do update set role = 'admin';
--
-- STEP 3: Password reset (if needed later):
--   Use Supabase Auth → Users → Reset Password  OR
--   The "Forgot Password" link on yourdomain.com/admin sends a reset email.

-- ─── SEED: Default site settings ────────────────────────────
insert into public.site_settings (key, value) values
  ('loading_logo_url', ''),
  ('maintenance_mode', 'false'),
  ('site_name', 'SBG ARMY')
on conflict (key) do nothing;

-- ─── AUTO-UPDATE TIMESTAMPS ─────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create or replace trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ─── REALTIME ───────────────────────────────────────────────
-- Enable realtime for these tables in the Supabase Dashboard:
-- Dashboard → Database → Replication → Tables
-- OR run:
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.tournament_registrations;
alter publication supabase_realtime add table public.news;
