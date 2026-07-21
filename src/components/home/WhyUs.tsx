import {
  Camera,
  GitCompare,
  MessageCircle,
  Search,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Card } from "@/components/ui/Card"
import { Container } from "@/components/ui/Container"
import { SectionTitle } from "@/components/ui/SectionTitle"
import { cn } from "@/lib/utils"

const TONES = [
  "bg-moroccan-red-50 text-moroccan-red-500",
  "bg-moroccan-gold-500/15 text-moroccan-gold-700",
  "bg-moroccan-mint-500/10 text-moroccan-mint-600",
] as const

export async function WhyUs() {
  const t = await getTranslations("home.why")

  const items: Array<{ icon: LucideIcon; title: string; desc: string }> = [
    {
      icon: Shield,
      title: t("dealersTitle"),
      desc: t("dealersDesc"),
    },
    { icon: Camera, title: t("realPhotosTitle"), desc: t("realPhotosDesc") },
    {
      icon: MessageCircle,
      title: t("directContactTitle"),
      desc: t("directContactDesc"),
    },
    { icon: Sparkles, title: t("estimationTitle"), desc: t("estimationDesc") },
    { icon: GitCompare, title: t("compareTitle"), desc: t("compareDesc") },
    { icon: Search, title: t("searchTitle"), desc: t("searchDesc") },
  ]

  return (
    <section className="py-12 md:py-16 bg-moroccan-sand-50/40">
      <Container>
        <SectionTitle title={t("title")} subtitle={t("subtitle")} />
        <ul className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <Card
              as="li"
              key={title}
              padding="none"
              clip
              className="group relative p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-soft hover:border-moroccan-gold-500/40"
            >
              {/* Decorative corner glow on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -end-8 -top-8 size-24 rounded-full bg-moroccan-gold-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />
              <span
                className={cn(
                  "inline-flex items-center justify-center size-12 rounded-xl mb-4",
                  TONES[i % TONES.length],
                )}
              >
                <Icon className="size-6" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <h3 className="font-display font-semibold text-lg text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </Card>
          ))}
        </ul>
      </Container>
    </section>
  )
}
