-- ============================================================================
-- autobladi.ma — Migration 013 — annonces.origine
--
-- Adds the "Origine du véhicule" field to annonces.
-- Stored as a free text key: ww_maroc | dedouanee | non_dedouanee
-- (labels live in src/lib/vehicle-options.ts — DB stays language-agnostic).
--
-- body_type already exists from the initial schema, so only `origine` is new.
-- Safe to run repeatedly. Run this in the Supabase SQL Editor.
-- ============================================================================

alter table public.annonces
  add column if not exists origine text;

-- Tell PostgREST (Supabase API) to reload its schema cache immediately so the
-- new column is recognized without waiting / restarting.
notify pgrst, 'reload schema';
