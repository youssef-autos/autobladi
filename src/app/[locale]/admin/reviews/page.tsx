import { getTranslations, setRequestLocale } from "next-intl/server"

import { ReviewsManager } from "@/components/admin/reviews/ReviewsManager"
import { listReviewsAdmin } from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

export default async function AdminReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.reviewsPage")
  const reviews = await listReviewsAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      <ReviewsManager reviews={reviews} />
    </div>
  )
}
