-- 017_placement_visibility.sql
-- Adds a visibility switch to ad placements so admins can hide a whole
-- placement slot from the public site (no ad and no placeholder rendered).
-- Run this in the Supabase SQL Editor.

alter table public.ad_placements
  add column if not exists is_active boolean not null default true;

-- Reload PostgREST schema cache so the new column is queryable immediately.
notify pgrst, 'reload schema';
