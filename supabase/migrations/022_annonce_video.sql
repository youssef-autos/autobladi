-- 022_annonce_video.sql
-- Adds an optional promo video (YouTube / Facebook / TikTok) to a car listing.
-- This is a professionals-only feature, enforced in the app layer.

alter table public.annonces
  add column if not exists video_url text;

-- Reload PostgREST schema cache so the API exposes the new column.
notify pgrst, 'reload schema';
