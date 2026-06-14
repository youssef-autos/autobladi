-- 024_plan_features_ar.sql
-- Plan features are now bilingual: `features` holds the French list, the new
-- `features_ar` holds the Arabic list (mirrors the name / name_ar pattern).

alter table public.subscription_plans
  add column if not exists features_ar jsonb not null default '[]'::jsonb;

-- Reload PostgREST schema cache so the API exposes the new column.
notify pgrst, 'reload schema';
