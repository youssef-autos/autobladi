-- 023_plan_original_price.sql
-- Pro plans now store an "original price" (compare-at) alongside the package
-- price. The discount percentage is DERIVED in the app from the two, so the
-- manual discount_percent column is removed.

alter table public.subscription_plans
  add column if not exists original_price numeric(12, 2) not null default 0;

-- Drop the manual discount column (and its check) if a previous revision added it.
alter table public.subscription_plans
  drop constraint if exists subscription_plans_discount_percent_check;
alter table public.subscription_plans
  drop column if exists discount_percent;

-- Reload PostgREST schema cache so the API exposes the change.
notify pgrst, 'reload schema';
