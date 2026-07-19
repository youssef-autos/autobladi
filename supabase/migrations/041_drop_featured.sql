-- 041_drop_featured.sql
-- "Mise en avant" (featured listings) removed — the self-service Pro toggle,
-- the admin featured queue, the "featured" badge, and the homepage section
-- are all gone from the app. Drops the now-unused annonces columns and index.
--
-- Irreversible: to restore, re-run the relevant parts of migration 001.

drop index if exists public.idx_annonces_featured;

alter table public.annonces drop column if exists featured;
alter table public.annonces drop column if exists featured_until;
