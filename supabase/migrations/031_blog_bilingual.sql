-- 031_blog_bilingual.sql
-- Bilingual blog posts. The existing title/excerpt/content stay as the primary
-- (Arabic, the site default locale); these add the optional French translation.
-- Public reads fall back to the primary fields when a French value is empty.

alter table public.blog_posts
  add column if not exists title_fr text,
  add column if not exists excerpt_fr text,
  add column if not exists content_fr text;
