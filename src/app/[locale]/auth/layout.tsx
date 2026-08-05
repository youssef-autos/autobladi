import { setRequestLocale } from "next-intl/server"

import { AuthShell } from "@/components/auth/AuthShell"
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
  return <AuthShell logoUrl={logos.light}>{children}</AuthShell>
}
