-- ============================================================================
-- autobladi.ma — Migration 008 — restore default Supabase role grants
--
-- During development the default GRANTs on public.* (the ones Supabase
-- normally provisions for the anon / authenticated / service_role roles)
-- were lost on at least the `profiles` table — Postgres started returning
-- "permission denied for table profiles" even for service_role calls.
--
-- This migration re-applies the standard grant matrix and sets DEFAULT
-- PRIVILEGES so any future tables created in the public schema inherit
-- the same access by default. RLS is unchanged — it continues to govern
-- which rows each role can actually see/write.
--
-- Safe to run repeatedly: all statements are idempotent.
-- Run this in the Supabase SQL editor.
-- ============================================================================

-- 1) Allow each role to "see" the public schema at all
grant usage on schema public to anon, authenticated, service_role;

-- 2) Existing objects
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to anon, authenticated;
grant all on all sequences in schema public to service_role;

grant execute on all functions in schema public to anon, authenticated, service_role;

-- 3) Defaults for future objects created in this schema
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public
  grant all on sequences to service_role;

alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
