-- 020_concessionnaire_secteur.sql
-- Optional district (secteur) for a dealer, shown only when the chosen city has
-- secteurs. Run this in the SQL Editor.

alter table public.concessionnaires
  add column if not exists secteur_id uuid references public.secteurs(id) on delete set null;

notify pgrst, 'reload schema';
