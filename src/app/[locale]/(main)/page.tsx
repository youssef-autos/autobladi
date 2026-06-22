import { Fragment, Suspense } from "react"
import { setRequestLocale } from "next-intl/server"

import { AdSlot } from "@/components/ads/AdSlot"
import { JsonLd } from "@/components/seo/JsonLd"
import { websiteSchema } from "@/lib/seo/structured-data"
import { BlogPreview } from "@/components/home/BlogPreview"
import { BrandsGrid } from "@/components/home/BrandsGrid"
import { EstimationCTA } from "@/components/home/EstimationCTA"
import { FeaturedCars } from "@/components/home/FeaturedCars"
import { HeroSection } from "@/components/home/HeroSection"
import { LatestCars } from "@/components/home/LatestCars"
import { Newsletter } from "@/components/home/Newsletter"
import { TopDealers } from "@/components/home/TopDealers"
import { WhyUs } from "@/components/home/WhyUs"
import { Container } from "@/components/ui/Container"
import type { HomeSectionKey } from "@/lib/home-sections"
import {
  getActiveModels,
  getHomeSectionsConfig,
  getPopularBrands,
} from "@/lib/queries/home"

export const revalidate = 60

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [brands, models, sections] = await Promise.all([
    getPopularBrands(12),
    getActiveModels(),
    getHomeSectionsConfig(),
  ])

  // Each managed section's rendered node (with its data + Suspense wrapping).
  const sectionNodes: Record<HomeSectionKey, React.ReactNode> = {
    featured: (
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedCars />
      </Suspense>
    ),
    brands: <BrandsGrid brands={brands} />,
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

  const visible = sections.filter((s) => s.visible).map((s) => s.key)
  // Distribute the two extra ad slots through the section list.
  const midPos = Math.floor((visible.length - 1) / 2)
  const bottomPos = visible.length - 2

  return (
    <>
      <JsonLd data={websiteSchema(locale)} />

      <HeroSection brands={brands} models={models} />

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
