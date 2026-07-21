import { Fragment, Suspense } from "react"
import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import { AdSlot } from "@/components/ads/AdSlot"
import { JsonLd } from "@/components/seo/JsonLd"
import { websiteSchema } from "@/lib/seo/structured-data"
import { BlogPreview } from "@/components/home/BlogPreview"
import { BrandsGrid } from "@/components/home/BrandsGrid"
import { EstimationCTA } from "@/components/home/EstimationCTA"
import { HeroSection } from "@/components/home/HeroSection"
import { LatestCars } from "@/components/home/LatestCars"
import { Newsletter } from "@/components/home/Newsletter"
import { TopDealers } from "@/components/home/TopDealers"
import { WhyUs } from "@/components/home/WhyUs"
import { Container } from "@/components/ui/Container"
import { HOME_SECTION_KEYS, type HomeSectionKey } from "@/lib/home-sections"
import {
  getActiveBrands,
  getActiveModels,
  getPopularBrands,
} from "@/lib/queries/home"
import { localeAlternates } from "@/lib/seo/alternates"

export const revalidate = 60

// Independent from the root layout's fallback — same intent, but editable
// here without touching every other page that still relies on that default.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const ar = locale === "ar"
  const title = ar
    ? "autobladi.ma — بيع وشراء السيارات في المغرب"
    : "autobladi.ma — Achat et vente de voitures au Maroc"
  const description = ar
    ? "بيع وشراء السيارات الجديدة والمستعملة في المغرب. تقدير مجاني بالذكاء الاصطناعي، معارض موثوقة، وتواصل مباشر وآمن."
    : "Achetez et vendez des voitures neuves et d'occasion au Maroc. Estimation gratuite par IA, showrooms vérifiés, contact direct et sécurisé."
  return {
    // `absolute` bypasses the root layout's `%s · autobladi.ma` template —
    // this title is already fully branded and shouldn't get suffixed again.
    title: { absolute: title },
    description,
    alternates: localeAlternates(locale, ""),
    openGraph: { title, description },
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [allBrands, popularBrands, models] = await Promise.all([
    getActiveBrands(),
    getPopularBrands(12),
    getActiveModels(),
  ])

  // Each managed section's rendered node (with its data + Suspense wrapping).
  const sectionNodes: Record<HomeSectionKey, React.ReactNode> = {
    brands: <BrandsGrid brands={popularBrands} />,
    latest: (
      <Suspense fallback={<SectionSkeleton />}>
        <LatestCars />
      </Suspense>
    ),
    why: <WhyUs />,
    dealers: (
      <Suspense fallback={<SectionSkeleton />}>
        <TopDealers />
      </Suspense>
    ),
    estimation: <EstimationCTA />,
    blog: (
      <Suspense fallback={<SectionSkeleton />}>
        <BlogPreview />
      </Suspense>
    ),
    newsletter: <Newsletter />,
  }

  const visible = HOME_SECTION_KEYS
  // Distribute the two extra ad slots through the section list.
  const midPos = Math.floor((visible.length - 1) / 2)
  const bottomPos = visible.length - 2

  return (
    <>
      <JsonLd data={websiteSchema(locale)} />

      <HeroSection brands={allBrands} models={models} />

      <Container className="py-6">
        <Suspense fallback={<AdSkeleton />}>
          {/* One slot renders the right size per device automatically. */}
          <AdSlot slotId="home_top" />
        </Suspense>
      </Container>

      {visible.map((key, i) => (
        <Fragment key={key}>
          {sectionNodes[key]}
          {i === midPos && (
            <Container className="py-6">
              <Suspense fallback={<AdSkeleton />}>
                <AdSlot slotId="home_middle" />
              </Suspense>
            </Container>
          )}
          {bottomPos > midPos && i === bottomPos && (
            <Container className="py-6">
              <Suspense fallback={<AdSkeleton />}>
                <AdSlot slotId="home_bottom" />
              </Suspense>
            </Container>
          )}
        </Fragment>
      ))}
    </>
  )
}

function SectionSkeleton() {
  return (
    <Container className="py-12 md:py-16">
      <div className="h-8 w-1/3 rounded-lg bg-muted animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="aspect-[4/3] bg-muted animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-6 w-1/2 bg-muted animate-pulse rounded" />
              <div className="h-3 w-full bg-muted animate-pulse rounded mt-3" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}

function AdSkeleton() {
  return <div className="h-[150px] md:h-[180px] rounded-2xl bg-muted animate-pulse" />
}
