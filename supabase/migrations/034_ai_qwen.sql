-- 034_ai_qwen.sql
-- Add Qwen (Alibaba DashScope, OpenAI-compatible) as a third AI provider next to
-- Gemini and OpenAI. Adds its secret key + model columns and widens the provider
-- check constraint. Still admin-only RLS (secrets) — inherited from 030.

alter table public.ai_settings
  add column if not exists qwen_key text not null default '',
  add column if not exists qwen_model text not null default '';

-- Widen the allowed providers to include 'qwen'. The inline check from 030 is
-- auto-named ai_settings_provider_check.
alter table public.ai_settings
  drop constraint if exists ai_settings_provider_check;

alter table public.ai_settings
  add constraint ai_settings_provider_check
  check (provider in ('gemini', 'openai', 'qwen'));
