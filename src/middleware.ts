import createIntlMiddleware from "next-intl/middleware"
import { type NextRequest } from "next/server"

import { routing } from "@/i18n/routing"
import { updateSession } from "@/lib/supabase/middleware"

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request)

  try {
    const supabaseResponse = await updateSession(request)
    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie.name, cookie.value)
    }
  } catch {
    // Corrupted auth cookie — clear all Supabase auth cookies
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.includes("-auth-token")) {
        response.cookies.delete(cookie.name)
      }
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
