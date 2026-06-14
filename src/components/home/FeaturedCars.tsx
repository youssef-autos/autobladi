import { ArrowRight, Sparkles } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { CarCard } from "@/components/cars/CarCard"
import { Container } from "@/components/ui/Container"
import { EmptyState } from "@/components/ui/EmptyState"
import { SectionTitle } from "@/components/ui/SectionTitle"
import { getFeaturedAnnonces } from "@/lib/queries/home"

export async function FeaturedCars() {
  const t = await getTranslations("home.featured")
  const cars = await getFeaturedAnnonces(4)

  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
          <SectionTitle title={t("title")} subtitle={t("subtitle")} align="start" />
          <Link
            href="/annonces?featured=true"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-moroccan-red-500 hover:underline shrink-0"
          >
            {t("viewAll")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        {cars.length === 0 ? (
          <EmptyState icon={Sparkles} title={t("empty")} />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cars.map((annonce) => (
              <li key={annonce.id}>
                <CarCard annonce={annonce} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  )
}
