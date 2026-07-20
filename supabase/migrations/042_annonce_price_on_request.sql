-- "Prix sur demande": lets a seller hide the price from public buyers while
-- keeping it visible to themselves (and admins) in their own dashboard.
alter table public.annonces
  add column if not exists price_on_request boolean not null default false;
