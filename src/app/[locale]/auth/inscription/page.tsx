import { getTranslations, setRequestLocale } from "next-intl/server"

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
  const [social, t] = await Promise.all([
    getSocialLoginEnabled(),
    getTranslations("auth.signUp"),
  ])
  const socialLogin = social.facebook || social.google
    ? (
      <SocialLoginButtons
        facebook={social.facebook}
        google={social.google}
        dividerLabel={t("orFillForm")}
      />
    )
    : null
  return <SignUpForm socialLogin={socialLogin} />
}
