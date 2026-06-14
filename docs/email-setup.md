# Email setup — autobladi.ma + Resend

## 1) Provision Resend

1. Create an account at [resend.com](https://resend.com) and a project.
2. **Add and verify the `autobladi.ma` domain** under *Domains* → *Add Domain*.
3. Add the DNS records Resend gives you to your DNS provider (Cloudflare,
   AWS Route 53, etc.):

   | Type | Name | Value | Notes |
   |------|------|-------|-------|
   | TXT  | `@`              | `v=spf1 include:_spf.resend.com -all` | SPF |
   | TXT  | `resend._domainkey` | (the long key Resend shows you) | DKIM |
   | TXT  | `_dmarc`         | `v=DMARC1; p=none; rua=mailto:postmaster@autobladi.ma` | DMARC |
   | MX   | (use Resend's MX if you want inbound) | — | optional |

   Wait until Resend marks the domain as **Verified** (usually under 30 min).

4. Generate an API key under *API Keys*. Copy it.

## 2) Configure the app

In `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://autobladi.ma
```

Restart `npm run dev`.

## 3) Configure From / Reply-To from the admin

Visit `/ar/admin/settings/email` (admin-only) and set:

- **From**: `autobladi <noreply@autobladi.ma>`
- **Reply-To**: `contact@autobladi.ma`
- Per-type toggles (enable/disable each email category)
- **Send test e-mail** — sanity-check before going live

These values are stored in `site_settings` and override anything in code.
The settings module caches them for 60s (invalidated on save).

## 4) Cron jobs (Supabase Edge Functions)

Three recurring jobs aren't in the Next.js codebase — they live as
Supabase Edge Functions you deploy from the dashboard or via the CLI.
Blueprints below; adjust to your project before deploying.

### `daily_expire_annonces`

Runs once a day. Calls `expire_annonces()` (defined in migration 010) to
flip every active annonce past its `expires_at` to `expired`.

```ts
// supabase/functions/daily_expire_annonces/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )
  const { data, error } = await supabase.rpc("expire_annonces")
  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
  return new Response(JSON.stringify({ ok: true, expired: data }))
})
```

Schedule from Supabase Dashboard → *Database* → *Cron*: `0 3 * * *` (3am UTC).

### `daily_annonce_expiring_emails`

Looks for annonces expiring in 3 days, sends the heads-up email.

```ts
// supabase/functions/daily_annonce_expiring_emails/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@4"

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )
  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!)

  const from = new Date()
  from.setDate(from.getDate() + 3)
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + 1)

  const { data: annonces } = await supabase
    .from("annonces")
    .select("id, title, user_id, expires_at")
    .eq("status", "active")
    .gte("expires_at", from.toISOString())
    .lt("expires_at", to.toISOString())

  for (const a of annonces ?? []) {
    const { data: authUser } = await supabase.auth.admin.getUserById(a.user_id)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", a.user_id)
      .single()
    if (!authUser?.user?.email) continue

    await resend.emails.send({
      from: "autobladi <noreply@autobladi.ma>",
      to: authUser.user.email,
      subject: "إعلانك ينتهي قريباً — جدّده الآن",
      html: `<p>مرحباً ${profile?.full_name ?? ""},</p>
             <p>إعلانك "${a.title}" سينتهي خلال 3 أيام.
             <a href="https://autobladi.ma/ar/dashboard/modifier/${a.id}">جدّده الآن</a>.</p>`,
    })
  }

  return new Response(JSON.stringify({ ok: true, sent: (annonces ?? []).length }))
})
```

Schedule: `0 8 * * *` (8am UTC).

### `daily_subscription_expiring_emails`

Same pattern, but looks for `subscription_requests` whose `ends_at` is 7
days out and is currently `approved`.

```ts
const { data: subs } = await supabase
  .from("subscription_requests")
  .select(`
    id, user_id, ends_at,
    subscription_plans(name, name_ar)
  `)
  .eq("status", "approved")
  .gte("ends_at", from.toISOString())
  .lt("ends_at", to.toISOString())
```

…and call Resend with the SubscriptionExpiring template (or inline HTML
equivalent — Edge Functions can't import React components, so reproduce
the HTML manually or render with `@react-email/render` if you bundle it).

## 5) Unsubscribe

Every profile auto-generates `email_unsubscribe_token` (migration 010 trigger).
The newsletter template's footer renders:

```
https://autobladi.ma/ar/unsubscribe?token=<token>
```

The page sets `profiles.newsletter_subscribed = false`. Account
notifications (annonce approved, subscription expiring, etc.) are NOT
governed by this flag — they always go out, as they're transactional.

## 6) Testing checklist

| What | How |
|------|-----|
| From displays correctly | Send a test from `/admin/settings/email` |
| Gmail rendering | Test e-mail to a Gmail account, open desktop + mobile |
| Outlook rendering | Same, target outlook.com |
| Arabic RTL flow | Use Arabic templates; check direction in Gmail web |
| DKIM passes | Open the test email's "Show original" — verify `dkim=pass` |
| Bounce handling | Send to `bounce@simulator.amazonses.com` |
| Toggles work | Disable one type in admin, trigger it, confirm skip log |

## 7) When emails go silently missing

The send pipeline is intentionally non-blocking:

1. If `RESEND_API_KEY` is missing → logged + skipped (`[email] ... — skipping`)
2. If the type toggle is `false` → logged + skipped
3. If Resend returns an error → logged with details, never throws

Check the server console (`npm run dev` terminal or your hosting provider's
logs) before assuming Resend is at fault.
