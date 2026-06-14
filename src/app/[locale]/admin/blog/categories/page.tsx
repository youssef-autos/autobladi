import { getTranslations, setRequestLocale } from "next-intl/server"

import { BlogCategoriesManager } from "@/components/admin/blog/categories/BlogCategoriesManager"
import { listBlogCategoriesAdmin } from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminBlogCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.blogCategoriesPage")
  const categories = await listBlogCategoriesAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      <BlogCategoriesManager categories={categories} />
    </div>
  )
}
