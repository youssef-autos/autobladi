import { setRequestLocale } from "next-intl/server"

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { getSiteLogos } from "@/lib/queries/home"

// SEO: sign-in/sign-up flows should never be indexed
export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const logos = await getSiteLogos().catch(() => ({ light: null, dark: null }))
  return <AuthSplitLayout logoUrl={logos.light}>{children}</AuthSplitLayout>
}
