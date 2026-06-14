-- 028_social_login.sql
-- Social login (Facebook / Google) configuration, managed from the admin panel.
-- Contains client secrets → admin-only RLS (NEVER public, unlike site_settings).
-- The public login page only reads the `enabled` flags server-side.

create table if not exists public.social_login_settings (
  provider text primary key check (provider in ('facebook', 'google')),
  enabled boolean not null default false,
  client_id text not null default '',
  secret text not null default '',
  redirect_url text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.social_login_settings (provider)
values ('facebook'), ('google')
on conflict (provider) do nothing;

alter table public.social_login_settings enable row level security;

drop policy if exists "social_admin_all" on public.social_login_settings;
create policy "social_admin_all"
  on public.social_login_settings for all
  using (public.is_admin()) with check (public.is_admin());
