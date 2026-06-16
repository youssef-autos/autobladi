import createIntlMiddleware from "next-intl/middleware"
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { routing } from "@/i18n/routing"

const intlMiddleware = createIntlMiddleware(routing)

const LOCALE_RE = /^\/(ar|fr)(?=\/|$)/
const PROTECTED_PATHS = ["/dashboard", "/admin"]
const ADMIN_PATHS = ["/admin"]

function getLocale(pathname: string): "ar" | "fr" {
  const match = pathname.match(LOCALE_RE)
  return (match?.[1] as "ar" | "fr") ?? routing.defaultLocale
}

function stripLocale(pathname: string): string {
  return pathname.replace(LOCALE_RE, "") || "/"
}

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request)

  const pathname = request.nextUrl.pathname
  const stripped = stripLocale(pathname)
  const needsAuth = PROTECTED_PATHS.some((p) => stripped === p || stripped.startsWith(`${p}/`))
  const needsAdmin = ADMIN_PATHS.some((p) => stripped === p || stripped.startsWith(`${p}/`))

  if (!needsAuth) {
    return intlResponse
  }

  const response = intlResponse
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const locale = getLocale(pathname)

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/auth/connexion`
    url.searchParams.set("returnTo", pathname)
    return NextResponse.redirect(url)
  }

  if (needsAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .maybeSingle<{ account_type: string }>()

    if (!profile || profile.account_type !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = `/${locale}`
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
