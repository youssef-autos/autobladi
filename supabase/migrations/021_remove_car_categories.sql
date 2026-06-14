-- 021_remove_car_categories.sql
-- Removes the car "category" feature entirely (4×4, Berline, …).
-- NOTE: This does NOT touch blog_categories — those are kept.

-- Drop the FK column from annonces first (categories is referenced by it).
alter table public.annonces
  drop column if exists category_id;

-- Drop the car categories table.
drop table if exists public.categories cascade;

-- Reload PostgREST schema cache so the API stops exposing the dropped column.
notify pgrst, 'reload schema';
