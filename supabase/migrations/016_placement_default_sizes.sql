-- ============================================================================
-- autobladi.ma — Migration 016 — Default placement dimensions (backfill)
--
-- Ensures every ad placement has sensible default dimensions matching where it
-- appears on the page. Only fills rows where width/height is NULL, so any size
-- an admin has already customised in /admin/ads/placements is preserved.
--
-- The canonical sizes were seeded in migration 007; this is a safety net for
-- installs that ran an older seed or added placements without dimensions.
-- Run in the Supabase SQL editor.
-- ============================================================================

-- Tall side rails (skyscraper / large rectangle).
update public.ad_placements
   set width = 300, height = 600
 where (width is null or height is null) and slug like '%sidebar%';

-- In-content leaderboards.
update public.ad_placements
   set width = 728, height = 90
 where (width is null or height is null) and slug like '%inline%';

-- Home billboards.
update public.ad_placements
   set width = 970, height = 250
 where (width is null or height is null) and slug like 'home%';

-- Catch-all: wide top/bottom/footer banners.
update public.ad_placements
   set width = 970, height = 120
 where width is null or height is null;

notify pgrst, 'reload schema';
