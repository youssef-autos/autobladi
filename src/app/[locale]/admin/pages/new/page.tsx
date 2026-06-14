import { getTranslations, setRequestLocale } from "next-intl/server"

import { PageEditor } from "@/components/admin/pages/PageEditor"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminPageNewPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.pagesPage")

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("newPage")}
        </h1>
      </header>

      <PageEditor mode="create" />
    </div>
  )
}
