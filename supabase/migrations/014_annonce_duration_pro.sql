-- ============================================================================
-- autobladi.ma — Migration 014 — Per-account-type annonce lifetime
--
-- Splits the single annonce lifetime into two values:
--   * annonce_duration_days       → regular (gratuit) accounts  (default 60)
--   * annonce_duration_days_pro   → professional (pro) accounts  (default 90)
--
-- The expiry trigger now looks up the owner's account_type and picks the
-- matching duration. Run in the Supabase SQL editor after migration 013.
-- ============================================================================

-- 1) Seed the new pro duration setting (only if absent).
insert into public.site_settings (key, value)
values ('annonce_duration_days_pro', '90'::jsonb)
on conflict (key) do nothing;

-- 2) Recompute expiry based on the owner's account type.
create or replace function public.set_annonce_expiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer;
  v_account_type text;
  v_key text;
begin
  if new.status = 'active'
     and (old.status is null or old.status <> 'active')
     and new.expires_at is null then

    select account_type into v_account_type
      from public.profiles
     where id = new.user_id;

    if v_account_type = 'pro' then
      v_key := 'annonce_duration_days_pro';
    else
      v_key := 'annonce_duration_days';
    end if;

    select (value)::text::int into v_days
      from public.site_settings
     where key = v_key;

    if v_days is null or v_days < 1 then
      v_days := 60;
    end if;

    new.expires_at := coalesce(new.published_at, now()) + (v_days * interval '1 day');
  end if;
  return new;
end;
$$;

-- Trigger already created in migration 010; the CREATE OR REPLACE above is
-- enough to pick up the new logic.

notify pgrst, 'reload schema';
