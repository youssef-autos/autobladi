-- ============================================================================
-- autobladi.ma — auto-create concessionnaire on subscription approval
-- Run after 001, 002, 003.
-- ============================================================================

-- When an admin marks a subscription_request as approved:
--   1. Promote the user to account_type='pro'
--   2. Create a placeholder concessionnaire row (so the user can edit it from
--      /dashboard/showroom and the public detail page becomes reachable).
-- The function is `security definer` so it can update profiles regardless of
-- the caller's RLS context.

create or replace function public.on_subscription_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  short_id text;
begin
  if new.status = 'approved'
     and (old.status is null or old.status <> 'approved')
  then
    update public.profiles
       set account_type = 'pro'
     where id = new.user_id
       and account_type = 'gratuit';

    if not exists (
      select 1 from public.concessionnaires where user_id = new.user_id
    ) then
      short_id := substr(replace(new.user_id::text, '-', ''), 1, 8);
      insert into public.concessionnaires (user_id, name, slug, is_active)
      values (
        new.user_id,
        'Concession ' || short_id,
        'concession-' || short_id,
        true
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_on_subscription_approved on public.subscription_requests;
create trigger trg_on_subscription_approved
  after update on public.subscription_requests
  for each row execute function public.on_subscription_approved();

-- ---------------------------------------------------------------------------
-- Keep concessionnaires.reviews_count + rating in sync with reviews table.
-- This is a derived field — update via trigger so the public listing can
-- order/filter without a sub-query per row.
-- ---------------------------------------------------------------------------
create or replace function public.recompute_concessionnaire_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.concessionnaire_id, old.concessionnaire_id);
  if target_id is null then
    return coalesce(new, old);
  end if;

  update public.concessionnaires c
     set rating = coalesce(sub.avg_rating, 0),
         reviews_count = coalesce(sub.cnt, 0)
    from (
      select avg(rating)::numeric(3,2) as avg_rating,
             count(*) as cnt
        from public.concessionnaire_reviews
       where concessionnaire_id = target_id
    ) as sub
   where c.id = target_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_review_aggregate_insert on public.concessionnaire_reviews;
create trigger trg_review_aggregate_insert
  after insert on public.concessionnaire_reviews
  for each row execute function public.recompute_concessionnaire_rating();

drop trigger if exists trg_review_aggregate_update on public.concessionnaire_reviews;
create trigger trg_review_aggregate_update
  after update on public.concessionnaire_reviews
  for each row execute function public.recompute_concessionnaire_rating();

drop trigger if exists trg_review_aggregate_delete on public.concessionnaire_reviews;
create trigger trg_review_aggregate_delete
  after delete on public.concessionnaire_reviews
  for each row execute function public.recompute_concessionnaire_rating();

-- ---------------------------------------------------------------------------
-- A user can only review a given concessionnaire once.
-- ---------------------------------------------------------------------------
create unique index if not exists ux_reviews_user_per_concessionnaire
  on public.concessionnaire_reviews (concessionnaire_id, user_id);
