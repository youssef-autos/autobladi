-- 038_ad_events.sql
-- Event log powering the Pro "advanced statistics" dashboard. One row per
-- view / phone reveal / WhatsApp click / message on an annonce, with the
-- inferred traffic source. Written and read server-side via the service-role
-- client only (API routes verify the Pro plan) — RLS is enabled with no
-- policies so anon/authenticated clients can neither read nor write.
--
-- The legacy annonces.views_count counter is untouched and keeps working.
--
-- Rollback:
--   drop table if exists public.ad_events;

create table if not exists public.ad_events (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.annonces(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'phone_click', 'whatsapp_click', 'message')),
  source text not null default 'direct' check (source in ('search', 'homepage', 'dealer_page', 'direct', 'other')),
  created_at timestamptz not null default now()
);

create index if not exists ad_events_ad_type_created_idx
  on public.ad_events (ad_id, event_type, created_at);

alter table public.ad_events enable row level security;
