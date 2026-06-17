-- ============================================================================
-- 035 — Ad Placement: device column + mobile slots
--
-- 1. Add a `device` column: 'desktop' | 'mobile' | 'both'
--    - desktop  → hidden on screens < md (Tailwind "hidden md:block")
--    - mobile   → hidden on screens ≥ md (Tailwind "block md:hidden")
--    - both     → always visible
-- 2. Rename concessionnaire_* slugs to professionnel_* to match the
--    pages (migration 032 renamed the DB tables; slugs were missed).
-- 3. Insert mobile-specific 300×250 slots for every page that currently
--    only has a wide desktop banner.
-- 4. Update footer_banner to desktop-only (970px is unusable on mobile).
-- ============================================================================

-- 1) Add device column -------------------------------------------------------
alter table public.ad_placements
  add column if not exists device text not null default 'both'
  check (device in ('mobile', 'desktop', 'both'));

-- 2) Mark existing slots as desktop / both -----------------------------------
-- Wide leaderboards and skyscrapers are desktop-only.
update public.ad_placements
   set device = 'desktop'
 where slug in (
   'home_top', 'home_middle', 'home_bottom',
   'listings_top', 'listings_sidebar', 'listings_inline',
   'annonce_top', 'annonce_sidebar', 'annonce_bottom',
   'concessionnaire_top', 'concessionnaire_sidebar',
   'blog_top', 'blog_sidebar',
   'footer_banner'
 );

-- Inline blog banner (300×250) looks fine on mobile → keep 'both'.
update public.ad_placements
   set device = 'both'
 where slug = 'blog_post_inline';

-- 3) Rename concessionnaire_* → professionnel_* ------------------------------
update public.ad_placements
   set slug = 'professionnel_top',
       name = 'Professionnel — Top banner'
 where slug = 'concessionnaire_top'
   and not exists (select 1 from public.ad_placements where slug = 'professionnel_top');

update public.ad_placements
   set slug = 'professionnel_sidebar',
       name = 'Professionnel — Sidebar'
 where slug = 'concessionnaire_sidebar'
   and not exists (select 1 from public.ad_placements where slug = 'professionnel_sidebar');

-- 4) Insert mobile slots (300×250 — Medium Rectangle, universally accepted) --
insert into public.ad_placements (name, slug, width, height, description, device)
values
  ('Home — Top (Mobile)',           'home_top_mobile',           300, 250, 'Bannière en haut de l''accueil sur mobile',             'mobile'),
  ('Home — Middle (Mobile)',        'home_middle_mobile',        300, 250, 'Bannière au milieu de l''accueil sur mobile',            'mobile'),
  ('Listings — Top (Mobile)',       'listings_top_mobile',       300, 250, 'Bannière en haut de la liste des annonces sur mobile',   'mobile'),
  ('Listings — Inline (Mobile)',    'listings_inline_mobile',    300, 250, 'Bannière entre les annonces sur mobile',                 'mobile'),
  ('Annonce — Top (Mobile)',        'annonce_top_mobile',        300, 250, 'Bannière en haut de la page de détail sur mobile',       'mobile'),
  ('Annonce — Bottom (Mobile)',     'annonce_bottom_mobile',     300, 250, 'Bannière en bas de la page de détail sur mobile',        'mobile'),
  ('Blog — Top (Mobile)',           'blog_top_mobile',           300, 250, 'Bannière en haut du blog sur mobile',                   'mobile'),
  ('Professionnel — Top (Mobile)',  'professionnel_top_mobile',  300, 250, 'Bannière en haut de la page professionnelle sur mobile', 'mobile')
on conflict (slug) do update
   set device      = excluded.device,
       width       = excluded.width,
       height      = excluded.height,
       description = excluded.description;

notify pgrst, 'reload schema';
