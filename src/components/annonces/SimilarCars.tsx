import { Car } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { CarCard } from "@/components/cars/CarCard"
import { Container } from "@/components/ui/Container"
import { EmptyState } from "@/components/ui/EmptyState"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { getSimilarAnnonces, type AnnonceDetail } from "@/lib/queries/annonce-detail"

type Props = {
  annonce: AnnonceDetail
}

export async function SimilarCars({ annonce }: Props) {
  const t = await getTranslations("annonceDetail.similar")
  const cars = await getSimilarAnnonces(annonce, 4)

  return (
    <section className="py-12 md:py-16 bg-moroccan-sand-50/30">
      <Container>
        <header className="space-y-2 mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t("title")}
          </h2>
          <GoldAccent />
        </header>
        {cars.length === 0 ? (
          <EmptyState icon={Car} title={t("empty")} />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cars.map((c) => (
              <li key={c.id}>
                <CarCard annonce={c} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  )
}
