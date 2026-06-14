-- ============================================================================
-- autobladi.ma — Migration 009 — blog enhancements
--
-- 1. parent_id on blog_comments → enables one-level nested replies.
-- 2. tags text[] on blog_posts → comma-separated tags rendered on detail page.
-- 3. likes_count on blog_comments → optional engagement counter.
-- 4. comments_count cached on blog_posts → avoids join for grid listings.
-- 5. SECURITY DEFINER RPC increment_blog_view → safe public counter bump.
-- 6. Triggers to keep blog_posts.comments_count in sync with blog_comments
--    (only counts approved comments).
--
-- Run this in the Supabase SQL editor (not via CLI).
-- Safe to run repeatedly.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Schema additions
-- ---------------------------------------------------------------------------
alter table public.blog_comments
  add column if not exists parent_id uuid
    references public.blog_comments(id) on delete cascade;

alter table public.blog_comments
  add column if not exists likes_count integer not null default 0;

alter table public.blog_posts
  add column if not exists tags text[] not null default '{}';

alter table public.blog_posts
  add column if not exists comments_count integer not null default 0;

create index if not exists idx_blog_comments_parent
  on public.blog_comments (parent_id);

create index if not exists idx_blog_posts_tags
  on public.blog_posts using gin (tags);

-- ---------------------------------------------------------------------------
-- 2) Increment view counter — SECURITY DEFINER bypasses RLS so the public
--    API route can bump the counter without owning the row.
-- ---------------------------------------------------------------------------
create or replace function public.increment_blog_view(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.blog_posts
     set views_count = coalesce(views_count, 0) + 1
   where id = p_post_id
     and is_published = true;
end;
$$;

grant execute on function public.increment_blog_view(uuid)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3) Keep blog_posts.comments_count in sync with blog_comments — only
--    approved comments count toward the displayed total.
-- ---------------------------------------------------------------------------
create or replace function public.refresh_blog_comments_count(p_post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.blog_posts
     set comments_count = (
       select count(*) from public.blog_comments
        where post_id = p_post_id and is_approved = true
     )
   where id = p_post_id;
$$;

create or replace function public.on_blog_comment_changed()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_blog_comments_count(new.post_id);
  elsif tg_op = 'UPDATE' then
    if new.is_approved is distinct from old.is_approved
       or new.post_id is distinct from old.post_id then
      perform public.refresh_blog_comments_count(new.post_id);
      if new.post_id is distinct from old.post_id then
        perform public.refresh_blog_comments_count(old.post_id);
      end if;
    end if;
  elsif tg_op = 'DELETE' then
    perform public.refresh_blog_comments_count(old.post_id);
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_blog_comments_count_ins on public.blog_comments;
drop trigger if exists trg_blog_comments_count_upd on public.blog_comments;
drop trigger if exists trg_blog_comments_count_del on public.blog_comments;

create trigger trg_blog_comments_count_ins
  after insert on public.blog_comments
  for each row execute function public.on_blog_comment_changed();

create trigger trg_blog_comments_count_upd
  after update on public.blog_comments
  for each row execute function public.on_blog_comment_changed();

create trigger trg_blog_comments_count_del
  after delete on public.blog_comments
  for each row execute function public.on_blog_comment_changed();

-- ---------------------------------------------------------------------------
-- 4) One-time backfill in case there are existing approved comments
-- ---------------------------------------------------------------------------
update public.blog_posts p
   set comments_count = sub.cnt
  from (
    select post_id, count(*) as cnt
      from public.blog_comments
     where is_approved = true
     group by post_id
  ) sub
 where p.id = sub.post_id;
