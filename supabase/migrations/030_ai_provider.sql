-- 030_ai_provider.sql
-- AI configuration: which model powers estimation + descriptions, and the API
-- keys. Contains SECRETS → admin-only RLS (never public, unlike site_settings).
-- Singleton row (id = true).

create table if not exists public.ai_settings (
  id boolean primary key default true,
  provider text not null default 'gemini' check (provider in ('gemini', 'openai')),
  gemini_key text not null default '',
  openai_key text not null default '',
  openai_model text not null default '',
  updated_at timestamptz not null default now(),
  constraint ai_settings_singleton check (id)
);

insert into public.ai_settings (id) values (true) on conflict (id) do nothing;

alter table public.ai_settings enable row level security;

drop policy if exists "ai_admin_all" on public.ai_settings;
create policy "ai_admin_all"
  on public.ai_settings for all
  using (public.is_admin()) with check (public.is_admin());
