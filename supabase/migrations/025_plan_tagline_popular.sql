-- 025_plan_tagline_popular.sql
-- Admin-editable per-plan tagline (bilingual) + an explicit "most popular"
-- flag so the admin chooses which plan is highlighted (instead of a heuristic).

alter table public.subscription_plans
  add column if not exists tagline text,
  add column if not exists tagline_ar text,
  add column if not exists is_popular boolean not null default false;

-- Reload PostgREST schema cache so the API exposes the new columns.
notify pgrst, 'reload schema';
