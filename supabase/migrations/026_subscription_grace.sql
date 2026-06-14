-- 026_subscription_grace.sql
-- Grace period (in days) after a pro subscription expires before the service is
-- suspended. During this window a daily reminder email is sent. The value is
-- admin-editable from /admin/parametres. Suspension + emails are driven by the
-- daily cron route /api/cron/subscription-grace (see route for scheduling).

insert into public.site_settings (key, value)
values ('subscription_grace_days', '7'::jsonb)
on conflict (key) do nothing;
