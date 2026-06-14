import { ArrowRight, Calculator } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { Container } from "@/components/ui/Container"

export async function EstimationCTA() {
  const t = await getTranslations("home.estimationCta")

  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-moroccan-gradient text-white p-8 md:p-12">
          {/* Decorative gold blob */}
          <div
            className="absolute -end-20 -top-20 size-64 rounded-full bg-moroccan-gold-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -start-10 -bottom-10 size-40 rounded-full bg-moroccan-gold-500/10 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-moroccan-gold-500">
                <Calculator className="size-4" aria-hidden="true" />
                Gemini AI
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight">
                {t("title")}
              </h2>
              <p className="text-white/85 leading-relaxed">{t("subtitle")}</p>
            </div>

            <Link
              href="/estimation"
              className="inline-flex items-center justify-center gap-2 rounded-xl h-12 px-8 bg-white text-moroccan-red-500 font-semibold shadow-lg hover:bg-moroccan-gold-50 transition-colors"
            >
              {t("cta")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
