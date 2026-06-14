-- ============================================================================
-- autobladi.ma — Migration 007 — extra ad placements + click/impression
-- counters
--
-- This migration:
-- 1. Backfills/renames a couple of legacy slugs to match the new naming scheme
--    used by AdBanner (`annonce_detail`            → `annonce_sidebar`,
--                     `footer`                     → `footer_banner`).
-- 2. Inserts the missing placements so we have a full set of 15 slots that
--    cover home / listings / annonce / concessionnaire / blog / footer
--    locations on both top, sidebar, inline and bottom positions.
-- 3. Adds two SECURITY DEFINER functions to atomically increment the
--    `clicks` and `impressions` counters on `public.advertisements`. The
--    function bypasses RLS (we only expose the safe primary-key arg), so we
--    can call it from a regular API route without granting public UPDATE on
--    the table.
--
-- Run this in the Supabase SQL editor (NOT via the Supabase CLI).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Rename legacy slugs in-place so existing rows (and any FK refs) keep
--    pointing at the same UUIDs. Use NOT EXISTS guards so the migration is
--    idempotent.
-- ---------------------------------------------------------------------------
update public.ad_placements
   set slug = 'annonce_sidebar',
       name = 'Annonce — Sidebar',
       width = 300,
       height = 600,
       description = 'Encart latéral sur la page de détail d''une annonce'
 where slug = 'annonce_detail'
   and not exists (select 1 from public.ad_placements where slug = 'annonce_sidebar');

update public.ad_placements
   set slug = 'footer_banner',
       name = 'Footer — Banner',
       width = 970,
       height = 120,
       description = 'Bannière en pied de page (toutes pages)'
 where slug = 'footer'
   and not exists (select 1 from public.ad_placements where slug = 'footer_banner');

-- ---------------------------------------------------------------------------
-- 2) Upsert the 15 canonical placements. `on conflict (slug) do update`
--    keeps width/height/description in sync if they have drifted.
-- ---------------------------------------------------------------------------
insert into public.ad_placements (name, slug, width, height, description) values
  ('Home — Top banner',              'home_top',              970, 250, 'Bannière en haut de la page d''accueil'),
  ('Home — Middle banner',           'home_middle',           970, 250, 'Bannière au milieu de la page d''accueil'),
  ('Home — Bottom banner',           'home_bottom',           970, 250, 'Bannière en bas de la page d''accueil'),
  ('Listings — Top banner',          'listings_top',          970, 120, 'Bannière en haut de la page des annonces'),
  ('Listings — Sidebar',             'listings_sidebar',      300, 600, 'Encart latéral sur la page des annonces'),
  ('Listings — Inline',              'listings_inline',       970, 150, 'Bannière injectée entre les annonces'),
  ('Annonce — Top banner',           'annonce_top',           728,  90, 'Bannière en haut de la page de détail'),
  ('Annonce — Sidebar',              'annonce_sidebar',       300, 250, 'Encart latéral sur la page de détail'),
  ('Annonce — Bottom banner',        'annonce_bottom',        728,  90, 'Bannière en bas de la page de détail'),
  ('Concessionnaire — Top banner',   'concessionnaire_top',   970, 150, 'Bannière en haut de la page d''un concessionnaire'),
  ('Concessionnaire — Sidebar',      'concessionnaire_sidebar', 300, 600, 'Encart latéral sur la page d''un concessionnaire'),
  ('Blog — Top banner',              'blog_top',              970, 150, 'Bannière en haut du blog'),
  ('Blog — Inline post',             'blog_post_inline',      728,  90, 'Bannière au milieu d''un article'),
  ('Blog — Sidebar',                 'blog_sidebar',          300, 600, 'Encart latéral du blog'),
  ('Footer — Banner',                'footer_banner',         970, 120, 'Bannière en pied de page (toutes pages)')
on conflict (slug) do update set
  name        = excluded.name,
  width       = excluded.width,
  height      = excluded.height,
  description = excluded.description;

-- ---------------------------------------------------------------------------
-- 3) Atomic counter functions. Both run as `security definer` because the
--    public can only UPDATE through these RPCs (ads_admin_write policy blocks
--    direct writes for anyone but admins). We don't return anything sensitive.
-- ---------------------------------------------------------------------------
create or replace function public.increment_ad_click(p_ad_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.advertisements
     set clicks = coalesce(clicks, 0) + 1
   where id = p_ad_id
     and is_active = true;
end;
$$;

create or replace function public.increment_ad_impression(p_ad_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.advertisements
     set impressions = coalesce(impressions, 0) + 1
   where id = p_ad_id
     and is_active = true;
end;
$$;

-- Allow anonymous and authenticated clients to call the RPCs (the API route
-- typically uses the service-role key, but we keep these grants tight enough
-- that the RPC works from any client — write access is mediated by the
-- function body, not RLS).
grant execute on function public.increment_ad_click(uuid)      to anon, authenticated, service_role;
grant execute on function public.increment_ad_impression(uuid) to anon, authenticated, service_role;
