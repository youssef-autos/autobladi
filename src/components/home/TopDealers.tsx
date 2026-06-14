import { Building2 } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { ProfessionnelCard } from "@/components/professionnels/ProfessionnelCard"
import { Container } from "@/components/ui/Container"
import { EmptyState } from "@/components/ui/EmptyState"
import { SectionTitle } from "@/components/ui/SectionTitle"
import { getTopDealers } from "@/lib/queries/home"

export async function TopDealers() {
  const t = await getTranslations("home.topDealers")
  const dealers = await getTopDealers(6)

  return (
    <section className="py-12 md:py-16 bg-moroccan-sand-50/50">
      <Container>
        <SectionTitle title={t("title")} subtitle={t("subtitle")} />
        {dealers.length === 0 ? (
          <EmptyState icon={Building2} title={t("empty")} className="mt-10" />
        ) : (
          <ul className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {dealers.map((d) => (
              <li key={d.id} className="flex">
                <ProfessionnelCard dealer={d} className="w-full" />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  )
}
