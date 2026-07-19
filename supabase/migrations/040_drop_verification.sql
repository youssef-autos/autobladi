-- 040_drop_verification.sql
-- Identity verification removed — the "verified" badge and its request/review
-- flow are gone from the app. This drops the now-unused verification_requests
-- table together with its trigger/function (migration 005), the profiles
-- column it flipped, and the private storage bucket for the documents.
--
-- Irreversible: to restore, re-run the relevant parts of migrations 001, 002 and 005.

-- Trigger + function first (they depend on the table).
drop trigger if exists trg_on_verification_reviewed on public.verification_requests;
drop function if exists public.on_verification_reviewed() cascade;

-- Table (cascade removes its FKs, RLS policies and indexes).
drop table if exists public.verification_requests cascade;

-- profiles.is_verified — no longer set by anything.
alter table public.profiles drop column if exists is_verified;

-- Storage: policies first, then the bucket itself.
drop policy if exists "verifications_owner_read"   on storage.objects;
drop policy if exists "verifications_owner_write"  on storage.objects;
drop policy if exists "verifications_owner_update" on storage.objects;
drop policy if exists "verifications_owner_delete" on storage.objects;
drop policy if exists "verifications_admin_read"   on storage.objects;

delete from storage.objects where bucket_id = 'verifications';
delete from storage.buckets where id = 'verifications';
