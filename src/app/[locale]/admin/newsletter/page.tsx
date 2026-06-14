import { MailCheck, MailX, Users } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { NewsletterComposer } from "@/components/admin/newsletter/NewsletterComposer"
import {
  SubscribersPanel,
  type SubscriberView,
} from "@/components/admin/newsletter/SubscribersPanel"
import { listNewsletterRecipients } from "@/lib/email/recipients"
import { getNewsletterStats } from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

export default async function AdminNewsletterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.newsletterPage")

  const [stats, recipients] = await Promise.all([
    getNewsletterStats(),
    listNewsletterRecipients(),
  ])

  // Strip the unsubscribe token before handing data to the client.
  const subscribers: SubscriberView[] = recipients.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    created_at: r.created_at,
  }))

  const cards = [
    {
      icon: MailCheck,
      label: t("stats.subscribers"),
      value: stats.subscribers,
      accent: "text-moroccan-mint-500 bg-moroccan-mint-500/10",
    },
    {
      icon: MailX,
      label: t("stats.unsubscribed"),
      value: stats.unsubscribed,
      accent: "text-muted-foreground bg-muted",
    },
    {
      icon: Users,
      label: t("stats.total"),
      value: stats.total,
      accent: "text-moroccan-red-500 bg-moroccan-red-50",
    },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ icon: Icon, label, value, accent }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-5 shadow-card flex items-center gap-4"
          >
            <span
              className={`inline-flex size-11 items-center justify-center rounded-xl ${accent}`}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {value}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <NewsletterComposer subscriberCount={stats.subscribers} />

      <SubscribersPanel subscribers={subscribers} />
    </div>
  )
}
