import { Heart } from "lucide-react"
import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { FavoriteCard } from "@/components/dashboard/FavoriteCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { listMyFavorites } from "@/lib/queries/dashboard"

export const dynamic = "force-dynamic"

export default async function FavorisPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("dashboard.favorisPage")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion`)

  const favorites = await listMyFavorites(user.id)

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      {favorites.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-soft">
          <EmptyState
            icon={Heart}
            title={t("empty")}
            description={t("emptyDesc")}
            action={
              <Link
                href="/annonces"
                className="inline-flex items-center h-11 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
              >
                {t("browse")}
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favorites.map((f) => (
            <li key={f.favoriteId}>
              <FavoriteCard favoriteId={f.favoriteId} annonce={f.annonce} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
