-- ============================================================================
-- autobladi.ma — initial schema
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type account_type as enum ('gratuit', 'pro', 'admin');
create type fuel_type as enum ('essence', 'diesel', 'hybrid', 'electric', 'lpg');
create type transmission_type as enum ('manuelle', 'automatique');
create type condition_type as enum ('neuf', 'occasion');
create type annonce_status as enum ('draft', 'pending', 'active', 'sold', 'rejected', 'expired');
create type request_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users) — created before is_admin() which references it
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  whatsapp text,
  avatar_url text,
  account_type account_type not null default 'gratuit',
  is_verified boolean not null default false,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Reference tables: brands / car_models / categories / cities
-- ---------------------------------------------------------------------------
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.car_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_fr text not null,
  slug text not null unique,
  icon text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_fr text not null,
  slug text not null unique,
  region text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- annonces (listings)
-- ---------------------------------------------------------------------------
create table public.annonces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text,
  brand_id uuid references public.brands(id) on delete restrict,
  model_id uuid references public.car_models(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  city_id uuid references public.cities(id) on delete set null,
  year integer,
  mileage integer,
  price numeric(12, 2),
  fuel_type fuel_type,
  transmission transmission_type,
  body_type text,
  color text,
  doors integer,
  seats integer,
  engine_power integer,
  engine_size text,
  first_owner boolean default false,
  accident_free boolean default false,
  condition condition_type default 'occasion',
  options jsonb not null default '[]'::jsonb,
  contact_phone text,
  contact_whatsapp text,
  status annonce_status not null default 'pending',
  rejection_reason text,
  views_count integer not null default 0,
  featured boolean not null default false,
  featured_until timestamptz,
  expires_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create trigger annonces_set_slug
  before insert on public.annonces
  for each row execute function public.generate_annonce_slug();

create table public.annonce_images (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid not null references public.annonces(id) on delete cascade,
  url text not null,
  thumbnail_url text,
  order_index integer not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  annonce_id uuid not null references public.annonces(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, annonce_id)
);

-- ---------------------------------------------------------------------------
-- conversations / messages
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid not null references public.profiles(id) on delete cascade,
  annonce_id uuid references public.annonces(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user1_id, user2_id, annonce_id),
  check (user1_id <> user2_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  annonce_id uuid references public.annonces(id) on delete set null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- concessionnaires (dealers)
-- ---------------------------------------------------------------------------
create table public.concessionnaires (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  cover_url text,
  address text,
  city_id uuid references public.cities(id) on delete set null,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  phone text,
  whatsapp text,
  email text,
  website text,
  opening_hours jsonb,
  rating numeric(3, 2) not null default 0,
  reviews_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.concessionnaire_reviews (
  id uuid primary key default gen_random_uuid(),
  concessionnaire_id uuid not null references public.concessionnaires(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- verification_requests (for pro accounts)
-- ---------------------------------------------------------------------------
create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  manager_name text,
  rc_number text,
  rc_document_url text,
  id_card_url text,
  professional_phone text,
  address text,
  status request_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- subscription_plans / subscription_requests
-- ---------------------------------------------------------------------------
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  price numeric(12, 2) not null,
  duration_days integer not null,
  max_annonces integer not null,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subscription_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  amount numeric(12, 2) not null,
  receipt_url text,
  status request_status not null default 'pending',
  bank_reference text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- estimations (Gemini-powered price estimates)
-- ---------------------------------------------------------------------------
create table public.estimations (
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

-- ---------------------------------------------------------------------------
-- blog
-- ---------------------------------------------------------------------------
create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_fr text not null,
  slug text not null unique,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.blog_categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image text,
  is_published boolean not null default false,
  published_at timestamptz,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- reports / contact_messages
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid not null references public.annonces(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  description text,
  status request_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- advertisements
-- ---------------------------------------------------------------------------
create table public.ad_placements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  width integer,
  height integer,
  description text,
  created_at timestamptz not null default now()
);

create table public.advertisements (
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

-- ---------------------------------------------------------------------------
-- site_settings / notifications
-- ---------------------------------------------------------------------------
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- updated_at triggers
-- ===========================================================================
create trigger profiles_set_updated_at         before update on public.profiles         for each row execute function public.set_updated_at();
create trigger annonces_set_updated_at         before update on public.annonces         for each row execute function public.set_updated_at();
create trigger concessionnaires_set_updated_at before update on public.concessionnaires for each row execute function public.set_updated_at();
create trigger blog_posts_set_updated_at       before update on public.blog_posts       for each row execute function public.set_updated_at();
create trigger site_settings_set_updated_at    before update on public.site_settings    for each row execute function public.set_updated_at();

-- ===========================================================================
-- Indexes for filterable / hot columns
-- ===========================================================================
create index idx_annonces_status        on public.annonces (status);
create index idx_annonces_brand         on public.annonces (brand_id);
create index idx_annonces_model         on public.annonces (model_id);
create index idx_annonces_city          on public.annonces (city_id);
create index idx_annonces_category      on public.annonces (category_id);
create index idx_annonces_user          on public.annonces (user_id);
create index idx_annonces_price         on public.annonces (price);
create index idx_annonces_year          on public.annonces (year);
create index idx_annonces_mileage       on public.annonces (mileage);
create index idx_annonces_fuel          on public.annonces (fuel_type);
create index idx_annonces_transmission  on public.annonces (transmission);
create index idx_annonces_published     on public.annonces (published_at desc);
create index idx_annonces_featured      on public.annonces (featured) where featured = true;
create index idx_annonces_active_listing on public.annonces (status, published_at desc) where status = 'active';

create index idx_annonce_images_annonce on public.annonce_images (annonce_id, order_index);
create index idx_car_models_brand       on public.car_models (brand_id);
create index idx_favorites_user         on public.favorites (user_id);
create index idx_favorites_annonce      on public.favorites (annonce_id);

create index idx_messages_receiver      on public.messages (receiver_id, is_read);
create index idx_messages_sender        on public.messages (sender_id);
create index idx_messages_annonce       on public.messages (annonce_id);
create index idx_messages_created       on public.messages (created_at desc);

create index idx_conversations_user1    on public.conversations (user1_id, last_message_at desc);
create index idx_conversations_user2    on public.conversations (user2_id, last_message_at desc);

create index idx_concessionnaires_city  on public.concessionnaires (city_id);
create index idx_concessionnaires_slug  on public.concessionnaires (slug);
create index idx_reviews_dealer         on public.concessionnaire_reviews (concessionnaire_id);

create index idx_verif_requests_user    on public.verification_requests (user_id);
create index idx_verif_requests_status  on public.verification_requests (status);
create index idx_sub_requests_user      on public.subscription_requests (user_id);
create index idx_sub_requests_status    on public.subscription_requests (status);
create index idx_estimations_user       on public.estimations (user_id);

create index idx_blog_posts_category    on public.blog_posts (category_id);
create index idx_blog_posts_published   on public.blog_posts (is_published, published_at desc);
create index idx_blog_comments_post     on public.blog_comments (post_id);
create index idx_reports_annonce        on public.reports (annonce_id);
create index idx_reports_status         on public.reports (status);
create index idx_ads_placement          on public.advertisements (placement_id, is_active);
create index idx_notifications_user     on public.notifications (user_id, is_read, created_at desc);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles                 enable row level security;
alter table public.brands                   enable row level security;
alter table public.car_models               enable row level security;
alter table public.categories               enable row level security;
alter table public.cities                   enable row level security;
alter table public.annonces                 enable row level security;
alter table public.annonce_images           enable row level security;
alter table public.favorites                enable row level security;
alter table public.conversations            enable row level security;
alter table public.messages                 enable row level security;
alter table public.concessionnaires         enable row level security;
alter table public.concessionnaire_reviews  enable row level security;
alter table public.verification_requests    enable row level security;
alter table public.subscription_plans       enable row level security;
alter table public.subscription_requests    enable row level security;
alter table public.estimations              enable row level security;
alter table public.blog_categories          enable row level security;
alter table public.blog_posts               enable row level security;
alter table public.blog_comments            enable row level security;
alter table public.reports                  enable row level security;
alter table public.contact_messages         enable row level security;
alter table public.ad_placements            enable row level security;
alter table public.advertisements           enable row level security;
alter table public.site_settings            enable row level security;
alter table public.notifications            enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles_public_read"      on public.profiles for select using (true);
create policy "profiles_self_update"      on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_self_insert"      on public.profiles for insert with check (id = auth.uid());
create policy "profiles_admin_all"        on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Reference tables: public read, admin write
-- ---------------------------------------------------------------------------
create policy "brands_public_read"        on public.brands for select using (true);
create policy "brands_admin_write"        on public.brands for all using (public.is_admin()) with check (public.is_admin());

create policy "models_public_read"        on public.car_models for select using (true);
create policy "models_admin_write"        on public.car_models for all using (public.is_admin()) with check (public.is_admin());

create policy "categories_public_read"    on public.categories for select using (true);
create policy "categories_admin_write"    on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "cities_public_read"        on public.cities for select using (true);
create policy "cities_admin_write"        on public.cities for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- annonces
-- ---------------------------------------------------------------------------
create policy "annonces_active_public_read" on public.annonces for select using (status = 'active' or user_id = auth.uid() or public.is_admin());
create policy "annonces_owner_insert"       on public.annonces for insert with check (user_id = auth.uid());
create policy "annonces_owner_update"       on public.annonces for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "annonces_owner_delete"       on public.annonces for delete using (user_id = auth.uid());
create policy "annonces_admin_all"          on public.annonces for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- annonce_images — readable if parent is readable, mutable by owner/admin
-- ---------------------------------------------------------------------------
create policy "images_read" on public.annonce_images for select
  using (exists (
    select 1 from public.annonces a
    where a.id = annonce_id
      and (a.status = 'active' or a.user_id = auth.uid() or public.is_admin())
  ));
create policy "images_owner_write" on public.annonce_images for all
  using (exists (select 1 from public.annonces a where a.id = annonce_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.annonces a where a.id = annonce_id and a.user_id = auth.uid()));
create policy "images_admin_all" on public.annonce_images for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
create policy "favorites_self_read"   on public.favorites for select using (user_id = auth.uid());
create policy "favorites_self_write"  on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- conversations / messages
-- ---------------------------------------------------------------------------
create policy "conv_participants_read"  on public.conversations for select using (user1_id = auth.uid() or user2_id = auth.uid() or public.is_admin());
create policy "conv_participants_write" on public.conversations for all using (user1_id = auth.uid() or user2_id = auth.uid()) with check (user1_id = auth.uid() or user2_id = auth.uid());

create policy "messages_participants_read" on public.messages for select using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin());
create policy "messages_sender_insert"     on public.messages for insert with check (sender_id = auth.uid());
create policy "messages_receiver_update"   on public.messages for update using (receiver_id = auth.uid()) with check (receiver_id = auth.uid());

-- ---------------------------------------------------------------------------
-- concessionnaires
-- ---------------------------------------------------------------------------
create policy "dealers_public_read"   on public.concessionnaires for select using (is_active or user_id = auth.uid() or public.is_admin());
create policy "dealers_owner_write"   on public.concessionnaires for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dealers_admin_all"     on public.concessionnaires for all using (public.is_admin()) with check (public.is_admin());

create policy "reviews_public_read"   on public.concessionnaire_reviews for select using (true);
create policy "reviews_author_write"  on public.concessionnaire_reviews for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reviews_admin_all"     on public.concessionnaire_reviews for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- verification_requests / subscription_requests
-- ---------------------------------------------------------------------------
create policy "verif_self_read"     on public.verification_requests for select using (user_id = auth.uid() or public.is_admin());
create policy "verif_self_insert"   on public.verification_requests for insert with check (user_id = auth.uid());
create policy "verif_admin_update"  on public.verification_requests for update using (public.is_admin()) with check (public.is_admin());

create policy "subreq_self_read"    on public.subscription_requests for select using (user_id = auth.uid() or public.is_admin());
create policy "subreq_self_insert"  on public.subscription_requests for insert with check (user_id = auth.uid());
create policy "subreq_admin_update" on public.subscription_requests for update using (public.is_admin()) with check (public.is_admin());

create policy "plans_public_read"   on public.subscription_plans for select using (is_active or public.is_admin());
create policy "plans_admin_write"   on public.subscription_plans for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- estimations
-- ---------------------------------------------------------------------------
create policy "estimations_owner_read"   on public.estimations for select using (user_id is null or user_id = auth.uid() or public.is_admin());
create policy "estimations_insert"       on public.estimations for insert with check (user_id is null or user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- blog
-- ---------------------------------------------------------------------------
create policy "blog_cats_public_read"     on public.blog_categories for select using (true);
create policy "blog_cats_admin_write"     on public.blog_categories for all using (public.is_admin()) with check (public.is_admin());

create policy "blog_posts_public_read"    on public.blog_posts for select using (is_published or author_id = auth.uid() or public.is_admin());
create policy "blog_posts_author_write"   on public.blog_posts for all using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "blog_posts_admin_write"    on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());

create policy "blog_comments_public_read" on public.blog_comments for select using (is_approved or user_id = auth.uid() or public.is_admin());
create policy "blog_comments_self_insert" on public.blog_comments for insert with check (user_id = auth.uid());
create policy "blog_comments_self_delete" on public.blog_comments for delete using (user_id = auth.uid() or public.is_admin());
create policy "blog_comments_admin_update" on public.blog_comments for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- reports / contact_messages
-- ---------------------------------------------------------------------------
create policy "reports_self_insert"  on public.reports for insert with check (reporter_id = auth.uid() or reporter_id is null);
create policy "reports_self_read"    on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
create policy "reports_admin_update" on public.reports for update using (public.is_admin()) with check (public.is_admin());

create policy "contact_anyone_insert" on public.contact_messages for insert with check (true);
create policy "contact_admin_read"    on public.contact_messages for select using (public.is_admin());
create policy "contact_admin_update"  on public.contact_messages for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- advertisements
-- ---------------------------------------------------------------------------
create policy "placements_public_read" on public.ad_placements for select using (true);
create policy "placements_admin_write" on public.ad_placements for all using (public.is_admin()) with check (public.is_admin());

create policy "ads_public_read"        on public.advertisements for select using (is_active or public.is_admin());
create policy "ads_admin_write"        on public.advertisements for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- site_settings / notifications
-- ---------------------------------------------------------------------------
create policy "settings_public_read"   on public.site_settings for select using (true);
create policy "settings_admin_write"   on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "notif_self_read"        on public.notifications for select using (user_id = auth.uid());
create policy "notif_self_update"      on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notif_admin_insert"     on public.notifications for insert with check (public.is_admin() or user_id = auth.uid());
