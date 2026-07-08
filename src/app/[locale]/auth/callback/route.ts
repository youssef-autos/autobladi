import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { routing } from "@/i18n/routing"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]

/**
 * Auth callback for both social login (OAuth) and email links (e.g. password
 * recovery). Exchanges the PKCE code for a session, then routes:
 *   - to `next` when the email link asked for a specific page
 *     (password recovery → `/auth/reinitialiser`), or
 *   - to the dashboard by default (social login).
 *
 * The active locale is always applied so the destination stays localized and
 * open redirects are impossible (only same-origin relative `next` is honored).
 */
function safeNext(next: string | null, locale: string): string | null {
  if (!next) return null
  // Same-origin relative paths only — block absolute/protocol-relative URLs.
  if (!next.startsWith("/") || next.startsWith("//")) return null
  const alreadyLocalized = routing.locales.some(
    (l) => next === `/${l}` || next.startsWith(`/${l}/`),
  )
  return alreadyLocalized ? next : `/${locale}${next}`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const tokenHash = url.searchParams.get("token_hash")
  const otpType = url.searchParams.get("type")
  const next = safeNext(url.searchParams.get("next"), locale)

  if (code || (tokenHash && otpType)) {
    const supabase = await createClient()
    // Email links (password recovery, email change) arrive as a token_hash we
    // verify with verifyOtp; social login arrives as a PKCE `code`.
    const { error } =
      tokenHash && otpType && EMAIL_OTP_TYPES.includes(otpType as EmailOtpType)
        ? await supabase.auth.verifyOtp({
            type: otpType as EmailOtpType,
            token_hash: tokenHash,
          })
        : await supabase.auth.exchangeCodeForSession(code!)
    if (!error) {
      return NextResponse.redirect(
        new URL(next ?? `/${locale}/dashboard`, url.origin),
      )
    }
  }

  return NextResponse.redirect(
    new URL(`/${locale}/auth/connexion?error=oauth`, url.origin),
  )
}
