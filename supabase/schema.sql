-- ============================================================================
-- autobladi.ma — COMPLETE DATABASE SCHEMA (consolidated)
-- ============================================================================
--
-- This single file replaces migrations 001..044. It describes the FINAL state
-- of the database, with every later drop/rename already applied:
--
--   • car "categories"        — removed (migration 021)
--   • verification_requests   — removed (migration 040)
--   • subscriptions/plans     — removed (migration 039)
--   • featured listings       — removed (migration 041)
--   • concessionnaires        — renamed to "professionnels" (migration 032)
--
-- HOW TO USE ON A NEW PROJECT
--   1. Create a fresh Supabase project.
--   2. Open the SQL Editor and run this whole file in one go.
--   3. Recreate the storage buckets' contents (this file creates the buckets
--      and their policies, but not the image files themselves).
--   4. Copy your env vars (see .env.local.example).
--
-- Safe to re-run: every statement is idempotent (create ... if not exists /
-- create or replace / on conflict do nothing).
--
-- NOTE ON auth.users: Supabase owns that table. We only attach a trigger to it.
--
-- ----------------------------------------------------------------------------
-- ⚠️  KNOWN DRIFT vs. the CURRENT production database (2026-07)
--
--  profiles.newsletter_subscribed  and  profiles.email_unsubscribe_token
--  are declared here but are MISSING from the live database — migration 010
--  was never fully applied. The app reads both columns (email/recipients.ts,
--  queries/admin.ts, /unsubscribe), so newsletter sending, the admin
--  newsletter stats and the unsubscribe page currently fail at runtime.
--
--  This file declares the CORRECT schema. To repair an existing database:
--
--    alter table public.profiles
--      add column if not exists newsletter_subscribed boolean not null default true,
--      add column if not exists email_unsubscribe_token text;
--
--    update public.profiles
--       set email_unsubscribe_token = encode(gen_random_bytes(24), 'base64')
--     where email_unsubscribe_token is null;
--
--    create unique index if not exists idx_profiles_unsubscribe_token
--      on public.profiles (email_unsubscribe_token)
--      where email_unsubscribe_token is not null;
--
--  Also note: the review-aggregate function is named
--  recompute_professionnel_rating() here; the live DB still carries the
--  pre-rename name recompute_concessionnaire_rating(). Both behave
--  identically — only fresh installs get the clearer name.
-- ----------------------------------------------------------------------------
-- ============================================================================


-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
create extension if not exists "pgcrypto";
create extension if not exists "unaccent";


-- ============================================================================
-- 2. ENUMS
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_type') then
    create type account_type as enum ('gratuit', 'pro', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'fuel_type') then
    create type fuel_type as enum ('essence', 'diesel', 'hybrid', 'electric', 'lpg');
  end if;
  if not exists (select 1 from pg_type where typname = 'transmission_type') then
    create type transmission_type as enum ('manuelle', 'automatique');
  end if;
  if not exists (select 1 from pg_type where typname = 'condition_type') then
    create type condition_type as enum ('neuf', 'occasion');
  end if;
  if not exists (select 1 from pg_type where typname = 'annonce_status') then
    create type annonce_status as enum ('draft', 'pending', 'active', 'sold', 'rejected', 'expired');
  end if;
  -- Still used by public.reports.status
  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type request_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;


-- ============================================================================
-- 3. HELPER FUNCTIONS (needed by tables/policies below)
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    lower(unaccent(coalesce(value, ''))),
    '[^a-z0-9]+', '-', 'g'
  ));
$$;


-- ============================================================================
-- 4. PROFILES (extends auth.users) — first, because is_admin() reads it
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  whatsapp text,
  avatar_url text,
  account_type account_type not null default 'gratuit',
  city text,
  -- Email / newsletter (migration 010)
  newsletter_subscribed boolean not null default true,
  email_unsubscribe_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_profiles_unsubscribe_token
  on public.profiles (email_unsubscribe_token)
  where email_unsubscribe_token is not null;

-- Used inside nearly every RLS policy. SECURITY DEFINER so it can read
-- profiles regardless of the caller's own row-level permissions.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and account_type = 'admin'
  );
$$;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Every profile gets a random unsubscribe token so newsletter emails can
-- carry a one-click opt-out link without an extra round trip.
create or replace function public.set_unsubscribe_token()
returns trigger
language plpgsql
as $$
begin
  if new.email_unsubscribe_token is null then
    new.email_unsubscribe_token = encode(gen_random_bytes(24), 'base64');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_unsubscribe_token on public.profiles;
create trigger trg_profiles_unsubscribe_token
  before insert on public.profiles
  for each row execute function public.set_unsubscribe_token();


-- ============================================================================
-- 5. REFERENCE TABLES — brands / models / cities / secteurs
-- ============================================================================
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.car_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_fr text not null,
  slug text not null unique,
  region text,
  created_at timestamptz not null default now()
);

-- Districts / quartiers inside a city (Casablanca → Maarif, Ain Sebaa …).
create table if not exists public.secteurs (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name_ar text not null,
  name_fr text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  -- Unique per city: two cities may both have a "centre-ville".
  unique (city_id, slug)
);


