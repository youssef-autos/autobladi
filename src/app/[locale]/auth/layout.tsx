import { setRequestLocale } from "next-intl/server"

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { getSiteLogos } from "@/lib/queries/home"

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const logos = await getSiteLogos()
  return <AuthSplitLayout logoUrl={logos.light}>{children}</AuthSplitLayout>
}
