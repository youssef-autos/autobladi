import { setRequestLocale } from "next-intl/server"

import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { getSiteLogos } from "@/lib/queries/home"

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const logos = await getSiteLogos()

  return (
    <>
      <Header logoUrl={logos.light} />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer logoUrl={logos.dark} />
    </>
  )
}
