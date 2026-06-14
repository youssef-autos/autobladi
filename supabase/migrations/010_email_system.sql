-- ============================================================================
-- autobladi.ma — Migration 010 — Resend email system
--
-- 1. profiles.newsletter_subscribed + email_unsubscribe_token
--    The token is a random base64url string; we generate it on insert so
--    every user can have an unsubscribe link without an extra round trip.
-- 2. site_settings defaults for email configuration (admin-editable).
-- 3. annonces.expires_at — referenced by the cron job that flips active
--    posts to "expired" and the AnnonceExpiring email.
-- 4. Trigger to keep annonces.expires_at in sync with site_settings
--    (annonce_duration_days) on publish.
--
-- Safe to run repeatedly.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Profiles columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists newsletter_subscribed boolean not null default true;

alter table public.profiles
  add column if not exists email_unsubscribe_token text;

create unique index if not exists idx_profiles_unsubscribe_token
  on public.profiles (email_unsubscribe_token)
  where email_unsubscribe_token is not null;

-- Backfill tokens for existing profiles
update public.profiles
   set email_unsubscribe_token = encode(gen_random_bytes(24), 'base64')
 where email_unsubscribe_token is null;

-- Auto-generate on insert
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

-- ---------------------------------------------------------------------------
-- 2) Site settings defaults — only insert if missing so admin edits stick.
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value) values
  ('email_from',
     '"autobladi <noreply@autobladi.ma>"'::jsonb),
  ('email_reply_to',
     '"contact@autobladi.ma"'::jsonb),
  ('email_enabled',
     '{
       "welcome": true,
       "annonce_pending": true,
       "annonce_approved": true,
       "annonce_rejected": true,
       "verification_approved": true,
       "verification_rejected": true,
       "subscription_approved": true,
       "subscription_rejected": true,
       "subscription_expiring": true,
       "annonce_expiring": true,
       "contact_notification": true,
       "report_notification": true,
       "newsletter": true
     }'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 3) Annonces expiry column
-- ---------------------------------------------------------------------------
alter table public.annonces
  add column if not exists expires_at timestamptz;

create index if not exists idx_annonces_expires_at
  on public.annonces (expires_at)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- 4) Set expires_at when an annonce transitions to active (published or
--    approved). Pulls the duration from site_settings.annonce_duration_days
--    (defaults to 60 days if missing).
-- ---------------------------------------------------------------------------
create or replace function public.set_annonce_expiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer;
begin
  if new.status = 'active'
     and (old.status is null or old.status <> 'active')
     and new.expires_at is null then
    select coalesce((value)::text::int, 60) into v_days
      from public.site_settings
     where key = 'annonce_duration_days';
    new.expires_at := coalesce(new.published_at, now()) + (v_days * interval '1 day');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_annonces_set_expiry on public.annonces;
create trigger trg_annonces_set_expiry
  before insert or update on public.annonces
  for each row execute function public.set_annonce_expiry();

-- ---------------------------------------------------------------------------
-- 5) Helper used by the daily expire cron: marks active annonces past
--    their expires_at as expired in one pass. Returns the count flipped.
-- ---------------------------------------------------------------------------
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

grant execute on function public.expire_annonces() to service_role;