-- ============================================================================
-- 6. ANNONCES (listings) + images
-- ============================================================================
create table if not exists public.annonces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text,
  brand_id uuid references public.brands(id) on delete restrict,
  model_id uuid references public.car_models(id) on delete restrict,
  city_id uuid references public.cities(id) on delete set null,
  secteur_id uuid references public.secteurs(id) on delete set null,
  year integer,
  mileage integer,
  price numeric(12, 2),
  price_on_request boolean not null default false,
  negotiable boolean not null default false,
  fuel_type fuel_type,
  transmission transmission_type,
  body_type text,
  origine text,                     -- ww_maroc | dedouanee | non_dedouanee
  color text,
  doors integer,
  seats integer,
  engine_power integer,
  engine_size text,
  first_owner boolean default false,
  accident_free boolean default false,
  condition condition_type default 'occasion',
  options jsonb not null default '[]'::jsonb,
  video_url text,                   -- promo video (pros only, enforced in app)
  contact_phone text,
  contact_whatsapp text,
  status annonce_status not null default 'pending',
  rejection_reason text,
  views_count integer not null default 0,
  expires_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Build a readable slug: brand-model-year-city-<random>.
create or replace function public.generate_annonce_slug()
returns trigger
language plpgsql
as $$
declare
  brand_slug text;
  model_slug text;
  city_slug text;
  suffix text;
begin
  if new.slug is not null and length(new.slug) > 0 then
    return new;
  end if;

  select b.slug into brand_slug from public.brands b where b.id = new.brand_id;
  select m.slug into model_slug from public.car_models m where m.id = new.model_id;
  select c.slug into city_slug from public.cities c where c.id = new.city_id;
  suffix := substr(encode(gen_random_bytes(4), 'hex'), 1, 6);

  new.slug := trim(both '-' from concat_ws('-',
    nullif(brand_slug, ''),
    nullif(model_slug, ''),
    nullif(new.year::text, ''),
    nullif(city_slug, ''),
    suffix
  ));

  if new.slug is null or length(new.slug) = 0 then
    new.slug := public.slugify(coalesce(new.title, 'annonce')) || '-' || suffix;
  end if;

  return new;
end;
$$;

drop trigger if exists annonces_set_slug on public.annonces;
create trigger annonces_set_slug
  before insert on public.annonces
  for each row execute function public.generate_annonce_slug();

-- On going active, stamp expires_at from the owner's account type:
--   gratuit → site_settings.annonce_duration_days      (default 60)
--   pro     → site_settings.annonce_duration_days_pro  (default 90)
create or replace function public.set_annonce_expiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer;
  v_account_type text;
  v_key text;
begin
  if new.status = 'active'
     and (old.status is null or old.status <> 'active')
     and new.expires_at is null then

    select account_type into v_account_type
      from public.profiles
     where id = new.user_id;

    if v_account_type = 'pro' then
      v_key := 'annonce_duration_days_pro';
    else
      v_key := 'annonce_duration_days';
    end if;

    select (value)::text::int into v_days
      from public.site_settings
     where key = v_key;

    if v_days is null or v_days < 1 then
      v_days := 60;
    end if;

    new.expires_at := coalesce(new.published_at, now()) + (v_days * interval '1 day');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_annonces_set_expiry on public.annonces;
create trigger trg_annonces_set_expiry
  before insert or update on public.annonces
  for each row execute function public.set_annonce_expiry();

-- Called by a scheduled job: flips active listings past expires_at.
create or replace function public.expire_annonces()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with affected as (
    update public.annonces
       set status = 'expired'
     where status = 'active'
       and expires_at is not null
       and expires_at < now()
    returning id
  )
  select count(*) into v_count from affected;
  return v_count;
end;
$$;

create table if not exists public.annonce_images (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid not null references public.annonces(id) on delete cascade,
  url text not null,
  thumbnail_url text,
  order_index integer not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 7. FAVORITES
-- ============================================================================
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  annonce_id uuid not null references public.annonces(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, annonce_id)
);


