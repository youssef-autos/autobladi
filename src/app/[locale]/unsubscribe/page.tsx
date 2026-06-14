import type { Metadata } from "next"
import { CheckCircle2, XCircle } from "lucide-react"
import { setRequestLocale } from "next-intl/server"

import { Container } from "@/components/ui/Container"
import { Link } from "@/i18n/navigation"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

type SearchParams = Record<string, string | string[] | undefined>

function readString(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (Array.isArray(value) && value[0]) return value[0]
  return null
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams])
  setRequestLocale(locale)
  const ar = locale === "ar"
  const token = readString(sp.token)

  let status: "ok" | "missing_token" | "invalid_token" | "error" = "missing_token"

  if (token) {
    try {
      const admin = createAdminClient()
      // Service-role bypasses RLS — we only have the random token, so an
      // attacker can't iterate UUIDs to mass-unsubscribe.
      const { data, error } = await admin
        .from("profiles")
        .update({ newsletter_subscribed: false } as never)
        .eq("email_unsubscribe_token", token)
        .select("id")
        .maybeSingle<{ id: string }>()
      if (error) status = "error"
      else if (!data) status = "invalid_token"
      else status = "ok"
    } catch {
      status = "error"
    }
  }

  return (
    <main className="min-h-dvh bg-moroccan-sand-50/40 flex items-center">
      <Container className="py-16 max-w-lg">
        <div className="rounded-2xl bg-card border border-border p-8 shadow-card text-center space-y-4">
          {status === "ok" ? (
            <>
              <CheckCircle2
                className="size-14 text-moroccan-mint-500 mx-auto"
                aria-hidden="true"
              />
              <h1 className="font-display text-2xl font-bold text-foreground">
                {ar ? "تم إلغاء الاشتراك ✓" : "Désabonnement confirmé ✓"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {ar
                  ? "لن تتلقّى منّا بعد الآن أي رسائل ضمن النشرة الإخبارية. الإشعارات المهمّة المتعلّقة بحسابك (إعلانات، اشتراكات، إلخ) ستستمر بالوصول."
                  : "Vous ne recevrez plus notre newsletter. Les notifications importantes liées à votre compte (annonces, abonnements, etc.) continueront à vous parvenir."}
              </p>
            </>
          ) : (
            <>
              <XCircle
                className="size-14 text-moroccan-red-500 mx-auto"
                aria-hidden="true"
              />
              <h1 className="font-display text-2xl font-bold text-foreground">
                {ar ? "تعذّر إلغاء الاشتراك" : "Désabonnement impossible"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {status === "missing_token"
                  ? ar
                    ? "الرابط غير مكتمل. استعمل الرابط الكامل من إيميل النشرة."
                    : "Le lien est incomplet. Utilisez le lien complet reçu par e-mail."
                  : status === "invalid_token"
                    ? ar
                      ? "الرابط غير صالح أو منتهي الصلاحية."
                      : "Lien invalide ou expiré."
                    : ar
                      ? "حدث خطأ غير متوقّع. حاول مرة أخرى أو تواصل معنا."
                      : "Une erreur inattendue. Réessayez ou contactez-nous."}
              </p>
            </>
          )}

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center h-10 px-5 rounded-xl bg-moroccan-red-500 text-white text-sm font-semibold hover:bg-moroccan-red-600"
            >
              {ar ? "العودة للموقع" : "Retour au site"}
            </Link>
          </div>
        </div>
      </Container>
    </main>
  )
}
