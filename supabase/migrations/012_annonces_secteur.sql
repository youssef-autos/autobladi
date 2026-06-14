-- ============================================================================
-- autobladi.ma — Migration 012 — secteur_id on annonces
--
-- Links an annonce optionally to a secteur (neighbourhood) within its city.
-- Nullable: existing annonces remain unchanged.
-- ON DELETE SET NULL: if a secteur is removed, annonces keep their city.
-- Run in the Supabase SQL editor after migration 011.
-- ============================================================================

alter table public.annonces
  add column if not exists secteur_id uuid
    references public.secteurs(id) on delete set null;

create index if not exists idx_annonces_secteur
  on public.annonces (secteur_id)
  where secteur_id is not null;

-- Refresh PostgREST's schema cache so the new column is immediately usable
-- (otherwise inserts fail with "Could not find the 'secteur_id' column ...").
notify pgrst, 'reload schema';
