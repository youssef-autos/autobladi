import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"

import { SignInForm } from "@/components/auth/SignInForm"
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons"
import { getSocialLoginEnabled } from "@/lib/queries/social-login"

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const social = await getSocialLoginEnabled()
  return (
    <Suspense fallback={null}>
      <div className="space-y-5">
        <SignInForm />
        <SocialLoginButtons facebook={social.facebook} google={social.google} />
      </div>
    </Suspense>
  )
}
