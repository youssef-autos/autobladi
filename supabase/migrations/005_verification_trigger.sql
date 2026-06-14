-- ============================================================================
-- autobladi.ma — verification approval trigger
-- Sets profiles.is_verified = true when an admin approves a verification_request.
-- Run after 001..004.
-- ============================================================================

create or replace function public.on_verification_reviewed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Approved → flip is_verified on
  if new.status = 'approved'
     and (old.status is null or old.status <> 'approved')
  then
    update public.profiles
       set is_verified = true
     where id = new.user_id;
  end if;

  -- Rejected after being approved → revoke is_verified
  if new.status = 'rejected'
     and old.status = 'approved'
  then
    update public.profiles
       set is_verified = false
     where id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_on_verification_reviewed on public.verification_requests;
create trigger trg_on_verification_reviewed
  after update on public.verification_requests
  for each row execute function public.on_verification_reviewed();

-- ---------------------------------------------------------------------------
-- Helpful indexes for admin review queue and per-user lookup
-- ---------------------------------------------------------------------------
create index if not exists idx_verif_requests_pending
  on public.verification_requests (created_at desc)
  where status = 'pending';

-- One pending or approved request per user at a time. Rejected requests are
-- allowed to coexist so the user can resubmit a fresh one.
create unique index if not exists ux_verif_one_active_per_user
  on public.verification_requests (user_id)
  where status in ('pending', 'approved');
