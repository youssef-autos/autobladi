import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Crown } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AdBanner } from "@/components/ads/AdBanner"
import { JsonLd } from "@/components/seo/JsonLd"
import { autoDealerSchema, breadcrumbSchema } from "@/lib/seo/structured-data"
import { ShowroomHeader } from "@/components/showroom/ShowroomHeader"
import { DealerCars } from "@/components/showroom/DealerCars"
import {
  DealerAbout,
  DealerHours,
  DealerLocation,
} from "@/components/showroom/DealerInfoSections"
import { ReviewsTab } from "@/components/showroom/ReviewsTab"
import { Container } from "@/components/ui/Container"
import { Link } from "@/i18n/navigation"
import {
  getShowroomBySlug,
  getMyReviewFor,
  listShowroomAnnonces,
  listReviews,
} from "@/lib/queries/showrooms"
import { localeAlternates } from "@/lib/seo/alternates"

export const revalidate = 60

type RouteParams = { locale: string; slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const dealer = await getShowroomBySlug(slug)
  if (!dealer) return { title: "Not found" }
  const description =
    dealer.description?.slice(0, 160) ?? `${dealer.name} — autobladi.ma`
  return {
    title: dealer.name,
    description,
    alternates: localeAlternates(locale, `/showroom/${dealer.slug}`),
    openGraph: {
      title: dealer.name,
      description,
      images: dealer.cover_url ? [dealer.cover_url] : undefined,
      type: "website",
    },
  }
}

export default async function ShowroomDetailPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const dealer = await getShowroomBySlug(slug)
  if (!dealer) notFound()

  const [cars, reviews, myReview] = await Promise.all([
    listShowroomAnnonces(dealer.user_id),
    listReviews(dealer.id),
    getMyReviewFor(dealer.id),
  ])
  const t = await getTranslations("showrooms")

  return (
    <>
      <ShowroomHeader dealer={dealer} />

      <Container className="pt-6">
        <Suspense fallback={<div className="h-[120px] md:h-[150px] rounded-2xl bg-muted animate-pulse" />}>
          <AdBanner placement="showroom_top" />
        </Suspense>
      </Container>

      <Container className="py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-6">
          {/* Info column: about (with contact) → hours → location → reviews.
              Below the cars on mobile, beside them (left) on desktop. */}
          <div className="order-2 lg:order-1 lg:col-start-1 space-y-6">
            <section>
              <SectionHeading title={t("tabs.about")} />
              <DealerAbout dealer={dealer} />
            </section>

            <DealerHours dealer={dealer} />

            <DealerLocation dealer={dealer} />

            <section>
              <SectionHeading title={t("tabs.reviews")} />
              <ReviewsTab
                showroomId={dealer.id}
                averageRating={dealer.rating}
                reviewsCount={dealer.reviews_count}
                reviews={reviews}
                hasAlreadyReviewed={!!myReview}
              />
            </section>

            {/* Vertical ad slot — fits the narrow info column. */}
            <Suspense fallback={<div className="h-[600px] w-full max-w-[300px] mx-auto rounded-2xl bg-muted animate-pulse" />}>
              <AdBanner placement="showroom_sidebar" />
            </Suspense>
          </div>

          {/* Cars — beside the info column, with a New/Used/All filter.
              Above the info column on mobile, right of it on desktop. */}
          <div className="order-1 lg:order-2 lg:col-start-2 min-w-0">
            <DealerCars cars={cars} />
          </div>
        </div>
      </Container>

      {/* For-professionals CTA — turns this storefront into a sales pitch */}
      <Container className="pb-12 md:pb-16">
        <section className="relative overflow-hidden rounded-3xl bg-brand-dark px-6 py-10 md:px-12 md:py-12">
          <div
            className="absolute -top-16 end-0 size-64 rounded-full bg-moroccan-gold-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-6 text-center md:flex-row md:items-center md:justify-between md:text-start">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
                {t("detail.proCtaTitle")}
              </h2>
              <p className="mt-2 text-white/75 leading-relaxed">
                {t("detail.proCtaText")}
              </p>
            </div>
            <Link
              href="/dashboard/showroom"
              className="inline-flex shrink-0 items-center justify-center gap-2 h-12 px-7 rounded-xl bg-moroccan-gradient text-white font-semibold shadow-moroccan hover:brightness-105 transition-all"
            >
              <Crown className="size-4" aria-hidden="true" />
              {t("detail.proCtaButton")}
            </Link>
          </div>
        </section>
      </Container>

      <JsonLd
        data={autoDealerSchema({
          locale,
          slug: dealer.slug,
          name: dealer.name,
          description: dealer.description,
          logoUrl: dealer.logo_url,
          coverUrl: dealer.cover_url,
          phone: dealer.phone,
          email: dealer.email,
          website: dealer.website,
          address: dealer.address,
          cityName: dealer.city?.name_fr ?? null,
          latitude: dealer.latitude,
          longitude: dealer.longitude,
          rating: dealer.rating,
          reviewsCount: dealer.reviews_count,
        })}
      />

      <JsonLd
        data={breadcrumbSchema([
          {
            name: locale === "fr" ? "Accueil" : "الرئيسية",
            url: `${SITE_URL}/${locale}`,
          },
          {
            name: locale === "fr" ? "Showrooms" : "المعارض",
            url: `${SITE_URL}/${locale}/showrooms`,
          },
          {
            name: dealer.name,
            url: `${SITE_URL}/${locale}/showroom/${dealer.slug}`,
          },
        ])}
      />
    </>
  )
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-5 inline-flex items-center gap-3">
      <span className="h-6 w-1 rounded-full bg-moroccan-gradient" aria-hidden="true" />
      {title}
    </h2>
  )
}

