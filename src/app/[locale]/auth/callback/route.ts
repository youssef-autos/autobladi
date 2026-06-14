import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * OAuth (social login) callback. Exchanges the PKCE code for a session, then
 * redirects to the dashboard. On failure, back to the login page with an error.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, url.origin))
    }
  }

  return NextResponse.redirect(
    new URL(`/${locale}/auth/connexion?error=oauth`, url.origin),
  )
}
