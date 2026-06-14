import { setRequestLocale } from "next-intl/server"

import { EmailSettingsForm } from "@/components/admin/EmailSettingsForm"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { getEmailSettings } from "@/lib/email/settings"
import { isResendConfigured } from "@/lib/email/client"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminEmailSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const settings = await getEmailSettings()
  const resendConfigured = await isResendConfigured()

  return (
    <Container className="py-8 md:py-10 max-w-3xl">
      <header className="space-y-2 mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          {locale === "ar" ? "إعدادات الإيميل" : "Paramètres e-mail"}
        </h1>
        <GoldAccent />
        <p className="text-sm text-muted-foreground">
          {locale === "ar"
            ? "اضبط عنوان المُرسل والـ Reply-To، فعّل/عطّل أنواع الإيميل، وأرسل إيميلاً تجريبياً للتحقّق من الإعداد."
            : "Configurez l'expéditeur, le Reply-To, activez/désactivez chaque type, et testez l'envoi."}
        </p>
      </header>

      <EmailSettingsForm
        locale={locale}
        initial={settings}
        resendConfigured={resendConfigured}
      />
    </Container>
  )
}
