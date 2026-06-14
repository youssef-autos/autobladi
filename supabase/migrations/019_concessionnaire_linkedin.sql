-- 019_concessionnaire_linkedin.sql
-- Adds LinkedIn to the dealer social links. Run this in the SQL Editor.

alter table public.concessionnaires
  add column if not exists linkedin text;

notify pgrst, 'reload schema';
