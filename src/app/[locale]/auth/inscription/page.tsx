import { setRequestLocale } from "next-intl/server"

import { SignUpForm } from "@/components/auth/SignUpForm"
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons"
import { getSocialLoginEnabled } from "@/lib/queries/social-login"

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const social = await getSocialLoginEnabled()
  return (
    <div className="space-y-5">
      <SignUpForm />
      <SocialLoginButtons facebook={social.facebook} google={social.google} />
    </div>
  )
}