-- ============================================================================
-- 8. CONVERSATIONS / MESSAGES (realtime)
-- ============================================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid not null references public.profiles(id) on delete cascade,
  annonce_id uuid references public.annonces(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user1_id, user2_id, annonce_id),
  check (user1_id <> user2_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  annonce_id uuid references public.annonces(id) on delete set null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 9. PROFESSIONNELS (showrooms) + reviews
-- ============================================================================
create table if not exists public.professionnels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  cover_url text,
  address text,
  city_id uuid references public.cities(id) on delete set null,
  secteur_id uuid references public.secteurs(id) on delete set null,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  phone text,
  whatsapp text,
  email text,
  website text,
  facebook text,
  instagram text,
  youtube text,
  tiktok text,
  linkedin text,
  opening_hours jsonb,
  rating numeric(3, 2) not null default 0,
  reviews_count integer not null default 0,
  is_active boolean not null default true,
  is_verified boolean not null default false,   -- admin-granted badge
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professionnel_reviews (
  id uuid primary key default gen_random_uuid(),
  professionnel_id uuid not null references public.professionnels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- One review per user per showroom.
create unique index if not exists ux_reviews_user_per_professionnel
  on public.professionnel_reviews (professionnel_id, user_id);

-- Keep professionnels.rating / reviews_count denormalised so listings can
-- sort and filter without a per-row sub-query.
create or replace function public.recompute_professionnel_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.professionnel_id, old.professionnel_id);
  if target_id is null then
    return coalesce(new, old);
  end if;

  update public.professionnels p
     set rating = coalesce(sub.avg_rating, 0),
         reviews_count = coalesce(sub.cnt, 0)
    from (
      select avg(rating)::numeric(3,2) as avg_rating,
             count(*) as cnt
        from public.professionnel_reviews
       where professionnel_id = target_id
    ) as sub
   where p.id = target_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_review_aggregate_insert on public.professionnel_reviews;
create trigger trg_review_aggregate_insert
  after insert on public.professionnel_reviews
  for each row execute function public.recompute_professionnel_rating();

drop trigger if exists trg_review_aggregate_update on public.professionnel_reviews;
create trigger trg_review_aggregate_update
  after update on public.professionnel_reviews
  for each row execute function public.recompute_professionnel_rating();

drop trigger if exists trg_review_aggregate_delete on public.professionnel_reviews;
create trigger trg_review_aggregate_delete
  after delete on public.professionnel_reviews
  for each row execute function public.recompute_professionnel_rating();


-- ============================================================================
-- 10. ESTIMATIONS (AI price estimates)
-- ============================================================================
create table if not exists public.estimations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  model_id uuid references public.car_models(id) on delete set null,
  year integer,
  mileage integer,
  condition condition_type,
  city_id uuid references public.cities(id) on delete set null,
  fuel_type fuel_type,
  estimated_price_min numeric(12, 2),
  estimated_price_max numeric(12, 2),
  gemini_response jsonb,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 11. BLOG
-- ============================================================================
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_fr text not null,
  slug text not null unique,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.blog_categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  -- Primary (Arabic) fields + optional French translation; reads fall back
  -- to the primary field when the French value is empty.
  title text not null,
  title_fr text,
  slug text not null unique,
  excerpt text,
  excerpt_fr text,
  content text,
  content_fr text,
  cover_image text,
  tags text[] not null default '{}',
  is_published boolean not null default false,
  published_at timestamptz,
  views_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.blog_comments(id) on delete cascade,
  content text not null,
  is_approved boolean not null default false,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Public view counter — SECURITY DEFINER so an anonymous request can bump it.
create or replace function public.increment_blog_view(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.blog_posts
     set views_count = coalesce(views_count, 0) + 1
   where id = p_post_id
     and is_published = true;
end;
$$;

-- Cached comments_count counts APPROVED comments only.
create or replace function public.refresh_blog_comments_count(p_post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.blog_posts
     set comments_count = (
       select count(*) from public.blog_comments
        where post_id = p_post_id and is_approved = true
     )
   where id = p_post_id;
$$;

create or replace function public.on_blog_comment_changed()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_blog_comments_count(new.post_id);
  elsif tg_op = 'UPDATE' then
    if new.is_approved is distinct from old.is_approved
       or new.post_id is distinct from old.post_id then
      perform public.refresh_blog_comments_count(new.post_id);
      if new.post_id is distinct from old.post_id then
        perform public.refresh_blog_comments_count(old.post_id);
      end if;
    end if;
  elsif tg_op = 'DELETE' then
    perform public.refresh_blog_comments_count(old.post_id);
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_blog_comments_count_ins on public.blog_comments;
create trigger trg_blog_comments_count_ins
  after insert on public.blog_comments
  for each row execute function public.on_blog_comment_changed();

drop trigger if exists trg_blog_comments_count_upd on public.blog_comments;
create trigger trg_blog_comments_count_upd
  after update on public.blog_comments
  for each row execute function public.on_blog_comment_changed();

drop trigger if exists trg_blog_comments_count_del on public.blog_comments;
create trigger trg_blog_comments_count_del
  after delete on public.blog_comments
  for each row execute function public.on_blog_comment_changed();


-- ============================================================================
-- 12. REPORTS / CONTACT MESSAGES
-- ============================================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid not null references public.annonces(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  description text,
  status request_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 13. ADVERTISING — placements / creatives / events
-- ============================================================================
create table if not exists public.ad_placements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  -- Desktop size; *_mobile overrides it below the md breakpoint.
  width integer,
  height integer,
  width_mobile integer,
  height_mobile integer,
  device text not null default 'both' check (device in ('mobile', 'desktop', 'both')),
  default_provider text check (default_provider in ('adsense', 'direct')),
  adsense_slot_id text,
  lazy boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.advertisements (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.ad_placements(id) on delete cascade,
  title text not null,
  image_url text not null,
  link_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  clicks integer not null default 0,
  impressions integer not null default 0,
  created_at timestamptz not null default now()
);

-- Atomic counters. SECURITY DEFINER because ads_admin_write blocks direct
-- UPDATE for the public — the RPC body is the only allowed mutation.
create or replace function public.increment_ad_click(p_ad_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.advertisements
     set clicks = coalesce(clicks, 0) + 1
   where id = p_ad_id
     and is_active = true;
end;
$$;

create or replace function public.increment_ad_impression(p_ad_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.advertisements
     set impressions = coalesce(impressions, 0) + 1
   where id = p_ad_id
     and is_active = true;
end;
$$;

-- Per-listing engagement log powering the Pro statistics dashboard.
-- Written/read via the service-role client only: RLS is ON with NO policies,
-- so anon/authenticated can neither read nor write.
create table if not exists public.ad_events (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.annonces(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'phone_click', 'whatsapp_click', 'message')),
  source text not null default 'direct' check (source in ('search', 'homepage', 'dealer_page', 'direct', 'other')),
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 14. CMS PAGES (À propos, CGU, Confidentialité …)
-- ============================================================================
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_fr text not null,
  title_ar text not null,
  content_fr text,
  content_ar text,
  is_published boolean not null default true,
  show_in_footer boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================================================
-- 15. SETTINGS / SECRETS / NOTIFICATIONS
-- ============================================================================
-- PUBLIC-READ settings (logo, analytics id, adsense client id …).
-- Never put secrets here — see app_secrets / ai_settings below.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Social login credentials — ADMIN ONLY (contains client secrets).
create table if not exists public.social_login_settings (
  provider text primary key check (provider in ('facebook', 'google')),
  enabled boolean not null default false,
  client_id text not null default '',
  secret text not null default '',
  redirect_url text not null default '',
  updated_at timestamptz not null default now()
);

-- AI provider + API keys — ADMIN ONLY. Singleton row (id = true).
create table if not exists public.ai_settings (
  id boolean primary key default true,
  provider text not null default 'gemini',
  gemini_key text not null default '',
  openai_key text not null default '',
  openai_model text not null default '',
  qwen_key text not null default '',
  qwen_model text not null default '',
  updated_at timestamptz not null default now(),
  constraint ai_settings_singleton check (id),
  constraint ai_settings_provider_check check (provider in ('gemini', 'openai', 'qwen'))
);

-- Integration secrets (Resend API key) — ADMIN ONLY. Singleton row.
create table if not exists public.app_secrets (
  id boolean primary key default true,
  resend_key text not null default '',
  updated_at timestamptz not null default now(),
  constraint app_secrets_singleton check (id)
);


-- ============================================================================
-- 16. updated_at TRIGGERS
-- ============================================================================
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists annonces_set_updated_at on public.annonces;
create trigger annonces_set_updated_at
  before update on public.annonces
  for each row execute function public.set_updated_at();

drop trigger if exists professionnels_set_updated_at on public.professionnels;
create trigger professionnels_set_updated_at
  before update on public.professionnels
  for each row execute function public.set_updated_at();

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

drop trigger if exists pages_set_updated_at on public.pages;
create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 17. INDEXES
-- ============================================================================
-- annonces — every filterable column on /annonces
create index if not exists idx_annonces_status         on public.annonces (status);
create index if not exists idx_annonces_brand          on public.annonces (brand_id);
create index if not exists idx_annonces_model          on public.annonces (model_id);
create index if not exists idx_annonces_city           on public.annonces (city_id);
create index if not exists idx_annonces_user           on public.annonces (user_id);
create index if not exists idx_annonces_price          on public.annonces (price);
create index if not exists idx_annonces_year           on public.annonces (year);
create index if not exists idx_annonces_mileage        on public.annonces (mileage);
create index if not exists idx_annonces_fuel           on public.annonces (fuel_type);
create index if not exists idx_annonces_transmission   on public.annonces (transmission);
create index if not exists idx_annonces_published      on public.annonces (published_at desc);
create index if not exists idx_annonces_active_listing on public.annonces (status, published_at desc) where status = 'active';
create index if not exists idx_annonces_secteur        on public.annonces (secteur_id) where secteur_id is not null;
create index if not exists idx_annonces_expires_at     on public.annonces (expires_at) where status = 'active';

create index if not exists idx_annonce_images_annonce  on public.annonce_images (annonce_id, order_index);
create index if not exists idx_car_models_brand        on public.car_models (brand_id);
create index if not exists idx_secteurs_city           on public.secteurs (city_id);
create index if not exists idx_favorites_user          on public.favorites (user_id);
create index if not exists idx_favorites_annonce       on public.favorites (annonce_id);

-- messaging
create index if not exists idx_messages_receiver       on public.messages (receiver_id, is_read);
create index if not exists idx_messages_sender         on public.messages (sender_id);
create index if not exists idx_messages_annonce        on public.messages (annonce_id);
create index if not exists idx_messages_created        on public.messages (created_at desc);
create index if not exists idx_messages_conversation   on public.messages (conversation_id, created_at);
create index if not exists idx_messages_unread_per_user on public.messages (receiver_id, is_read) where is_read = false;
create index if not exists idx_conversations_user1     on public.conversations (user1_id, last_message_at desc);
create index if not exists idx_conversations_user2     on public.conversations (user2_id, last_message_at desc);

-- showrooms
create index if not exists idx_professionnels_city     on public.professionnels (city_id);
create index if not exists idx_professionnels_slug     on public.professionnels (slug);
create index if not exists idx_reviews_professionnel   on public.professionnel_reviews (professionnel_id);

-- blog / misc
create index if not exists idx_estimations_user        on public.estimations (user_id);
create index if not exists idx_blog_posts_category     on public.blog_posts (category_id);
create index if not exists idx_blog_posts_published    on public.blog_posts (is_published, published_at desc);
create index if not exists idx_blog_posts_tags         on public.blog_posts using gin (tags);
create index if not exists idx_blog_comments_post      on public.blog_comments (post_id);
create index if not exists idx_blog_comments_parent    on public.blog_comments (parent_id);
create index if not exists idx_reports_annonce         on public.reports (annonce_id);
create index if not exists idx_reports_status          on public.reports (status);
create index if not exists idx_ads_placement           on public.advertisements (placement_id, is_active);
create index if not exists ad_events_ad_type_created_idx on public.ad_events (ad_id, event_type, created_at);
create index if not exists idx_notifications_user      on public.notifications (user_id, is_read, created_at desc);
create index if not exists idx_pages_footer            on public.pages (order_index) where is_published and show_in_footer;


-- ============================================================================
-- 18. REALTIME (messaging)
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;

-- Required so Realtime can emit OLD values on UPDATE/DELETE.
alter table public.messages      replica identity full;
alter table public.conversations replica identity full;


-- ============================================================================
-- 19. ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles              enable row level security;
alter table public.brands                enable row level security;
alter table public.car_models            enable row level security;
alter table public.cities                enable row level security;
alter table public.secteurs              enable row level security;
alter table public.annonces              enable row level security;
alter table public.annonce_images        enable row level security;
alter table public.favorites             enable row level security;
alter table public.conversations         enable row level security;
alter table public.messages              enable row level security;
alter table public.professionnels        enable row level security;
alter table public.professionnel_reviews enable row level security;
alter table public.estimations           enable row level security;
alter table public.blog_categories       enable row level security;
alter table public.blog_posts            enable row level security;
alter table public.blog_comments         enable row level security;
alter table public.reports               enable row level security;
alter table public.contact_messages      enable row level security;
alter table public.ad_placements         enable row level security;
alter table public.advertisements        enable row level security;
alter table public.ad_events             enable row level security;  -- no policies: service-role only
alter table public.site_settings         enable row level security;
alter table public.notifications         enable row level security;
alter table public.pages                 enable row level security;
alter table public.social_login_settings enable row level security;
alter table public.ai_settings           enable row level security;
alter table public.app_secrets           enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles for select using (true);
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Reference tables: public read, admin write
-- ---------------------------------------------------------------------------
drop policy if exists "brands_public_read" on public.brands;
create policy "brands_public_read" on public.brands for select using (true);
drop policy if exists "brands_admin_write" on public.brands;
create policy "brands_admin_write" on public.brands for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "models_public_read" on public.car_models;
create policy "models_public_read" on public.car_models for select using (true);
drop policy if exists "models_admin_write" on public.car_models;
create policy "models_admin_write" on public.car_models for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "cities_public_read" on public.cities;
create policy "cities_public_read" on public.cities for select using (true);
drop policy if exists "cities_admin_write" on public.cities;
create policy "cities_admin_write" on public.cities for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "secteurs_public_read" on public.secteurs;
create policy "secteurs_public_read" on public.secteurs for select using (true);
drop policy if exists "secteurs_admin_write" on public.secteurs;
create policy "secteurs_admin_write" on public.secteurs for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- annonces — active listings are public; owners and admins see their own
-- ---------------------------------------------------------------------------
drop policy if exists "annonces_active_public_read" on public.annonces;
create policy "annonces_active_public_read" on public.annonces for select
  using (status = 'active' or user_id = auth.uid() or public.is_admin());
drop policy if exists "annonces_owner_insert" on public.annonces;
create policy "annonces_owner_insert" on public.annonces for insert with check (user_id = auth.uid());
drop policy if exists "annonces_owner_update" on public.annonces;
create policy "annonces_owner_update" on public.annonces for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "annonces_owner_delete" on public.annonces;
create policy "annonces_owner_delete" on public.annonces for delete using (user_id = auth.uid());
drop policy if exists "annonces_admin_all" on public.annonces;
create policy "annonces_admin_all" on public.annonces for all using (public.is_admin()) with check (public.is_admin());

-- annonce_images — visibility follows the parent listing
drop policy if exists "images_read" on public.annonce_images;
create policy "images_read" on public.annonce_images for select
  using (exists (
    select 1 from public.annonces a
    where a.id = annonce_id
      and (a.status = 'active' or a.user_id = auth.uid() or public.is_admin())
  ));
drop policy if exists "images_owner_write" on public.annonce_images;
create policy "images_owner_write" on public.annonce_images for all
  using (exists (select 1 from public.annonces a where a.id = annonce_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.annonces a where a.id = annonce_id and a.user_id = auth.uid()));
drop policy if exists "images_admin_all" on public.annonce_images;
create policy "images_admin_all" on public.annonce_images for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- favorites — strictly private
-- ---------------------------------------------------------------------------
drop policy if exists "favorites_self_read" on public.favorites;
create policy "favorites_self_read" on public.favorites for select using (user_id = auth.uid());
drop policy if exists "favorites_self_write" on public.favorites;
create policy "favorites_self_write" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- conversations / messages — participants only
-- ---------------------------------------------------------------------------
drop policy if exists "conv_participants_read" on public.conversations;
create policy "conv_participants_read" on public.conversations for select
  using (user1_id = auth.uid() or user2_id = auth.uid() or public.is_admin());
drop policy if exists "conv_participants_write" on public.conversations;
create policy "conv_participants_write" on public.conversations for all
  using (user1_id = auth.uid() or user2_id = auth.uid())
  with check (user1_id = auth.uid() or user2_id = auth.uid());

drop policy if exists "messages_participants_read" on public.messages;
create policy "messages_participants_read" on public.messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin());
drop policy if exists "messages_sender_insert" on public.messages;
create policy "messages_sender_insert" on public.messages for insert with check (sender_id = auth.uid());
drop policy if exists "messages_receiver_update" on public.messages;
create policy "messages_receiver_update" on public.messages for update using (receiver_id = auth.uid()) with check (receiver_id = auth.uid());

-- ---------------------------------------------------------------------------
-- professionnels
-- ---------------------------------------------------------------------------
drop policy if exists "dealers_public_read" on public.professionnels;
create policy "dealers_public_read" on public.professionnels for select
  using (is_active or user_id = auth.uid() or public.is_admin());
drop policy if exists "dealers_owner_write" on public.professionnels;
create policy "dealers_owner_write" on public.professionnels for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "dealers_admin_all" on public.professionnels;
create policy "dealers_admin_all" on public.professionnels for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "reviews_public_read" on public.professionnel_reviews;
create policy "reviews_public_read" on public.professionnel_reviews for select using (true);
drop policy if exists "reviews_author_write" on public.professionnel_reviews;
create policy "reviews_author_write" on public.professionnel_reviews for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "reviews_admin_all" on public.professionnel_reviews;
create policy "reviews_admin_all" on public.professionnel_reviews for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- estimations — anonymous estimates allowed (user_id null)
-- ---------------------------------------------------------------------------
drop policy if exists "estimations_owner_read" on public.estimations;
create policy "estimations_owner_read" on public.estimations for select
  using (user_id is null or user_id = auth.uid() or public.is_admin());
drop policy if exists "estimations_insert" on public.estimations;
create policy "estimations_insert" on public.estimations for insert with check (user_id is null or user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- blog
-- ---------------------------------------------------------------------------
drop policy if exists "blog_cats_public_read" on public.blog_categories;
create policy "blog_cats_public_read" on public.blog_categories for select using (true);
drop policy if exists "blog_cats_admin_write" on public.blog_categories;
create policy "blog_cats_admin_write" on public.blog_categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "blog_posts_public_read" on public.blog_posts;
create policy "blog_posts_public_read" on public.blog_posts for select
  using (is_published or author_id = auth.uid() or public.is_admin());
drop policy if exists "blog_posts_author_write" on public.blog_posts;
create policy "blog_posts_author_write" on public.blog_posts for all using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists "blog_posts_admin_write" on public.blog_posts;
create policy "blog_posts_admin_write" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "blog_comments_public_read" on public.blog_comments;
create policy "blog_comments_public_read" on public.blog_comments for select
  using (is_approved or user_id = auth.uid() or public.is_admin());
drop policy if exists "blog_comments_self_insert" on public.blog_comments;
create policy "blog_comments_self_insert" on public.blog_comments for insert with check (user_id = auth.uid());
drop policy if exists "blog_comments_self_delete" on public.blog_comments;
create policy "blog_comments_self_delete" on public.blog_comments for delete using (user_id = auth.uid() or public.is_admin());
drop policy if exists "blog_comments_admin_update" on public.blog_comments;
create policy "blog_comments_admin_update" on public.blog_comments for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- reports / contact
-- ---------------------------------------------------------------------------
drop policy if exists "reports_self_insert" on public.reports;
create policy "reports_self_insert" on public.reports for insert with check (reporter_id = auth.uid() or reporter_id is null);
drop policy if exists "reports_self_read" on public.reports;
create policy "reports_self_read" on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
drop policy if exists "reports_admin_update" on public.reports;
create policy "reports_admin_update" on public.reports for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "contact_anyone_insert" on public.contact_messages;
create policy "contact_anyone_insert" on public.contact_messages for insert with check (true);
drop policy if exists "contact_admin_read" on public.contact_messages;
create policy "contact_admin_read" on public.contact_messages for select using (public.is_admin());
drop policy if exists "contact_admin_update" on public.contact_messages;
create policy "contact_admin_update" on public.contact_messages for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- advertising
-- ---------------------------------------------------------------------------
drop policy if exists "placements_public_read" on public.ad_placements;
create policy "placements_public_read" on public.ad_placements for select using (true);
drop policy if exists "placements_admin_write" on public.ad_placements;
create policy "placements_admin_write" on public.ad_placements for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ads_public_read" on public.advertisements;
create policy "ads_public_read" on public.advertisements for select using (is_active or public.is_admin());
drop policy if exists "ads_admin_write" on public.advertisements;
create policy "ads_admin_write" on public.advertisements for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- settings / notifications / pages
-- ---------------------------------------------------------------------------
drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings for select using (true);
drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notif_self_read" on public.notifications;
create policy "notif_self_read" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "notif_self_update" on public.notifications;
create policy "notif_self_update" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notif_admin_insert" on public.notifications;
create policy "notif_admin_insert" on public.notifications for insert with check (public.is_admin() or user_id = auth.uid());

drop policy if exists "pages_public_read" on public.pages;
create policy "pages_public_read" on public.pages for select using (is_published or public.is_admin());
drop policy if exists "pages_admin_all" on public.pages;
create policy "pages_admin_all" on public.pages for all using (public.is_admin()) with check (public.is_admin());

-- Secret-bearing tables: admin only, no public read of any kind.
drop policy if exists "social_admin_all" on public.social_login_settings;
create policy "social_admin_all" on public.social_login_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ai_admin_all" on public.ai_settings;
create policy "ai_admin_all" on public.ai_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "app_secrets_admin_all" on public.app_secrets;
create policy "app_secrets_admin_all" on public.app_secrets for all using (public.is_admin()) with check (public.is_admin());


-- ============================================================================
-- 20. GRANTS (RLS still governs which ROWS each role sees)
-- ============================================================================
grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to anon, authenticated;
grant all on all sequences in schema public to service_role;

grant execute on all functions in schema public to anon, authenticated, service_role;

-- Same defaults for anything created later.
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- Explicit grants for the public-callable RPCs.
grant execute on function public.increment_ad_click(uuid)      to anon, authenticated, service_role;
grant execute on function public.increment_ad_impression(uuid) to anon, authenticated, service_role;
grant execute on function public.increment_blog_view(uuid)     to anon, authenticated, service_role;
grant execute on function public.expire_annonces()             to service_role;


-- ============================================================================
-- 21. STORAGE BUCKETS + POLICIES
-- ============================================================================
-- NOTE: the bucket id "concessionnaires" is intentionally NOT renamed to
-- "professionnels" — renaming it would invalidate every existing logo/cover
-- URL. It is internal and never shown to users.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('annonces',         'annonces',         true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('avatars',          'avatars',          true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('concessionnaires', 'concessionnaires', true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('blog',             'blog',             true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('ads',              'ads',              true,  5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Owner-scoped buckets: the first path segment must be the caller's uid,
-- i.e. objects are stored as "<user_id>/<file>".
-- annonces ------------------------------------------------------------------
drop policy if exists "annonces_public_read" on storage.objects;
create policy "annonces_public_read" on storage.objects for select using (bucket_id = 'annonces');
drop policy if exists "annonces_owner_insert" on storage.objects;
create policy "annonces_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'annonces' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "annonces_owner_update" on storage.objects;
create policy "annonces_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'annonces' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "annonces_owner_delete" on storage.objects;
create policy "annonces_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'annonces' and (storage.foldername(name))[1] = auth.uid()::text);

-- avatars -------------------------------------------------------------------
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- concessionnaires (showroom logos / covers) --------------------------------
drop policy if exists "concessionnaires_public_read" on storage.objects;
create policy "concessionnaires_public_read" on storage.objects for select using (bucket_id = 'concessionnaires');
drop policy if exists "concessionnaires_owner_write" on storage.objects;
create policy "concessionnaires_owner_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'concessionnaires' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "concessionnaires_owner_update" on storage.objects;
create policy "concessionnaires_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'concessionnaires' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "concessionnaires_owner_delete" on storage.objects;
create policy "concessionnaires_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'concessionnaires' and (storage.foldername(name))[1] = auth.uid()::text);

-- blog / ads — public read, admin write only --------------------------------
drop policy if exists "blog_public_read" on storage.objects;
create policy "blog_public_read" on storage.objects for select using (bucket_id = 'blog');
drop policy if exists "blog_admin_write" on storage.objects;
create policy "blog_admin_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'blog' and public.is_admin());
drop policy if exists "blog_admin_update" on storage.objects;
create policy "blog_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'blog' and public.is_admin());
drop policy if exists "blog_admin_delete" on storage.objects;
create policy "blog_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'blog' and public.is_admin());

drop policy if exists "ads_public_read" on storage.objects;
create policy "ads_public_read" on storage.objects for select using (bucket_id = 'ads');
drop policy if exists "ads_admin_write" on storage.objects;
create policy "ads_admin_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'ads' and public.is_admin());
drop policy if exists "ads_admin_update" on storage.objects;
create policy "ads_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'ads' and public.is_admin());
drop policy if exists "ads_admin_delete" on storage.objects;
create policy "ads_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'ads' and public.is_admin());


-- ============================================================================
-- 22. SEED DATA
-- ============================================================================
-- --- Ad placements ---------------------------------------------------------
-- Desktop slots
insert into public.ad_placements (name, slug, width, height, description, device) values
  ('Home — Top banner',           'home_top',              970, 250, 'Bannière en haut de la page d''accueil',              'desktop'),
  ('Home — Middle banner',        'home_middle',           970, 250, 'Bannière au milieu de la page d''accueil',            'desktop'),
  ('Home — Bottom banner',        'home_bottom',           970, 250, 'Bannière en bas de la page d''accueil',               'desktop'),
  ('Listings — Top banner',       'listings_top',          970, 120, 'Bannière en haut de la page des annonces',            'desktop'),
  ('Listings — Sidebar',          'listings_sidebar',      300, 600, 'Encart latéral sur la page des annonces',             'desktop'),
  ('Listings — Inline',           'listings_inline',       970, 150, 'Bannière injectée entre les annonces',                'desktop'),
  ('Annonce — Top banner',        'annonce_top',           728,  90, 'Bannière en haut de la page de détail',               'desktop'),
  ('Annonce — Sidebar',           'annonce_sidebar',       300, 250, 'Encart latéral sur la page de détail',                'desktop'),
  ('Annonce — Bottom banner',     'annonce_bottom',        728,  90, 'Bannière en bas de la page de détail',                'desktop'),
  ('Professionnel — Top banner',  'professionnel_top',     970, 150, 'Bannière en haut de la page d''un professionnel',      'desktop'),
  ('Professionnel — Sidebar',     'professionnel_sidebar', 300, 600, 'Encart latéral sur la page d''un professionnel',       'desktop'),
  ('Blog — Top banner',           'blog_top',              970, 150, 'Bannière en haut du blog',                            'desktop'),
  ('Blog — Sidebar',              'blog_sidebar',          300, 600, 'Encart latéral du blog',                              'desktop'),
  ('Footer — Banner',             'footer_banner',         970, 120, 'Bannière en pied de page (toutes pages)',             'desktop'),
  ('Blog — Inline post',          'blog_post_inline',      728,  90, 'Bannière au milieu d''un article',                     'both'),
  -- Mobile slots (300×250 Medium Rectangle — universally accepted)
  ('Home — Top (Mobile)',          'home_top_mobile',          300, 250, 'Bannière en haut de l''accueil sur mobile',             'mobile'),
  ('Home — Middle (Mobile)',       'home_middle_mobile',       300, 250, 'Bannière au milieu de l''accueil sur mobile',           'mobile'),
  ('Listings — Top (Mobile)',      'listings_top_mobile',      300, 250, 'Bannière en haut de la liste des annonces sur mobile',  'mobile'),
  ('Listings — Inline (Mobile)',   'listings_inline_mobile',   300, 250, 'Bannière entre les annonces sur mobile',                'mobile'),
  ('Annonce — Top (Mobile)',       'annonce_top_mobile',       300, 250, 'Bannière en haut de la page de détail sur mobile',      'mobile'),
  ('Annonce — Bottom (Mobile)',    'annonce_bottom_mobile',    300, 250, 'Bannière en bas de la page de détail sur mobile',       'mobile'),
  ('Blog — Top (Mobile)',          'blog_top_mobile',          300, 250, 'Bannière en haut du blog sur mobile',                  'mobile'),
  ('Professionnel — Top (Mobile)', 'professionnel_top_mobile', 300, 250, 'Bannière en haut de la page professionnelle sur mobile','mobile')
on conflict (slug) do nothing;

-- --- Singleton settings rows ----------------------------------------------
insert into public.social_login_settings (provider) values ('facebook'), ('google')
  on conflict (provider) do nothing;
insert into public.ai_settings (id) values (true) on conflict (id) do nothing;
insert into public.app_secrets (id) values (true) on conflict (id) do nothing;

-- --- Site settings defaults (admin-editable afterwards) --------------------
insert into public.site_settings (key, value) values
  ('watermark_text',            '"autobladi.ma"'::jsonb),
  ('annonce_duration_days',     '60'::jsonb),
  ('annonce_duration_days_pro', '90'::jsonb),
  ('email_from',                '"autobladi <noreply@autobladi.ma>"'::jsonb),
  ('email_reply_to',            '"contact@autobladi.ma"'::jsonb),
  ('email_enabled',             '{
     "welcome": true,
     "annonce_pending": true,
     "annonce_approved": true,
     "annonce_rejected": true,
     "contact_notification": true,
     "report_notification": true,
     "newsletter": true
   }'::jsonb)
on conflict (key) do nothing;

-- --- Default CMS pages -----------------------------------------------------
insert into public.pages (slug, title_fr, title_ar, content_fr, content_ar, order_index)
values
  (
    'about', 'À propos', 'من نحن',
    $fr$## À propos d'autobladi.ma

autobladi.ma est la marketplace marocaine dédiée à l'achat et à la vente de voitures d'occasion et neuves. Notre mission est de simplifier la mise en relation entre acheteurs et vendeurs partout au Maroc.

Modifiez ce texte depuis le tableau de bord administrateur.$fr$,
    $ar$## من نحن

autobladi.ma هي المنصة المغربية المتخصصة في بيع وشراء السيارات المستعملة والجديدة. مهمتنا هي تسهيل التواصل بين البائعين والمشترين في جميع أنحاء المغرب.

يمكنك تعديل هذا النص من لوحة تحكم الأدمين.$ar$,
    1
  ),
  (
    'terms', 'Conditions d''utilisation', 'شروط الاستخدام',
    $fr$## Conditions d'utilisation

En utilisant autobladi.ma, vous acceptez les présentes conditions. Modifiez ce contenu depuis le tableau de bord administrateur.$fr$,
    $ar$## شروط الاستخدام

باستخدامك لموقع autobladi.ma فإنك توافق على هذه الشروط. يمكنك تعديل هذا المحتوى من لوحة تحكم الأدمين.$ar$,
    2
  ),
  (
    'privacy', 'Politique de confidentialité', 'سياسة الخصوصية',
    $fr$## Politique de confidentialité

Nous respectons votre vie privée. Modifiez ce contenu depuis le tableau de bord administrateur.$fr$,
    $ar$## سياسة الخصوصية

نحترم خصوصيتك. يمكنك تعديل هذا المحتوى من لوحة تحكم الأدمين.$ar$,
    3
  )
on conflict (slug) do nothing;


-- ============================================================================
-- 23. REPAIR PASS — brings an EXISTING database up to the schema above
-- ============================================================================
-- `create table if not exists` above does nothing when a table already exists,
-- so a database created from the old migration chain can be missing columns
-- added later. These statements are no-ops on a fresh install and fix an old
-- one. Add future column additions here as well.

-- Migration 010 (email/newsletter) was never fully applied in production:
-- without these two columns the newsletter send, the admin newsletter stats
-- and the /unsubscribe page all fail at runtime.
alter table public.profiles
  add column if not exists newsletter_subscribed boolean not null default true,
  add column if not exists email_unsubscribe_token text;

update public.profiles
   set email_unsubscribe_token = encode(gen_random_bytes(24), 'base64')
 where email_unsubscribe_token is null;

create unique index if not exists idx_profiles_unsubscribe_token
  on public.profiles (email_unsubscribe_token)
  where email_unsubscribe_token is not null;


-- ============================================================================
-- Done. Refresh PostgREST's schema cache so the API sees everything at once.
-- ============================================================================
notify pgrst, 'reload schema';
