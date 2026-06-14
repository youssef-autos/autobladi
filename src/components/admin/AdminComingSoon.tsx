import { Wrench } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { EmptyState } from "@/components/ui/EmptyState"

type Props = {
  title?: string
}

export async function AdminComingSoon({ title }: Props) {
  const t = await getTranslations("adminPanel.comingSoon")
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
        <EmptyState
          icon={Wrench}
          title={title ?? t("title")}
          description={t("desc")}
          action={
            <Link
              href="/admin"
              className="inline-flex items-center h-10 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
            >
              ← {t("back")}
            </Link>
          }
        />
      </div>
    </div>
  )
}
