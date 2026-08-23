-- ============================================================
-- SBG ARMY — Migration 002: New Features
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

-- ─── EXTENDED ROLES ─────────────────────────────────────────
-- Update role constraint to support all roles:
-- 'super_admin' | 'admin' | 'staff' | 'moderator' | 'user'
-- The role column is already text, so it accepts any value.
-- No schema change needed — just use the new role values in INSERTs.

-- ─── AUDIT LOGS ─────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete set null,
  email       text,
  action      text not null,           -- e.g. 'user.login', 'order.approve', 'content.update'
  entity      text,                    -- e.g. 'order', 'user', 'product'
  entity_id   text,
  details     jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "Admins can read audit logs"
  on public.audit_logs for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'super_admin')));

create policy "Service can insert audit logs"
  on public.audit_logs for insert
  with check (true);

-- ─── CONTACT MESSAGES ───────────────────────────────────────
create table if not exists public.contact_messages (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  category    text not null default 'general',  -- general | support | bug | feedback | business | recruitment
  message     text not null,
  status      text not null default 'new',      -- new | read | replied | resolved
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Anyone can submit contact messages"
  on public.contact_messages for insert
  with check (true);

create policy "Admins can read all contact messages"
  on public.contact_messages for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'staff', 'moderator')));

create policy "Admins can update contact messages"
  on public.contact_messages for update
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'staff')));

-- ─── RECRUITMENT APPLICATIONS ───────────────────────────────
create table if not exists public.recruitment_applications (
  id                  uuid primary key default uuid_generate_v4(),
  full_name           text not null,
  age                 integer,
  email               text not null,
  whatsapp            text not null,
  game                text not null,
  role                text not null,
  game_uid            text not null,
  rank                text,
  years_experience    text,
  achievements        text,
  about               text,
  youtube_channel     text,
  instagram           text,
  availability        text,
  status              text not null default 'pending',   -- pending | reviewing | accepted | rejected
  admin_note          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.recruitment_applications enable row level security;

create policy "Anyone can submit recruitment applications"
  on public.recruitment_applications for insert
  with check (true);

create policy "Admins can read recruitment applications"
  on public.recruitment_applications for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'staff')));

create policy "Admins can update recruitment applications"
  on public.recruitment_applications for update
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'staff')));

-- ─── BLOG COMMENTS ──────────────────────────────────────────
create table if not exists public.blog_comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     text not null,           -- reference to IndexedDB post id
  user_id     uuid references public.users(id) on delete cascade,
  author_name text not null,
  content     text not null,
  approved    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.blog_comments enable row level security;

create policy "Anyone can read approved comments"
  on public.blog_comments for select
  using (approved = true);

create policy "Logged-in users can submit comments"
  on public.blog_comments for insert
  with check (auth.uid() = user_id);

create policy "Admins can approve/delete comments"
  on public.blog_comments for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'moderator')));

-- ─── ROLE PERMISSIONS REFERENCE ─────────────────────────────
-- super_admin : full access, can promote/demote admins
-- admin       : full content + order management
-- staff       : view orders, manage roster, respond to contact
-- moderator   : approve blog comments, review recruitment apps
-- user        : standard player account

-- ─── SUPER ADMIN SETUP ──────────────────────────────────────
-- To create a super admin, add the user in Supabase Auth → Users,
-- then run:
--
-- update public.users
-- set role = 'super_admin'
-- where email = '<your-admin-email>';

-- ─── REALTIME (additional tables) ───────────────────────────
alter publication supabase_realtime add table public.contact_messages;
alter publication supabase_realtime add table public.recruitment_applications;

-- ─── UPDATED_AT TRIGGERS ────────────────────────────────────
create or replace trigger contact_messages_updated_at
  before update on public.contact_messages
  for each row execute function public.set_updated_at();

create or replace trigger recruitment_updated_at
  before update on public.recruitment_applications
  for each row execute function public.set_updated_at();
