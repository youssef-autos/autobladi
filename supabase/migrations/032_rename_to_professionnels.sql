-- ============================================================================
-- 032 — Rename "concessionnaires" → "professionnels"
-- Broadens the concept from car showrooms to all professional sellers
-- (new-car dealerships AND used-car dealers).
--
-- Renames the tables + the reviews FK column, then recreates the functions
-- whose bodies hard-code the old names (Postgres does NOT rewrite function
-- bodies on rename). Triggers, FKs, indexes and RLS policies follow the table
-- automatically and need no change.
--
-- NOT renamed on purpose:
--   • storage bucket "concessionnaires" — keeps its id so existing image URLs
--     (logo_url / cover_url) stay valid. It is internal, never shown to users.
--
-- Run in the Supabase SQL editor after 001..031. Safe to run once.
-- ============================================================================

-- 1) Rename tables + the reviews FK column ----------------------------------
alter table public.concessionnaires        rename to professionnels;
alter table public.concessionnaire_reviews rename to professionnel_reviews;
alter table public.professionnel_reviews   rename column concessionnaire_id to professionnel_id;

-- 2) Recreate functions that reference the old names ------------------------

-- Review rating aggregate (was recompute_concessionnaire_rating; kept name so
-- the existing trg_review_aggregate_* triggers stay wired).
create or replace function public.recompute_concessionnaire_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.professionnel_id, old.professionnel_id);
  if target_id is null then
    return coalesce(new, old);
  end if;

  update public.professionnels c
     set rating = coalesce(sub.avg_rating, 0),
         reviews_count = coalesce(sub.cnt, 0)
    from (
      select avg(rating)::numeric(3,2) as avg_rating,
             count(*) as cnt
        from public.professionnel_reviews
       where professionnel_id = target_id
    ) as sub
   where c.id = target_id;

  return coalesce(new, old);
end;
$$;

-- Subscription approval → promote to pro + ensure a professionnel row.
create or replace function public.on_subscription_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  short_id text;
  plan_duration int;
begin
  if new.status = 'approved'
     and (old.status is null or old.status <> 'approved')
  then
    update public.profiles
       set account_type = 'pro'
     where id = new.user_id
       and account_type = 'gratuit';

    if not exists (
      select 1 from public.professionnels where user_id = new.user_id
    ) then
      short_id := substr(replace(new.user_id::text, '-', ''), 1, 8);
      insert into public.professionnels (user_id, name, slug, is_active)
      values (
        new.user_id,
        'Professionnel ' || short_id,
        'professionnel-' || short_id,
        true
      );
    end if;

    select duration_days into plan_duration
      from public.subscription_plans
     where id = new.plan_id;

    if plan_duration is not null then
      new.starts_at := coalesce(new.starts_at, now());
      new.ends_at := new.starts_at + (plan_duration || ' days')::interval;
    end if;
  end if;
  return new;
end;
$$;

-- Subscription expiry → downgrade + hide the professionnel from listings.
create or replace function public.expire_subscriptions()
returns table (downgraded_user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with expired as (
    select sr.user_id
      from public.subscription_requests sr
     where sr.status = 'approved'
       and sr.ends_at is not null
       and sr.ends_at < now()
       and not exists (
         select 1
           from public.subscription_requests sr2
          where sr2.user_id = sr.user_id
            and sr2.status = 'approved'
            and (sr2.ends_at is null or sr2.ends_at >= now())
       )
  ),
  downgraded as (
    update public.profiles p
       set account_type = 'gratuit',
           is_verified = false
     where p.id in (select user_id from expired)
       and p.account_type = 'pro'
     returning p.id
  ),
  hidden as (
    update public.professionnels c
       set is_active = false
     where c.user_id in (select user_id from expired)
     returning c.user_id
  )
  select id from downgraded;
end;
$$;

-- 3) Ad placements — rename slugs + labels to match the new term ------------
update public.ad_placements set slug = 'professionnel_top'     where slug = 'concessionnaire_top';
update public.ad_placements set slug = 'professionnel_sidebar' where slug = 'concessionnaire_sidebar';
update public.ad_placements
   set name        = replace(name, 'Concessionnaire', 'Professionnel'),
       description = replace(description, 'concessionnaire', 'professionnel')
 where slug like 'professionnel\_%';
