-- ============================================================================
-- autobladi.ma — Storage buckets + RLS policies
-- Run after 001_initial_schema.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('annonces',         'annonces',         true,  10485760, array['image/jpeg','image/png','image/webp']),
  ('avatars',          'avatars',          true,   5242880, array['image/jpeg','image/png','image/webp']),
  ('concessionnaires', 'concessionnaires', true,   5242880, array['image/jpeg','image/png','image/webp']),
  ('blog',             'blog',             true,   5242880, array['image/jpeg','image/png','image/webp']),
  ('ads',              'ads',              true,   5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('verifications',    'verifications',    false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('receipts',         'receipts',         false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set
  public              = excluded.public,
  file_size_limit     = excluded.file_size_limit,
  allowed_mime_types  = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Helper used in policies: the first path segment must equal the caller uid.
--   storage.foldername(name)[1]  →  '<user_id>'
--   auth.uid()::text             →  same when caller is the owner
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- annonces — public read; owner write/update/delete
-- ===========================================================================
drop policy if exists "annonces_public_read"      on storage.objects;
drop policy if exists "annonces_owner_insert"     on storage.objects;
drop policy if exists "annonces_owner_update"     on storage.objects;
drop policy if exists "annonces_owner_delete"     on storage.objects;

create policy "annonces_public_read"
  on storage.objects for select
  using (bucket_id = 'annonces');

create policy "annonces_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'annonces'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "annonces_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'annonces'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "annonces_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'annonces'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===========================================================================
-- avatars — public read; owner write
-- ===========================================================================
drop policy if exists "avatars_public_read"   on storage.objects;
drop policy if exists "avatars_owner_write"   on storage.objects;
drop policy if exists "avatars_owner_update"  on storage.objects;
drop policy if exists "avatars_owner_delete"  on storage.objects;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===========================================================================
-- concessionnaires — public read; owner write
-- ===========================================================================
drop policy if exists "concessionnaires_public_read"  on storage.objects;
drop policy if exists "concessionnaires_owner_write"  on storage.objects;
drop policy if exists "concessionnaires_owner_update" on storage.objects;
drop policy if exists "concessionnaires_owner_delete" on storage.objects;

create policy "concessionnaires_public_read"
  on storage.objects for select
  using (bucket_id = 'concessionnaires');

create policy "concessionnaires_owner_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'concessionnaires'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "concessionnaires_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'concessionnaires'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "concessionnaires_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'concessionnaires'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===========================================================================
-- blog — public read; admin write only
-- ===========================================================================
drop policy if exists "blog_public_read"  on storage.objects;
drop policy if exists "blog_admin_write"  on storage.objects;
drop policy if exists "blog_admin_update" on storage.objects;
drop policy if exists "blog_admin_delete" on storage.objects;

create policy "blog_public_read"
  on storage.objects for select
  using (bucket_id = 'blog');

create policy "blog_admin_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'blog' and public.is_admin());

create policy "blog_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'blog' and public.is_admin());

create policy "blog_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'blog' and public.is_admin());

-- ===========================================================================
-- ads — public read; admin write only
-- ===========================================================================
drop policy if exists "ads_public_read"  on storage.objects;
drop policy if exists "ads_admin_write"  on storage.objects;
drop policy if exists "ads_admin_update" on storage.objects;
drop policy if exists "ads_admin_delete" on storage.objects;

create policy "ads_public_read"
  on storage.objects for select
  using (bucket_id = 'ads');

create policy "ads_admin_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'ads' and public.is_admin());

create policy "ads_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'ads' and public.is_admin());

create policy "ads_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'ads' and public.is_admin());

-- ===========================================================================
-- verifications — PRIVATE: owner reads + writes, admin reads everything
-- ===========================================================================
drop policy if exists "verifications_owner_read"   on storage.objects;
drop policy if exists "verifications_owner_write"  on storage.objects;
drop policy if exists "verifications_owner_update" on storage.objects;
drop policy if exists "verifications_owner_delete" on storage.objects;
drop policy if exists "verifications_admin_read"   on storage.objects;

create policy "verifications_owner_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "verifications_admin_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'verifications' and public.is_admin());

create policy "verifications_owner_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "verifications_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "verifications_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===========================================================================
-- receipts — PRIVATE: owner + admin read; owner writes
-- ===========================================================================
drop policy if exists "receipts_owner_read"   on storage.objects;
drop policy if exists "receipts_owner_write"  on storage.objects;
drop policy if exists "receipts_owner_update" on storage.objects;
drop policy if exists "receipts_owner_delete" on storage.objects;
drop policy if exists "receipts_admin_read"   on storage.objects;

create policy "receipts_owner_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipts_admin_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and public.is_admin());

create policy "receipts_owner_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipts_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipts_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Bump watermark_text default if it was never customised. Safe to skip if you
-- prefer the existing JSON string form.
-- ---------------------------------------------------------------------------
update public.site_settings
   set value = '"autobladi.ma"'::jsonb
 where key = 'watermark_text' and value is null;
