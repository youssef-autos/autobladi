import { setRequestLocale } from "next-intl/server"

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ResetPasswordForm />
}
