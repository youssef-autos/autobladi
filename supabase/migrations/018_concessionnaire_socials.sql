-- 018_concessionnaire_socials.sql
-- Social media links for dealer storefronts (shown on the public dealer page,
-- editable from the dashboard showroom form). Run this in the SQL Editor.

alter table public.concessionnaires
  add column if not exists facebook  text,
  add column if not exists instagram text,
  add column if not exists youtube   text,
  add column if not exists tiktok    text;

notify pgrst, 'reload schema';
