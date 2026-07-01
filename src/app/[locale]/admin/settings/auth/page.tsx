import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AuthSettingsForm } from "@/components/admin/AuthSettingsForm"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function AdminAuthSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.authSettingsPage")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion`)
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  if (profile?.account_type !== "admin") redirect(`/${locale}`)

  const { data: row } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "require_email_confirmation")
    .maybeSingle<{ value: unknown }>()

  // Default: email confirmation required (true)
  const requireEmailConfirmation = row?.value !== false

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      <AuthSettingsForm initial={{ require_email_confirmation: requireEmailConfirmation }} />
    </div>
  )
}
