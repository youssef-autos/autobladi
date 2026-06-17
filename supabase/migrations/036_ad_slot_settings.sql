-- ============================================================================
-- 036 — Make every ad-slot setting editable from the admin panel.
--
-- The slot *definitions* used to live only in code (config/ads.config.ts).
-- This adds the columns needed so an admin can control each slot entirely from
-- the dashboard: per-device sizes, default network, and the AdSense ad-unit id.
--
-- Existing columns reused:  is_active (on/off), device, width/height (desktop).
-- New columns added here:    width_mobile, height_mobile, default_provider,
--                            adsense_slot_id, lazy.
--
-- No seeding is required: the app falls back to the code defaults for any
-- column left NULL, and the row is filled in the first time the admin saves it.
-- The global AdSense publisher id (ca-pub-…) is stored in `site_settings`
-- under the key `adsense_client_id` (it is a PUBLIC value, embedded in every
-- page's <script>, so it is safe in the public-read settings table — unlike
-- secret API keys, which must never go there).
-- ============================================================================

alter table public.ad_placements
  add column if not exists width_mobile     integer,
  add column if not exists height_mobile    integer,
  add column if not exists default_provider text
    check (default_provider in ('adsense', 'direct')),
  add column if not exists adsense_slot_id  text,
  add column if not exists lazy             boolean not null default true;

notify pgrst, 'reload schema';
