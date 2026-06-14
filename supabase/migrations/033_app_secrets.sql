-- 033_app_secrets.sql
-- Admin-only store for integration secrets that must NEVER be public
-- (unlike site_settings, which has a public-read policy). Currently holds the
-- Resend API key entered from /admin/settings/email. Read server-side via the
-- service-role client only. Singleton row (id = true).

create table if not exists public.app_secrets (
  id boolean primary key default true,
  resend_key text not null default '',
  updated_at timestamptz not null default now(),
  constraint app_secrets_singleton check (id)
);

insert into public.app_secrets (id) values (true) on conflict (id) do nothing;

alter table public.app_secrets enable row level security;

drop policy if exists "app_secrets_admin_all" on public.app_secrets;
create policy "app_secrets_admin_all"
  on public.app_secrets for all
  using (public.is_admin()) with check (public.is_admin());
