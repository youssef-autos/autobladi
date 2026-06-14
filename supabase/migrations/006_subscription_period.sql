-- ============================================================================
-- autobladi.ma — subscription period tracking + expiry job
-- Extends the trigger from 004 to set starts_at / ends_at on approval and
-- adds expire_subscriptions() callable from pg_cron or an Edge Function.
-- Run after 001..005.
-- ============================================================================

-- Replace the function from 004 with an extended version that:
--   1. Promotes the user to pro
--   2. Creates a placeholder concessionnaire row
--   3. Sets starts_at / ends_at from the linked plan's duration_days
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
    -- 1. promote to pro (only when currently free)
    update public.profiles
       set account_type = 'pro'
     where id = new.user_id
       and account_type = 'gratuit';

    -- 2. ensure a concessionnaire row exists
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

    -- 3. set the active period from the plan duration
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

-- Switch trigger from AFTER to BEFORE so the row update to starts_at/ends_at
-- happens in the same write — no second UPDATE needed.
drop trigger if exists trg_on_subscription_approved on public.subscription_requests;
create trigger trg_on_subscription_approved
  before update on public.subscription_requests
  for each row execute function public.on_subscription_approved();

-- ---------------------------------------------------------------------------
-- expire_subscriptions(): downgrades pro accounts whose latest approved
-- subscription has ended, hides their concessionnaire from the public
-- listing, and returns the affected count.
--
-- Schedule with pg_cron (run as superuser):
--   select cron.schedule('expire-subs-daily', '0 3 * * *',
--     $$ select public.expire_subscriptions() $$);
--
-- Or call from an Edge Function with a service-role client:
--   await supabase.rpc("expire_subscriptions");
-- ---------------------------------------------------------------------------
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
         -- only downgrade if there's no other still-valid approved sub
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
    update public.concessionnaires c
       set is_active = false
     where c.user_id in (select user_id from expired)
     returning c.user_id
  )
  select id from downgraded;
end;
$$;

-- Indexes used by the cron query and the user's status page
create index if not exists idx_sub_requests_active_period
  on public.subscription_requests (user_id, status, ends_at desc)
  where status = 'approved';

create index if not exists idx_sub_requests_user_status
  on public.subscription_requests (user_id, status, created_at desc);
