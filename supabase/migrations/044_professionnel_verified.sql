-- "Vérifié": lets an admin mark a showroom as verified. Admin-only — no
-- self-service request/document flow (unlike the old, removed identity
-- verification system from migration 040).
alter table public.professionnels
  add column if not exists is_verified boolean not null default false;
