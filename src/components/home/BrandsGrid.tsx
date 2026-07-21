"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { Card } from "@/components/ui/Card"
import { Container } from "@/components/ui/Container"
import { SectionTitle } from "@/components/ui/SectionTitle"
import type { Brand } from "@/lib/queries/home"

type Props = {
  brands: Brand[]
}

export function BrandsGrid({ brands }: Props) {
  const t = useTranslations("home.brands")
  const top = brands.slice(0, 12)

  return (
    <section className="py-12 md:py-16 bg-moroccan-sand-50/50">
      <Container>
        <SectionTitle title={t("title")} subtitle={t("subtitle")} />
        <ul className="mt-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {top.map((brand) => (
            <li key={brand.id}>
              <Card
                as={Link}
                href={`/annonces?brand=${brand.slug}`}
                padding="sm"
                shadow="none"
                className="group flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-moroccan-gold-500 hover:shadow-card"
              >
                <span className="inline-flex items-center justify-center size-16 rounded-full bg-moroccan-sand-50 overflow-hidden">
                  {brand.logo_url ? (
                    <Image
                      src={brand.logo_url}
                      alt={brand.name}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  ) : (
                    <span className="font-display text-2xl font-bold text-moroccan-sand-200">
                      {brand.name[0]}
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium text-foreground group-hover:text-moroccan-red-500 transition-colors">
                  {brand.name}
                </span>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}