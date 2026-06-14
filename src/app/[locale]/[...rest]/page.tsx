import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

/**
 * Catch-all for any path under a locale that matches no real route
 * (e.g. /ar/this-page-does-not-exist). Without it, Next renders its bare
 * default 404 instead of our styled, localized `[locale]/not-found.tsx`.
 * It simply triggers notFound() so the locale's not-found UI is shown.
 */
export default async function CatchAllNotFound({
  params,
}: {
  params: Promise<{ locale: string; rest: string[] }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  notFound()
}
