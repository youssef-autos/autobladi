import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { PageEditor } from "@/components/admin/pages/PageEditor"
import { getPageAdmin } from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminPageEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.pagesPage")
  const page = await getPageAdmin(id)
  if (!page) notFound()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("editTitle")}
        </h1>
      </header>

      <PageEditor mode="edit" initial={page} />
    </div>
  )
}
