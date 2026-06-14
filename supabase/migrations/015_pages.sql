-- ============================================================================
-- autobladi.ma — Migration 015 — CMS content pages
--
-- A lightweight CMS for editorial pages (À propos, CGU, Confidentialité, …)
-- managed from /admin/pages. Each page is bilingual (fr + ar markdown) and
-- can optionally appear in the footer "Société" column.
--
-- Public URL: /{locale}/p/{slug}
-- Run in the Supabase SQL editor after migration 014.
-- ============================================================================

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_fr text not null,
  title_ar text not null,
  content_fr text,
  content_ar text,
  is_published boolean not null default true,
  show_in_footer boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pages_footer
  on public.pages (order_index)
  where is_published and show_in_footer;

alter table public.pages enable row level security;

drop policy if exists "pages_public_read" on public.pages;
create policy "pages_public_read" on public.pages
  for select using (is_published or public.is_admin());

drop policy if exists "pages_admin_all" on public.pages;
create policy "pages_admin_all" on public.pages
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.pages to anon;
grant select, insert, update, delete on public.pages to authenticated;
grant all on public.pages to service_role;

-- ---------------------------------------------------------------------------
-- Seed the default editorial pages (idempotent on slug).
-- ---------------------------------------------------------------------------
insert into public.pages (slug, title_fr, title_ar, content_fr, content_ar, order_index)
values
  (
    'about',
    'À propos',
    'من نحن',
    $fr$## À propos d'autobladi.ma

autobladi.ma est la marketplace marocaine dédiée à l'achat et à la vente de voitures d'occasion et neuves. Notre mission est de simplifier la mise en relation entre acheteurs et vendeurs partout au Maroc.

Modifiez ce texte depuis le tableau de bord administrateur.$fr$,
    $ar$## من نحن

autobladi.ma هي المنصة المغربية المتخصصة في بيع وشراء السيارات المستعملة والجديدة. مهمتنا هي تسهيل التواصل بين البائعين والمشترين في جميع أنحاء المغرب.

يمكنك تعديل هذا النص من لوحة تحكم الأدمين.$ar$,
    1
  ),
  (
    'terms',
    'Conditions d''utilisation',
    'شروط الاستخدام',
    $fr$## Conditions d'utilisation

En utilisant autobladi.ma, vous acceptez les présentes conditions. Modifiez ce contenu depuis le tableau de bord administrateur.$fr$,
    $ar$## شروط الاستخدام

باستخدامك لموقع autobladi.ma فإنك توافق على هذه الشروط. يمكنك تعديل هذا المحتوى من لوحة تحكم الأدمين.$ar$,
    2
  ),
  (
    'privacy',
    'Politique de confidentialité',
    'سياسة الخصوصية',
    $fr$## Politique de confidentialité

Nous respectons votre vie privée. Modifiez ce contenu depuis le tableau de bord administrateur.$fr$,
    $ar$## سياسة الخصوصية

نحترم خصوصيتك. يمكنك تعديل هذا المحتوى من لوحة تحكم الأدمين.$ar$,
    3
  )
on conflict (slug) do nothing;

notify pgrst, 'reload schema';
