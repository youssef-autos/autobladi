import { setRequestLocale } from "next-intl/server"

import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { getSiteLogoUrl } from "@/lib/queries/home"

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const logoUrl = await getSiteLogoUrl(locale)

  return (
    <>
      <Header logoUrl={logoUrl} />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer logoUrl={logoUrl} />
    </>
  )
}
