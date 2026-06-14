import { setRequestLocale } from "next-intl/server"

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AuthSplitLayout>{children}</AuthSplitLayout>
}
