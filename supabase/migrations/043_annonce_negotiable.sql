-- "Négociable": lets a seller flag a listing's price as open to negotiation.
-- Was collected in the publish form and shown in the review step since
-- earlier, but never persisted — this finishes wiring it up.
alter table public.annonces
  add column if not exists negotiable boolean not null default false;
