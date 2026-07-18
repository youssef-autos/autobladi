-- 039_drop_subscriptions.sql
-- Subscriptions removed — every feature on autobladi.ma is now free. This drops
-- the now-unused subscription tables together with the trigger and helper
-- functions that referenced them (migrations 001 + 006).
--
-- Irreversible: to restore, re-run the relevant parts of migrations 001 and 006.

-- Trigger + functions first (they depend on the tables).
drop trigger if exists trg_on_subscription_approved on public.subscription_requests;
drop function if exists public.on_subscription_approved() cascade;
drop function if exists public.expire_subscriptions() cascade;

-- Tables (cascade removes their FKs, RLS policies and indexes).
drop table if exists public.subscription_requests cascade;
drop table if exists public.subscription_plans cascade;
