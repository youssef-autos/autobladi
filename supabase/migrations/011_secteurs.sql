-- ============================================================================
-- autobladi.ma — Migration 011 — Secteurs (quartiers / districts)
--
-- A secteur belongs to a city and is optional on annonces.
-- Examples: Casablanca → Ain Sebaa, Hay Mohammadi, Maarif…
--
-- Run in the Supabase SQL editor (not via CLI).
-- ============================================================================

create table public.secteurs (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name_ar text not null,
  name_fr text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  -- Slug must be unique within the same city (two cities can share a
  -- secteur name, e.g. "centre-ville" in Casablanca and Rabat).
  unique (city_id, slug)
);

create index idx_secteurs_city on public.secteurs (city_id);

-- ---------------------------------------------------------------------------
-- RLS — same policy as cities: public read, admin write only
-- ---------------------------------------------------------------------------
alter table public.secteurs enable row level security;

create policy "secteurs_public_read"
  on public.secteurs for select using (true);

create policy "secteurs_admin_write"
  on public.secteurs for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants (migration 008 sets defaults going forward; these cover the
-- explicit table so it's always accessible even before 008 defaults kick in)
-- ---------------------------------------------------------------------------
grant select on public.secteurs to anon, authenticated;
grant select, insert, update, delete on public.secteurs to authenticated;
grant all on public.secteurs to service_role;
